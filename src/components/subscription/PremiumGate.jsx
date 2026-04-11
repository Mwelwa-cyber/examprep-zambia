import { useState } from 'react'
import { useSubscription } from '../../hooks/useSubscription'
import UpgradeModal from './UpgradeModal'

export default function PremiumGate({ feature, children }) {
  const { isPremium, canUseExamMode, canUseWeaknessAnalysis } = useSubscription()
  const [showUpgrade, setShowUpgrade] = useState(false)

  const allowed = feature === 'examMode' ? canUseExamMode
    : feature === 'weaknessAnalysis' ? canUseWeaknessAnalysis
    : isPremium

  if (allowed) return children

  return (
    <>
      <div onClick={() => setShowUpgrade(true)} className="cursor-pointer select-none relative">
        <div className="opacity-40 pointer-events-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
          <div className="text-center px-4">
            <div className="text-3xl mb-1">🔒</div>
            <p className="font-black text-gray-700 text-sm">Premium feature</p>
            <p className="text-green-600 font-bold text-xs underline mt-0.5">Upgrade to unlock</p>
          </div>
        </div>
      </div>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </>
  )
}

export function AttemptCounter({ onUpgradeClick }) {
  const { isPremium, attemptsLeft, dailyLimit, usedToday } = useSubscription()

  if (isPremium) return (
    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 text-sm">
      <span>⭐</span><span className="font-bold text-yellow-700">Premium — unlimited quizzes</span>
    </div>
  )

  const pct = Math.round((usedToday / dailyLimit) * 100)
  const empty = attemptsLeft === 0
  const warning = attemptsLeft <= 1

  return (
    <div className={`rounded-xl px-3 py-2 text-sm border ${empty ? 'bg-red-50 border-red-200' : warning ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`font-bold ${empty ? 'text-red-700' : warning ? 'text-orange-700' : 'text-blue-700'}`}>
          {empty ? '⛔ Daily limit reached' : `📝 ${attemptsLeft} quiz${attemptsLeft !== 1 ? 'zes' : ''} left today`}
        </span>
        <button onClick={onUpgradeClick} className="text-xs font-black text-green-600 underline min-h-0 p-0 bg-transparent shadow-none">Go Unlimited ⭐</button>
      </div>
      <div className="w-full bg-white/60 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${empty ? 'bg-red-400' : warning ? 'bg-orange-400' : 'bg-blue-400'}`}
          style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      {empty && <p className="text-xs text-red-600 mt-1">Come back tomorrow, or upgrade for unlimited access.</p>}
    </div>
  )
}

export function UpgradeBanner({ onUpgradeClick }) {
  const { isPremium } = useSubscription()
  const [show, setShow] = useState(true)
  if (isPremium || !show) return null
  return (
    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
      <div>
        <p className="font-black text-white text-base">🚀 Upgrade to Premium</p>
        <p className="text-white/90 text-xs mt-0.5">Unlimited quizzes · All papers · Exam mode</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onUpgradeClick} className="bg-white text-orange-600 font-black text-sm py-2 px-4 rounded-full shadow min-h-0">From K50/mo</button>
        <button onClick={() => setShow(false)} className="text-white/70 hover:text-white font-black text-xl min-h-0 p-0 bg-transparent shadow-none">×</button>
      </div>
    </div>
  )
}
