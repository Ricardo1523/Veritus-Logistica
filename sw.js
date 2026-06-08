const CACHE_NAME = 'veritus-v2'; // Bumped version to force cache refresh
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './home.html',
  './scanner.html',
  './gerar-qr.html',
  './historico.html',
  './relatorios.html',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/pages.css',
  './js/store.js',
  './js/ui.js',
  './js/home.js',
  './js/scanner.js',
  './js/gerar-qr.js',
  './js/historico.js',
  './js/relatorios.js',
  './js/navigation.js',
  './js/firebase-init.js',
  './icons/icon-48.png',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js'
];

// Install Event - Caching Assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell and content');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Cleaning old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first fallback to cache for HTML/dynamic pages, cache first for CSS/JS/images
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and external API/CDNs that might fail
  if (event.request.method !== 'GET') return;

  // For same-origin requests or specific libraries
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Fetch in the background to update the cache (stale-while-revalidate style)
        fetch(event.request)
          .then(networkResponse => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {/* Ignore network errors offline */});
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(event.request)
        .then(networkResponse => {
          // If we got a valid response, cache it
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback if network fails and not in cache
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
    })
  );
});
