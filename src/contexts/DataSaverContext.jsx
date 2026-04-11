/**
 * DataSaverContext
 * ─────────────────────────────────────────────────
 * Provides a global toggle for "Data Saver Mode" — optimised for
 * learners in Zambia on limited mobile data.
 *
 * When ON:
 *   • Images are hidden or replaced with placeholders
 *   • CSS animations are disabled (class `ds-no-anim` added to body)
 *   • Heavy backgrounds (gradients, patterns) are simplified
 *   • Media auto-load is suppressed
 *
 * State is persisted to localStorage so the preference survives
 * a page refresh.
 */
import { createContext, useContext, useEffect, useState } from 'react'

const DataSaverContext = createContext({ dataSaver: false, toggleDataSaver: () => {} })

const LS_KEY = 'examprep:dataSaver'

export function DataSaverProvider({ children }) {
  const [dataSaver, setDataSaver] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === 'true' } catch { return false }
  })

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, String(dataSaver)) } catch { /* noop */ }
    // Add/remove body class so CSS can react globally
    document.body.classList.toggle('data-saver', dataSaver)
  }, [dataSaver])

  function toggleDataSaver() { setDataSaver(v => !v) }

  return (
    <DataSaverContext.Provider value={{ dataSaver, toggleDataSaver }}>
      {children}
    </DataSaverContext.Provider>
  )
}

export function useDataSaver() {
  return useContext(DataSaverContext)
}
