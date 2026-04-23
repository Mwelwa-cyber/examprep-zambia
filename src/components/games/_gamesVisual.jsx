/**
 * Games visual system.
 *
 * Single source of truth for:
 *   - subject → gradient + Heroicon
 *   - game type/title → Heroicon
 *   - stat/nav Heroicons re-exports
 *
 * Every /games screen imports from here so icons and colours stay consistent.
 */

import {
  CalculatorIcon,
  BookOpenIcon,
  BeakerIcon,
  GlobeAltIcon,
  PuzzlePieceIcon,
  BoltIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  CheckBadgeIcon,
  MapIcon,
  SparklesIcon,
  StarIcon,
  FireIcon,
  TrophyIcon,
  ClockIcon,
  LockClosedIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'

export {
  CalculatorIcon, BookOpenIcon, BeakerIcon, GlobeAltIcon,
  PuzzlePieceIcon, BoltIcon, Squares2X2Icon, DocumentTextIcon,
  CheckBadgeIcon, MapIcon, SparklesIcon, StarIcon, FireIcon,
  TrophyIcon, ClockIcon, LockClosedIcon, RocketLaunchIcon,
  AcademicCapIcon, ArrowRightIcon, PlayIcon,
}

/** Subject visual tokens. Consistent across every card that shows a subject. */
export const SUBJECT_VISUAL = {
  mathematics: {
    label: 'Mathematics',
    Icon: CalculatorIcon,
    gradient: 'from-amber-400 to-orange-500',
    soft: 'from-amber-50 to-orange-50',
    ring: 'border-amber-200',
    text: 'text-orange-700',
    tileBg: 'bg-amber-50',
    blob: 'bg-amber-300',
  },
  english: {
    label: 'English',
    Icon: BookOpenIcon,
    gradient: 'from-sky-400 to-blue-500',
    soft: 'from-sky-50 to-blue-50',
    ring: 'border-sky-200',
    text: 'text-sky-700',
    tileBg: 'bg-sky-50',
    blob: 'bg-sky-300',
  },
  science: {
    label: 'Science',
    Icon: BeakerIcon,
    gradient: 'from-emerald-400 to-green-500',
    soft: 'from-emerald-50 to-green-50',
    ring: 'border-emerald-200',
    text: 'text-emerald-700',
    tileBg: 'bg-emerald-50',
    blob: 'bg-emerald-300',
  },
  social: {
    label: 'Social Studies',
    Icon: GlobeAltIcon,
    gradient: 'from-yellow-500 to-amber-600',
    soft: 'from-yellow-50 to-amber-100',
    ring: 'border-yellow-300',
    text: 'text-amber-700',
    tileBg: 'bg-yellow-50',
    blob: 'bg-yellow-300',
  },
  default: {
    label: 'Games',
    Icon: PuzzlePieceIcon,
    gradient: 'from-slate-400 to-slate-500',
    soft: 'from-slate-50 to-slate-100',
    ring: 'border-slate-200',
    text: 'text-slate-700',
    tileBg: 'bg-slate-50',
    blob: 'bg-slate-300',
  },
}

export function subjectVisual(slug) {
  return SUBJECT_VISUAL[slug] || SUBJECT_VISUAL.default
}

/** Pick a Heroicon for a game based on its `type` then its title. */
export function gameTypeIcon(game) {
  const type = (game?.type || '').toLowerCase()
  if (type === 'timed_quiz')    return BoltIcon
  if (type === 'memory_match')  return PuzzlePieceIcon
  if (type === 'word_builder')  return Squares2X2Icon

  const title = (game?.title || '').toLowerCase()
  if (/map|zambia|africa|province|capital|continent/.test(title)) return MapIcon
  if (/true.*false|true or false|t\/f/.test(title))              return CheckBadgeIcon
  if (/memory|match/.test(title))                                return PuzzlePieceIcon
  if (/read|comprehension|story/.test(title))                    return BookOpenIcon
  if (/speed|times|race|blitz|sprint/.test(title))               return BoltIcon
  if (/build|sentence|parts/.test(title))                        return Squares2X2Icon
  if (/spell|vocab|word|grammar/.test(title))                    return DocumentTextIcon
  if (/quiz|challenge/.test(title))                              return DocumentTextIcon
  return PuzzlePieceIcon
}

/** Map a badge id to a Heroicon (falls back to TrophyIcon). */
export function badgeIcon(id) {
  switch (id) {
    case 'first-game':       return SparklesIcon
    case 'on-fire':          return FireIcon
    case 'centurion':        return StarIcon
    case 'sharp-shooter':    return CheckBadgeIcon
    case 'maths-racer':      return BoltIcon
    case 'word-wizard':      return DocumentTextIcon
    case 'science-scout':    return BeakerIcon
    case 'all-rounder':      return Squares2X2Icon
    case 'dedicated-player': return AcademicCapIcon
    case 'champion':         return TrophyIcon
    default:                 return TrophyIcon
  }
}

/** Tiny helper that wraps a Heroicon in a soft-coloured circle. */
export function IconBubble({ icon: Icon, gradient = 'from-slate-400 to-slate-500', size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8 [&>svg]:w-4 [&>svg]:h-4',
    md: 'w-11 h-11 [&>svg]:w-5 [&>svg]:h-5',
    lg: 'w-14 h-14 [&>svg]:w-6 [&>svg]:h-6',
    xl: 'w-20 h-20 [&>svg]:w-9 [&>svg]:h-9',
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-2xl text-white shadow-sm bg-gradient-to-br ${gradient} ${sizes[size] || sizes.md} ${className}`}
      aria-hidden="true"
    >
      <Icon strokeWidth={2} />
    </span>
  )
}
