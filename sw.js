const CACHE_NAME = 'runfield-v1';
const urlsToCache = [
  // Desktop version
  '/runfield/index.html',
  '/runfield/mt.js',
  '/runfield/audio.js',
  '/runfield/Runfield.png',
  '/runfield/instructions.png',
  '/runfield/bg.jpg',
  '/runfield/leaves_left.png',
  '/runfield/leaves_right.png',
  '/runfield/icons/icon-192.png',
  '/runfield/icons/icon-512.png',
  // Field theme
  '/runfield/field/run_frames.png',
  '/runfield/field/boost_frames.png',
  '/runfield/field/shadow.png',
  '/runfield/field/sky.png',
  '/runfield/field/background.png',
  '/runfield/field/horizon.png',
  '/runfield/field/path.png',
  '/runfield/field/foreground.png',
  // Snow theme
  '/runfield/snow/run_frames.png',
  '/runfield/snow/boost_frames.png',
  '/runfield/snow/shadow.png',
  '/runfield/snow/sky.png',
  '/runfield/snow/background.png',
  '/runfield/snow/horizon.png',
  '/runfield/snow/path.png',
  '/runfield/snow/foreground.png',
  // Audio files (ogg)
  '/runfield/delaa.ogg',
  '/runfield/hyppy.ogg',
  '/runfield/hyppy2.ogg',
  '/runfield/hyppy3.ogg',
  '/runfield/lasku2.ogg',
  '/runfield/musa.ogg',
  '/runfield/snoicboom.ogg',
  '/runfield/turbo3_2.ogg',
  // Audio files (mp3)
  '/runfield/delaa.ogg.mp3',
  '/runfield/hyppy.ogg.mp3',
  '/runfield/hyppy2.ogg.mp3',
  '/runfield/hyppy3.ogg.mp3',
  '/runfield/lasku2.ogg.mp3',
  '/runfield/musa.ogg.mp3',
  '/runfield/snoicboom.ogg.mp3',
  '/runfield/turbo3_2.ogg.mp3',
  // Mobile version
  '/runfield-mobile/index.html',
  '/runfield-mobile/mt.js',
  '/runfield-mobile/audio.js',
  '/runfield-mobile/Runfield.png',
  '/runfield-mobile/instructions.png',
  '/runfield-mobile/bg_forest_field.png',
  '/runfield-mobile/boost_frames.png',
  '/runfield-mobile/fg_field.png',
  '/runfield-mobile/fg_field_front.png',
  '/runfield-mobile/run_frames.png',
  '/runfield-mobile/shadow.png',
  '/runfield-mobile/sky.png'
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
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the new resource
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Return a custom offline page or message if needed
          return new Response('Offline - resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});
