// ===== EXPRESS PROXY SERVER =====
// Proxies Gemini API calls to hide the API key on the server side.

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

if (!GEMINI_API_KEY) {
  console.warn('WARNING: GEMINI_API_KEY not set. Proxy will not work.');
}

// Parse JSON bodies
app.use(express.json({ limit: '1mb' }));

// Serve static files from project root
app.use(express.static(path.join(__dirname, '..')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', proxy: !!GEMINI_API_KEY });
});

// Proxy Gemini text API
app.post('/api/gemini/:model', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const { model } = req.params;
  const url = `${API_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    console.error('Gemini proxy error:', e);
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

// Proxy Gemini TTS API
app.post('/api/gemini-tts/:model', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const { model } = req.params;
  const url = `${API_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    console.error('Gemini TTS proxy error:', e);
    res.status(500).json({ error: 'TTS proxy request failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Matrix server running on port ${PORT}`);
  console.log(`Gemini proxy: ${GEMINI_API_KEY ? 'ACTIVE' : 'INACTIVE (no API key)'}`);
});
