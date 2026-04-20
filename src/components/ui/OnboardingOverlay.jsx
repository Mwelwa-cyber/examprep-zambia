/**
 * OnboardingOverlay
 *
 * Shows a brief welcome tour the very first time a user opens the dashboard.
 * Steps are stored and dismissed via localStorage key 'examprep:onboarded'.
 *
 * Usage:
 *   <OnboardingOverlay />   (place anywhere inside the dashboard component tree)
 */
import { useState, useEffect } from 'react'
import Button from './Button'

const LS_KEY = 'examprep:onboarded'

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to ZedExams! 🎓',
    body: 'This is your learning hub. Select your grade to see your subjects and start practising.',
    icon: '👋',
  },
  {
    id: 'quizzes',
    title: 'Take Quizzes',
    body: 'Hit "Start Quiz" to test your knowledge with CBC-aligned practice questions.',
    icon: '✏️',
  },
  {
    id: 'theme',
    title: 'Change Your Theme',
    body: 'Click the colour swatch in the top bar to switch between 5 beautiful themes.',
    icon: '🎨',
  },
  {
    id: 'badges',
    title: 'Earn Badges',
    body: 'Complete quizzes to unlock achievement badges and track your learning journey.',
    icon: '🏆',
  },
]

export default function OnboardingOverlay() {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(LS_KEY)) setVisible(true)
    } catch { /* localStorage unavailable */ }
  }, [])

  function dismiss() {
    try { localStorage.setItem(LS_KEY, 'true') } catch { }
    setVisible(false)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else dismiss()
  }

  if (!visible) return null

  const current = STEPS[step]

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="theme-card rounded-3xl shadow-2xl border theme-border w-full max-w-sm p-6 animate-slide-up">
        {/* Step indicator dots — theme accent for current, subtle bg for the rest */}
        <div className="flex justify-center gap-1.5 mb-4" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all duration-base ease-out ${i === step ? 'w-5 h-2 theme-accent-fill' : 'w-2 h-2 theme-bg-subtle'}`}
            />
          ))}
        </div>

        <div className="text-5xl text-center mb-3" aria-hidden="true">{current.icon}</div>

        <h2 className="text-display-md theme-text text-center mb-2">{current.title}</h2>
        <p className="theme-text-muted text-body-sm text-center mb-6">{current.body}</p>

        <div className="flex gap-3">
          <Button variant="secondary" size="md" fullWidth onClick={dismiss} className="flex-1">
            Skip tour
          </Button>
          <Button variant="primary" size="md" fullWidth onClick={next} className="flex-1">
            {step < STEPS.length - 1 ? 'Next →' : "Let's go! 🚀"}
          </Button>
        </div>
      </div>
    </div>
  )
}
