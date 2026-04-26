/**
 * Voice helpers for the Zed Telegram assistant.
 *
 *   transcribeOgg   — OpenAI Whisper STT for incoming Telegram voice notes.
 *   synthesizeOgg   — Google Cloud Text-to-Speech in OGG_OPUS format so the
 *                     output drops straight into Telegram sendVoice without
 *                     any transcoding.
 *
 * The Google TTS SDK and voice list are reused from functions/tts.js — same
 * curated voices, same project credentials. Whisper is called over plain
 * HTTPS via fetch + FormData (Node 22 ships them globally) so there's no
 * `openai` package to add and patch.
 */

const textToSpeech = require("@google-cloud/text-to-speech");

const ttsClient = new textToSpeech.TextToSpeechClient();

// Ordered list — also drives the numbered /voice picker in Telegram, so the
// indexes here are stable. Names match the curated list in useSpeech.js.
const VOICE_CATALOG = [
  {voiceURI: "en-GB-Neural2-B", name: "British Male (Neural)"},
  {voiceURI: "en-GB-Neural2-A", name: "British Female (Neural)"},
  {voiceURI: "en-ZA-Standard-A", name: "South African Female"},
  {voiceURI: "en-ZA-Standard-B", name: "South African Male"},
  {voiceURI: "en-GB-Studio-B", name: "British Male (Studio HQ)"},
  {voiceURI: "en-GB-Studio-C", name: "British Female (Studio HQ)"},
  {voiceURI: "en-US-Neural2-F", name: "American Female (Neural)"},
  {voiceURI: "en-US-Neural2-J", name: "American Male (Neural)"},
  {voiceURI: "en-GB-Standard-A", name: "British (Standard)"},
];
const ALLOWED_VOICES = new Set(VOICE_CATALOG.map((v) => v.voiceURI));
const DEFAULT_VOICE = VOICE_CATALOG[0].voiceURI; // British male — Zed's voice
const TTS_MAX_CHARS = 3000;

const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";
const WHISPER_MODEL = "whisper-1";

function languageCodeFor(voice) {
  return voice.split("-").slice(0, 2).join("-");
}

/**
 * Transcribe an OGG/Opus voice clip from Telegram via OpenAI Whisper.
 * Returns the trimmed transcript, or "" if Whisper produced nothing.
 * Throws on HTTP / auth errors so the caller can decide how to recover.
 */
async function transcribeOgg(openaiKey, oggBuffer, opts = {}) {
  if (!openaiKey) throw new Error("OPENAI_API_KEY not configured");
  if (!oggBuffer || !oggBuffer.length) throw new Error("Empty audio buffer");

  const form = new FormData();
  const blob = new Blob([oggBuffer], {type: "audio/ogg"});
  form.append("file", blob, "voice.ogg");
  form.append("model", WHISPER_MODEL);
  form.append("language", opts.language || "en");
  form.append("response_format", "json");
  form.append("temperature", "0");

  const res = await fetch(WHISPER_URL, {
    method: "POST",
    headers: {Authorization: `Bearer ${openaiKey}`},
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error?.message || `HTTP ${res.status}`;
    const err = new Error(`Whisper STT failed: ${message}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return String(data?.text || "").trim();
}

/**
 * Synthesize speech as an OGG_OPUS buffer ready for Telegram sendVoice.
 * Uses the same Google Cloud TTS client + voice list as functions/tts.js.
 *
 * Returns { audio: Buffer, voice: string, truncated: boolean }.
 * truncated=true means the input was longer than TTS_MAX_CHARS and only the
 * head was synthesised — caller should mention this to the user.
 */
async function synthesizeOgg(text, opts = {}) {
  const cleaned = stripMarkdown(text);
  if (!cleaned) throw new Error("Empty TTS text");

  const truncated = cleaned.length > TTS_MAX_CHARS;
  const input = truncated ? cleaned.slice(0, TTS_MAX_CHARS) : cleaned;

  const requested = opts.voice && ALLOWED_VOICES.has(opts.voice) ?
    opts.voice :
    DEFAULT_VOICE;

  const [response] = await ttsClient.synthesizeSpeech({
    input: {text: input},
    voice: {languageCode: languageCodeFor(requested), name: requested},
    audioConfig: {
      audioEncoding: "OGG_OPUS",
      speakingRate: Math.min(Math.max(Number(opts.rate) || 1.0, 0.5), 1.5),
      pitch: Math.min(Math.max(Number(opts.pitch) || 0, -10), 10),
    },
  });

  const audio = response?.audioContent;
  if (!audio) throw new Error("Google TTS returned empty audioContent");
  return {
    audio: Buffer.isBuffer(audio) ? audio : Buffer.from(audio),
    voice: requested,
    truncated,
  };
}

// Mirror of stripMarkdown in src/components/ai/useSpeech.js — keeps the
// Telegram voice notes from reading out literal `*`, `#`, list bullets, etc.
function stripMarkdown(text) {
  return String(text ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^>\s*/gm, "")
    .replace(/\s*\|\s*/g, ", ")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

module.exports = {
  transcribeOgg,
  synthesizeOgg,
  stripMarkdown,
  VOICE_CATALOG,
  ALLOWED_VOICES,
  DEFAULT_VOICE,
  TTS_MAX_CHARS,
};
