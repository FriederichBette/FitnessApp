const CACHE_NAME = 'weyland-v21';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js'
];

self.addEventListener('install', (e) => {
    // Force new service worker to take over immediately
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (e) => {
    // Clean up old caches (v1, etc.)
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    // Take control of all open tabs immediately
    return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Network-First strategy for critical files (optional) or keep Cache-First but with versioning
    // For now, keeping Cache-First but relying on version bump to update.
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
