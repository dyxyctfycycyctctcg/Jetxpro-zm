const CACHE_NAME = 'swiftcrash-shell-v4';
const APP_SHELL = [
  './index.html',
  './Menu.html',
  './Wallet.html',
  './predictor.html',
  './manifest.json',
  './pwa-icon.svg',
  './pwa-icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(
        APP_SHELL.map(asset =>
          fetch(asset, { cache: 'no-cache' })
            .then(response => response.ok ? cache.put(asset, response) : null)
            .catch(() => null)
        )
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Never cache API requests, POST requests, or third-party services.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api')) {
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const networkRequest = fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return cached;
      });

      return cached || networkRequest;
    })
  );
});