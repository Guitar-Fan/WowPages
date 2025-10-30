// VS Code Zero - Service Worker
// Enables offline functionality and PWA features

const CACHE_NAME = 'vscode-zero-v1.0.0';
const STATIC_CACHE_NAME = 'vscode-zero-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'vscode-zero-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/main.js',
    '/file-system.js',
    '/terminal.js',
    '/compiler.js',
    '/git-integration.js',
    '/manifest.json',
    '/resources/icon-192.png',
    '/resources/icon-512.png',
    '/resources/hero-bg.jpg',
    // External dependencies
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/loader.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/editor/editor.main.css',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/editor/editor.worker.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/language/json/json.worker.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/language/css/css.worker.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/language/html/html.worker.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/language/typescript/ts.worker.js',
    'https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js',
    'https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css',
    'https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js',
    'https://cdn.jsdelivr.net/npm/isomorphic-git@1.25.6/dist/umd/index.min.js'
];

// Dynamic content cache patterns
const DYNAMIC_CACHE_PATTERNS = [
    /^https:\/\/cdn\.jsdmirror\.com\//,
    /^https:\/\/cdn\..jsdelivr\.net\//,
    /^https:\/\/unpkg\.com\//,
    /^https:\/\/cdn\.staticfile\.org\//
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('📦 Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker: Static assets cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Service Worker: Failed to cache static assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content or fetch from network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests
    if (request.url.includes('/api/')) {
        // API requests - network first, cache fallback
        event.respondWith(networkFirstStrategy(request));
    } else if (isStaticAsset(request.url)) {
        // Static assets - cache first, network fallback
        event.respondWith(cacheFirstStrategy(request));
    } else if (shouldCacheDynamically(request.url)) {
        // Dynamic content - network first with cache
        event.respondWith(networkWithCacheStrategy(request));
    } else {
        // Default - stale while revalidate
        event.respondWith(staleWhileRevalidateStrategy(request));
    }
});

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
    try {
        const cache = await caches.open(STATIC_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('📦 Service Worker: Serving from cache:', request.url);
            return cachedResponse;
        }
        
        // If not in cache, fetch from network and cache
        console.log('🌐 Service Worker: Fetching from network:', request.url);
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ Service Worker: Cache-first strategy failed:', error);
        return new Response('Resource not available offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Network-first strategy for API requests
async function networkFirstStrategy(request) {
    try {
        console.log('🌐 Service Worker: Network first for API:', request.url);
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('📦 Service Worker: Falling back to cache for API:', request.url);
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return new Response('API not available offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Network with cache strategy for dynamic content
async function networkWithCacheStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Stale while revalidate strategy
async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Fetch from network in background
    const networkResponsePromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch((error) => {
            console.log('📦 Service Worker: Network failed, using cache:', request.url);
        });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Otherwise wait for network
    return networkResponsePromise;
}

// Helper functions
function isStaticAsset(url) {
    return STATIC_ASSETS.some(asset => url.includes(asset)) ||
           url.includes('.css') ||
           url.includes('.js') ||
           url.includes('.png') ||
           url.includes('.jpg') ||
           url.includes('.svg') ||
           url.includes('.woff') ||
           url.includes('.woff2');
}

function shouldCacheDynamically(url) {
    return DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

// Background sync for offline commits and operations
self.addEventListener('sync', (event) => {
    console.log('🔄 Service Worker: Background sync triggered:', event.tag);
    
    if (event.tag === 'git-sync') {
        event.waitUntil(handleGitSync());
    }
});

async function handleGitSync() {
    try {
        // This would handle offline Git operations
        // For now, just log that sync occurred
        console.log('🔄 Service Worker: Git sync completed');
    } catch (error) {
        console.error('❌ Service Worker: Git sync failed:', error);
    }
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('📢 Service Worker: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'VS Code Zero update available',
        icon: '/resources/icon-192.png',
        badge: '/resources/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        },
        actions: [
            {
                action: 'explore',
                title: 'Open VS Code Zero',
                icon: '/resources/icon-192.png'
            },
            {
                action: 'close',
                title: 'Close notification',
                icon: '/resources/icon-192.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('VS Code Zero', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Service Worker: Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    console.log('📨 Service Worker: Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(clearAllCaches());
    }
});

// Utility functions
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('🗑️ Service Worker: All caches cleared');
}

async function getCacheStats() {
    const cacheNames = await caches.keys();
    const stats = {};
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        stats[cacheName] = requests.length;
    }
    
    return stats;
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('🔄 Service Worker: Periodic sync triggered:', event.tag);
    
    if (event.tag === 'content-sync') {
        event.waitUntil(handlePeriodicSync());
    }
});

async function handlePeriodicSync() {
    try {
        // Update cached content periodically
        const cache = await caches.open(STATIC_CACHE_NAME);
        const requests = await cache.keys();
        
        // Update a few resources each time
        const toUpdate = requests.slice(0, 3);
        
        await Promise.all(
            toUpdate.map(async (request) => {
                try {
                    const response = await fetch(request);
                    if (response.ok) {
                        await cache.put(request, response);
                        console.log('🔄 Service Worker: Updated cache for', request.url);
                    }
                } catch (error) {
                    console.warn('⚠️ Service Worker: Failed to update', request.url, error);
                }
            })
        );
    } catch (error) {
        console.error('❌ Service Worker: Periodic sync failed:', error);
    }
}

// Error handling
self.addEventListener('error', (event) => {
    console.error('💥 Service Worker: Error occurred:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('💥 Service Worker: Unhandled promise rejection:', event.reason);
});

console.log('🔧 Service Worker: Script loaded');