// ===== STORY ENGINE =====

import { getState, setState, updateState } from './state.js';
import { getMissionByIndex, getChapter } from './missions.js';
import { getApiById } from './matrix-api.js';
import { callGemini, callGeminiForChat } from './gemini.js';
import { speakText } from './voice.js';
import { executeCode, buildAPIs } from './sandbox.js';
import { getCode, setCode } from './editor.js';
import {
  addCharacterLine, addSystemLine, addPlayerLine,
  addErrorLine, addSuccessLine, typewriterCharacterLine,
  showTypingIndicator, hideTypingIndicator, clearTerminal,
  addAvatarLine
} from './terminal.js';
import { triggerEffect } from './effects.js';
import { playSFX } from './audio.js';
import { updateUI, updateAPIReference, updateMissionBar, runAPIKeySequence } from './ui.js';
import { generateInfiniteMission, recordInfiniteCompletion } from './infinite.js';

// Currently active infinite mission (not part of main progression)
let activeInfiniteMission = null;

function maybeSFX(name) {
  const state = getState();
  if (state.settings.soundEnabled) playSFX(name);
}

export function getCurrentMission() {
  // If there's an active infinite mission, return that
  if (activeInfiniteMission) return activeInfiniteMission;

  const state = getState();
  const index = state.player.completedMissions.length;
  return getMissionByIndex(index);
}

export function getCurrentChapter() {
  const mission = getCurrentMission();
  if (!mission) return null;
  return getChapter(mission.chapter);
}

export async function startMission(mission) {
  // Allow passing a specific mission (for infinite missions)
  if (!mission) {
    mission = getCurrentMission();
  }

  // Demo mode: limit to first 3 missions (Morpheus chapter)
  const stateCheck = getState();
  if (stateCheck.settings.demoMode && stateCheck.player.completedMissions.length >= 3) {
    await showDemoComplete();
    return;
  }

  if (!mission) {
    await showGameComplete();
    return;
  }

  const state = getState();
  setState('player.currentMission', mission.id);

  // Update chapter
  setState('story.chapter', mission.chapter);

  // Update UI
  updateMissionBar(mission.name, mission.objective);
  updateAPIReference();

  // Show character avatar
  addAvatarLine(mission.character);
  maybeSFX('mission_start');

  // Show intro dialogue with typewriter effect
  // Batch all dialogue lines into a single TTS call (instead of one per line)
  const alias = state.player.alias;
  const dialogueLines = [];
  for (const line of mission.introDialogue) {
    const text = line.replace('{alias}', alias);
    if (!text.startsWith('[')) {
      dialogueLines.push(text);
    }
  }

  // Fire single TTS call for all intro lines concatenated
  if (dialogueLines.length > 0) {
    speakText(dialogueLines.join(' '), mission.character).catch(() => {});
  }

  for (const line of mission.introDialogue) {
    const text = line.replace('{alias}', alias);
    if (text.startsWith('[')) {
      // System message
      addSystemLine(text);
      await sleep(500);
    } else {
      await typewriterCharacterLine(mission.character, text, 25, { skipTTS: true });
      await sleep(300);
    }
  }

  // Set starter code in editor if available
  if (mission.starterCode) {
    setCode(mission.starterCode);
  }
}

