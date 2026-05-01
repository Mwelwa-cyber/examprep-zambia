"""
ZedExams · Usage gate middleware  (REFERENCE / DESIGN ARTIFACT)
================================================================

This file is NOT executed by the application. The live backend runs on
Firebase Cloud Functions (Node.js) and the equivalent gate already lives
at `functions/teacherTools/usageMeter.js` (`assertAndIncrement`).

Two structural differences between this reference and the production gate:

  1. Plan names
       This reference: free, pro, max
       Production:     free, individual, school
                       (see PLAN_LIMITS in functions/teacherTools/usageMeter.js)

  2. Limits
       This reference uses tighter free-tier limits (lesson_plan: 5 vs. 10)
       and adds a `daily_total` cap not currently enforced per-tool in
       production. The /teacher/welcome-to-pro page copy ("daily cap just
       jumped from 2 to 10", "lesson plans · 40/month") follows THIS
       reference, so the page and the live caps are intentionally out of
       sync until a product decision is made.

Treat this as the design we'd port to Node.js if/when the plan model is
unified. To translate:
  - PLAN_CAPS  →  PLAN_LIMITS in usageMeter.js
  - check_usage_limit  →  assertAndIncrement (already atomic via
                          Firestore transaction)
  - usage_events table →  `usageMeters/{uid}/periods/{yyyymm}` doc
  - HTTPException 429  →  HttpsError('resource-exhausted', ...) with
                          a structured `details` payload mirroring the
                          `detail` dict below.

Drop this in front of every AI-generation endpoint. It checks the user's
plan, current usage, and daily count, and either lets the request through
or raises a structured 429 the frontend can map straight to a paywall scenario.

Runtime (if ever ported back to Python): 3.10+, FastAPI, asyncpg.
"""

from datetime import datetime, timezone
from calendar import monthrange
from fastapi import HTTPException, Depends, status
from typing import Literal


# ============================================================
# 1. PLAN CAPS — single source of truth, kept in code
# ============================================================
# Putting these in code (not the DB) means they're version-controlled,
# easy to test, and changes ship with code reviews.

Feature = Literal['lesson_plan','worksheet','teacher_notes','assessment','scheme']

PLAN_CAPS: dict[str, dict] = {
    'free': {
        'lesson_plan':    5,
        'worksheet':      3,
        'teacher_notes':  3,
        'assessment':     0,   # 0 = locked, surface as 'feature-locked'
        'scheme':         0,
        'daily_total':    2,
        'model':          'standard',
    },
    'pro': {
        'lesson_plan':   40,
        'worksheet':     25,
        'teacher_notes': 25,
        'assessment':     8,
        'scheme':         2,
        'daily_total':   10,
        'model':         'premium',
    },
    'max': {
        'lesson_plan':  200,   # "unlimited" with fair-use ceiling
        'worksheet':    200,
        'teacher_notes':200,
        'assessment':   200,
        'scheme':       200,
        'daily_total':   30,
        'model':        'premium',
    },
}

# Friendly labels for the paywall UI
FEATURE_LABEL: dict[str, str] = {
    'lesson_plan':   'lesson plans',
    'worksheet':     'worksheets',
    'teacher_notes': 'teacher notes',
    'assessment':    'assessments',
    'scheme':        'schemes of work',
}


# ============================================================
# 2. THE GATE — call this before every generation
# ============================================================

