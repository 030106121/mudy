/* 앱 껍데기를 저장해 와이파이가 불안정해도 화면이 열리게 함. 실시간 데이터는 네트워크로. */
const CACHE = 'mudy-v1';
const FILES = ['./','./index.html','./band.html','./sync.js','./vendor/firebase-app-compat.js','./vendor/firebase-database-compat.js',
  './manifest.json','./band.webmanifest','./icon-192.png','./icon-512.png','./band-192.png','./band-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
