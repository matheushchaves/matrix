// ===== APPLICATION BOOTSTRAP =====

import { getState, loadSave, resetSave, setState } from './state.js';
import { initRain } from './rain.js';
import { initEditor } from './editor.js';
import {
  updateUI, updateAPIReference, setupModals,
  runAPIKeySequence, showGameUI
} from './ui.js';
import { initHome, hideHome, showAliasModal } from './home.js';
import { startMission, handleCodeSubmission, handleTerminalInput } from './story.js';
import { addSystemLine } from './terminal.js';
import { startMusic } from './audio.js';
import { initMobile } from './mobile.js';

// ===== GLOBAL ERROR HANDLING =====
window.onerror = (msg, source, line, col, error) => {
  console.error('Global error:', msg, source, line, col, error);
  try {
    addSystemLine(`[ERRO] ${msg}`);
  } catch { /* terminal may not be ready */ }
  return false;
};

window.onunhandledrejection = (event) => {
  console.error('Unhandled rejection:', event.reason);
  try {
    const msg = event.reason?.message || String(event.reason);
    addSystemLine(`[ERRO] ${msg}`);
  } catch { /* terminal may not be ready */ }
};

function removeLoadingScreen() {
  const el = document.getElementById('loading-screen');
  if (el) el.remove();
  const style = document.getElementById('loading-style');
  if (style) style.remove();
}

async function init() {
  // Remove loading screen
  removeLoadingScreen();

  // Start rain immediately for atmosphere
  initRain();

  // Check for existing save
  loadSave();

  // Show home screen and wait for action
  const action = await initHome();

  switch (action) {
    case 'new':
      hideHome();
      await newGame();
      break;
    case 'continue':
      hideHome();
      await resumeGame();
      break;
    case 'tutorial':
      hideHome();
      await runTutorial();
      break;
    default:
      hideHome();
      await newGame();
  }
}

async function newGame() {
  // Reset any existing save to start fresh
  resetSave();

  // Get alias
  const alias = await showAliasModal();

  // Get API key
  await runAPIKeySequence();

  // Mark story as started
  setState('story.storyStarted', true);

  // Setup game UI
  showGameUI();
  setupGame();

  // Welcome message
  addSystemLine('Conexao estabelecida.');
  addSystemLine(`Bem-vindo a Matrix, ${alias}.`);
  addSystemLine('');

  // Start first mission
  await sleep(1000);
  await startMission();
}

async function resumeGame() {
  const state = getState();

  // Show game directly
  showGameUI();
  setupGame();

  // Update UI with saved state
  updateUI();
  updateAPIReference();

  addSystemLine('Reconectando a Matrix...');
  addSystemLine(`Bem-vindo de volta, ${state.player.alias}.`);
  addSystemLine(`Nivel: ${state.player.level} | Reputacao: ${state.player.reputation} | Missoes: ${state.player.completedMissions.length}/7`);
  addSystemLine('');

  // Resume current mission
  await sleep(1000);
  await startMission();
}

async function runTutorial() {
  // Get API key first if needed
  await runAPIKeySequence();

  const state = getState();
  if (!state.player.alias) {
    const alias = await showAliasModal();
  }

  if (!state.story.storyStarted) {
    setState('story.storyStarted', true);
  }

  // Show game UI
  showGameUI();
  setupGame();

  // Run tutorial
  try {
    const { runTutorial: startTutorial } = await import('./tutorial.js');
    await startTutorial();
  } catch (e) {
    console.warn('Tutorial module not available:', e);
  }

  // After tutorial, start mission
  addSystemLine('Tutorial completo. Preparando sua primeira missao...');
  addSystemLine('');
  await sleep(1000);
  await startMission();
}

function setupGame() {
  // Init editor with code submission handler
  initEditor(handleCodeSubmission);

  // Setup modal handlers
  setupModals();

  // Update HUD
  updateUI();

  // Init mobile support
  initMobile();

  // Start soundtrack (if sound enabled)
  const state = getState();
  if (state.settings.soundEnabled) {
    startMusic();
  }

  // Terminal input handler
  const terminalInput = document.getElementById('terminal-input');
  if (terminalInput) {
    terminalInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const text = terminalInput.value;
        terminalInput.value = '';
        await handleTerminalInput(text);
      }
    });
  }

  // Keyboard shortcut - Ctrl+Enter to run code
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      // Only if not in terminal input
      if (document.activeElement !== terminalInput) {
        handleCodeSubmission();
      }
    }
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
