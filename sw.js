const CACHE_NAME='safetymanager-pwa-v2';
const APP_SHELL=['/','/index.html','/manifest.json','/js/app.js','/js/supabase_config.js','/js/data.js','/js/utils.js','/js/pwa.js','/js/modules/progetti_corsisti_refinement.js','/assets/icons/safetymanager-192.svg','/assets/icons/safetymanager-192.png','/assets/icons/safetymanager-512.png','/assets/icons/safetymanager-maskable.svg'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{
    await Promise.allSettled(APP_SHELL.map(url=>cache.add(url)));
  }));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('safetymanager-pwa-')&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin || url.pathname.startsWith('/api/')) return;

  // Rete prima per HTML, JavaScript e manifest: gli aggiornamenti non restano bloccati nella cache.
  const freshFirst=req.mode==='navigate' || url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname.endsWith('.json');
  if(freshFirst){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(req);
        if(fresh.ok){
          const cache=await caches.open(CACHE_NAME);
          cache.put(req.mode==='navigate'?'/index.html':req,fresh.clone());
        }
        return fresh;
      }catch(_){
        return (await caches.match(req.mode==='navigate'?'/index.html':req)) || (req.mode==='navigate' ? await caches.match('/') : null) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(req);
    if(cached) return cached;
    try{
      const response=await fetch(req);
      if(response.ok){
        const cache=await caches.open(CACHE_NAME);
        cache.put(req,response.clone());
      }
      return response;
    }catch(_){return Response.error();}
  })());
});