async def check_usage_limit(user, feature: Feature, db) -> dict:
    """
    Returns a dict with `use_credit: bool` if the request should proceed.
    Raises HTTPException(429) with a structured `detail` if blocked.

    The `detail` shape is exactly what the frontend paywall.show() consumes:
      { reason, feature, used, cap, reset_days, plan }
    """
    plan = user.plan
    caps = PLAN_CAPS[plan]
    now  = datetime.now(timezone.utc)

    # --- 2a. Feature locked entirely on this plan ---
    if caps[feature] == 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                'reason':  'feature-locked',
                'feature': FEATURE_LABEL[feature],
                'plan':    plan,
                'message': f'{FEATURE_LABEL[feature].capitalize()} are not available on the {plan.title()} plan.',
            },
        )

    # --- 2b. Daily cap (cheapest check, run first) ---
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    daily_count = await db.fetchval(
        """SELECT COUNT(*) FROM usage_events
           WHERE user_id = $1
             AND created_at >= $2
             AND status = 'success'""",
        user.id, today_start,
    )

    if daily_count >= caps['daily_total']:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                'reason':  'daily-cap',
                'used':    daily_count,
                'cap':     caps['daily_total'],
                'plan':    plan,
                'message': f"You've hit today's {caps['daily_total']}-generation cap.",
            },
        )

    # --- 2c. Monthly per-feature cap ---
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_count = await db.fetchval(
        """SELECT COUNT(*) FROM usage_events
           WHERE user_id = $1
             AND feature = $2
             AND created_at >= $3
             AND status = 'success'""",
        user.id, feature, month_start,
    )

    if monthly_count >= caps[feature]:
        # Honour one-off K5 credits before bouncing the user
        if user.one_off_credits > 0:
            return {'use_credit': True, 'model': caps['model']}

        # Days until reset (the 1st of next month)
        days_in_month   = monthrange(now.year, now.month)[1]
        days_until_reset = days_in_month - now.day + 1

        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                'reason':      'monthly-limit',
                'feature':     FEATURE_LABEL[feature],
                'used':        monthly_count,
                'cap':         caps[feature],
                'reset_days':  days_until_reset,
                'plan':        plan,
                'message':     f"You've used all {caps[feature]} {FEATURE_LABEL[feature]} this month.",
            },
        )

    return {'use_credit': False, 'model': caps['model']}


# ============================================================
# 3. RECORDING USAGE — call after a successful generation
# ============================================================

async def record_usage(user, feature: Feature, db, *,
                       used_credit: bool = False,
                       metadata: dict | None = None) -> None:
    """
    Logs the event AND decrements the one-off credit if one was used.
    Wrap this in the same DB transaction as the generation save, so we
    never charge a user without giving them their output.
    """
    async with db.transaction():
        await db.execute(
            """INSERT INTO usage_events
               (user_id, feature, status, charged_credit, metadata)
               VALUES ($1, $2, 'success', $3, $4::jsonb)""",
            user.id, feature, used_credit, metadata or {},
        )
        if used_credit:
            await db.execute(
                "UPDATE users SET one_off_credits = one_off_credits - 1 WHERE id = $1",
                user.id,
            )


# ============================================================
# 4. EXAMPLE ROUTE — how it all fits together
# ============================================================
"""
@app.post('/api/generate/lesson-plan')
async def generate_lesson_plan(
    body: LessonPlanRequest,
    user = Depends(current_user),
    db   = Depends(get_db),
):
    # 1. Gate
    gate = await check_usage_limit(user, 'lesson_plan', db)

    # 2. Generate (use cheaper model on Free, premium on Pro/Max)
    result = await ai_generate_lesson_plan(body, model=gate['model'])

    # 3. Record (atomic with the result save)
    await record_usage(
        user, 'lesson_plan', db,
        used_credit=gate['use_credit'],
        metadata={'grade': body.grade, 'subject': body.subject, 'topic': body.topic},
    )

    return result


# Example client-side handling (vanilla JS):
#
#   try {
#     const r = await fetch('/api/generate/lesson-plan', {...});
#     if (r.status === 429) {
#       const { detail } = await r.json();
#       paywall.show(detail.reason, detail);   // 1:1 mapping
#       return;
#     }
#     // ... use the result
#   } catch (e) { ... }
"""


# ============================================================
# 5. USAGE-LOOKUP HELPER (for the dashboard meter)
# ============================================================

async def get_current_month_usage(user_id, db) -> dict:
    """Returns {feature: used_count} for the dashboard widget."""
    rows = await db.fetch(
        """SELECT feature, COUNT(*) AS used
           FROM usage_events
           WHERE user_id = $1
             AND status = 'success'
             AND created_at >= date_trunc('month', NOW())
           GROUP BY feature""",
        user_id,
    )
    out = {f: 0 for f in PLAN_CAPS['free'] if f not in ('daily_total','model')}
    for r in rows:
        out[r['feature']] = r['used']
    return out


async def get_today_usage(user_id, db) -> int:
    """Total generations today — for the daily strip on the meter."""
    return await db.fetchval(
        """SELECT COUNT(*) FROM usage_events
           WHERE user_id = $1
             AND status = 'success'
             AND created_at >= date_trunc('day', NOW())""",
        user_id,
    )