export async function handleCodeSubmission() {
  const mission = getCurrentMission();
  if (!mission) {
    addSystemLine('Nenhuma missao ativa. Digite "nova missao" para um desafio gerado por IA!');
    return;
  }

  const code = getCode();
  if (!code.trim()) {
    addErrorLine('Nenhum codigo para executar.');
    return;
  }

  const state = getState();

  // Show running state
  const btnRun = document.getElementById('btn-run');
  if (btnRun) {
    btnRun.classList.add('running');
    btnRun.textContent = '\u23F3 EXECUTANDO...';
  }

  // Build APIs for sandbox
  const unlockedAPIs = state.player.unlockedAPIs || [];
  const apis = buildAPIs(mission, unlockedAPIs);

  // Execute code in sandbox
  addSystemLine('Executando codigo...');
  maybeSFX('code_run');
  const result = await executeCode(code, apis);

  // Show execution result
  showExecutionResult(result);

  // Build message for Gemini
  const codeMessage = buildCodeMessage(code, result, mission);

  // Call Gemini for evaluation
  showTypingIndicator();
  let geminiResponse;

  try {
    geminiResponse = await callGemini(codeMessage, mission.geminiContext);
  } catch (e) {
    // Use local validation as fallback
    geminiResponse = buildFallbackResponse(result, mission);
  }

  hideTypingIndicator();

  // If Gemini failed, use local validation
  if (geminiResponse._fallback) {
    const localResult = mission.localValidation(result);
    if (localResult.pass) {
      geminiResponse.missionComplete = true;
      geminiResponse.missionScore = localResult.score;
      geminiResponse.dialogue = 'Impressionante. Voce conseguiu.';
      geminiResponse.triggerEffect = 'success_flash';
    } else if (localResult.score > 0) {
      geminiResponse.dialogue = 'Voce esta no caminho certo, mas ainda nao e o suficiente.';
      geminiResponse.hint = 'Revise seu codigo e tente novamente.';
    }
  }

  // Display response
  await displayGeminiResponse(geminiResponse);

  // Handle mission completion
  if (geminiResponse.missionComplete) {
    if (mission._infinite) {
      await handleInfiniteMissionComplete(mission, geminiResponse);
    } else {
      await handleMissionComplete(mission, geminiResponse);
    }
  }

  // Reset run button
  if (btnRun) {
    btnRun.classList.remove('running');
    btnRun.textContent = '\u25B6 EXECUTAR';
  }
}

function buildCodeMessage(code, result, mission) {
  let msg = `CODIGO DO JOGADOR:\n\`\`\`javascript\n${code}\n\`\`\`\n\n`;
  msg += `RESULTADO DA EXECUCAO:\n`;

  if (result.success) {
    msg += `- Retorno: ${result.returnValue}\n`;
  } else {
    msg += `- ERRO: ${result.error?.message || 'Erro desconhecido'}\n`;
  }

  if (result.logs && result.logs.length > 0) {
    msg += `- Console logs: ${result.logs.map(l => l.args.join(' ')).join('; ')}\n`;
  }

  if (result.apiCalls && result.apiCalls.length > 0) {
    msg += `- APIs chamadas: ${result.apiCalls.map(c => `Matrix.${c.name}(${c.args.join(', ')})`).join(', ')}\n`;
  }

  msg += `\nMISSAO: ${mission.name}\nOBJETIVO: ${mission.objective}`;
  return msg;
}

function showExecutionResult(result) {
  const outputEl = document.getElementById('execution-output');
  const resultEl = document.getElementById('execution-result');
  if (!outputEl || !resultEl) return;

  outputEl.classList.remove('hidden');

  if (result.success) {
    resultEl.className = '';
    let text = '';
    if (result.logs && result.logs.length > 0) {
      text += result.logs.map(l => `[${l.type}] ${l.args.join(' ')}`).join('\n') + '\n';
    }
    text += `\u2192 ${result.returnValue}`;
    resultEl.textContent = text;
  } else {
    resultEl.className = 'error';
    resultEl.textContent = `ERRO: ${result.error?.message || 'Erro desconhecido'}`;
  }
}

async function displayGeminiResponse(response) {
  const character = response.character || 'morpheus';

  // Trigger visual effect first
  if (response.triggerEffect) {
    triggerEffect(response.triggerEffect);
  }

  // Show dialogue with typewriter
  if (response.dialogue) {
    await typewriterCharacterLine(character, response.dialogue, 25);
  }

  // Show feedback
  if (response.feedback) {
    await sleep(300);
    addSystemLine(`[Analise] ${response.feedback}`);
  }

  // Show hint if available
  if (response.hint) {
    await sleep(300);
    addSystemLine(`[Dica] ${response.hint}`);
  }

  // Show score if mission is complete
  if (response.missionComplete && response.missionScore) {
    await sleep(300);
    addSuccessLine(`\u2605 Missao completa! Pontuacao: ${response.missionScore}/100`);
  }
}

