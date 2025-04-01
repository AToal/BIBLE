const CACHE_NAME = 'BIBLE-cache-v040120250957';
const INITIAL_CACHE_FILES = [
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/manifest.json',
  '/media/BIBLE-192x192.png',
  '/media/BIBLE-512x512.png',
  '/data/BIBLE/BOOKS.json'
];

// Cache BIBLE BOOKS for chosen translation
function cacheAllBIBLEBOOKSForTranslation(translation) {
  return caches.open(CACHE_NAME).then(cache => {
    return fetch('/data/BIBLE/BOOKS.json')
      .then(response => response.json())
      .then(BOOKS => {
        // For each BOOK — Build URL using chosen translation
        const BOOKrequests = BOOKS.map(bookAbbrev => {
          const bookURL = `/data/BIBLE/${translation}/${bookAbbrev.replace(/\s+/g, '')}.json`;
          console.log(`Fetching BOOK: ${bookURL}`);

          return fetch(bookURL)
            .then(response => {
              if (response.ok) {
                console.log(`Caching BOOK [${translation}]: ${bookAbbrev}`);
                return cache.put(bookURL, response.clone());
              } else {
                console.error(`Failed to fetch [${translation}] ${bookAbbrev}: ${response.statusText}`);
              }
            })
            .catch(err => console.error(`Failed to cache [${translation}] ${bookAbbrev}:`, err));
        });

        return Promise.all(BOOKrequests);
      })
      .catch(err => console.error('Failed to fetch BOOKS.json during cache:', err));
  }).catch(err => console.error('Failed to open cache for BIBLE BOOKS:', err));
}

// Install event — Cache initial files & default translation
self.addEventListener('install', event => {
  console.log('Service worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache during install');
        return cache.addAll(INITIAL_CACHE_FILES);
      })
      .then(() => {
        // Cache default 'kjv' translation
        return cacheAllBIBLEBOOKSForTranslation('kjv');
      })
      .catch(err => console.error('Failed to cache initial files during install:', err))
  );
  self.skipWaiting();
});

// Activate event — Clean up old caches if exists
self.addEventListener('activate', event => {
  console.log('Service worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event — Serve cached files when available, network if not cached
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then(networkResponse => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            return networkResponse;
          });
      })
      .catch(() => {
        // If both cache & network fail
        console.warn('Offline: resource not in cache or network unavailable');
        return caches.match('/offline.html'); // Optionally serve fallback
      })
  );
});

// Message event — Handle requests to cache more translations
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_TRANSLATION') {
    const translation = event.data.translation;
    console.log(`Caching translation: ${translation}`);
    event.waitUntil(cacheAllBIBLEBOOKSForTranslation(translation));
  }
});
