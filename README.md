# Matrix: O Codigo

Um jogo de programacao imersivo ambientado no universo Matrix. Escreva JavaScript para hackear a Matrix, completar missoes e desbloquear habilidades — guiado por Morpheus, o Oraculo e o Agente Smith, com voz gerada por IA.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Gemini](https://img.shields.io/badge/Gemini_AI-8E75B2?logo=google&logoColor=white)

## Como Funciona

Voce e um hacker recrutado pela resistencia. No **terminal**, personagens do Matrix te dao instrucoes. No **editor**, voce escreve codigo JavaScript para completar as missoes. A **IA Gemini** avalia seu codigo e responde em personagem.

### Recursos

- **7 missoes** em 3 capitulos com historia progressiva
- **6 APIs da Matrix** desbloqueadas conforme voce avanca (`Matrix.scan()`, `Matrix.trace()`, `Matrix.decrypt()`, `Matrix.bend()`, `Matrix.freeze()`, `Matrix.inject()`)
- **IA Gemini** avalia o codigo e responde como Morpheus, Oraculo ou Agente Smith
- **Voz TTS** — personagens falam com vozes distintas via Gemini TTS
- **Missoes infinitas** geradas por IA apos completar a campanha
- **Tutorial interativo** com spotlight guiando cada elemento da UI
- **Efeitos visuais** — chuva digital, glitch, bullet time, screen shake
- **SFX sintetizados** via Web Audio API
- **Avatares SVG** dos personagens no terminal
- **Execucao sandboxed** — seu codigo roda em iframe isolado
- **Progresso salvo** automaticamente no localStorage

## Jogar Localmente

1. Gere uma API key gratuita em [Google AI Studio](https://aistudio.google.com/apikey)
2. Abra `index.html` no navegador
3. Cole sua API key quando solicitado
4. Escolha "Nova Partida" e siga as instrucoes do Morpheus

> Funciona direto no navegador via `file://` — nenhuma instalacao necessaria.

## Deploy (Cloud Run)

O servidor Express funciona como proxy para a API Gemini, escondendo a API key no backend.

```bash
# Instalar dependencias do servidor
cd server && npm install && cd ..

# Testar localmente
GEMINI_API_KEY=sua_chave node server/server.js
# Acesse http://localhost:8080

# Deploy no Google Cloud Run
export GEMINI_API_KEY=sua_chave
export GCP_PROJECT_ID=seu_projeto
./deploy.sh
```

### Docker

```bash
docker build -t matrix .
docker run -p 8080:8080 -e GEMINI_API_KEY=sua_chave matrix
```

## Estrutura do Projeto

```
matrix/
├── index.html              # HTML principal
├── css/
│   ├── main.css            # Layout e estilos base
│   ├── editor.css          # Tema CodeMirror
│   ├── effects.css         # Animacoes visuais
│   ├── home.css            # Landing page
│   └── tutorial.css        # Tutorial spotlight
├── js/
│   ├── app.js              # Bootstrap e roteamento
│   ├── state.js            # Estado global (observer pattern)
│   ├── home.js             # Menu da home page
│   ├── terminal.js         # Renderizador do terminal
│   ├── editor.js           # Editor CodeMirror
│   ├── story.js            # Motor de historia e missoes
│   ├── missions.js         # Definicao das 7 missoes
│   ├── matrix-api.js       # APIs da Matrix (scan, trace, etc)
│   ├── gemini.js           # Cliente Gemini com proxy detection
│   ├── sandbox.js          # Execucao isolada de codigo
│   ├── effects.js          # Efeitos visuais
│   ├── rain.js             # Chuva digital (canvas)
│   ├── avatars.js          # Avatares SVG dos personagens
│   ├── voice.js            # TTS via Gemini (fila sequencial)
│   ├── audio.js            # SFX sintetizados
│   ├── tutorial.js         # Tutorial interativo
│   └── infinite.js         # Missoes infinitas geradas por IA
├── server/
│   ├── server.js           # Express proxy server
│   └── package.json        # Dependencias do servidor
├── Dockerfile              # Container Cloud Run
├── deploy.sh               # Script de deploy GCP
└── .dockerignore
```

## Tecnologias

- **Frontend**: JavaScript vanilla (ES6 modules), HTML5, CSS3
- **Editor**: [CodeMirror 5](https://codemirror.net/5/)
- **IA**: [Google Gemini API](https://ai.google.dev/) (texto + TTS)
- **Audio**: Web Audio API (SFX sintetizados + decodificacao PCM do TTS)
- **Backend** (opcional): Node.js + Express
- **Deploy**: Docker + Google Cloud Run

## Licenca

MIT
