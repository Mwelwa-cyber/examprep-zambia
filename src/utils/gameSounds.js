/**
 * Tiny sound helper for the games surface.
 *
 * Generates short tones with the Web Audio API — no sound files needed.
 * Mute state persists in localStorage so the preference sticks across
 * sessions. Defaults to ON; one-tap mute toggle in the nav.
 *
 * Used by:
 *   - TimedQuizGame   (correct/wrong on each answer)
 *   - MemoryMatchGame (match/mismatch on flip)
 *   - WordBuilderGame (solve beep)
 */

const STORAGE_KEY = 'zedexams_games_muted'
let audioCtx = null
let soundsReady = false

function getMuted() {
  try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}

export function isMuted() { return getMuted() }

export function toggleMute() {
  const next = !getMuted()
  try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0') } catch {}
  return next
}

function ctx() {
  if (audioCtx) return audioCtx
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    audioCtx = new AC()
    return audioCtx
  } catch {
    return null
  }
}

/** Prime the audio context on first user gesture (iOS/Safari requirement). */
export function primeSounds() {
  if (soundsReady) return
  const c = ctx()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
  soundsReady = true
}

function beep(freq, durMs, volume = 0.12, waveform = 'sine') {
  if (getMuted()) return
  const c = ctx()
  if (!c) return
  try {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = waveform
    osc.frequency.setValueAtTime(freq, c.currentTime)
    gain.gain.setValueAtTime(volume, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durMs / 1000)
    osc.connect(gain).connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + durMs / 1000)
  } catch {
    /* swallow — audio is non-critical */
  }
}

/** Bright two-note "yay" for a correct answer. */
export function playCorrect() {
  beep(660, 90)
  setTimeout(() => beep(880, 130), 80)
}

/** Low "nope" for a wrong answer. */
export function playWrong() {
  beep(220, 180, 0.10, 'sawtooth')
}

/** Celebratory rising triplet for a match / streak / badge. */
export function playWin() {
  beep(660, 80)
  setTimeout(() => beep(880, 80), 80)
  setTimeout(() => beep(1100, 160), 160)
}

/** Soft click for tile placement / card flip. */
export function playTick() {
  beep(520, 40, 0.06, 'triangle')
}
