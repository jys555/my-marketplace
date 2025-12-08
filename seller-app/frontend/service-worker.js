// Service Worker for Seller App
// Version: 3.0.0 - Updated catalog table design

const CACHE_NAME = 'seller-app-v3.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/catalog.html',
    '/orders.html',
    '/inventory.html',
    '/inventory-purchase.html',
    '/style.css',
    '/api.js',
    '/app.js',
    '/catalog.js',
    '/orders.js',
    '/inventory.js',
    '/inventory-purchase.js',
    '/ui.js',
    '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing new version:', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('[Service Worker] Cache failed:', error);
            })
    );
    // Skip waiting - yangi versiya darhol aktiv bo'ladi
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating new version:', CACHE_NAME);
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            console.log('[Service Worker] Found caches:', cacheNames);
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Claiming clients...');
            // Force update all clients immediately
            return self.clients.claim();
        }).then(() => {
            console.log('[Service Worker] Notifying clients about update...');
            // Send message to all clients to reload
            return self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
                console.log('[Service Worker] Found', clients.length, 'clients');
                clients.forEach(client => {
                    console.log('[Service Worker] Sending update message to client');
                    client.postMessage({ 
                        type: 'SW_UPDATED', 
                        cacheName: CACHE_NAME,
                        message: 'New version available, reloading...'
                    });
                });
            });
        })
    );
});

// Fetch event - Network first, then cache (for better updates)
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip API requests (always fetch from network)
    if (event.request.url.includes('/api/')) {
        return;
    }

    // For HTML files, always fetch from network first
    if (event.request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache the new version
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(event.request);
                })
        );
        return;
    }

    // For other resources, try network first, then cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Don't cache if not a valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                // Fallback to cache if network fails
                return caches.match(event.request);
            })
    );
});

// Message event - handle messages from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

