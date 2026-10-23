/* Service worker da Penseira.
   Online: sempre busca a versão mais nova (e ignora o cache HTTP do GitHub Pages, que dura 10 min).
   Offline: usa a última cópia guardada. Assim, um deploy aparece na hora, e o app continua funcionando sem internet. */
const CACHE = 'penseira-v7';
const ASSETS = ['./', './index.html', './penseira.css', './app.js', './art.js', './magic.js', './manifest.webmanifest',
  './fonts/inter-latin-wght-normal.woff2', './fonts/cormorant-garamond-latin-wght-normal.woff2', './fonts/cormorant-garamond-latin-wght-italic.woff2',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ASSETS.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    } catch (err) {
      return (await caches.match(req, { ignoreSearch: true })) || (await caches.match('./index.html'));
    }
  })());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow('./');
  }));
});
