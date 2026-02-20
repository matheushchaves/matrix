// ===== SFX & AMBIENT AUDIO =====

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

// Synthesized SFX using Web Audio API oscillators
const SFX_CONFIGS = {
  glitch: { type: 'sawtooth', freq: 200, duration: 0.15, gain: 0.12, detune: 400 },
  bullet_time: { type: 'sine', freq: 80, duration: 0.8, gain: 0.08, sweep: 40 },
  success: { type: 'sine', freq: 523, duration: 0.3, gain: 0.1, arpeggio: [523, 659, 784] },
  error: { type: 'square', freq: 150, duration: 0.2, gain: 0.08, detune: -200 },
  rain_intensify: { type: 'sawtooth', freq: 60, duration: 0.5, gain: 0.06 },
  screen_shake: { type: 'sawtooth', freq: 120, duration: 0.25, gain: 0.1, detune: 300 },
  scanlines: { type: 'sine', freq: 1000, duration: 0.1, gain: 0.04 },
  type_key: { type: 'sine', freq: 800, duration: 0.02, gain: 0.02 },
};

export function playSFX(name) {
  const config = SFX_CONFIGS[name];
  if (!config) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    if (config.arpeggio) {
      playArpeggio(ctx, config);
    } else {
      playTone(ctx, config);
    }
  } catch (e) {
    // Silently fail - audio is not critical
  }
}

function playTone(ctx, config) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = config.type;
  osc.frequency.value = config.freq;
  if (config.detune) osc.detune.value = config.detune;

  gain.gain.setValueAtTime(config.gain, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration);

  if (config.sweep) {
    osc.frequency.linearRampToValueAtTime(config.freq + config.sweep, ctx.currentTime + config.duration);
  }

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + config.duration);
}

function playArpeggio(ctx, config) {
  config.arpeggio.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + i * 0.1;

    osc.type = config.type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(config.gain, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + config.duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + config.duration);
  });
}

// Ambient white noise generator
let ambientSource = null;
let ambientGain = null;

export function startAmbient() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Brown noise (filtered white noise) for ambient
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    ambientSource = ctx.createBufferSource();
    ambientSource.buffer = buffer;
    ambientSource.loop = true;

    ambientGain = ctx.createGain();
    ambientGain.gain.value = 0.015;

    ambientSource.connect(ambientGain);
    ambientGain.connect(ctx.destination);
    ambientSource.start();
  } catch (e) {
    // Silently fail
  }
}

export function stopAmbient() {
  try {
    if (ambientSource) {
      ambientSource.stop();
      ambientSource = null;
    }
  } catch (e) {
    // Silently fail
  }
}
