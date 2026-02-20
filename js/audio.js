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
  glitch: { type: 'sawtooth', freq: 200, duration: 0.2, gain: 0.35, detune: 400 },
  bullet_time: { type: 'sine', freq: 80, duration: 0.8, gain: 0.2, sweep: 40 },
  success: { type: 'sine', freq: 523, duration: 0.35, gain: 0.35, arpeggio: [523, 659, 784] },
  error: { type: 'square', freq: 150, duration: 0.25, gain: 0.3, detune: -200 },
  rain_intensify: { type: 'sawtooth', freq: 60, duration: 0.5, gain: 0.15 },
  screen_shake: { type: 'sawtooth', freq: 120, duration: 0.3, gain: 0.3, detune: 300 },
  scanlines: { type: 'sine', freq: 1000, duration: 0.15, gain: 0.12 },
  type_key: { type: 'sine', freq: 800, duration: 0.03, gain: 0.06 },
  mission_start: { type: 'sine', freq: 330, duration: 0.4, gain: 0.25, arpeggio: [330, 392, 440] },
  code_run: { type: 'square', freq: 440, duration: 0.12, gain: 0.2 },
  level_up: { type: 'sine', freq: 440, duration: 0.3, gain: 0.3, arpeggio: [440, 554, 659, 880] },
  unlock: { type: 'sine', freq: 660, duration: 0.3, gain: 0.3, arpeggio: [660, 784, 880] },
  transmission: { type: 'sawtooth', freq: 100, duration: 0.6, gain: 0.15, sweep: 200 },
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

// ================================================================
// PROCEDURAL SOUNDTRACK — Dark ambient / electronic Matrix style
// ================================================================
// All music is synthesized in real-time with Web Audio API.
// No external files, no AI tokens. Runs forever.
//
// Layers:
//   1. Sub drone     — very low sine, slow pitch wobble
//   2. Dark pad      — detuned saw oscillators through low-pass filter
//   3. Arpeggio      — minor pentatonic notes pulsing in sequence
//   4. Noise texture — filtered brown noise for atmosphere
// ================================================================

let musicNodes = null; // all nodes for cleanup
let musicPlaying = false;

// D minor / A minor pentatonic — dark, cinematic
const SCALE = [
  55.00,  // A1
  65.41,  // C2
  73.42,  // D2
  82.41,  // E2
  98.00,  // G2
  110.00, // A2
  130.81, // C3
  146.83, // D3
  164.81, // E3
  196.00, // G3
];

const ARP_NOTES = [
  220.00, // A3
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  293.66, // D4
  392.00, // G4
  329.63, // E4
];

export function startMusic() {
  if (musicPlaying) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Fade in over 3 seconds
    master.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 3);

    const nodes = { master, layers: [], intervals: [] };

    // Layer 1: Sub Drone
    createDrone(ctx, master, nodes);

    // Layer 2: Dark Pad
    createPad(ctx, master, nodes);

    // Layer 3: Arpeggio
    createArpeggio(ctx, master, nodes);

    // Layer 4: Noise Texture
    createNoiseTexture(ctx, master, nodes);

    musicNodes = nodes;
    musicPlaying = true;
  } catch (e) {
    console.warn('Music failed to start:', e);
  }
}

export function stopMusic() {
  if (!musicNodes || !musicPlaying) return;

  try {
    const ctx = getAudioContext();

    // Fade out over 2 seconds
    musicNodes.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);

    // Cleanup after fade
    setTimeout(() => {
      if (!musicNodes) return;

      musicNodes.intervals.forEach(id => clearInterval(id));

      musicNodes.layers.forEach(node => {
        try { node.stop?.(); } catch {}
        try { node.disconnect?.(); } catch {}
      });

      try { musicNodes.master.disconnect(); } catch {}
      musicNodes = null;
      musicPlaying = false;
    }, 2500);
  } catch (e) {
    musicNodes = null;
    musicPlaying = false;
  }
}

export function isMusicPlaying() {
  return musicPlaying;
}

