// ===== GEMINI TTS VOICE =====

import { getState } from './state.js';
import { getTtsApiUrl, isProxyActive } from './gemini.js';

const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// Voice mapping — chosen to match character personality and gender
const CHARACTER_VOICES = {
  morpheus: 'Charon',     // Informative, calm — Morpheus's philosophical authority
  oracle: 'Aoede',        // Breezy, warm — Oracle's maternal, enigmatic tone
  smith: 'Orus',          // Firm, decisive — Smith's cold, precise menace
};

let audioContext = null;
let currentSource = null;

// Sequential queue: lines play one after another, never overlapping
let queue = [];
let processing = false;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Queue text to be spoken. Lines are played sequentially —
 * each waits for the previous to finish before starting.
 * Queue is capped at 5 items to avoid unbounded backlog.
 */
export async function speakText(text, character = 'morpheus') {
  const state = getState();
  if (!state.settings.voiceEnabled) return;

  const apiKey = state.settings.geminiApiKey;
  if (!apiKey && !isProxyActive()) return;

  const voiceName = CHARACTER_VOICES[character] || 'Charon';

  // Cap queue size — drop oldest if too many are pending
  if (queue.length >= 5) {
    queue.shift();
  }

  queue.push({ text, voiceName });

  // If not already processing, start the queue loop
  if (!processing) {
    processQueue();
  }
}

async function processQueue() {
  if (processing) return;
  processing = true;

  try {
    while (queue.length > 0) {
      const { text, voiceName } = queue.shift();

      try {
        const audioData = await fetchTTS(text, voiceName);
        if (audioData) {
          await playPCMAudio(audioData);
        }
      } catch (e) {
        console.warn('TTS item failed:', e);
      }
    }
  } finally {
    // Always reset — even on unexpected errors the queue must not deadlock
    processing = false;
  }
}

async function fetchTTS(text, voiceName) {
  const url = getTtsApiUrl(TTS_MODEL);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName,
            }
          }
        }
      }
    }),
  });

  if (!response.ok) {
    console.warn('TTS API error:', response.status);
    return null;
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
}

/**
 * Play PCM audio. Resolves when playback finishes.
 * Has a safety timeout so the queue can never deadlock.
 */
function playPCMAudio(base64Data) {
  return new Promise(async (resolve) => {
    let resolved = false;
    const done = () => {
      if (resolved) return;
      resolved = true;
      currentSource = null;
      resolve();
    };

    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();

      // Decode base64 to binary
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      // Convert to Int16 PCM
      const int16 = new Int16Array(bytes.buffer);

      if (int16.length === 0) { done(); return; }

      // Create AudioBuffer (24kHz mono)
      const sampleRate = 24000;
      const audioBuffer = ctx.createBuffer(1, int16.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < int16.length; i++) {
        channelData[i] = int16[i] / 32768;
      }

      // Safety timeout: audio duration + 2s margin
      const timeoutMs = (audioBuffer.duration * 1000) + 2000;
      setTimeout(done, timeoutMs);

      // Play and resolve when audio ends
      currentSource = ctx.createBufferSource();
      currentSource.buffer = audioBuffer;
      currentSource.connect(ctx.destination);
      currentSource.onended = done;
      currentSource.start();
    } catch (e) {
      done();
    }
  });
}

export function stopCurrentVoice() {
  // Flush the queue
  queue = [];

  // Stop currently playing audio
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // Already stopped
    }
    currentSource = null;
  }
}
