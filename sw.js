// ==============================================================================
// MY TYPE PWA - SERVICE WORKER DE ALTA PERFORMANCE
// Cache inteligente: App Shell offline + Network First para dados dinâmicos
// ==============================================================================

const CACHE_NAME = 'mytype-pwa-v48';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico',
  '/icons/favicon-192.png',
  '/icons/favicon-32.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon.svg',
  '/icons/user-avatar.png'
];

// Instalação do Service Worker: baixa os assets essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pré-carregando App Shell no cache offline...');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Aviso: Alguns recursos estáticos falharam no pré-cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Ativação: limpa versões antigas do cache e assume controle imediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removendo cache obsoleto:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de requisições:
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Navegação de páginas HTML (/ e /mytype.html): Network First com Fallback para Cache
  if (request.mode === 'navigate' || request.destination === 'document' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match('/') || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // 2. Arquivos estáticos locais (ícones, imagens locais, etc): Stale While Revalidate
  if (url.origin === location.origin && (url.pathname.startsWith('/icons/') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.css') || url.pathname.endsWith('.js'))) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Demais requisições (APIs, terceiros): direto na rede com fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
