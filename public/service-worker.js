const CACHE_NAME = 'BIBLE-cache-v3';
const INITIAL_CACHE_FILES = [
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/media/BIBLE-192x192.png',
  '/media/BIBLE-512x512.png',
  '/data/BIBLE/BOOKS.json'
];

// Function to cache all Bible books during install (for offline support)
function cacheAllBibleBooks() {
  return caches.open(CACHE_NAME).then(cache => {
    return fetch('/data/BIBLE/BOOKS.json')
      .then(response => response.json())
      .then(books => {
        const bookRequests = books.map(bookAbbrev => {
          const bookUrl = `/data/BIBLE/kjv/${bookAbbrev.replace(/\s+/g, '')}.json`;
          console.log(`Fetching book: ${bookUrl}`);  // Log the URL being fetched
          return fetch(bookUrl)
            .then(response => {
              if (response.ok) {
                console.log(`Caching book: ${bookAbbrev}`); // Log the BOOK
                return cache.put(bookUrl, response.clone());
              } else {
                console.error(`Failed to fetch ${bookAbbrev}: ${response.statusText}`); // Log fail
              }
            })
            .catch(err => console.error(`Failed to cache ${bookAbbrev}:`, err));
        });
        return Promise.all(bookRequests);
      })
      .catch(err => console.error('Failed to fetch BOOKS.json during cache:', err));
  }).catch(err => console.error('Failed to open cache for Bible books:', err));
}

// Install event: Cache initial files and all Bible books
self.addEventListener('install', event => {
  console.log('Service worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache during install');
        return cache.addAll(INITIAL_CACHE_FILES);
      })
      .then(() => {
        return cacheAllBibleBooks();  // Cache all Bible books
      })
      .catch(err => console.error('Failed to cache initial files during install:', err))
  );
  self.skipWaiting();  // Force the service worker to activate immediately
});

// Activate event: Clean up old caches if any exist
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
    }).then(() => self.clients.claim())  // Take control of uncontrolled clients
  );
});

// Fetch event: Serve cached files when available, and fall back to network if not cached
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // If the resource is found in cache, return it
        if (cachedResponse) {
          return cachedResponse;
        }

        // If the resource is not found in cache, try fetching it from the network
        return fetch(event.request)
          .then(networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the network response before caching it
            const responseToCache = networkResponse.clone();

            // Open the cache and store the fetched resource
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            // Return the network response
            return networkResponse;
          });
      })
      .catch(() => {
        // If both the cache and network fail, handle the offline case
        console.warn('Offline: resource not available in cache or network');
        return caches.match('/offline.html');  // Optionally serve an offline fallback page
      })
  );
});

