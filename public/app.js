// Global variables to hold BOOK data and current BOOK/CHAPTER
let bibleBooks = [];
let currentBookIndex = 0;
let currentChapterIndex = 0;

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
    verseElement.innerHTML = `<span style="color:red;">${verse.verse}</span> ${verse.text}`;
    contentElement.appendChild(verseElement);
  });
}

// Save the last visited BOOK and CHAPTER to localStorage
function saveLastVisited(bookIndex, chapterIndex) {
  localStorage.setItem('lastVisitedBook', bookIndex);
  localStorage.setItem('lastVisitedChapter', chapterIndex);
}

// Initialize the app when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', loadBooksList);