async function handleMissionComplete(mission, response) {
  const state = getState();

  // Add to completed missions
  updateState('player.completedMissions', completed => [...completed, mission.id]);

  // Update reputation
  const scoreGain = response.missionScore || 70;
  updateState('player.reputation', rep => rep + scoreGain);

  // Unlock new API
  if (mission.unlocksAPI) {
    const api = getApiById(mission.unlocksAPI);
    updateState('player.unlockedAPIs', apis => [...apis, mission.unlocksAPI]);

    if (api) {
      await sleep(500);
      maybeSFX('unlock');
      addSuccessLine(`Nova API desbloqueada: ${api.name}`);
      addSystemLine(`${api.description}`);
      triggerEffect('rain_intensify');
    }
  }

  // Level up
  if (mission.nextLevel) {
    setState('player.level', mission.nextLevel);
    await sleep(300);
    maybeSFX('level_up');
    addSuccessLine(`Nivel: ${mission.nextLevel}`);
  }

  // Update UI
  updateUI();
  updateAPIReference(getState().player.level);

  // Check for chapter transition
  const nextMission = getMissionByIndex(state.player.completedMissions.length + 1);
  if (nextMission && nextMission.chapter !== mission.chapter) {
    const nextChapter = getChapter(nextMission.chapter);
    await sleep(1000);
    addSystemLine('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
    addSystemLine(`CAPITULO ${nextMission.chapter + 1}: ${nextChapter.name}`);
    addSystemLine('\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501');
  }

  // Start next mission after delay
  await sleep(2000);
  await startMission();
}

async function handleInfiniteMissionComplete(mission, response) {
  const scoreGain = response.missionScore || 70;

  // Record infinite mission completion
  recordInfiniteCompletion(mission, scoreGain);

  // Update reputation
  updateState('player.reputation', rep => rep + scoreGain);

  // Clear active infinite mission
  activeInfiniteMission = null;

  const state = getState();
  await sleep(300);
  addSystemLine(`Missoes infinitas completas: ${state.infinite.missionsCompleted} | Score total: ${state.infinite.score}`);
  addSystemLine('');
  addSystemLine('Digite "nova missao" para outro desafio!');

  // Update UI
  updateUI();
  updateMissionBar('MODO LIVRE', 'Digite "nova missao" para um novo desafio.');
}

function buildFallbackResponse(result, mission) {
  const local = mission.localValidation(result);
  return {
    dialogue: local.pass
      ? 'Voce demonstrou seu valor. Continue assim.'
      : 'Ainda nao. Tente novamente.',
    character: mission.character,
    emotion: local.pass ? 'impressed' : 'neutral',
    missionComplete: local.pass,
    missionScore: local.score,
    feedback: result.success ? '' : `Erro: ${result.error?.message || 'desconhecido'}`,
    triggerEffect: local.pass ? 'success_flash' : (result.success ? null : 'error_flash'),
    hint: local.score > 0 && !local.pass ? 'Voce esta perto. Revise sua abordagem.' : null,
    _fallback: true,
  };
}

async function showDemoComplete() {
  const state = getState();
  const alias = state.player.alias;

  addSystemLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  addSystemLine('DEMO COMPLETA');
  addSystemLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await typewriterCharacterLine('morpheus',
    `Voce viu apenas o comeco, ${alias}. Para continuar, precisa da sua propria conexao com a Matrix.`, 25);
  await sleep(500);

  addSystemLine('Para jogar as missoes 4-7, voce precisa de uma API key gratuita do Google AI Studio.');
  addSystemLine('');

  // Show API key modal to let user enter their own key
  const modal = document.getElementById('apikey-modal');
  modal.classList.remove('hidden');

  return new Promise((resolve) => {
    const onConfirm = () => {
      const key = document.getElementById('apikey-input').value.trim();
      if (!key) return;
      setState('settings.geminiApiKey', key);
      setState('settings.demoMode', false);
      modal.classList.add('hidden');

      addSuccessLine('Conexao propria estabelecida! Continuando as missoes...');
      sleep(1000).then(() => startMission());
      resolve();
    };

    // Use cloned listeners to avoid double-binding
    const confirmBtn = document.getElementById('apikey-confirm');
    const input = document.getElementById('apikey-input');
    const clonedBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(clonedBtn, confirmBtn);
    const clonedInput = input.cloneNode(true);
    input.parentNode.replaceChild(clonedInput, input);

    clonedBtn.addEventListener('click', onConfirm);
    clonedInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') onConfirm();
    });
  });
}

