// Minimal service worker — required for PWA install prompt.
// Uses network-first strategy: always fetch from network, no offline cache.

self.addEventListener('fetch', () => {
  // Let the browser handle all requests normally
});
