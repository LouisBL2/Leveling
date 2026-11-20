/* Service worker : permet l'usage hors connexion.
   Ne stocke QUE les fichiers de l'application, jamais tes données
   (elles restent dans le localStorage). Incrémente VERSION à chaque mise à jour. */
const VERSION = 'leveling-v5';
const FILES = ['./', 'index.html', 'css/style.css', 'js/questions.js', 'js/quests.js', 'js/persona.js', 'js/bosses.js', 'js/app.js',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Réseau d'abord (pour recevoir les mises à jour), cache en secours hors connexion.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((r) => {
      const copy = r.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then((m) => m || caches.match('index.html')))
  );
});
