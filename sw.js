// Service Worker de Mundo Fútbol: permite jugar sin conexión.
// Sube la versión del caché cada vez que cambies archivos del juego.
const CACHE = "mundo-futbol-v16";
const ARCHIVOS = [
    ".",
    "index.html",
    "style.css",
    "data.js",
    "script.js",
    "manifest.json",
    "icon-192.png",
    "icon-512.png"
];

self.addEventListener("install", (e) => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
    self.skipWaiting();
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Red primero y actualiza el caché; si no hay conexión, sirve del caché.
self.addEventListener("fetch", (e) => {
    if (e.request.method !== "GET") return;
    e.respondWith(
        fetch(e.request)
            .then(resp => {
                const copia = resp.clone();
                caches.open(CACHE).then(c => c.put(e.request, copia));
                return resp;
            })
            .catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
});
