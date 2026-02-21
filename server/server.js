// ===== MATRIX SERVER =====
// Static file server + demo proxy for Gemini API (key stays server-side).

const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Allowed top-level fields in the request body (reject anything unexpected)
const ALLOWED_BODY_FIELDS = new Set([
  'contents',
  'generationConfig',
  'system_instruction',
]);

// Parse JSON bodies (limit size to prevent abuse)
app.use(express.json({ limit: '64kb' }));

// Serve static files from project root
app.use(express.static(path.join(__dirname, '..')));

// Health check — frontend uses `demo` flag to show/hide demo button
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', demo: !!GEMINI_API_KEY });
});

// ===== DEMO PROXY =====

if (GEMINI_API_KEY) {
  // Rate limit: 30 requests per hour per IP
  const demoLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Limite de requisicoes atingido. Tente novamente mais tarde.' },
  });

  app.post('/api/gemini-demo/:model', demoLimiter, async (req, res) => {
    const { model } = req.params;
    const body = req.body;

    // Validate body — only allow known fields
    const bodyKeys = Object.keys(body);
    for (const key of bodyKeys) {
      if (!ALLOWED_BODY_FIELDS.has(key)) {
        return res.status(400).json({ error: `Campo nao permitido: ${key}` });
      }
    }

    if (!body.contents) {
      return res.status(400).json({ error: 'Campo "contents" obrigatorio.' });
    }

    try {
      const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.text();
      res.status(response.status).type('application/json').send(data);
    } catch (err) {
      console.error('Demo proxy error:', err.message);
      res.status(502).json({ error: 'Falha ao conectar com a API do Gemini.' });
    }
  });

  console.log('Demo mode enabled (GEMINI_API_KEY set)');
} else {
  // No key — demo endpoint returns 503
  app.post('/api/gemini-demo/:model', (_req, res) => {
    res.status(503).json({ error: 'Demo indisponivel.' });
  });

  console.log('Demo mode disabled (no GEMINI_API_KEY)');
}

app.listen(PORT, () => {
  console.log(`Matrix server running on port ${PORT}`);
});
