/**
 * ============================================
 * 🛠️ SERVICE WORKER
 * ============================================
 * Cache-first strategy for static assets
 * Network-first for API calls
 * Stale-while-revalidate for track data
 */

const CACHE_NAME = 'dj1-tags-v1';
const STATIC_CACHE = 'static-v1';
const API_CACHE = 'api-v1';
const TRACKS_CACHE = 'tracks-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index-tags-design.html',
    '/player-styles.css',
    '/utils.js',
    '/store.js',
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// API endpoints
const API_BASE = 'https://api.dj1.ru/api';
const SUPABASE_URL = 'https://nwdalhrbifkjyyhpstnt.supabase.co';

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('📦 Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Static assets cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Failed to cache static assets:', error);
            })
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('⚡ Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (![STATIC_CACHE, API_CACHE, TRACKS_CACHE].includes(cacheName)) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker ready');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache with fallback strategies
self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    
    // Static assets - cache first
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(event.request));
        return;
    }
    
    // Supabase API - network first with cache fallback
    if (url.includes(SUPABASE_URL)) {
        event.respondWith(networkFirst(event.request, API_CACHE));
        return;
    }
    
    // Track API - stale while revalidate
    if (url.includes(API_BASE)) {
        event.respondWith(staleWhileRevalidate(event.request, TRACKS_CACHE));
        return;
    }
    
    // Default - network first
    event.respondWith(networkFirst(event.request, 'default-cache'));
});

// Cache-first strategy
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        console.log('💾 Cache hit:', request.url);
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ Fetch failed:', request.url, error);
        return new Response('Offline', { status: 503 });
    }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('🌐 Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            console.log('💾 Serving from cache:', request.url);
            return cachedResponse;
        }
        
        return new Response('Offline', { status: 503 });
    }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch((error) => {
        console.log('🌐 Background fetch failed:', error.message);
        return null;
    });
    
    return cachedResponse || fetchPromise;
}

// Helper: Check if URL is static asset
function isStaticAsset(url) {
    return (
        url.endsWith('.css') ||
        url.endsWith('.js') ||
        url.endsWith('.svg') ||
        url.endsWith('.png') ||
        url.endsWith('.jpg') ||
        url.endsWith('.jpeg') ||
        url.includes('fonts.googleapis.com') ||
        url.includes('cdnjs.cloudflare.com')
    );
}
