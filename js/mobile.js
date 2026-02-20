// ===== MOBILE SUPPORT =====

import { getEditor } from './editor.js';

let mainContent = null;
let dots = [];
let currentPanel = 0;

function isMobile() {
  return window.innerWidth <= 768;
}

export function initMobile() {
  if (!isMobile()) return;

  mainContent = document.getElementById('main-content');
  dots = Array.from(document.querySelectorAll('.panel-dot'));

  if (!mainContent || dots.length === 0) return;

  setupIndicator();
  setupScrollListener();
  setupTouchToFocus();
  setupResizeHandler();
}

// --- Panel indicator dot clicks ---
function setupIndicator() {
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = parseInt(dot.dataset.panel, 10);
      scrollToPanel(index);
    });
  });
}

// --- Scroll listener to update active dot ---
function setupScrollListener() {
  let ticking = false;
  mainContent.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveDot();
        ticking = false;
      });
      ticking = true;
    }
  });
}

function updateActiveDot() {
  if (!mainContent) return;
  const scrollLeft = mainContent.scrollLeft;
  const panelWidth = mainContent.offsetWidth;
  const newPanel = Math.round(scrollLeft / panelWidth);

  if (newPanel !== currentPanel) {
    currentPanel = newPanel;
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentPanel);
    });

    // Refresh CodeMirror when switching to editor panel
    if (currentPanel === 1) {
      refreshEditor();
    }
  }
}

function refreshEditor() {
  setTimeout(() => {
    const editor = getEditor();
    if (editor) {
      editor.refresh();
    }
  }, 100);
}

function scrollToPanel(index) {
  if (!mainContent) return;
  const panelWidth = mainContent.offsetWidth;
  mainContent.scrollTo({
    left: index * panelWidth,
    behavior: 'smooth'
  });
}

// --- Touch-to-focus: tap terminal output to focus input ---
function setupTouchToFocus() {
  const terminalOutput = document.getElementById('terminal-output');
  const terminalInput = document.getElementById('terminal-input');
  if (!terminalOutput || !terminalInput) return;

  terminalOutput.addEventListener('click', () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    terminalInput.focus();
  });
}

// --- Resize handler (debounced) ---
function setupResizeHandler() {
  let resizeTimer = null;

  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const editor = getEditor();
      if (editor) {
        editor.refresh();
      }
      // Re-snap to current panel after resize
      if (mainContent && isMobile()) {
        const panelWidth = mainContent.offsetWidth;
        mainContent.scrollLeft = currentPanel * panelWidth;
      }
    }, 150);
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
  }
  window.addEventListener('orientationchange', handleResize);
}

// --- Public API ---
export function showEditorPanel() {
  scrollToPanel(1);
}

export function showTerminalPanel() {
  scrollToPanel(0);
}