// --- Layer 1: Sub Drone ---
// Very low sine wave with slow LFO modulating pitch
function createDrone(ctx, master, nodes) {
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.12;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 55; // A1

  // Slow pitch wobble via LFO
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.08; // very slow
  lfoGain.gain.value = 2;     // subtle pitch range
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  lfo.start();

  // Second detuned oscillator for width
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 55.3; // slightly detuned
  osc2.connect(droneGain);
  osc2.start();

  osc.connect(droneGain);
  droneGain.connect(master);
  osc.start();

  nodes.layers.push(osc, osc2, lfo, lfoGain, droneGain);
}

// --- Layer 2: Dark Pad ---
// Detuned sawtooth oscillators through low-pass filter with slow sweep
function createPad(ctx, master, nodes) {
  const padGain = ctx.createGain();
  padGain.gain.value = 0.04;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  filter.Q.value = 2;

  // Slow filter sweep via LFO
  const filterLfo = ctx.createOscillator();
  const filterLfoGain = ctx.createGain();
  filterLfo.type = 'sine';
  filterLfo.frequency.value = 0.03;
  filterLfoGain.gain.value = 300;
  filterLfo.connect(filterLfoGain);
  filterLfoGain.connect(filter.frequency);
  filterLfo.start();

  // Chord: A2, C3, E3 (Am)
  const chordFreqs = [110, 130.81, 164.81];

  chordFreqs.forEach(freq => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.connect(filter);
    osc.start();
    nodes.layers.push(osc);

    // Detuned copy for width
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = freq * 1.003;
    osc2.connect(filter);
    osc2.start();
    nodes.layers.push(osc2);
  });

  filter.connect(padGain);
  padGain.connect(master);

  nodes.layers.push(filter, filterLfo, filterLfoGain, padGain);
}

// --- Layer 3: Arpeggio ---
// Pulsing minor pentatonic notes, one at a time, with delay/echo
function createArpeggio(ctx, master, nodes) {
  const arpGain = ctx.createGain();
  arpGain.gain.value = 0.045;

  // Delay for echo effect
  const delay = ctx.createDelay(1.0);
  delay.delayTime.value = 0.375; // dotted eighth feel
  const feedback = ctx.createGain();
  feedback.gain.value = 0.35;
  const delayFilter = ctx.createBiquadFilter();
  delayFilter.type = 'lowpass';
  delayFilter.frequency.value = 1200;

  // Delay feedback loop
  delay.connect(delayFilter);
  delayFilter.connect(feedback);
  feedback.connect(delay);

  // Dry + wet mix
  const dryGain = ctx.createGain();
  dryGain.gain.value = 1.0;
  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.5;

  dryGain.connect(arpGain);
  delay.connect(wetGain);
  wetGain.connect(arpGain);
  arpGain.connect(master);

  let noteIndex = 0;
  const BPM = 75;
  const beatMs = (60 / BPM) * 1000;

  const interval = setInterval(() => {
    if (!musicPlaying) return;

    try {
      const freq = ARP_NOTES[noteIndex % ARP_NOTES.length];
      noteIndex++;

      // Randomly skip notes for breathing space
      if (Math.random() < 0.3) return;

      const osc = ctx.createOscillator();
      const env = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      // Short envelope: attack 10ms, sustain, release 200ms
      const now = ctx.currentTime;
      const duration = 0.25;
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.8, now + 0.01);
      env.gain.setValueAtTime(0.8, now + duration * 0.6);
      env.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(env);
      env.connect(dryGain);
      env.connect(delay);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch {}
  }, beatMs);

  nodes.intervals.push(interval);
  nodes.layers.push(delay, feedback, delayFilter, dryGain, wetGain, arpGain);
}

// --- Layer 4: Noise Texture ---
// Filtered brown noise for atmosphere
function createNoiseTexture(ctx, master, nodes) {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Brown noise
  let last = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 200;
  noiseFilter.Q.value = 0.5;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.02;

  source.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);
  source.start();

  nodes.layers.push(source, noiseFilter, noiseGain);
}
