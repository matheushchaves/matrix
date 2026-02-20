// ===== MISSION DEFINITIONS =====

export const CHAPTERS = [
  { id: 'ch1', name: 'O Despertar', character: 'morpheus' },
  { id: 'ch2', name: 'A Toca do Coelho', character: 'oracle' },
  { id: 'ch3', name: 'A Batalha', character: 'smith' },
];

export const MISSIONS = [
  // === CHAPTER 1: O Despertar (Morpheus) ===
  {
    id: 'mission_1',
    chapter: 0,
    name: 'A Pilula Vermelha',
    character: 'morpheus',
    objective: 'Escreva uma funcao que retorne a string "I am awake" e a execute.',
    introDialogue: [
      'Eu sei por que voce esta aqui, {alias}.',
      'Voce sabe que tem algo errado com o mundo. Voce nao sabe o que e, mas sente... como uma farpa na sua mente.',
      'Eu posso te mostrar a verdade. Mas primeiro, preciso saber se voce e capaz.',
      'Prove que esta acordado. Escreva uma funcao que retorne "I am awake" e a execute no editor.',
    ],
    starterCode: '// Escreva uma funcao que retorna "I am awake"\n// e chame ela para retornar o resultado\n\nfunction awaken() {\n  // seu codigo aqui\n}\n\nreturn awaken();',
    apisNeeded: [],
    scanData: null,
    traceData: null,
    geminiContext: `MISSAO 1: A Pilula Vermelha
O jogador deve escrever codigo que retorne a string "I am awake".
Qualquer variacao criativa e aceitavel ("Eu estou acordado", etc).
O importante e que o codigo funcione e retorne uma string indicando que esta "acordado/desperto".
Se retornar exatamente "I am awake", missionScore >= 70.
Se usar uma funcao bem estruturada, bonus de score.
Ao completar: parabenize como Morpheus e diga que agora ele pode ver a Matrix.`,
    localValidation(result) {
      if (!result.success) return { pass: false, score: 0 };
      const val = (result.returnValue || '').replace(/"/g, '').toLowerCase().trim();
      if (val.includes('awake') || val.includes('acordado') || val.includes('desperto')) {
        return { pass: true, score: 75 };
      }
      return { pass: false, score: 0 };
    },
    unlocksAPI: 'scan',
    nextLevel: 2,
  },
  {
    id: 'mission_2',
    chapter: 0,
    name: 'Primeiros Olhos',
    character: 'morpheus',
    objective: 'Use Matrix.scan() para encontrar e filtrar todas as anomalias.',
    introDialogue: [
      'Muito bem, {alias}. Voce deu o primeiro passo.',
      'Agora voce tem acesso ao Matrix.scan() - seus olhos dentro da Matrix.',
      'A Matrix esta cheia de entidades: humanos, programas... e anomalias.',
      'Use Matrix.scan() e filtre apenas as entidades do tipo "anomaly". Retorne o array de anomalias.',
    ],
    starterCode: '// Use Matrix.scan() para obter todas as entidades\n// Filtre apenas as de tipo "anomaly"\n// Retorne o array filtrado\n\nconst entities = Matrix.scan();\n// seu codigo aqui\n',
    apisNeeded: ['scan'],
    scanData: [
      { type: 'human', id: 'h001', name: 'Cidadao_01', threat: 0 },
      { type: 'program', id: 'p001', name: 'Sentinela_A', threat: 2 },
      { type: 'anomaly', id: 'a001', name: 'Glitch_Alpha', threat: 5 },
      { type: 'human', id: 'h002', name: 'Cidadao_02', threat: 0 },
      { type: 'anomaly', id: 'a002', name: 'Glitch_Beta', threat: 3 },
      { type: 'program', id: 'p002', name: 'Daemon_X', threat: 1 },
      { type: 'anomaly', id: 'a003', name: 'Glitch_Gamma', threat: 7 },
      { type: 'human', id: 'h003', name: 'Cidadao_03', threat: 0 },
    ],
    traceData: null,
    geminiContext: `MISSAO 2: Primeiros Olhos
O jogador deve usar Matrix.scan() para obter entidades e filtrar as de tipo "anomaly".
Existem 3 anomalias nos dados: Glitch_Alpha, Glitch_Beta, Glitch_Gamma.
O jogador deve usar .filter() ou metodo equivalente.
Se retornar array com 3 anomalias: missionComplete = true, score 70+.
Se usar codigo elegante (filter com arrow function): bonus score.
Se retornar array vazio ou errado: dica sobre usar .filter() com type === "anomaly".`,
    localValidation(result) {
      if (!result.success) return { pass: false, score: 0 };
      try {
        const val = JSON.parse(result.returnValue);
        if (Array.isArray(val) && val.length === 3 && val.every(e => e.type === 'anomaly')) {
          return { pass: true, score: 75 };
        }
        if (Array.isArray(val) && val.some(e => e.type === 'anomaly')) {
          return { pass: false, score: 30 };
        }
      } catch(e) {}
      return { pass: false, score: 0 };
    },
    unlocksAPI: 'trace',
    nextLevel: 3,
  },
  {
    id: 'mission_3',
    chapter: 0,
    name: 'Rastreando o Agente',
    character: 'morpheus',
    objective: 'Encontre o Agente com Matrix.scan() e rastreie sua posicao com Matrix.trace().',
    introDialogue: [
      'As anomalias que voce encontrou... sao sintomas de algo maior.',
      'Ha um Agente dentro da Matrix. Ele esta nos procurando.',
      'Use Matrix.scan() para encontra-lo e Matrix.trace() para descobrir sua localizacao.',
      'Rapido, {alias}. Nao temos muito tempo.',
    ],
    starterCode: '// 1. Use Matrix.scan() para encontrar a entidade tipo "agent"\n// 2. Use Matrix.trace(id) para rastrear a localizacao\n// 3. Retorne um objeto com o agente e sua posicao\n\n',
    apisNeeded: ['scan', 'trace'],
    scanData: [
      { type: 'human', id: 'h010', name: 'Cidadao_10', threat: 0 },
      { type: 'program', id: 'p010', name: 'Firewall_01', threat: 1 },
      { type: 'agent', id: 'smith_01', name: 'Agente_Smith', threat: 10 },
      { type: 'human', id: 'h011', name: 'Cidadao_11', threat: 0 },
      { type: 'program', id: 'p011', name: 'Proxy_02', threat: 1 },
    ],
    traceData: {
      'smith_01': { x: 42, y: 15, z: 0, moving: true, speed: 8.5, direction: 'north' },
      'h010': { x: 10, y: 20, z: 0, moving: false, speed: 0, direction: null },
      'p010': { x: 0, y: 0, z: 5, moving: false, speed: 0, direction: null },
    },
    geminiContext: `MISSAO 3: Rastreando o Agente
O jogador deve:
1. Usar Matrix.scan() para encontrar a entidade com type === "agent" (id: "smith_01")
2. Usar Matrix.trace("smith_01") para obter a localizacao
3. Retornar um objeto combinando as informacoes

O agente esta em x:42, y:15, movendo para norte.
Se o jogador encontrou o agente E rastreou a posicao: missionComplete = true.
Se usou .find() para localizar o agente: bonus de elegancia.
Ao completar: Morpheus avisa que precisam fugir. Fim do capitulo 1. Transicao para o Oraculo.
triggerEffect: "rain_intensify" ao completar, "glitch" se errar.`,
    localValidation(result) {
      if (!result.success) return { pass: false, score: 0 };
      const val = result.returnValue || '';
      if (val.includes('smith_01') && (val.includes('42') || val.includes('x'))) {
        return { pass: true, score: 75 };
      }
      if (result.apiCalls && result.apiCalls.some(c => c.name === 'trace')) {
        return { pass: false, score: 40 };
      }
      return { pass: false, score: 0 };
    },
    unlocksAPI: 'decrypt',
    nextLevel: 4,
  },

  // === CHAPTER 2: A Toca do Coelho (Oracle) ===
  {
    id: 'mission_4',
    chapter: 1,
    name: 'Mensagem Cifrada',
    character: 'oracle',
    objective: 'Descriptografe a mensagem usando Matrix.decrypt() com sua propria funcao de decifrar.',
    introDialogue: [
      'Ah, voce chegou. Eu estava esperando por voce, {alias}.',
      'Tenho um biscoito pra voce... mas primeiro, um pequeno teste.',
      'Deixei uma mensagem cifrada na Matrix. Cada letra foi deslocada 3 posicoes no alfabeto.',
      'Use Matrix.decrypt() passando uma funcao que reverta a cifra. A mensagem e: "Wkhuh#lv#qr#vsrrq"',
    ],
    starterCode: '// A mensagem esta cifrada com Caesar Cipher (deslocamento de 3)\n// "Wkhuh#lv#qr#vsrrq" -> cada caractere foi deslocado +3\n// Voce precisa deslocar -3 para descriptografar\n//\n// Use Matrix.decrypt(texto, funcaoDecifradora)\n// A funcao recebe cada caractere e deve retornar o caractere decifrado\n\nconst mensagem = "Wkhuh#lv#qr#vsrrq";\n\nreturn Matrix.decrypt(mensagem, function(char) {\n  // seu codigo aqui - desloque o caractere -3 posicoes\n});\n',
    apisNeeded: ['decrypt'],
    decryptData: 'Wkhuh#lv#qr#vsrrq',
    scanData: [
      { type: 'message', id: 'msg_001', name: 'Mensagem_Cifrada', data: 'Wkhuh#lv#qr#vsrrq', threat: 0 },
    ],
    traceData: null,
    geminiContext: `MISSAO 4: Mensagem Cifrada
O jogador deve descriptografar "Wkhuh#lv#qr#vsrrq" usando Caesar Cipher com deslocamento -3.
A mensagem decifrada e: "There is no spoon" (referencia classica do Matrix).
O jogador precisa passar uma funcao para Matrix.decrypt() que desloca cada caractere -3.
Exemplo correto: char => String.fromCharCode(char.charCodeAt(0) - 3)
Se a mensagem decifrada contem "there is no spoon" (case insensitive): missionComplete = true, score 70+.
Se a funcao e elegante e usa charCodeAt/fromCharCode: bonus score.
O Oraculo responde em personagem: enigmatica, faz referencia a colher.
triggerEffect: "glitch" ao completar.`,
    localValidation(result) {
      if (!result.success) return { pass: false, score: 0 };
      const val = (result.returnValue || '').replace(/"/g, '').toLowerCase();
      if (val.includes('there is no spoon')) {
        return { pass: true, score: 80 };
      }
      if (val.includes('there') || val.includes('spoon')) {
        return { pass: false, score: 40 };
      }
      return { pass: false, score: 0 };
    },
    unlocksAPI: 'bend',
    nextLevel: 5,
  },
  {
    id: 'mission_5',
    chapter: 1,
    name: 'Dobrar a Colher',
    character: 'oracle',
    objective: 'Use Matrix.bend() para abrir caminho atraves dos obstaculos.',
    introDialogue: [
      'Voce ja sabe a verdade: nao existe colher.',
      'Agora precisa atravessar um corredor da Matrix. Ha uma parede e uma porta trancada no caminho.',
      'Use Matrix.scan() para ver os obstaculos, depois Matrix.bend() para modifica-los.',
      'Torne a parede nao-solida OU destranque a porta. Criatividade conta, querido.',
    ],
    starterCode: '// 1. Use Matrix.scan() para ver os objetos\n// 2. Use Matrix.bend(id, { propriedade: valor }) para modificar\n//    Opcoes: tornar parede nao-solida, destrancar porta, etc.\n// 3. Retorne o resultado\n\nconst objects = Matrix.scan();\n// seu codigo aqui\n',
    apisNeeded: ['scan', 'bend'],
    scanData: [
      { type: 'object', id: 'wall_01', name: 'Parede_Corredor', solid: true, material: 'concrete', transparency: 0 },
      { type: 'object', id: 'door_01', name: 'Porta_Trancada', locked: true, state: 'closed', material: 'steel' },
      { type: 'object', id: 'floor_01', name: 'Piso', solid: true, material: 'tile', transparency: 0 },
    ],
    traceData: null,
    geminiContext: `MISSAO 5: Dobrar a Colher
O jogador deve usar Matrix.scan() para encontrar obstaculos e Matrix.bend() para modifica-los.
Objetos: wall_01 (parede solida), door_01 (porta trancada), floor_01 (piso).
Solucoes validas:
- Matrix.bend("wall_01", { solid: false }) - tornar parede nao-solida
- Matrix.bend("door_01", { locked: false }) - destrancar porta
- Matrix.bend("door_01", { state: "open" }) - abrir porta
- Qualquer combinacao criativa
Se o jogador usou Matrix.bend em wall_01 ou door_01: missionComplete = true.
Solucoes mais criativas (ex: tornar parede transparente, destruir a parede, etc): bonus score.
O Oraculo comenta com sabedoria sobre como a realidade e flexivel.
triggerEffect: "success_flash" ao completar.`,
    localValidation(result) {
      if (!result.success) return { pass: false, score: 0 };
      if (result.apiCalls && result.apiCalls.some(c => c.name === 'bend')) {
        return { pass: true, score: 70 };
      }
      return { pass: false, score: 0 };
    },
    unlocksAPI: 'freeze',
    nextLevel: 6,
  },

  // === CHAPTER 3: A Batalha (Smith) ===
  {
    id: 'mission_6',
    chapter: 2,
    name: 'Bullet Time',
    character: 'smith',
    objective: 'Use Matrix.freeze() e calcule posicoes seguras para desviar dos projeteis.',
    introDialogue: [
      'Sr. {alias}... nos encontramos de novo.',
      'Voce acha que seus truques de hacker podem me deter? Patetico.',
      'Vamos ver se voce consegue desviar disso.',
      '[ALERTA: Multiplos projeteis detectados! Use Matrix.freeze() para ganhar tempo e calcule uma posicao segura!]',
    ],
    starterCode: '// ALERTA: Projeteis se aproximando!\n// 1. Use Matrix.freeze(ms) para desacelerar o tempo\n// 2. Use Matrix.scan() para detectar os projeteis\n// 3. Use Matrix.trace(id) para ver as trajetorias\n// 4. Calcule uma posicao X segura (que nenhum projetil atinja)\n// 5. Use Matrix.bend("player", { x: posicaoSegura }) para se mover\n\n',
    apisNeeded: ['scan', 'trace', 'freeze', 'bend'],
    scanData: [
      { type: 'projectile', id: 'bullet_1', name: 'Projetil_1', threat: 10 },
      { type: 'projectile', id: 'bullet_2', name: 'Projetil_2', threat: 10 },
      { type: 'projectile', id: 'bullet_3', name: 'Projetil_3', threat: 10 },
      { type: 'agent', id: 'smith_01', name: 'Agente_Smith', threat: 10 },
      { type: 'player', id: 'player', name: 'Player', threat: 0 },
    ],
    traceData: {
      'bullet_1': { x: 3, y: 5, z: 0, moving: true, speed: 100, targetX: 3 },
      'bullet_2': { x: 7, y: 5, z: 0, moving: true, speed: 100, targetX: 7 },
      'bullet_3': { x: 5, y: 5, z: 0, moving: true, speed: 100, targetX: 5 },
      'smith_01': { x: 0, y: 10, z: 0, moving: false, speed: 0 },
      'player': { x: 5, y: 0, z: 0, moving: false, speed: 0 },
    },
    geminiContext: `MISSAO 6: Bullet Time
O jogador deve:
1. Usar Matrix.freeze() para desacelerar o tempo
2. Usar Matrix.scan() para encontrar projeteis (type: "projectile")
3. Usar Matrix.trace() para ver posicoes dos projeteis
4. Calcular posicao segura (projeteis em x: 3, 5, 7 - posicoes seguras: qualquer x diferente desses)
5. Usar Matrix.bend("player", { x: posicaoSegura }) para desviar

Projeteis estao nas posicoes x: 3, 5, 7. Player esta em x: 5.
Qualquer x diferente de 3, 5, 7 e seguro (ex: 0, 1, 2, 4, 6, 8, 9, 10).
Se o jogador usou freeze + calculou posicao segura + moveu player: missionComplete = true.
Se apenas usou freeze sem calcular: score parcial.
Agente Smith fala com desprezo. Se o jogador conseguir: Smith fica irritado.
triggerEffect: "bullet_time" ao iniciar, "rain_red" com Smith.`,
    localValidation(result) {
      if (!result.success) return { pass: false, score: 0 };
      const usedFreeze = result.apiCalls && result.apiCalls.some(c => c.name === 'freeze');
      const usedBend = result.apiCalls && result.apiCalls.some(c => c.name === 'bend');
      const usedScan = result.apiCalls && result.apiCalls.some(c => c.name === 'scan');
      if (usedFreeze && usedBend && usedScan) {
        return { pass: true, score: 80 };
      }
      if (usedFreeze && usedBend) {
        return { pass: true, score: 65 };
      }
      if (usedFreeze) {
        return { pass: false, score: 30 };
      }
      return { pass: false, score: 0 };
    },
    unlocksAPI: 'inject',
    nextLevel: 7,
  },
  {
    id: 'mission_7',
    chapter: 2,
    name: 'O Codigo Fonte',
    character: 'smith',
    objective: 'Use todas as APIs para neutralizar o Agente Smith e salvar a Matrix.',
    introDialogue: [
      'Voce e persistente, Sr. {alias}. Mas isso termina aqui.',
      'Eu sou inevitavel. Eu sou o proposito. Voce nao pode me parar.',
      '[MISSAO FINAL: Neutralize TODOS os agentes Smith usando todas as suas habilidades!]',
      '[DICA: Escaneie, rastreie, congele o tempo, e injete codigo para neutralizar cada agente.]',
    ],
    starterCode: '// MISSAO FINAL: Neutralize o Agente Smith!\n//\n// Voce tem acesso a TODAS as APIs:\n// Matrix.scan()    - encontrar entidades\n// Matrix.trace(id) - rastrear posicao\n// Matrix.freeze(ms)- congelar tempo\n// Matrix.bend(id, props) - modificar propriedades\n// Matrix.inject(id, code) - injetar codigo\n// Matrix.decrypt(data, fn) - descriptografar\n//\n// Encontre todos os agentes e neutralize-os!\n\n',
    apisNeeded: ['scan', 'trace', 'freeze', 'bend', 'inject'],
    scanData: [
      { type: 'agent', id: 'smith_01', name: 'Smith_Prime', threat: 10, active: true },
      { type: 'agent', id: 'smith_02', name: 'Smith_Clone_1', threat: 8, active: true },
      { type: 'agent', id: 'smith_03', name: 'Smith_Clone_2', threat: 8, active: true },
      { type: 'human', id: 'h100', name: 'Cidadao_Inocente', threat: 0, active: true },
      { type: 'player', id: 'player', name: 'Player', threat: 0, active: true },
    ],
    traceData: {
      'smith_01': { x: 10, y: 10, z: 0, moving: true, speed: 5 },
      'smith_02': { x: 20, y: 5, z: 0, moving: true, speed: 5 },
      'smith_03': { x: 15, y: 15, z: 0, moving: true, speed: 5 },
      'player': { x: 0, y: 0, z: 0, moving: false, speed: 0 },
    },
    geminiContext: `MISSAO 7 (FINAL): O Codigo Fonte
O jogador deve neutralizar TODOS os 3 agentes Smith (smith_01, smith_02, smith_03).
O jogador tem TODAS as APIs disponiveis.

Solucao esperada (aproximada):
1. Matrix.freeze() para ganhar tempo
2. Matrix.scan() para encontrar os agentes
3. Loop nos agentes: Matrix.inject(id, codigo) ou Matrix.bend(id, { active: false, threat: 0 })
4. Verificar que todos foram neutralizados

QUALQUER abordagem criativa e valida! O importante e interagir com os 3 agentes.
Se todos os 3 foram alvo de inject ou bend: missionComplete = true.
Solucoes criativas (ex: fazer Smith lutar contra si mesmo, reescrever seu proposito): score 90+.
Se apenas 1-2 agentes neutralizados: feedback encorajador, "faltam mais".

ESTA E A MISSAO FINAL. Se completa:
- Smith deve admitir derrota (relutantemente)
- Morpheus aparece com mensagem de parabens
- dialogue deve ser epica e conclusiva
- triggerEffect: "bullet_time" + "rain_intensify"
- missionScore deve ser generoso (80+)`,
    localValidation(result) {
      if (!result.success) return { pass: false, score: 0 };
      const injectCalls = (result.apiCalls || []).filter(c => c.name === 'inject');
      const bendCalls = (result.apiCalls || []).filter(c => c.name === 'bend');
      const totalInteractions = injectCalls.length + bendCalls.length;

      if (totalInteractions >= 3) {
        return { pass: true, score: 85 };
      }
      if (totalInteractions >= 1) {
        return { pass: false, score: 40 };
      }
      return { pass: false, score: 0 };
    },
    unlocksAPI: null,
    nextLevel: null,
  },
];

export function getMission(missionId) {
  return MISSIONS.find(m => m.id === missionId);
}

export function getMissionByIndex(index) {
  return MISSIONS[index] || null;
}

export function getChapter(chapterIndex) {
  return CHAPTERS[chapterIndex] || null;
}
