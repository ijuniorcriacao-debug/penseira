/* Service worker da Penseira.
   - Online: busca sempre a versão mais nova (ignora o cache HTTP do GitHub Pages, que dura 10 min).
   - Offline: usa a última cópia guardada.
   - Versão nova: espera a pessoa tocar em "Atualizar" no aviso do app (mensagem SKIP_WAITING).
   - Push: mostra notificações enviadas por um servidor, mesmo com o app fechado. */
const VERSION = '1.3.2';               // mantenha igual ao APP_VERSION do app.js
const CACHE = 'penseira-' + VERSION;
const ASSETS = ['./', './index.html', './penseira.css', './app.js', './frases.js', './art.js', './magic.js', './manifest.webmanifest',
  './fonts/inter-latin-wght-normal.woff2', './fonts/cormorant-garamond-latin-wght-normal.woff2', './fonts/cormorant-garamond-latin-wght-italic.woff2',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ASSETS.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });

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

/* notificação enviada por servidor: { title, body, tag, url } */
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Penseira', {
    body: d.body || '', tag: d.tag || 'penseira', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: d.url || './' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow(url);
  }));
});
