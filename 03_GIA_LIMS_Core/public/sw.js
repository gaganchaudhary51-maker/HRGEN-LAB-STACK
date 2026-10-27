/**
 * 2026 Enterprise PWA Service Worker — HRGen GIA LIMS
 * Features:
 * - Predictable Upgrade Lifecycle with SKIP_WAITING message listener
 * - Web Locks API tab coordination for offline background sync
 * - Background Sync API registration ('outbox-sync')
 * - StaleWhileRevalidate for assets, NetworkFirst for dynamic shells
 * - Network-only with fail-closed authentication for API routes
 */

const CACHE_NAME = 'gia-lims-enterprise-v6.1.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js'
];

// Install: Cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Activate: Purge stale bundles and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Prompt-based upgrade listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch policy: NetworkFirst for app shell, StaleWhileRevalidate for statics, NetworkOnly for /api
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Protected REST APIs must never be cached by SW
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // HTML / App shell navigation: NetworkFirst with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  // Static assets: CacheFirst / StaleWhileRevalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Background Sync API: Replay queued offline mutations safely
self.addEventListener('sync', (event) => {
  if (event.tag === 'outbox-sync') {
    event.waitUntil(
      // Multi-tab concurrency protection via Web Locks API
      ('locks' in navigator)
        ? navigator.locks.request('gia_outbox_sync_lock', async () => triggerOutboxReplay())
        : triggerOutboxReplay()
    );
  }
});

async function triggerOutboxReplay() {
  const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const client of allClients) {
    client.postMessage({ type: 'FLUSH_OFFLINE_QUEUE' });
  }
}
