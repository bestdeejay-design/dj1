const CACHE_NAME = 'dj1-v2';
const STATIC_CACHE = 'static-v2';
const API_CACHE = 'api-v2';
const TRACKS_CACHE = 'tracks-v2';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/rays.css',
    '/rays.js',
    '/favicon.svg',
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js'
];

const API_BASE = 'https://api.dj1.ru/api';
const USER_ID = '28d5e3f7-9c38-4b5f-b875-94a776bcc90a';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== STATIC_CACHE && key !== API_CACHE && key !== TRACKS_CACHE)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(event.request));
        return;
    }

    if (url.includes(API_BASE) || url.includes('api.dj1.ru')) {
        event.respondWith(networkFirst(event.request, API_CACHE));
        return;
    }

    event.respondWith(networkFirst(event.request, 'default-cache'));
});

function isStaticAsset(url) {
    return STATIC_ASSETS.some((asset) => url === asset || url.endsWith(asset));
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    return cached || fetch(request);
}

async function networkFirst(request, cacheName) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw err;
    }
}
