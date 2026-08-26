/* Portugal 2026 — Service Worker (Offline-Cache) */
const CACHE = 'portugal2026-v2';
const ASSETS = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './js/map.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  './icons/favicon.png',
  './data/meta.json',
  './data/chapters.json',
  './data/days.json',
  './data/locations.json',
  './data/maps.json',
  './data/search-index.json'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

/* cache-first, mit Netz-Fallback und Nachladen in den Cache (für Bilder späterer Builds) */
self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method!=='GET') return;
  e.respondWith(
    caches.match(req).then(hit=>{
      if(hit) return hit;
      return fetch(req).then(res=>{
        const copy = res.clone();
        caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
        return res;
      }).catch(()=>hit);
    })
  );
});
