const CACHE_NAME = 'BIBLE-cache-v1';
const INITIAL_CACHE_FILES = [
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/data/BIBLE/BOOKS.json'
];

// Function to cache a specific BOOK
function cacheBook(bookAbbrev) {
  const bookUrl = `/data/BIBLE/kjv/${bookAbbrev}.json`;
  return caches.open(CACHE_NAME).then(cache => {
    return fetch(bookUrl).then(response => {
      if (response.ok) {
        cache.put(bookUrl, response.clone());
        console.log(`Cached ${bookAbbrev}`);
      }
      return response;
    });
  }).catch(err => console.error(`Failed to cache ${bookAbbrev}:`, err));
}

// Install event: Cache the necessary files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache during install');
        return cache.addAll(INITIAL_CACHE_FILES);
      })
      .catch(err => console.error('Failed to cache initial files on install:', err))
  );
});

// Activate event: Clean up old caches if any exist
self.addEventListener('activate', event => {
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
    })
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

// Message event: Handle requests from app.js to progressively cache books
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_BOOK') {
    const bookAbbrev = event.data.bookAbbrev;
    cacheBook(bookAbbrev);
  }
});

