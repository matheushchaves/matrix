// ===== INFINITE AI-GENERATED MISSIONS =====

import { getState, updateState } from './state.js';
import { callGeminiRaw } from './gemini.js';

const DIFFICULTIES = ['facil', 'medio', 'dificil', 'expert'];
const CATEGORIES = [
  'algoritmo', 'estrutura de dados', 'manipulacao de strings',
  'logica', 'matematica', 'array processing', 'objetos e JSON',
  'recursao', 'criatividade', 'otimizacao',
];

function getDifficulty() {
  const state = getState();
  const completed = state.infinite.missionsCompleted;
  const index = Math.min(Math.floor(completed / 3), DIFFICULTIES.length - 1);
  return DIFFICULTIES[index];
}

function getRandomCategory() {
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}

/**
 * Attempt to parse JSON from Gemini, cleaning common issues:
 * markdown fences, single quotes, trailing commas, etc.
 */
function parseJSON(raw) {
  // Strip markdown code fences if present
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  // First try as-is
  try { return JSON.parse(text); } catch {}

  // Fix trailing commas before } or ]
  let cleaned = text.replace(/,\s*([}\]])/g, '$1');

  try { return JSON.parse(cleaned); } catch {}

  // Replace single-quoted keys/values with double quotes (best effort)
  cleaned = cleaned.replace(/'/g, '"');

  try { return JSON.parse(cleaned); } catch (e) {
    throw new Error(`Invalid JSON from Gemini: ${e.message}`);
  }
}

export async function generateInfiniteMission() {
  const state = getState();
  const difficulty = getDifficulty();
  const category = getRandomCategory();
  const unlockedAPIs = state.player.unlockedAPIs || [];
  const missionNumber = state.infinite.missionsCompleted + 1;

  const prompt = `Voce e o gerador de missoes do jogo "Matrix: O Codigo", um jogo de programacao JavaScript ambientado no universo Matrix.

Gere uma missao de programacao com as seguintes especificacoes:
- DIFICULDADE: ${difficulty}
- CATEGORIA: ${category}
- NUMERO DA MISSAO: #${missionNumber}
- APIs DISPONIVEIS: ${unlockedAPIs.join(', ') || 'nenhuma especial'}

O jogador tem acesso a estas APIs da Matrix:
- Matrix.scan() - retorna array de entidades
- Matrix.trace(id) - retorna posicao de uma entidade
- Matrix.decrypt(data, fn) - descriptografa dados com funcao customizada
- Matrix.bend(id, props) - modifica propriedades de um objeto
- Matrix.freeze(ms) - congela o tempo
- Matrix.inject(id, code) - injeta codigo em entidade

GERE UM JSON com EXATAMENTE esta estrutura (sem markdown, apenas JSON puro):
{
  "name": "Nome curto e tematico da missao (em portugues)",
  "character": "morpheus",
  "objective": "Descricao clara do objetivo (em portugues, 1-2 frases)",
  "introDialogue": ["Fala 1 do personagem", "Fala 2", "Fala 3 com instrucoes"],
  "starterCode": "// Comentario explicando o desafio\\n// ...\\n",
  "scanData": [{"type": "tipo", "id": "id_1", "name": "Nome", "threat": 0}],
  "traceData": {"id_1": {"x": 0, "y": 0, "z": 0, "moving": false, "speed": 0}},
  "geminiContext": "Contexto para avaliacao do codigo do jogador. Explique o que o codigo deve fazer, criterios de sucesso e score.",
  "difficulty": "${difficulty}",
  "category": "${category}"
}

REGRAS:
- O desafio deve ser soluvel em 5-20 linhas de JavaScript
- Dados de scan/trace devem ser realistas e consistentes com o tema Matrix
- introDialogue deve ser em portugues, em personagem (Morpheus = filosofico, Oracle = enigmatica, Smith = frio)
- Alterne entre personagens: use "morpheus", "oracle", ou "smith"
- O starterCode deve ter comentarios em portugues guiando o jogador (maximo 4 linhas)
- O geminiContext deve ser conciso (2-3 frases com criterios de sucesso)
- introDialogue deve ter no maximo 3 falas curtas
- scanData deve ter no maximo 5 entidades
- MANTENHA A RESPOSTA COMPACTA — sem textos longos
- Dificuldade ${difficulty}: ${
  difficulty === 'facil' ? 'conceitos basicos, filtro, map, reduce simples' :
  difficulty === 'medio' ? 'combinacao de APIs, logica intermediaria, algoritmos simples' :
  difficulty === 'dificil' ? 'algoritmos mais complexos, multiplas APIs combinadas, otimizacao' :
  'problemas avancados, algoritmos sofisticados, solucoes criativas obrigatorias'
}`;

  const model = state.settings.geminiModel;

  const data = await callGeminiRaw(model, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 1.0,
      topP: 0.95,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    }
  });

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response from Gemini');
  }

  const missionData = parseJSON(text);

  // Build a mission object compatible with the existing system
  const mission = {
    id: `infinite_${missionNumber}`,
    chapter: 2,
    name: missionData.name || `Missao Infinita #${missionNumber}`,
    character: missionData.character || 'morpheus',
    objective: missionData.objective || 'Complete o desafio.',
    introDialogue: missionData.introDialogue || ['Uma nova missao foi gerada para voce.'],
    starterCode: missionData.starterCode || '// Escreva seu codigo aqui\n',
    apisNeeded: [],
    scanData: missionData.scanData || null,
    traceData: missionData.traceData || null,
    geminiContext: missionData.geminiContext || 'Avalie o codigo do jogador.',
    localValidation(result) {
      // Infinite missions rely on Gemini for evaluation
      if (!result.success) return { pass: false, score: 0 };
      return { pass: false, score: 20 };
    },
    unlocksAPI: null,
    nextLevel: null,
    _infinite: true,
    _difficulty: missionData.difficulty || difficulty,
    _category: missionData.category || category,
  };

  return mission;
}

export function recordInfiniteCompletion(mission, score) {
  updateState('infinite.missionsCompleted', n => n + 1);
  updateState('infinite.score', s => s + score);
  updateState('infinite.history', hist => [
    ...hist.slice(-49),
    {
      id: mission.id,
      name: mission.name,
      score,
      difficulty: mission._difficulty,
      category: mission._category,
      timestamp: Date.now(),
    }
  ]);
}
