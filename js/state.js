// ===== STATE MANAGEMENT (Observer Pattern) =====

const initialState = {
  player: {
    alias: '',
    level: 1,
    unlockedAPIs: [],
    completedMissions: [],
    currentMission: null,
    reputation: 0,
  },
  story: {
    chapter: 0,
    conversationHistory: [],
    flags: {},
    storyStarted: false,
  },
  ui: {
    terminalLines: [],
    isTyping: false,
    effectsActive: [],
  },
  settings: {
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash',
    soundEnabled: true,
    voiceEnabled: true,
    demoMode: false,
    rainSpeed: 1,
  },
  infinite: {
    missionsCompleted: 0,
    score: 0,
    history: [],
  },
};

let state = JSON.parse(JSON.stringify(initialState));
const listeners = new Map();

export function getState() {
  return state;
}

export function setState(path, value) {
  const parts = path.split('.');
  let obj = state;
  for (let i = 0; i < parts.length - 1; i++) {
    if (obj[parts[i]] === undefined) obj[parts[i]] = {};
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
  notifyListeners(path);
  debouncedSave();
}

export function updateState(path, updater) {
  const parts = path.split('.');
  let obj = state;
  for (let i = 0; i < parts.length - 1; i++) {
    if (obj[parts[i]] === undefined) obj[parts[i]] = {};
    obj = obj[parts[i]];
  }
  const key = parts[parts.length - 1];
  obj[key] = updater(obj[key]);
  notifyListeners(path);
  debouncedSave();
}

export function subscribe(path, callback) {
  if (!listeners.has(path)) {
    listeners.set(path, new Set());
  }
  listeners.get(path).add(callback);
  return () => listeners.get(path).delete(callback);
}

function notifyListeners(changedPath) {
  for (const [path, cbs] of listeners) {
    if (changedPath.startsWith(path) || path.startsWith(changedPath)) {
      cbs.forEach(cb => cb(getState()));
    }
  }
}

// Save/Load
const SAVE_KEY = 'matrix_game_save';
let saveTimeout = null;

function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const saveData = {
        version: 2,
        timestamp: Date.now(),
        player: state.player,
        story: {
          chapter: state.story.chapter,
          flags: state.story.flags,
          storyStarted: state.story.storyStarted,
          conversationHistory: state.story.conversationHistory.slice(-10),
        },
        settings: { ...state.settings, demoMode: undefined },
        infinite: state.infinite,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
      console.warn('Failed to save game state:', e);
    }
  }, 500);
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const saveData = JSON.parse(raw);

    // Support v1 and v2 saves
    if (saveData.version !== 1 && saveData.version !== 2) return false;

    state.player = { ...initialState.player, ...saveData.player };
    state.story = { ...initialState.story, ...saveData.story };
    state.settings = { ...initialState.settings, ...saveData.settings };
    state.infinite = { ...initialState.infinite, ...(saveData.infinite || {}) };

    // Migrate v1 -> v2: add voiceEnabled if missing
    if (state.settings.voiceEnabled === undefined) {
      state.settings.voiceEnabled = true;
    }

    // Migrate deprecated models
    const deprecated = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    if (deprecated.includes(state.settings.geminiModel)) {
      state.settings.geminiModel = 'gemini-2.5-flash';
    }

    return true;
  } catch (e) {
    console.warn('Failed to load save:', e);
    return false;
  }
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  state = JSON.parse(JSON.stringify(initialState));
}

export function forceSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  debouncedSave();
}
