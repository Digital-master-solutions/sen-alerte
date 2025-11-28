// Service Worker pour le cache des tuiles de carte
const CACHE_NAME = 'map-tiles-cache-v1';
const TILE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes

// Patterns de tuiles à mettre en cache
const TILE_PATTERNS = [
  /\.tile\.openstreetmap\.org/,
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('map-tiles-cache-') && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Vérifier si c'est une requête de tuile de carte
  const isTileRequest = TILE_PATTERNS.some(pattern => pattern.test(request.url));
  
  if (!isTileRequest) {
    return; // Laisser passer les autres requêtes normalement
  }

  event.respondWith(
    fetch(request).then((response) => {
      // Mettre en cache uniquement si la réponse est valide
      if (response.ok) {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, response.clone());
        });
      }
      return response;
    }).catch(() => {
      // En cas d'échec réseau, utiliser le cache
      return caches.match(request);
    })
  );
});

// Nettoyage périodique du cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        const requests = await cache.keys();
        const now = Date.now();
        
        return Promise.all(
          requests.map(async (request) => {
            const response = await cache.match(request);
            if (response) {
              const dateHeader = response.headers.get('sw-cache-date');
              if (dateHeader) {
                const cacheDate = new Date(dateHeader).getTime();
                if (now - cacheDate >= TILE_CACHE_DURATION) {
                  return cache.delete(request);
                }
              }
            }
          })
        );
      })
    );
  }
});
