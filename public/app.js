// Global variables to hold BOOK data and current BOOK/CHAPTER
let bibleBooks = [];
let currentBookIndex = 0;
let currentChapterIndex = 0;
let cachedBooks = new Set();  // Track which books have been cached

// Function to generate buttons for each BOOK in the #books-list section
function generateBooksList() {
  const booksListDiv = document.getElementById('books-list');

  // Clear any existing content in the books list
  booksListDiv.innerHTML = '';

  // Loop through all the books and create a button for each
  bibleBooks.forEach((bookAbbrev, index) => {
    const button = document.createElement('button');
    button.innerText = bibleBooks[index];  // Use the book's abbreviation or name

    // Add an event listener to load a random chapter when the book is selected
    button.addEventListener('click', () => {
      loadRandomChapterInBook(index);  // Load a random chapter from the selected book
    });

    // Append the button to the books list
    booksListDiv.appendChild(button);
  });
}

// Function to load BOOKS list from BOOKS.json
function loadBooksList() {
  fetch('/data/BIBLE/BOOKS.json')
    .then(response => response.json())
    .then(books => {
      bibleBooks = books;
      generateBooksList();  // Generate buttons for each book after loading the list
      checkPreviousSession();  // Check if there's a last read BOOK stored
    })
    .catch(err => console.error('Failed to load BOOK list:', err));
}

// Check for last session or load random BOOK
function checkPreviousSession() {
  const lastVisitedBook = localStorage.getItem('lastVisitedBook');
  const lastVisitedChapter = localStorage.getItem('lastVisitedChapter');

  if (lastVisitedBook !== null && lastVisitedChapter !== null) {
    // Load the last visited BOOK and CHAPTER
    currentBookIndex = parseInt(lastVisitedBook);
    currentChapterIndex = parseInt(lastVisitedChapter);
    loadBook(currentBookIndex, currentChapterIndex);
  } else {
    // Load a random BOOK if no previous session
    loadRandomBook();
  }
}

// Load a random BOOK
function loadRandomBook() {
  currentBookIndex = Math.floor(Math.random() * bibleBooks.length);
  loadRandomChapterInBook(currentBookIndex);  // Load a random chapter from the random book
}

// Function to load a random chapter in a specific book
function loadRandomChapterInBook(bookIndex) {
  let bookAbbrev = bibleBooks[bookIndex];  // Get the abbreviation or name

  // Remove spaces from the book name to match the filename
  bookAbbrev = bookAbbrev.replace(/\s+/g, '');

  // Fetch the JSON data for the selected BOOK
  fetch(`/data/BIBLE/kjv/${bookAbbrev}.json`)
    .then(response => response.json())
    .then(bookData => {
      // Generate a random chapter index within the range of available chapters
      const randomChapterIndex = Math.floor(Math.random() * bookData.chapters.length);

      // Display the random chapter
      loadBook(bookIndex, randomChapterIndex);
    })
    .catch(err => console.error('Failed to load BOOK data:', err));
}

// Function to load a BOOK by index and display its CHAPTERS
function loadBook(bookIndex, chapterIndex) {
  let bookAbbrev = bibleBooks[bookIndex];  // Get the abbreviation or name

  // Remove spaces from the book name to match the filename
  bookAbbrev = bookAbbrev.replace(/\s+/g, '');

  // Fetch the JSON data for the selected BOOK
  fetch(`/data/BIBLE/kjv/${bookAbbrev}.json`)
    .then(response => response.json())
    .then(bookData => {
      displayBook(bookData, chapterIndex);
      saveLastVisited(bookIndex, chapterIndex);  // Save the BOOK and CHAPTER as the last visited

      cacheBookInServiceWorker(bookAbbrev);  // Cache the loaded book using the service worker
      startProgressiveCaching();  // Start background caching of additional books
    })
    .catch(err => console.error('Failed to load BOOK data:', err));
}

// Display the BOOK and CHAPTER on the page
function displayBook(bookData, chapterIndex) {
  const bookTitleElement = document.getElementById('book-title');
  const contentElement = document.getElementById('content');

  // Update the BOOK title in the header
  bookTitleElement.textContent = `${bookData.book} ${chapterIndex + 1}`;

  // Clear previous content
  contentElement.innerHTML = '';

  // Display the verses for the current CHAPTER
  const chapter = bookData.chapters[chapterIndex];
  chapter.verses.forEach(verse => {
    const verseElement = document.createElement('p');
    verseElement.textContent = `${verse.verse} ${verse.text}`;
    contentElement.appendChild(verseElement);
  });
}

// Save the last visited BOOK and CHAPTER to localStorage
function saveLastVisited(bookIndex, chapterIndex) {
  localStorage.setItem('lastVisitedBook', bookIndex);
  localStorage.setItem('lastVisitedChapter', chapterIndex);
}

// Function to communicate with the service worker to cache a specific BOOK
function cacheBookInServiceWorker(bookAbbrev) {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_BOOK',
      bookAbbrev: bookAbbrev  // Send the abbreviation of the book to cache
    });
  } else {
    console.warn('Service worker is not available for caching.');
  }
}

// Function to start progressive caching based on network conditions
function startProgressiveCaching() {
  // Check network connection type using the Network Information API
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const networkSpeed = connection ? connection.effectiveType : 'unknown';

  if (networkSpeed === '4g' || networkSpeed === 'wifi') {
    // For strong networks, begin caching additional books gradually
    cacheBooksInBackground();
  } else {
    console.log('Slower connection detected, caching will be minimal');
  }
}

// Function to progressively cache books in the background
function cacheBooksInBackground() {
  let index = currentBookIndex + 1;  // Start caching from the next book

  function cacheNextBook() {
    if (index < bibleBooks.length) {
      const nextBookAbbrev = bibleBooks[index];
      if (!cachedBooks.has(nextBookAbbrev)) {
        cacheBookInServiceWorker(nextBookAbbrev);  // Cache the next book via service worker
        cachedBooks.add(nextBookAbbrev);  // Mark this book as cached
        console.log(`Progressively cached: ${nextBookAbbrev}`);
      }

      // Set a timeout to continue caching after some delay (e.g., 5 seconds)
      setTimeout(cacheNextBook, 5000);  // Adjust delay based on performance needs
      index++;
    }
  }

  // Start caching the next book
  cacheNextBook();
}

// Initialize the app when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', loadBooksList);

