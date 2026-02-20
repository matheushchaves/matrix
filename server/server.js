// ===== STATIC FILE SERVER =====
// Serves the Matrix game as static files. Each player uses their own Gemini API key.

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from project root
app.use(express.static(path.join(__dirname, '..')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Matrix server running on port ${PORT}`);
});
