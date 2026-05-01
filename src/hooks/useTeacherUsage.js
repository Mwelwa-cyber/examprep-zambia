import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

// Maps live tool keys (functions/teacherTools/usageMeter.js) onto the
// dashboard-widget feature keys.
const TOOL_TO_FEATURE = {
  lesson_plan:    'plans',
  worksheet:      'worksheets',
  notes:          'notes',
  quiz:           'assessments',
  scheme_of_work: 'schemes',
}

// Live plan id → display label / chip variant the widget understands.
// The live model still uses free / individual / school; the widget renders
// using the new free / pro / max vocabulary. Treat individual + school
// as Pro until the plan model is unified.
const PLAN_VIEW = {
  free:       { id: 'free', label: 'Free', daily: 2 },
  individual: { id: 'pro',  label: 'Pro',  daily: 10 },
  school:     { id: 'pro',  label: 'Pro',  daily: 10 },
}

function yyyymm(d = new Date()) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}${m}`
}

function daysUntilMonthReset(now = new Date()) {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return Math.max(1, Math.ceil((next - now) / (1000 * 60 * 60 * 24)))
}

function project(meterData) {
  if (!meterData) return null
  const planView = PLAN_VIEW[meterData.plan] || PLAN_VIEW.free
  const counters = meterData.counters || {}
  const limits = meterData.limits || {}

  const used = {}
  const caps = {}
  for (const [tool, feature] of Object.entries(TOOL_TO_FEATURE)) {
    used[feature] = Number(counters[tool] || 0)
    caps[feature] = Number(limits[tool] ?? 0)
  }

  return {
    plan: planView.id,
    planLabel: planView.label,
    used,
    caps,
    daily: planView.daily,
    today: 0,                          // daily counter not yet tracked per-doc
    resetDays: daysUntilMonthReset(),
  }
}

export function useTeacherUsage(uid) {
  const [state, setState] = useState({ loading: true, data: null, error: null })

  useEffect(() => {
    if (!uid) {
      setState({ loading: false, data: null, error: null })
      return
    }
    const ref = doc(db, `usageMeters/${uid}/periods/${yyyymm()}`)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const projected = project(snap.exists() ? snap.data() : null)
        setState({
          loading: false,
          data: projected || {
            plan: 'free', planLabel: 'Free',
            used: { plans: 0, worksheets: 0, notes: 0, assessments: 0, schemes: 0 },
            caps: { plans: 0, worksheets: 0, notes: 0, assessments: 0, schemes: 0 },
            daily: 2, today: 0, resetDays: daysUntilMonthReset(),
          },
          error: null,
        })
      },
      (error) => setState({ loading: false, data: null, error })
    )
    return unsub
  }, [uid])

  return state
}
