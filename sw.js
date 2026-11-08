// 離線快取:改版時把 VERSION 加一
// 2026-11-07:圖片放獨立的 IMG 快取(改版不清掉、快取優先,省流量又快);
// 頁面網路優先但 3 秒沒回應就先用快取(車上/訊號差時不會卡白畫面)
const VERSION = 'kq-enc-v32';
const IMG = 'kq-img-v1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== IMG).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const isImg = u => /\.(webp|png|svg|jpg|jpeg)$/i.test(u.pathname) && !u.pathname.includes('/icons/');
self.addEventListener('fetch', e => {
  // 只處理本站檔案;同步服務等跨網域請求直接放行
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (isImg(u)) {
    e.respondWith(caches.open(IMG).then(c => c.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  const net = fetch(e.request).then(r => { const cp = r.clone(); if (r.ok) caches.open(VERSION).then(c => c.put(e.request, cp)); return r; });
  const slow = new Promise(res => setTimeout(res, 3000)).then(() => caches.match(e.request, { ignoreSearch: true }));
  e.respondWith(Promise.race([net.catch(() => caches.match(e.request, { ignoreSearch: true })), slow.then(h => h || net)]).then(r => r || net));
});
