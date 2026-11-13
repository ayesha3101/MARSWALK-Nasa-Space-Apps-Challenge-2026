// MARSWALK Service Worker — Offline-first cache strategy with Network-First for data
const CACHE_NAME = 'marswalk-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/data/mission_manifest.json',
  '/data/dem_gale_boxwork.json',
  '/data/dem_heightmap.png',
  '/data/data_provenance.json',
  '/data/layers/hirise_optical.jpg',
  '/data/layers/hillshade.png',
  '/data/layers/slope_map.png',
  '/data/layers/themis_thermal.png',
  '/data/layers/crism_mineral.png',
  '/data/layers/usgs_geology.png',
  '/data/layers/hazard_mask.png',
  '/data/pov/hab_site.jpg',
  '/data/pov/stop1_boxwork_ridge.jpg',
  '/data/pov/stop2_rover_drop.jpg',
  '/data/pov/stop3_hollow_floor.jpg',
  '/data/pov/stop4_sulfate_escarpment.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for HTML and JSON data payloads to ensure latest mission parameters
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for images and static assets, falling back to network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.destination === 'image') {
          return new Response('', { status: 404 });
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
