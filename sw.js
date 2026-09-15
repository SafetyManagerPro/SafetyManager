const CACHE_NAME='safetymanager-pwa-v1';
const APP_SHELL=['/','/index.html','/manifest.json','/js/app.js','/js/supabase_config.js','/js/data.js','/js/utils.js','/assets/icons/safetymanager-192.svg','/assets/icons/safetymanager-512.svg','/assets/icons/safetymanager-maskable.svg'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).catch(()=>null));
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
  if(url.origin!==self.location.origin) return;
  if(url.pathname.startsWith('/api/')) return;

  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(req);
        const cache=await caches.open(CACHE_NAME);
        cache.put('/index.html',fresh.clone());
        return fresh;
      }catch(_){
        return (await caches.match('/index.html')) || (await caches.match('/')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(req);
    const network=fetch(req).then(async response=>{
      if(response && response.ok){
        const cache=await caches.open(CACHE_NAME);
        cache.put(req,response.clone());
      }
      return response;
    }).catch(()=>null);
    return cached || await network || Response.error();
  })());
});
