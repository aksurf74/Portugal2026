const CACHE='portugal2026-v5-rc4';
const CORE=['./','./index.html','./css/app.css','./js/app.js','./js/map.js','./manifest.json',
'./icons/icon-192.png','./icons/icon-512.png','./icons/icon-180.png','./icons/favicon.png',
'./data/meta.json','./data/home.json','./data/accommodations.json','./data/restaurants.json','./data/chapters.json','./data/days.json',
'./data/locations.json','./data/maps.json','./data/search-index.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;e.respondWith(caches.match(r).then(h=>h||fetch(r).then(res=>{const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c)).catch(()=>{});return res;}).catch(()=>h)));});
