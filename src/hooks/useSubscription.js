import { useAuth } from '../contexts/AuthContext'
import { useFirestore } from './useFirestore'
import { getActivePlan, PLANS } from '../utils/subscriptionConfig'

export function useSubscription() {
  const { currentUser, userProfile, isPremium } = useAuth()
  const { checkAndConsumeAttempt }              = useFirestore()

  const plan         = getActivePlan(userProfile)
  const dailyLimit   = isPremium ? Infinity : (plan.dailyQuizLimit ?? 5)
  const todayStr     = new Date().toISOString().slice(0, 10)
  const isNewDay     = (userProfile?.lastAttemptDate ?? '') !== todayStr
  const usedToday    = isNewDay ? 0 : (userProfile?.dailyAttempts ?? 0)
  const attemptsLeft = isPremium ? Infinity : Math.max(0, dailyLimit - usedToday)
  const isAtLimit    = !isPremium && attemptsLeft <= 0

  const canUseExamMode         = isPremium || plan.examMode
  const canUseWeaknessAnalysis = isPremium || plan.weaknessAnalysis
  const paperLimit             = isPremium ? Infinity : (plan.paperLimit ?? 3)

  async function tryStartQuiz() {
    if (!currentUser) return { allowed: false, reason: 'not_authenticated' }
    const result = await checkAndConsumeAttempt(currentUser.uid, isPremium, dailyLimit)
    return {
      allowed: result.allowed,
      attemptsLeft: isPremium ? Infinity : Math.max(0, dailyLimit - result.attemptsToday),
      reason: result.allowed ? null : 'daily_limit_reached',
    }
  }

  return { isPremium, plan, planId: plan.id, planName: plan.name, dailyLimit, attemptsLeft, usedToday, isAtLimit, canUseExamMode, canUseWeaknessAnalysis, paperLimit, tryStartQuiz }
}
