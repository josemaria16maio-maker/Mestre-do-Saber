// Service Worker simples para cumprir requisitos de PWA instalável
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Apenas passa as requisições, necessário para PWA
  e.respondWith(fetch(e.request));
});