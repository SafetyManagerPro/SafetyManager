const CACHE_NAME = 'safetypro-v38';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/safety_env.js',
  './js/supabase_config.js',
  './js/data.js',
  './js/utils.js',
  './js/app.js',
  './icon-192.png',
  './icon-512.png',
  './logocna.png',
  './timbrocna.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL).catch(err => console.warn('Cache app shell parziale:', err)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isSameOrigin(request) {
  try { return new URL(request.url).origin === self.location.origin; }
  catch (e) { return false; }
}

function isDynamicOrSourceFile(url) {
  return url.pathname.endsWith('.html') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.includes('/modules/');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isSameOrigin(request)) {
    // CDN/Supabase: non forziamo cache PWA, così dati e librerie restano aggiornati.
    event.respondWith(fetch(request));
    return;
  }

  if (isDynamicOrSourceFile(url)) {
    // Network-first per evitare deploy bloccati da cache vecchia.
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first per asset statici locali.
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      return response;
    }))
  );
});
