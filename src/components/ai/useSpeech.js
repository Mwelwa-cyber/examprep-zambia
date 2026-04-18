import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * useSpeech — wraps the browser Web Speech API (`window.speechSynthesis`)
 * so Zed can read his responses aloud.
 *
 * Why native Web Speech: it's free, offline-capable where the OS supports
 * it, no API quotas, and every evergreen browser ships it. Quality varies
 * by OS — Chrome on desktop has the best voices, iOS Safari has solid
 * system voices, Firefox is limited.
 *
 * The hook takes care of the rough edges:
 *   • Chrome loads voices async → we listen for `voiceschanged`
 *   • Long text is chunked by sentence (~200 chars) because Chrome silently
 *     truncates utterances past a few hundred characters
 *   • iOS needs a user gesture to unlock audio — voice-mode toggle or a
 *     per-message speak click both count as gestures
 *   • Markdown (**, ##, bullets) is stripped so the TTS doesn't say
 *     "asterisk asterisk"
 *   • The user's voice choice persists in localStorage
 *
 * Returns
 *   voices            — SpeechSynthesisVoice[] (English only, sorted by locale)
 *   voice             — the currently selected voice
 *   setVoice(id)      — pick by voiceURI (and persist)
 *   supported         — boolean, false if speechSynthesis is unavailable
 *   speaking          — boolean, true while any utterance is active
 *   activeId          — string | null — the id we passed into `speak()`
 *                        for the currently-speaking message (lets the UI
 *                        show which bubble is being read aloud)
 *   speak(text, id?)  — cancel current, speak new. id is arbitrary — it's
 *                        echoed through `activeId` for UI indicators
 *   stop()            — cancel everything
 */

const LS_VOICE_KEY = 'examprep:zedVoiceURI'

export function useSpeech() {
  const supported = typeof window !== 'undefined'
    && typeof window.speechSynthesis !== 'undefined'

  const [voices, setVoices] = useState([])
  const [voiceURI, setVoiceURI] = useState(() => {
    if (typeof localStorage === 'undefined') return ''
    try { return localStorage.getItem(LS_VOICE_KEY) || '' } catch { return '' }
  })
  const [speaking, setSpeaking] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const activeIdRef = useRef(null) // so utterance callbacks always see the latest value

  /* Load voices. Chrome populates asynchronously — list is empty on the
     first synchronous call — so we have to listen for `voiceschanged`. */
  useEffect(() => {
    if (!supported) return undefined
    const synth = window.speechSynthesis

    function refresh() {
      const all = synth.getVoices() || []
      // Only expose English voices — Zed speaks English regardless of the
      // learner's first language. Sort en-GB first, then en-ZA/en-KE (closer
      // accents), then en-US / the rest.
      const english = all.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'))
      const rank = (v) => {
        const lang = (v.lang || '').toLowerCase()
        if (lang === 'en-gb') return 0
        if (lang === 'en-za' || lang === 'en-ke' || lang === 'en-ng') return 1
        if (lang === 'en-us') return 2
        return 3
      }
      english.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
      setVoices(english)
    }

    refresh()
    synth.addEventListener?.('voiceschanged', refresh)
    // Fallback assignment for older Safari that uses the property form.
    if (typeof synth.onvoiceschanged !== 'undefined') {
      synth.onvoiceschanged = refresh
    }
    return () => synth.removeEventListener?.('voiceschanged', refresh)
  }, [supported])

  /* Resolve the selected voice object every time voiceURI or voices change.
     If the saved URI isn't in the current list (OS voices changed), fall
     through to the best-available auto-pick. */
  const voice = useMemo(() => {
    if (!voices.length) return null
    if (voiceURI) {
      const match = voices.find(v => v.voiceURI === voiceURI)
      if (match) return match
    }
    // Auto-pick: prefer a "natural" / "Google" voice within the best locale.
    const withFlag = (test) => voices.find(test)
    return (
      withFlag(v => /google/i.test(v.name) && v.lang.toLowerCase() === 'en-gb')
      || withFlag(v => v.lang.toLowerCase() === 'en-gb')
      || withFlag(v => v.lang.toLowerCase() === 'en-za')
      || withFlag(v => /google/i.test(v.name) && v.lang.toLowerCase().startsWith('en'))
      || voices[0]
    )
  }, [voices, voiceURI])

  const setVoice = useCallback((uri) => {
    setVoiceURI(uri || '')
    try { localStorage.setItem(LS_VOICE_KEY, uri || '') } catch { /* storage may be disabled */ }
  }, [])

  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setActiveId(null)
    activeIdRef.current = null
  }, [supported])

  const speak = useCallback((rawText, id = null) => {
    if (!supported) return
    const clean = stripMarkdown(rawText)
    if (!clean) return

    const synth = window.speechSynthesis
    synth.cancel()

    const chunks = chunkBySentence(clean, 200)
    if (!chunks.length) return

    setSpeaking(true)
    setActiveId(id)
    activeIdRef.current = id

    chunks.forEach((chunk, index) => {
      const utter = new window.SpeechSynthesisUtterance(chunk)
      if (voice) {
        utter.voice = voice
        utter.lang = voice.lang
      } else {
        utter.lang = 'en-GB'
      }
      // Gentle teacher pacing — slightly slower than default, normal pitch.
      utter.rate = 0.98
      utter.pitch = 1.0
      utter.volume = 1.0
      if (index === chunks.length - 1) {
        utter.onend = () => {
          // Only clear if we're still the active utterance (another speak()
          // call may have replaced us in the meantime).
          if (activeIdRef.current === id) {
            setSpeaking(false)
            setActiveId(null)
            activeIdRef.current = null
          }
        }
        utter.onerror = () => {
          if (activeIdRef.current === id) {
            setSpeaking(false)
            setActiveId(null)
            activeIdRef.current = null
          }
        }
      }
      synth.speak(utter)
    })
  }, [supported, voice])

  /* Cancel any ongoing speech when the component unmounts. Otherwise the
     tab keeps talking after the user navigates away. */
  useEffect(() => {
    if (!supported) return undefined
    return () => { try { window.speechSynthesis.cancel() } catch { /* already cancelled */ } }
  }, [supported])

  /* ──────────────────────────────────────────────────────────────────
   * Speech recognition (microphone → text)
   *
   * `window.SpeechRecognition` is only available in Chromium (Chrome,
   * Edge, Opera) and Safari — both under the `webkit` prefix. Firefox
   * doesn't ship it. The hook returns a separate `recognitionSupported`
   * flag so the UI can hide the mic entirely where unsupported.
   *
   * Dictation model (not chat model): tap to start, speak, tap to stop.
   * Interim results stream through `interimTranscript` so the textarea
   * shows what the user is saying in real time. Final committed pieces
   * accumulate in `finalTranscript`; the caller concatenates them with
   * any pre-existing input.
   * ──────────────────────────────────────────────────────────────── */
  const SpeechRecognition = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null
  const recognitionSupported = Boolean(SpeechRecognition)

  const [listening, setListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [recognitionError, setRecognitionError] = useState(null)
  const recognitionRef = useRef(null)
  // Tracks the length of the full session-final-text we've already emitted.
  // Chrome re-fires onresult for the SAME result index when it transitions
  // from interim → final, and sometimes keeps appending to an existing final
  // segment. Using event.resultIndex alone is not enough — we need to compare
  // the total accumulated final text against what we've already pushed out.
  const committedFinalRef = useRef('')

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* already stopped */ }
      recognitionRef.current = null
    }
    setListening(false)
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionSupported) return
    // Don't speak-and-listen simultaneously — it picks up the TTS output.
    try { window.speechSynthesis.cancel() } catch { /* ignore */ }

    const rec = new SpeechRecognition()
    rec.lang = (voice?.lang) || 'en-GB'
    rec.continuous = true        // keep listening through natural pauses
    rec.interimResults = true    // stream partial results while speaking
    rec.maxAlternatives = 1

    rec.onstart = () => {
      // Fresh session — forget what we've committed before.
      committedFinalRef.current = ''
    }

    rec.onresult = (event) => {
      // Build the FULL picture of this session:
      //   allFinal — every finalized segment concatenated
      //   interim  — the current in-progress segment
      // Then emit only the delta beyond what we've already pushed upstream.
      let interim = ''
      let allFinal = ''
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) allFinal += r[0].transcript + ' '
        else interim += r[0].transcript
      }
      allFinal = allFinal.replace(/\s+/g, ' ').trim()

      // Emit only the NEW final content beyond what we've already committed.
      // This survives two Chrome quirks:
      //   (1) the same result index fires twice as it transitions to final,
      //   (2) interim results can reset to empty and re-grow without
      //       affecting already-finalized earlier segments.
      if (allFinal.length > committedFinalRef.current.length
          && allFinal.startsWith(committedFinalRef.current)) {
        const newSegment = allFinal.slice(committedFinalRef.current.length).trim()
        committedFinalRef.current = allFinal
        if (newSegment) setFinalTranscript(newSegment)
      } else if (allFinal && allFinal !== committedFinalRef.current) {
        // Edge case: the recognizer revised earlier finalized text so our
        // previous prefix no longer matches. Replace wholesale rather than
        // duplicate — the caller will reconcile.
        committedFinalRef.current = allFinal
        setFinalTranscript(allFinal)
      }

      setInterimTranscript(interim)
    }

    rec.onerror = (e) => {
      // "no-speech" just means the user stayed silent — not really an error.
      if (e.error && e.error !== 'no-speech' && e.error !== 'aborted') {
        setRecognitionError(friendlyRecognitionError(e.error))
      }
      stopListening()
    }

    rec.onend = () => {
      setListening(false)
      setInterimTranscript('')
      recognitionRef.current = null
    }

    try {
      committedFinalRef.current = ''
      rec.start()
      recognitionRef.current = rec
      setListening(true)
      setInterimTranscript('')
      setRecognitionError(null)
    } catch (err) {
      setRecognitionError('Could not start the microphone. Is another tab using it?')
    }
  }, [recognitionSupported, SpeechRecognition, voice, stopListening])

  const resetTranscript = useCallback(() => {
    setFinalTranscript('')
    setInterimTranscript('')
    setRecognitionError(null)
  }, [])

  /* Stop the microphone on unmount so it doesn't keep the indicator lit
     after the user navigates away. */
  useEffect(() => {
    if (!recognitionSupported) return undefined
    return () => stopListening()
  }, [recognitionSupported, stopListening])

  return {
    // Text-to-speech
    supported, voices, voice, setVoice, speaking, activeId, speak, stop,
    // Speech-to-text (microphone)
    recognitionSupported,
    listening,
    interimTranscript,
    finalTranscript,
    recognitionError,
    startListening,
    stopListening,
    resetTranscript,
  }
}

