/* Service worker : permet l'usage hors connexion.
   Ne stocke QUE les fichiers de l'application, jamais tes données
   (elles restent dans le localStorage). Incrémente VERSION à chaque mise à jour. */
const VERSION = 'leveling-v16';
const Q = '?v=16'; // doit correspondre aux ?v= de index.html
const FILES = ['./', 'index.html', 'css/style.css' + Q, 'js/questions.js' + Q, 'js/quests.js' + Q, 'js/persona.js' + Q, 'js/bosses.js' + Q, 'js/achievements.js' + Q, 'js/sound.js' + Q, 'js/app.js' + Q,
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Réseau d'abord, en revalidant toujours auprès du serveur (cache: 'no-cache')
// pour ne jamais servir une ancienne version ; cache local seulement hors connexion.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }).then((r) => {
      if (!r.ok) return r;
      const copy = r.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then((m) => m || caches.match('index.html')))
  );
});
