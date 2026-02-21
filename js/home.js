// ===== HOME SCREEN =====

import { getState, setState } from './state.js';
import { startMusic, stopMusic } from './audio.js';

const TAGLINES = [
  'Voce esta pronto?',
  'A Matrix tem voce...',
  'Nao existe colher.',
  'Siga o coelho branco.',
  'Acorde, Neo...',
  'Liberte sua mente.',
];

let taglineInterval = null;

export function initHome() {
  const homeScreen = document.getElementById('home-screen');
  if (!homeScreen) return;

  // Start tagline rotation
  startTaglineRotation();

  // Show/hide Continue button based on save
  const state = getState();
  const btnContinue = document.getElementById('btn-continue');
  if (btnContinue) {
    if (state.story.storyStarted && state.player.alias) {
      btnContinue.classList.remove('hidden');
    } else {
      btnContinue.classList.add('hidden');
    }
  }

  // Check if demo is available via /health endpoint
  checkDemoAvailable();

  // Return promise that resolves with action
  return new Promise((resolve) => {
    document.getElementById('btn-new-game')?.addEventListener('click', () => {
      stopTaglineRotation();
      resolve('new');
    });

    document.getElementById('btn-continue')?.addEventListener('click', () => {
      stopTaglineRotation();
      resolve('continue');
    });

    document.getElementById('btn-demo')?.addEventListener('click', () => {
      stopTaglineRotation();
      resolve('demo');
    });

    document.getElementById('btn-tutorial')?.addEventListener('click', () => {
      stopTaglineRotation();
      resolve('tutorial');
    });

    document.getElementById('btn-home-settings')?.addEventListener('click', () => {
      openSettingsFromHome();
    });
  });
}

async function checkDemoAvailable() {
  const btnDemo = document.getElementById('btn-demo');
  if (!btnDemo) return;

  try {
    const res = await fetch('/health');
    if (res.ok) {
      const data = await res.json();
      if (data.demo) {
        btnDemo.classList.remove('hidden');
      }
    }
  } catch {
    // Demo not available (e.g. running via file:// or no server)
  }
}

export function hideHome() {
  const homeScreen = document.getElementById('home-screen');
  if (homeScreen) homeScreen.classList.add('hidden');
  stopTaglineRotation();
}

export function showAliasModal() {
  const modal = document.getElementById('alias-modal');
  if (!modal) return Promise.resolve('');

  modal.classList.remove('hidden');
  const input = modal.querySelector('.alias-input');
  if (input) input.focus();

  return new Promise((resolve) => {
    const confirm = () => {
      const alias = input.value.trim();
      if (!alias) return;
      setState('player.alias', alias);
      modal.classList.add('hidden');
      resolve(alias);
    };

    modal.querySelector('.alias-confirm')?.addEventListener('click', confirm);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirm();
    });
  });
}

// ===== SETTINGS FROM HOME =====

let settingsHandlersBound = false;

function openSettingsFromHome() {
  const settingsModal = document.getElementById('settings-modal');
  if (!settingsModal) return;

  const state = getState();
  document.getElementById('settings-apikey').value = state.settings.geminiApiKey;
  document.getElementById('settings-model').value = state.settings.geminiModel;
  document.getElementById('settings-sound').checked = state.settings.soundEnabled;
  const voiceEl = document.getElementById('settings-voice');
  if (voiceEl) voiceEl.checked = state.settings.voiceEnabled;

  settingsModal.classList.remove('hidden');

  // Bind close/save handlers once
  if (!settingsHandlersBound) {
    settingsHandlersBound = true;

    document.getElementById('settings-save')?.addEventListener('click', () => {
      setState('settings.geminiApiKey', document.getElementById('settings-apikey').value);
      setState('settings.geminiModel', document.getElementById('settings-model').value);
      const soundEnabled = document.getElementById('settings-sound').checked;
      setState('settings.soundEnabled', soundEnabled);
      const voiceEl = document.getElementById('settings-voice');
      if (voiceEl) setState('settings.voiceEnabled', voiceEl.checked);

      // Toggle music based on sound setting
      if (soundEnabled) {
        startMusic();
      } else {
        stopMusic();
      }

      settingsModal.classList.add('hidden');
    });

    document.getElementById('settings-close')?.addEventListener('click', () => {
      settingsModal.classList.add('hidden');
    });

    // Close on overlay click
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.add('hidden');
      }
    });
  }
}

// ===== TAGLINE ANIMATION =====

function startTaglineRotation() {
  const el = document.getElementById('home-tagline');
  if (!el) return;

  let index = 0;
  typeTagline(el, TAGLINES[index]);

  taglineInterval = setInterval(() => {
    index = (index + 1) % TAGLINES.length;
    typeTagline(el, TAGLINES[index]);
  }, 5000);
}

function stopTaglineRotation() {
  if (taglineInterval) {
    clearInterval(taglineInterval);
    taglineInterval = null;
  }
}

async function typeTagline(el, text) {
  el.innerHTML = '';
  for (let i = 0; i <= text.length; i++) {
    el.innerHTML = text.substring(0, i) + '<span class="cursor"></span>';
    await sleep(50);
  }
  // Keep cursor blinking at end
  await sleep(2500);
  // Fade out effect
  el.style.opacity = '0.5';
  await sleep(300);
  el.style.opacity = '1';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