function friendlyRecognitionError(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was blocked. Enable mic permission in your browser settings and try again.'
    case 'audio-capture':
      return 'No microphone detected. Check that your device has one connected.'
    case 'network':
      return 'Network error while transcribing. Check your connection.'
    case 'language-not-supported':
      return 'The selected language is not supported for voice input on this device.'
    default:
      return 'Voice input stopped unexpectedly. Tap the mic to try again.'
  }
}

/* ────────────────────────────────────────────────────────────────────────
 * Helpers
 * ─────────────────────────────────────────────────────────────────────── */

function stripMarkdown(text) {
  return String(text ?? '')
    // Strip code fences entirely — reading code blocks aloud is useless.
    .replace(/```[\s\S]*?```/g, ' ')
    // Inline code: keep the inner text, drop the backticks.
    .replace(/`([^`]+)`/g, '$1')
    // Headers: strip leading # marks.
    .replace(/^#{1,6}\s+/gm, '')
    // Bold / italic markers.
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    // List bullets (including blockquote markers).
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^>\s*/gm, '')
    // Pipes/tables → commas so TTS reads them as breaks.
    .replace(/\s*\|\s*/g, ', ')
    // Collapse whitespace but preserve sentence boundaries.
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function chunkBySentence(text, maxLen = 200) {
  if (!text) return []
  // Split on . ! ? followed by whitespace, keeping the punctuation.
  const sentences = text.split(/(?<=[.!?])\s+/)
  const chunks = []
  let current = ''
  for (const sentence of sentences) {
    if (!sentence.trim()) continue
    if (current && (current.length + 1 + sentence.length) > maxLen) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current = current ? `${current} ${sentence}` : sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}
