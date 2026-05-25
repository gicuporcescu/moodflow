const CACHE_NAME = 'moodflow-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

// Required for Chrome PWA installability criteria.
// Strategy: network-first passthrough (no offline caching yet).
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => Response.error()))
})
