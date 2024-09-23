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
          return fetch(bookUrl)
            .then(response => {
              if (response.ok) {
                return cache.put(bookUrl, response.clone());
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
      .then(response => {
        // Return cached file if found, otherwise fetch from network
        return response || fetch(event.request);
      })
      .catch(err => console.error('Fetch failed:', err))
  );
});


