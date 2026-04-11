/**
 * ProfessorPako — academic owl mascot for ExamPrep Zambia.
 *
 * Props:
 *   size    — pixel width/height of the SVG (default 100)
 *   mood    — 'normal' | 'happy' | 'thinking' | 'excited' | 'tip'
 *   animate — true = floating animation (respects data-saver)
 *   className — additional wrapper classes
 */
import { useDataSaver } from '../../contexts/DataSaverContext'

export default function ProfessorPako({ size = 100, mood = 'normal', animate = true, className = '' }) {
  const { dataSaver } = useDataSaver()
  const shouldAnimate = animate && !dataSaver

  // Mouth / beak position varies by mood
  const beakPath = {
    normal:  'M53 63 L67 63 L60 71Z',
    happy:   'M53 61 Q60 70 67 61 L67 63 Q60 73 53 63Z',
    thinking:'M55 64 L65 62',
    excited: 'M51 61 Q60 72 69 61 L69 64 Q60 76 51 64Z',
    tip:     'M53 63 L67 63 L60 71Z',
  }[mood] ?? 'M53 63 L67 63 L60 71Z'

  // Eye direction varies slightly
  const eyeOffset = mood === 'thinking' ? 2 : 0

  return (
    <div
      className={`inline-block select-none ${shouldAnimate ? 'animate-float' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 170"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Professor Pako the owl mascot"
        role="img"
      >
        {/* ── GRADUATION GOWN (behind body) ─────────────────── */}
        <path
          d="M28 85 Q20 112 22 155 L60 159 L98 155 Q100 112 92 85 Q76 96 60 96 Q44 96 28 85Z"
          fill="#1E3A8A"
        />
        {/* Gown front panels / lapels */}
        <path
          d="M44 85 L52 104 L60 98 L68 104 L76 85"
          fill="#1D4ED8"
          opacity="0.55"
        />
        <path
          d="M44 85 L52 104 L60 98 L68 104 L76 85"
          stroke="#3B82F6"
          strokeWidth="0.8"
          fill="none"
        />
        {/* Gold buttons on gown */}
        <circle cx="60" cy="108" r="2.2" fill="#F59E0B" />
        <circle cx="60" cy="118" r="2.2" fill="#F59E0B" />
        <circle cx="60" cy="128" r="2.2" fill="#F59E0B" />

        {/* ── BODY ─────────────────────────────────────────── */}
        <ellipse cx="60" cy="85" rx="27" ry="29" fill="#B45309" />

        {/* Belly / chest (cream) */}
        <ellipse cx="60" cy="91" rx="16" ry="20" fill="#FEF3C7" />
        {/* Belly feather lines */}
        <path d="M50 82 Q60 84 70 82" stroke="#D97706" strokeWidth="1.3" fill="none" />
        <path d="M48 89 Q60 91 72 89" stroke="#D97706" strokeWidth="1.3" fill="none" />
        <path d="M50 96 Q60 98 70 96" stroke="#D97706" strokeWidth="1.3" fill="none" />

        {/* ── WINGS ────────────────────────────────────────── */}
        <path d="M33 78 Q14 90 16 118 Q30 106 38 88Z" fill="#92400E" />
        <path d="M87 78 Q106 90 104 118 Q90 106 82 88Z" fill="#92400E" />
        {/* Wing feather texture */}
        <path d="M18 96 Q23 92 28 97"  stroke="#78350F" strokeWidth="1.1" fill="none" />
        <path d="M17 107 Q22 103 27 108" stroke="#78350F" strokeWidth="1.1" fill="none" />
        <path d="M102 96 Q97 92 92 97"  stroke="#78350F" strokeWidth="1.1" fill="none" />
        <path d="M103 107 Q98 103 93 108" stroke="#78350F" strokeWidth="1.1" fill="none" />

        {/* ── HEAD ─────────────────────────────────────────── */}
        <circle cx="60" cy="48" r="25" fill="#B45309" />

        {/* Forehead feather texture */}
        <path d="M46 36 L48 28 L52 36" stroke="#92400E" strokeWidth="1.1" fill="none" />
        <path d="M56 31 L58 23 L62 31" stroke="#92400E" strokeWidth="1.1" fill="none" />
        <path d="M68 36 L72 28 L74 36" stroke="#92400E" strokeWidth="1.1" fill="none" />

        {/* ── EAR TUFTS ────────────────────────────────────── */}
        <path d="M40 32 L35 16 L48 28Z" fill="#92400E" />
        <path d="M40 32 L37 20 L46 28Z" fill="#B45309" />
        <path d="M80 32 L85 16 L72 28Z" fill="#92400E" />
        <path d="M80 32 L83 20 L74 28Z" fill="#B45309" />

        {/* ── GRADUATION CAP ───────────────────────────────── */}
        {/* Skull cap */}
        <ellipse cx="60" cy="25" rx="21" ry="7" fill="#111827" />
        {/* Flat board */}
        <rect x="36" y="18" width="48" height="7" rx="0.5" fill="#111827" />
        {/* Board top highlight */}
        <rect x="36" y="18" width="48" height="2.5" rx="0.5" fill="#374151" />
        {/* Top button */}
        <circle cx="60" cy="18" r="2.5" fill="#4B5563" />
        {/* Tassel cord */}
        <path
          d="M84 20 Q96 15 93 35"
          stroke="#F59E0B"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {/* Tassel knot */}
        <circle cx="93" cy="34" r="3" fill="#FBBF24" />
        {/* Tassel strands */}
        <path d="M90 37 L87 47" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M93 37 L91 48" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M96 37 L95 47" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />

        {/* ── GLASSES ──────────────────────────────────────── */}
        {/* Left lens */}
        <circle cx="48" cy="50" r="10.5" fill="white" fillOpacity="0.92" />
        <circle cx="48" cy="50" r="10.5" stroke="#374151" strokeWidth="2" fill="none" />
        {/* Right lens */}
        <circle cx="72" cy="50" r="10.5" fill="white" fillOpacity="0.92" />
        <circle cx="72" cy="50" r="10.5" stroke="#374151" strokeWidth="2" fill="none" />
        {/* Bridge */}
        <path d="M58.5 50 L61.5 50" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
        {/* Temple arms */}
        <path d="M37.5 48 L35 46" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
        <path d="M82.5 48 L85 46" stroke="#374151" strokeWidth="2" strokeLinecap="round" />

        {/* ── EYES ─────────────────────────────────────────── */}
        {/* Left iris */}
        <circle cx={48 + eyeOffset} cy="51" r="6.5" fill="#1E40AF" />
        {/* Left pupil */}
        <circle cx={49 + eyeOffset} cy="51" r="4" fill="#0F172A" />
        {/* Left highlight */}
        <circle cx={51 + eyeOffset} cy="48.5" r="2" fill="white" />
        {/* Right iris */}
        <circle cx={72 + eyeOffset} cy="51" r="6.5" fill="#1E40AF" />
        {/* Right pupil */}
        <circle cx={73 + eyeOffset} cy="51" r="4" fill="#0F172A" />
        {/* Right highlight */}
        <circle cx={75 + eyeOffset} cy="48.5" r="2" fill="white" />

        {/* ── BEAK ─────────────────────────────────────────── */}
        <path d={beakPath} fill="#FBBF24" />
        <path d={`M53 63 L67 63 L60 66Z`} fill="#F59E0B" />

        {/* ── FEET / TALONS ─────────────────────────────────── */}
        <path
          d="M46 151 L42 163 M46 151 L47 163 M46 151 L51 161"
          stroke="#FBBF24"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="M74 151 L69 163 M74 151 L74 163 M74 151 L79 161"
          stroke="#FBBF24"
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* ── SCROLL (right wing) ───────────────────────────── */}
        <rect x="96" y="92" width="20" height="26" rx="2.5" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.3" />
        <rect x="96" y="92" width="20" height="6"  rx="1.5" fill="#FDE68A" />
        <rect x="96" y="112" width="20" height="6" rx="1.5" fill="#FDE68A" />
        <path d="M99 101 L113 101" stroke="#D97706" strokeWidth="1" strokeLinecap="round" />
        <path d="M99 105 L113 105" stroke="#D97706" strokeWidth="1" strokeLinecap="round" />
        <path d="M99 109 L111 109" stroke="#D97706" strokeWidth="1" strokeLinecap="round" />

        {/* ── MOOD ACCESSORIES ─────────────────────────────── */}
        {mood === 'excited' && (
          <>
            <path d="M18 50 L14 44 M16 56 L10 56" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <path d="M102 50 L106 44 M104 56 L110 56" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {mood === 'thinking' && (
          <>
            <circle cx="105" cy="30" r="4" fill="#E0E7FF" stroke="#6366F1" strokeWidth="1.5" />
            <circle cx="113" cy="22" r="3" fill="#E0E7FF" stroke="#6366F1" strokeWidth="1.5" />
            <circle cx="119" cy="16" r="5" fill="#E0E7FF" stroke="#6366F1" strokeWidth="1.5" />
            <text x="115.5" y="19.5" textAnchor="middle" fontSize="6" fill="#6366F1" fontWeight="bold">?</text>
          </>
        )}
        {mood === 'tip' && (
          <circle cx="110" cy="28" r="8" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
        )}
      </svg>
    </div>
  )
}
