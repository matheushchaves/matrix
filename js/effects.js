// ===== VISUAL EFFECTS =====

import * as rain from './rain.js';
import { playSFX } from './audio.js';
import { getState } from './state.js';

export function triggerEffect(effectName) {
  if (!effectName) return;

  const handlers = {
    glitch: triggerGlitch,
    screen_shake: triggerScreenShake,
    bullet_time: triggerBulletTime,
    rain_intensify: triggerRainIntensify,
    rain_red: triggerRainRed,
    success_flash: triggerSuccessFlash,
    error_flash: triggerErrorFlash,
    scanlines: triggerScanlines,
  };

  const handler = handlers[effectName];
  if (handler) handler();
}

function maybeSFX(name) {
  const state = getState();
  if (state.settings.soundEnabled) {
    playSFX(name);
  }
}

function triggerGlitch() {
  const gameUI = document.getElementById('game-ui');
  if (!gameUI) return;
  gameUI.classList.add('glitch');
  maybeSFX('glitch');
  setTimeout(() => gameUI.classList.remove('glitch'), 300);
}

function triggerScreenShake() {
  const gameUI = document.getElementById('game-ui');
  if (!gameUI) return;
  gameUI.classList.add('screen-shake');
  maybeSFX('screen_shake');
  setTimeout(() => gameUI.classList.remove('screen-shake'), 400);
}

function triggerBulletTime() {
  const body = document.body;
  body.classList.add('bullet-time');
  rain.setSpeed(0.2);
  maybeSFX('bullet_time');
  setTimeout(() => {
    body.classList.remove('bullet-time');
    rain.setSpeed(1);
  }, 3000);
}

function triggerRainIntensify() {
  rain.intensify(3000);
  maybeSFX('rain_intensify');
}

function triggerRainRed() {
  rain.redMode(5000);
}

function triggerSuccessFlash() {
  const terminal = document.getElementById('terminal-panel');
  if (!terminal) return;
  terminal.classList.add('success-flash');
  maybeSFX('success');
  setTimeout(() => terminal.classList.remove('success-flash'), 600);
}

function triggerErrorFlash() {
  const terminal = document.getElementById('terminal-panel');
  if (!terminal) return;
  terminal.classList.add('error-flash');
  maybeSFX('error');
  setTimeout(() => terminal.classList.remove('error-flash'), 600);
}

function triggerScanlines() {
  document.body.classList.add('scanlines');
  maybeSFX('scanlines');
  setTimeout(() => document.body.classList.remove('scanlines'), 5000);
}
