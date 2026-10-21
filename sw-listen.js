/* Excavationpro Listen — network-first HTML, cache static shell only */
const CACHE = 'excavationpro-listen-shell-v4';
const SHELL = [
  './manifest-listen.webmanifest',
  './ads.txt',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('huggingface.co') || url.pathname.includes('/stream/')) {
    return; // network only for audio
  }
  if (e.request.method !== 'GET') return;

  // HTML navigations: always prefer network so AdSense/consent updates deploy
  const isHTML =
    e.request.mode === 'navigate' ||
    (e.request.headers.get('accept') || '').includes('text/html') ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('/');

  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then((res) => res)
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // other same-origin: stale-while-revalidate light
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const net = fetch(e.request).then((res) => {
        if (res && res.ok && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return net || hit;
    })
  );
});