async function showGameComplete() {
  triggerEffect('bullet_time');
  await sleep(1500);

  triggerEffect('rain_intensify');
  maybeSFX('level_up');

  addSystemLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  addSuccessLine('MATRIX: O CODIGO - COMPLETO');
  addSystemLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await sleep(800);

  const state = getState();
  addAvatarLine('morpheus');
  await sleep(500);

  // Solo TTS — only one line before the stats block
  await typewriterCharacterLine('morpheus',
    `Voce fez o impossivel, ${state.player.alias}. Voce e O Escolhido.`, 30);
  await sleep(800);

  addSystemLine(`Reputacao final: ${state.player.reputation}`);
  addSystemLine(`Missoes completas: ${state.player.completedMissions.length}/7`);
  addSystemLine(`Nivel final: ${state.player.level}`);
  await sleep(500);

  const rating = state.player.reputation >= 500 ? 'O Escolhido (Neo)'
    : state.player.reputation >= 350 ? 'Operador Senior'
    : state.player.reputation >= 200 ? 'Hacker da Resistencia'
    : 'Recem-desperto';

  addSuccessLine(`Titulo: ${rating}`);
  await sleep(1000);

  // --- Infinite mode transition ---
  addSystemLine('');
  addSystemLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await sleep(500);

  // Batch TTS for the two infinite-mode lines — 1 API call
  const infiniteLines = [
    'A Matrix nao para. Novos desafios surgem a cada momento. Voce esta pronto para o que vem a seguir?',
    'A partir de agora, eu gero missoes unicas para voce. Sem limites. Sem fim.',
  ];
  speakText(infiniteLines.join(' '), 'morpheus').catch(() => {});

  for (const line of infiniteLines) {
    await typewriterCharacterLine('morpheus', line, 25, { skipTTS: true });
    await sleep(500);
  }

  addSystemLine('');
  addSuccessLine('>>> MODO INFINITO DESBLOQUEADO <<<');
  addSystemLine('Digite "nova missao" no terminal para desafios infinitos gerados por IA.');
  addSystemLine('Cada missao e unica — criada sob medida para o seu nivel.');
  addSystemLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  triggerEffect('rain_intensify');

  updateMissionBar('MODO INFINITO', 'Digite "nova missao" para desafios gerados por IA.');
}

export async function handleTerminalInput(text) {
  if (!text.trim()) return;

  addPlayerLine(text);

  // Special commands
  const lower = text.trim().toLowerCase();
  if (lower === 'help' || lower === 'ajuda') {
    addSystemLine('Comandos: help, status, reset, clear, nova missao');
    addSystemLine('Use o editor de codigo para completar missoes.');
    addSystemLine('Apos completar todas as missoes, use "nova missao" para desafios infinitos.');
    return;
  }
  if (lower === 'status') {
    const state = getState();
    addSystemLine(`Operador: ${state.player.alias}`);
    addSystemLine(`Nivel: ${state.player.level}`);
    addSystemLine(`Reputacao: ${state.player.reputation}`);
    addSystemLine(`Missoes: ${state.player.completedMissions.length}/7`);
    addSystemLine(`APIs: ${state.player.unlockedAPIs.join(', ') || 'nenhuma'}`);
    if (state.infinite.missionsCompleted > 0) {
      addSystemLine(`Missoes infinitas: ${state.infinite.missionsCompleted} | Score: ${state.infinite.score}`);
    }
    return;
  }
  if (lower === 'clear') {
    clearTerminal();
    return;
  }
  if (lower === 'reset') {
    const { resetSave } = await import('./state.js');
    resetSave();
    addSystemLine('Save apagado. Recarregando...');
    setTimeout(() => window.location.reload(), 1000);
    return;
  }
  if (lower === 'nova missao' || lower === 'new mission') {
    if (getState().settings.demoMode) {
      addSystemLine('Modo demo: missoes infinitas nao disponiveis. Insira sua API key para desbloquear.');
      return;
    }
    await handleNewInfiniteMission();
    return;
  }

  // Chat with Gemini
  showTypingIndicator();
  try {
    const response = await callGeminiForChat(text);
    hideTypingIndicator();
    if (response.dialogue) {
      await typewriterCharacterLine(response.character || 'morpheus', response.dialogue, 25);
    }
  } catch (e) {
    hideTypingIndicator();
    addCharacterLine('morpheus', 'A conexao esta instavel... Tente novamente.');
  }
}

async function handleNewInfiniteMission() {
  addSystemLine('Gerando nova missao...');
  maybeSFX('transmission');
  showTypingIndicator();

  try {
    const mission = await generateInfiniteMission();
    hideTypingIndicator();

    activeInfiniteMission = mission;
    await startMission(mission);
  } catch (e) {
    hideTypingIndicator();
    console.error('Failed to generate infinite mission:', e);
    addErrorLine('Falha ao gerar missao. Verifique sua conexao e API key.');
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
