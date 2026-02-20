// ===== SERVICE WORKER - Matrix: O Código =====
const CACHE_VERSION = 'matrix-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/editor.css',
  '/css/effects.css',
  '/css/home.css',
  '/css/tutorial.css',
  '/js/app.js',
  '/js/audio.js',
  '/js/avatars.js',
  '/js/editor.js',
  '/js/effects.js',
  '/js/gemini.js',
  '/js/home.js',
  '/js/infinite.js',
  '/js/matrix-api.js',
  '/js/missions.js',
  '/js/mobile.js',
  '/js/rain.js',
  '/js/sandbox.js',
  '/js/state.js',
  '/js/story.js',
  '/js/terminal.js',
  '/js/tutorial.js',
  '/js/ui.js',
  '/js/voice.js',
  '/assets/favicon.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/apple-touch-icon.png',
];

// CDN assets cached on first fetch
const CDN_PATTERNS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com/ajax/libs/codemirror',
];

// Never cache these
const NETWORK_ONLY_PATTERNS = [
  'generativelanguage.googleapis.com',
  '/api/gemini',
  '/health',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-only for API calls
  if (NETWORK_ONLY_PATTERNS.some((p) => event.request.url.includes(p))) {
    return; // Let browser handle normally
  }

  // Cache-first for static assets and CDN resources
  const isCDN = CDN_PATTERNS.some((p) => event.request.url.includes(p));
  const isLocal = url.origin === self.location.origin;

  if (isLocal || isCDN) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          // Cache successful GET responses
          if (response.ok && event.request.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
