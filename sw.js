const CACHE_NAME = 'runfield-v24';
const urlsToCache = [
  // Desktop version
  './index.html',
  './manifest.json',
  './Runfield.avif',
  './instructions.avif',
  './bg.avif',
  './leaves_left_2x.avif',
  './leaves_right_2x.avif',
  './icons/icon-192-2.png',
  './icons/icon-512-2.png',
  // Field theme
  './field/run_frames.avif',
  './field/boost_frames.avif',
  './field/shadow.avif',
  './field/sky.avif',
  './field/background.avif',
  './field/horizon.avif',
  './field/path.avif',
  './field/foreground.avif',
  // Snow theme
  './snow/run_frames.avif',
  './snow/boost_frames.avif',
  './snow/shadow.avif',
  './snow/sky.avif',
  './snow/background.avif',
  './snow/horizon.avif',
  './snow/path.avif',
  './snow/foreground.avif',
  // Audio files (mp3)
  './delaa.ogg.mp3',
  './hyppy.ogg.mp3',
  './hyppy2.ogg.mp3',
  './hyppy3.ogg.mp3',
  './lasku2.ogg.mp3',
  './musa.ogg.mp3',
  './snoicboom.ogg.mp3',
  './turbo3_2.ogg.mp3',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache resources one by one to avoid failing if one resource is missing
        return Promise.allSettled(
          urlsToCache.map(url =>
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return Promise.resolve();
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200) {
            return response;
          }

          // Only cache successful responses (but allow opaque responses for CORS)
          if (response.type === 'basic' || response.type === 'cors') {
            // Clone the response
            const responseToCache = response.clone();

            // Cache the new resource
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }

          return response;
        }).catch(() => {
          // Provide context-specific offline fallbacks
          if (event.request.destination === 'document') {
            // For HTML requests, try to return cached index page
            return caches.match('./index.html').then(cachedResponse => {
              return cachedResponse || new Response('Offline - Please visit while online first', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
          }
          // For other resources, just indicate offline
          return new Response('', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});
