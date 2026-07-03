const CACHE_NAME = 'safetypwa-v1';

self.addEventListener('install', (event) => {
    // Il Service worker si installa (bypassiamo la cache per i file in cloud/supabase)
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    // Permette alla WebApp di funzionare offline per la struttura base, ma ricarica i dati dinamici
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
