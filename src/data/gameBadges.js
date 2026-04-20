/**
 * Game Badges — awarded by playing the public /games experience.
 *
 * Each badge has:
 *   id          — stable unique slug, used as the key in /badges/{uid} doc
 *   name        — display name shown on the card and in the toast
 *   icon        — emoji
 *   tier        — 'bronze' | 'silver' | 'gold'
 *   description — what earned it
 *   hint        — sentence showing how to earn it (on locked badges)
 *   rule(ctx)   — pure function that returns truthy if the current game run
 *                 just earned this badge. `ctx` shape:
 *                 {
 *                   game:        { id, grade, subject, type, title },
 *                   score,       // final score
 *                   correct,     // number of correct answers
 *                   wrong,       // number of wrong answers
 *                   accuracy,    // 0–100
 *                   bestStreak,  // highest streak in this round
 *                   subjectsPlayed: Set<string>,  // across all previous plays
 *                   playsCount,  // total scores saved (including this one)
 *                 }
 *
 * When the student finishes a round, evaluateGameBadges(ctx) runs every
 * rule and returns the set of NEWLY earned badges — we filter out any
 * already in their badges/{uid} doc before showing toast.
 */

export const GAME_BADGES = [
  {
    id: 'first-game',
    name: 'First Game',
    icon: '🌱',
    tier: 'bronze',
    description: 'Played your very first learning game.',
    hint: 'Finish any game to unlock.',
    rule: (ctx) => ctx.playsCount >= 1,
  },
  {
    id: 'on-fire',
    name: 'On Fire',
    icon: '🔥',
    tier: 'silver',
    description: 'Got a 10-question winning streak.',
    hint: 'Hit a 10-in-a-row streak in any timed quiz.',
    rule: (ctx) => ctx.bestStreak >= 10,
  },
  {
    id: 'centurion',
    name: 'Centurion',
    icon: '💯',
    tier: 'silver',
    description: 'Scored 100 points or more in a single round.',
    hint: 'Reach 100 points in one round.',
    rule: (ctx) => ctx.score >= 100,
  },
  {
    id: 'sharp-shooter',
    name: 'Sharp Shooter',
    icon: '🎯',
    tier: 'gold',
    description: 'Answered 90% or more correctly in a single round.',
    hint: 'Finish a round with 90%+ accuracy (at least 5 questions answered).',
    rule: (ctx) => ctx.accuracy >= 90 && (ctx.correct + ctx.wrong) >= 5,
  },
  {
    id: 'maths-racer',
    name: 'Maths Racer',
    icon: '⚡',
    tier: 'bronze',
    description: 'Completed a Mathematics game.',
    hint: 'Finish any Maths game.',
    rule: (ctx) => ctx.game?.subject === 'mathematics' && ctx.playsCount >= 1,
  },
  {
    id: 'word-wizard',
    name: 'Word Wizard',
    icon: '🔤',
    tier: 'bronze',
    description: 'Completed an English game.',
    hint: 'Finish any English game.',
    rule: (ctx) => ctx.game?.subject === 'english' && ctx.playsCount >= 1,
  },
  {
    id: 'science-scout',
    name: 'Science Scout',
    icon: '🔬',
    tier: 'bronze',
    description: 'Completed a Science game.',
    hint: 'Finish any Science game.',
    rule: (ctx) => ctx.game?.subject === 'science' && ctx.playsCount >= 1,
  },
  {
    id: 'all-rounder',
    name: 'All Rounder',
    icon: '🌈',
    tier: 'gold',
    description: 'Played games from three or more different subjects.',
    hint: 'Finish games across 3 different subjects.',
    rule: (ctx) => (ctx.subjectsPlayed?.size || 0) >= 3,
  },
  {
    id: 'dedicated-player',
    name: 'Dedicated Player',
    icon: '🔖',
    tier: 'silver',
    description: 'Completed 10 game rounds.',
    hint: 'Finish 10 rounds in total.',
    rule: (ctx) => ctx.playsCount >= 10,
  },
  {
    id: 'champion',
    name: 'Champion',
    icon: '🏆',
    tier: 'gold',
    description: 'Scored 200+ points in a single round.',
    hint: 'Reach 200 points in one round.',
    rule: (ctx) => ctx.score >= 200,
  },
]

export const GAME_BADGE_MAP = Object.fromEntries(GAME_BADGES.map((b) => [b.id, b]))

/**
 * Evaluate which game badges the current run earned.
 * Returns { earnedIds: [ids…], newlyEarned: [{id, name, icon, …}, …] }
 * where newlyEarned excludes badges already present in `alreadyEarnedIds`.
 */
export function evaluateGameBadges(ctx, alreadyEarnedIds = new Set()) {
  const earnedIds = []
  const newlyEarned = []
  for (const badge of GAME_BADGES) {
    try {
      if (badge.rule(ctx)) {
        earnedIds.push(badge.id)
        if (!alreadyEarnedIds.has(badge.id)) newlyEarned.push(badge)
      }
    } catch (err) {
      console.warn(`badge rule threw for ${badge.id}`, err)
    }
  }
  return { earnedIds, newlyEarned }
}

export const BADGE_TIER_STYLES = {
  bronze: { border: 'border-amber-300', bg: 'bg-amber-50',   text: 'text-amber-800', label: 'Bronze' },
  silver: { border: 'border-slate-300', bg: 'bg-slate-50',   text: 'text-slate-700', label: 'Silver' },
  gold:   { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-800', label: 'Gold' },
}
