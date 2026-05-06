// src/features/notes/hooks/useNote.js
//
// Loads a single note by id for the editor screen.
// Returns { note, loading, error, refresh } — refresh re-fetches manually.

import { useEffect, useState, useCallback } from 'react'
import { getNote } from '../lib/firestore'

export function useNote(id) {
  const [note, setNote]       = useState(null)
  const [loading, setLoading] = useState(!!id)
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    if (!id) { setNote(null); setLoading(false); return }
    setLoading(true)
    try {
      const data = await getNote(id)
      setNote(data)
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  return { note, loading, error, refresh: load }
}
