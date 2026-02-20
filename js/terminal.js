// ===== TERMINAL RENDERER =====

import { getState, setState, updateState } from './state.js';
import { getAvatar } from './avatars.js';
import { speakText } from './voice.js';

const outputEl = () => document.getElementById('terminal-output');

export function addLine(text, cssClass = '') {
  updateState('ui.terminalLines', lines => [
    ...lines,
    { text, cssClass, timestamp: Date.now() }
  ]);
  renderLine(text, cssClass);
}

function renderLine(text, cssClass) {
  const el = outputEl();
  if (!el) return;
  const div = document.createElement('div');
  div.className = `terminal-line ${cssClass}`;
  div.innerHTML = text;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

export function addCharacterLine(character, text) {
  const charClass = `character-${character}`;
  const nameMap = {
    morpheus: 'Morpheus',
    oracle: 'Oraculo',
    smith: 'Agente Smith',
  };
  const displayName = nameMap[character] || character;
  const html = `<span class="character-name ${character}">${displayName}:</span> ${escapeHtml(text)}`;
  addLine(html, charClass);
}

export function addSystemLine(text) {
  addLine(escapeHtml(text), 'system');
}

export function addPlayerLine(text) {
  addLine(`<span class="prompt-char">&gt;</span> ${escapeHtml(text)}`, 'player');
}

export function addErrorLine(text) {
  addLine(escapeHtml(text), 'error');
}

export function addSuccessLine(text) {
  addLine(escapeHtml(text), 'success');
}

export function showTypingIndicator() {
  const el = outputEl();
  if (!el) return;
  setState('ui.isTyping', true);
  const div = document.createElement('div');
  div.id = 'typing-indicator';
  div.className = 'terminal-line';
  div.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

export function hideTypingIndicator() {
  setState('ui.isTyping', false);
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

export async function typewriterLine(text, cssClass = '', speed = 30) {
  const el = outputEl();
  if (!el) return;

  const div = document.createElement('div');
  div.className = `terminal-line ${cssClass}`;
  el.appendChild(div);

  // Parse HTML to get text content for typing but preserve tags
  const temp = document.createElement('div');
  temp.innerHTML = text;
  const plainText = temp.textContent;
  const isHtml = text !== plainText;

  if (isHtml) {
    // For HTML content, type out progressively
    let current = '';
    const chars = plainText.split('');
    for (let i = 0; i < chars.length; i++) {
      current += chars[i];
      div.textContent = current;
      el.scrollTop = el.scrollHeight;
      await sleep(speed);
    }
    // Set final HTML
    div.innerHTML = text;
  } else {
    for (let i = 0; i <= text.length; i++) {
      div.textContent = text.substring(0, i);
      el.scrollTop = el.scrollHeight;
      await sleep(speed);
    }
  }

  updateState('ui.terminalLines', lines => [
    ...lines,
    { text, cssClass, timestamp: Date.now() }
  ]);
}

export async function typewriterCharacterLine(character, text, speed = 30) {
  const charClass = `character-${character}`;
  const nameMap = {
    morpheus: 'Morpheus',
    oracle: 'Oraculo',
    smith: 'Agente Smith',
  };
  const displayName = nameMap[character] || character;

  // Fire-and-forget TTS (non-blocking)
  speakText(text, character).catch(() => {});

  const el = outputEl();
  if (!el) return;

  const div = document.createElement('div');
  div.className = `terminal-line ${charClass}`;
  el.appendChild(div);

  // Type character name first
  const prefix = `${displayName}: `;
  div.innerHTML = `<span class="character-name ${character}">${displayName}:</span> `;
  await sleep(200);

  // Then type the text
  const span = document.createElement('span');
  div.appendChild(span);

  for (let i = 0; i <= text.length; i++) {
    span.textContent = text.substring(0, i);
    el.scrollTop = el.scrollHeight;
    await sleep(speed);
  }

  updateState('ui.terminalLines', lines => [
    ...lines,
    { text: `${prefix}${text}`, cssClass: charClass, timestamp: Date.now() }
  ]);
}

export function addAvatarLine(character) {
  const svg = getAvatar(character);
  if (!svg) return;
  const el = outputEl();
  if (!el) return;
  const div = document.createElement('div');
  div.className = `terminal-avatar ${character}`;
  div.innerHTML = svg;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

export function clearTerminal() {
  const el = outputEl();
  if (el) el.innerHTML = '';
  setState('ui.terminalLines', []);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
