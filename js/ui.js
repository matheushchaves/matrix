// ===== UI MANAGEMENT =====

import { getState, setState } from './state.js';
import { MATRIX_APIS, getUnlockedAPIs } from './matrix-api.js';
import { isProxyActive } from './gemini.js';
import { startMusic, stopMusic } from './audio.js';

export function updateUI() {
  const state = getState();

  // HUD
  const aliasEl = document.getElementById('hud-alias');
  const levelEl = document.getElementById('hud-level');
  const repEl = document.getElementById('hud-reputation');

  if (aliasEl) aliasEl.textContent = `Operador: ${state.player.alias}`;
  if (levelEl) levelEl.textContent = `Nivel: ${state.player.level}`;
  if (repEl) repEl.textContent = `Rep: ${state.player.reputation}`;
}

export function updateMissionBar(name, objective) {
  const nameEl = document.getElementById('mission-name');
  const objEl = document.getElementById('mission-objective');
  if (nameEl) nameEl.textContent = `MISSAO: ${name}`;
  if (objEl) objEl.textContent = objective;
}

export function updateAPIReference() {
  const state = getState();
  const listEl = document.getElementById('api-list');
  if (!listEl) return;

  listEl.innerHTML = '';
  const unlockedIds = state.player.unlockedAPIs || [];

  for (const api of MATRIX_APIS) {
    const isUnlocked = unlockedIds.includes(api.id);
    const div = document.createElement('div');
    div.className = `api-item ${isUnlocked ? '' : 'locked'}`;
    div.innerHTML = `
      <span class="api-name">${api.name}</span>
      <span class="api-sig">${api.signature}</span>
      <span class="api-desc">${isUnlocked ? api.description : 'Nivel ' + api.level + ' necessario'}</span>
    `;
    listEl.appendChild(div);
  }
}

export function showModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

export function hideModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

export function setupModals() {
  // Settings modal
  document.getElementById('btn-settings')?.addEventListener('click', () => {
    const state = getState();
    document.getElementById('settings-apikey').value = state.settings.geminiApiKey;
    document.getElementById('settings-model').value = state.settings.geminiModel;
    document.getElementById('settings-sound').checked = state.settings.soundEnabled;
    document.getElementById('settings-voice').checked = state.settings.voiceEnabled;
    showModal('settings-modal');
  });

  document.getElementById('settings-save')?.addEventListener('click', () => {
    setState('settings.geminiApiKey', document.getElementById('settings-apikey').value);
    setState('settings.geminiModel', document.getElementById('settings-model').value);
    const soundEnabled = document.getElementById('settings-sound').checked;
    setState('settings.soundEnabled', soundEnabled);
    setState('settings.voiceEnabled', document.getElementById('settings-voice').checked);

    // Toggle music based on sound setting
    if (soundEnabled) {
      startMusic();
    } else {
      stopMusic();
    }

    hideModal('settings-modal');
  });

  document.getElementById('settings-close')?.addEventListener('click', () => {
    hideModal('settings-modal');
  });

  // Help modal
  document.getElementById('btn-help')?.addEventListener('click', () => {
    showModal('help-modal');
  });

  document.getElementById('help-close')?.addEventListener('click', () => {
    hideModal('help-modal');
  });

  // Close modals on overlay click
  document.querySelectorAll('.overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && !['home-screen', 'alias-modal', 'apikey-modal'].includes(overlay.id)) {
        overlay.classList.add('hidden');
      }
    });
  });
}

// ===== API KEY SEQUENCE =====

export async function runAPIKeySequence() {
  const state = getState();
  if (state.settings.geminiApiKey) return true;

  // If proxy is active, API key is optional
  if (isProxyActive()) return true;

  const modal = document.getElementById('apikey-modal');
  modal.classList.remove('hidden');

  return new Promise((resolve) => {
    const confirm = () => {
      const key = document.getElementById('apikey-input').value.trim();
      if (!key) return;
      setState('settings.geminiApiKey', key);
      modal.classList.add('hidden');
      resolve(true);
    };

    document.getElementById('apikey-confirm').addEventListener('click', confirm);
    document.getElementById('apikey-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirm();
    });
  });
}

export function showGameUI() {
  const homeScreen = document.getElementById('home-screen');
  const gameUI = document.getElementById('game-ui');

  if (homeScreen) homeScreen.classList.add('hidden');
  if (gameUI) gameUI.classList.remove('hidden');
}
