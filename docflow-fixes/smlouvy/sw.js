/* DocFlow Service Worker v7 */
const CACHE_NAME = 'docflow-cache-v7';
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './icon.svg',
  './favicon.png',
  './icon-192.png',
  './icon-512.png',
  './qrcode.min.js',
];

// ── INSTALL ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(e => {
        console.warn('SW: Some assets failed to cache:', e);
      });
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH: Cache-first for static, network-first for Firebase ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET, cross-origin API calls (Firebase, Google, etc.)
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin &&
      !url.hostname.includes('fonts.googleapis.com') &&
      !url.hostname.includes('fonts.gstatic.com')) {
    return;
  }

  // For our app assets: cache-first
  if (url.origin === self.location.origin ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          // Offline fallback: return cached index.html
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
    );
  }
});

// ── BACKGROUND SYNC: Daily renewal check notification ──
self.addEventListener('sync', event => {
  if (event.tag === 'renewal-check') {
    event.waitUntil(doRenewalCheck());
  }
});

// ── PERIODIC BACKGROUND SYNC (if supported) ──
self.addEventListener('periodicsync', event => {
  if (event.tag === 'daily-renewal-check') {
    event.waitUntil(doRenewalCheck());
  }
});

async function doRenewalCheck() {
  try {
    // Get contracts from all clients via message
    const clients = await self.clients.matchAll({ type: 'window' });
    if (clients.length > 0) {
      clients[0].postMessage({ type: 'SW_RENEWAL_CHECK' });
      return;
    }

    // No open clients - check if we should show notification
    const now = new Date();
    const hour = now.getHours();
    if (hour < 8 || hour > 10) return; // Only notify around 9 AM

    // Read contracts from cache (if we stored them)
    const cache = await caches.open(CACHE_NAME);
    const contractsResponse = await cache.match('./contracts-data');
    if (!contractsResponse) return;

    const data = await contractsResponse.json();
    const contracts = data.list || [];

    const soon = contracts.filter(c => {
      if (!c.renewal) return false;
      const d = Math.round((new Date(c.renewal) - now) / 86400000);
      return d >= 0 && d <= 7;
    });

    if (soon.length > 0) {
      const names = soon.slice(0, 3).map(c => c.name).join(', ');
      await self.registration.showNotification('DocFlow', {
        body: `${soon.length} smlouv se obnovuje za 7 dní: ${names}`,
        icon: './icon.svg',
        badge: './icon.svg',
        tag: 'renewal-alert',
        renotify: true,
        data: { url: './index.html' }
      });
    }
  } catch (e) {
    console.warn('SW renewal check failed:', e);
  }
}

// ── NOTIFICATION CLICK ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || './index.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.host) || c.url.includes('index.html'));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});

// ── MESSAGE from app ──
self.addEventListener('message', event => {
  if (event.data?.type === 'STORE_CONTRACTS') {
    // Store contracts data for background check
    caches.open(CACHE_NAME).then(cache => {
      const response = new Response(JSON.stringify(event.data.payload), {
        headers: { 'Content-Type': 'application/json' }
      });
      cache.put('./contracts-data', response);
    });
  }
});
