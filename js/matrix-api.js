// ===== MATRIX API DEFINITIONS =====

export const MATRIX_APIS = [
  {
    id: 'scan',
    name: 'Matrix.scan',
    level: 1,
    signature: 'Matrix.scan() : Entity[]',
    description: 'Escaneia a Matrix e retorna entidades visiveis. Cada entidade tem: { type, id, name, threat }',
    unlockMessage: 'Agora voce pode ver a Matrix como ela realmente e.',
  },
  {
    id: 'trace',
    name: 'Matrix.trace',
    level: 2,
    signature: 'Matrix.trace(entityId: string) : Location',
    description: 'Rastreia a localizacao exata de uma entidade. Retorna: { x, y, z, moving, speed }',
    unlockMessage: 'Voce pode rastrear qualquer entidade na Matrix.',
  },
  {
    id: 'decrypt',
    name: 'Matrix.decrypt',
    level: 3,
    signature: 'Matrix.decrypt(data: string, algorithm: Function) : string',
    description: 'Descriptografa dados usando um algoritmo customizado. O algorithm recebe cada caractere e retorna o caractere descriptografado.',
    unlockMessage: 'Os segredos da Matrix estao ao seu alcance.',
  },
  {
    id: 'bend',
    name: 'Matrix.bend',
    level: 4,
    signature: 'Matrix.bend(objectId: string, properties: object) : Result',
    description: 'Modifica as propriedades fisicas de um objeto na Matrix. Nao existe colher.',
    unlockMessage: 'Voce aprendeu a dobrar a realidade da Matrix.',
  },
  {
    id: 'freeze',
    name: 'Matrix.freeze',
    level: 5,
    signature: 'Matrix.freeze(durationMs: number) : Result',
    description: 'Congela o tempo na Matrix por uma duracao especifica em milissegundos.',
    unlockMessage: 'O tempo agora obedece a sua vontade.',
  },
  {
    id: 'inject',
    name: 'Matrix.inject',
    level: 6,
    signature: 'Matrix.inject(targetId: string, code: string) : Result',
    description: 'Injeta codigo diretamente em uma entidade da Matrix. O poder definitivo.',
    unlockMessage: 'Voce domina o codigo fonte da Matrix.',
  },
];

export function getUnlockedAPIs(level) {
  return MATRIX_APIS.filter(api => api.level <= level);
}

export function getApiIds(level) {
  return getUnlockedAPIs(level).map(api => api.id);
}

export function getApiById(id) {
  return MATRIX_APIS.find(api => api.id === id);
}
