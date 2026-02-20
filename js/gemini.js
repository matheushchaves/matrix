// ===== GEMINI API CLIENT =====

import { getState, updateState } from './state.js';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Proxy detection: probe /health endpoint at startup
let proxyAvailable = false;
let proxyChecked = false;

async function checkProxy() {
  if (proxyChecked) return proxyAvailable;
  proxyChecked = true;

  if (window.location.protocol === 'file:') {
    proxyAvailable = false;
    return false;
  }

  try {
    const res = await fetch('/health', { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      proxyAvailable = data.status === 'ok' && data.proxy === true;
    }
  } catch {
    proxyAvailable = false;
  }
  return proxyAvailable;
}

// Fire probe immediately on module load
checkProxy();

export function isProxyActive() {
  return proxyAvailable;
}

function getDirectUrl(model) {
  const apiKey = getState().settings.geminiApiKey;
  return `${API_BASE}/${model}:generateContent?key=${apiKey}`;
}

function getApiUrl(model) {
  if (proxyAvailable) {
    return `/api/gemini/${model}`;
  }
  return getDirectUrl(model);
}

function getTtsApiUrl(model) {
  if (proxyAvailable) {
    return `/api/gemini-tts/${model}`;
  }
  return getDirectUrl(model);
}

export { getTtsApiUrl };

function buildSystemPrompt(state, missionContext) {
  const characterMap = {
    0: 'morpheus', 1: 'morpheus', 2: 'morpheus',
    3: 'oracle', 4: 'oracle',
    5: 'smith', 6: 'smith',
  };
  const missionIndex = state.player.completedMissions.length;
  const character = characterMap[missionIndex] || 'morpheus';

  return `Voce e o Mestre do Jogo de "Matrix: O Codigo", um jogo de programacao ambientado no universo Matrix.
O jogador e um hacker que escreve codigo JavaScript para completar missoes dentro da Matrix.

REGRAS:
- Responda SEMPRE em portugues brasileiro
- NUNCA quebre o personagem
- Avalie o codigo do jogador e responda de forma dramatica e imersiva
- Seja conciso (maximo 3-4 frases por resposta de dialogo)
- Se o jogador errar, de dicas sutis sem dar a resposta

PERSONAGEM ATUAL: ${character.toUpperCase()}

PERSONALIDADES:
- MORPHEUS: Misterioso, filosofico, encorajador. Fala em metaforas sobre a Matrix e livre arbitrio. Usa "voce" (informal).
- ORACLE: Enigmatica, maternal, fala em charadas. Sempre sabe mais do que revela.
- SMITH: Frio, calculista, condescendente. Chama o jogador de "Sr./Sra. ${state.player.alias}". Fala sobre inevitabilidade.

ESTADO DO JOGADOR:
- Codinome: ${state.player.alias}
- Nivel: ${state.player.level}
- Reputacao: ${state.player.reputation}
- APIs desbloqueadas: ${state.player.unlockedAPIs.join(', ') || 'nenhuma'}
- Missoes completas: ${state.player.completedMissions.length}/7

${missionContext}

FORMATO DE RESPOSTA (JSON obrigatorio):
{
  "dialogue": "Texto em personagem para o jogador (maximo 3-4 frases)",
  "character": "${character}",
  "emotion": "neutral|impressed|disappointed|urgent|amused|threatening",
  "missionComplete": false,
  "missionScore": 0,
  "feedback": "Feedback tecnico curto sobre o codigo (1 frase)",
  "triggerEffect": null,
  "hint": null
}

REGRAS DE AVALIACAO:
1. missionComplete = true SOMENTE se o codigo atingiu o objetivo da missao
2. missionScore de 0-100 (60+ para passar, 80+ para solucao boa, 95+ para solucao brilhante)
3. triggerEffect pode ser: null, "glitch", "screen_shake", "bullet_time", "rain_intensify", "rain_red"
4. Se o jogador estiver travado, forneca uma hint sutil
5. Se o codigo tiver erro, explique o que aconteceu de forma dramatica (em personagem)`;
}

export async function callGemini(userMessage, missionContext = '') {
  const state = getState();
  const apiKey = state.settings.geminiApiKey;
  const model = state.settings.geminiModel;

  if (!apiKey && !proxyAvailable) {
    return getFallbackResponse('Chave API nao configurada.');
  }

  const systemPrompt = buildSystemPrompt(state, missionContext);
  const history = state.story.conversationHistory.slice(-10);

  try {
    const response = await fetch(
      getApiUrl(model),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [
            ...history,
            { role: 'user', parts: [{ text: userMessage }] }
          ],
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return getFallbackResponse(`Erro na API (${response.status}). Usando modo offline.`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return getFallbackResponse('Resposta vazia da API.');
    }

    // Update conversation history
    updateState('story.conversationHistory', hist => [
      ...hist.slice(-9),
      { role: 'user', parts: [{ text: userMessage }] },
      { role: 'model', parts: [{ text }] }
    ]);

    // Parse JSON response
    try {
      return JSON.parse(text);
    } catch (e) {
      // Try extracting JSON from text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e2) {
          // Use raw text as dialogue
          return {
            dialogue: text.substring(0, 500),
            character: 'morpheus',
            emotion: 'neutral',
            missionComplete: false,
            missionScore: 0,
            feedback: '',
            triggerEffect: null,
            hint: null,
          };
        }
      }
      return getFallbackResponse(text.substring(0, 300));
    }
  } catch (e) {
    console.error('Gemini call failed:', e);
    return getFallbackResponse('Falha na conexao. Usando modo offline.');
  }
}

export async function callGeminiForChat(userMessage) {
  const state = getState();
  const missionIndex = state.player.completedMissions.length;
  const characterMap = {
    0: 'morpheus', 1: 'morpheus', 2: 'morpheus',
    3: 'oracle', 4: 'oracle',
    5: 'smith', 6: 'smith',
  };
  const character = characterMap[missionIndex] || 'morpheus';

  const context = `O jogador esta conversando com voce no terminal (nao esta submetendo codigo).
Responda em personagem de forma breve (1-2 frases). Nao avalie codigo.
Responda APENAS com JSON: { "dialogue": "...", "character": "${character}", "emotion": "neutral" }`;

  return callGemini(userMessage, context);
}

export async function callGeminiRaw(model, body) {
  const url = getApiUrl(model);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }
  return response.json();
}

function getFallbackResponse(reason) {
  return {
    dialogue: reason || 'A conexao com a Matrix esta instavel...',
    character: 'morpheus',
    emotion: 'neutral',
    missionComplete: false,
    missionScore: 0,
    feedback: '',
    triggerEffect: null,
    hint: null,
    _fallback: true,
  };
}
