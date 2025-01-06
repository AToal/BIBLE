// Global variables to hold BOOK data and current BOOK/CHAPTER
let BIBLEBOOKS = [];
let currentBOOKindex = 0;
let currentCHAPTERindex = 0;
let currentTranslation = 'kjv'; // Default translation

// Function to generate buttons for each BOOK in the #BIBLEBOOKS section
function generateBIBLEBOOKS() {
  const BIBLEBOOKSelement = document.getElementById('BIBLEBOOKS');

  // Clear any existing CHAPTERVERSES in the BOOKS list
  BIBLEBOOKSelement.innerHTML = '';

  // Loop through all the BOOKS and create a button for each
  BIBLEBOOKS.forEach((BOOKabbrev, index) => {
    const button = document.createElement('button');
    button.innerText = BIBLEBOOKS[index]; // Use the BOOK'S abbreviation or name

    // Add an event listener to load a random CHAPTER when the BOOK is selected
    button.addEventListener('click', () => {
      loadRandomCHAPTERinBOOK(index); // Load a random CHAPTER from the selected book
    });

    // Append the button to the BOOKS list
    BIBLEBOOKSelement.appendChild(button);
  });
}

// Function to load BOOKS list from BOOKS.json
function loadBIBLEBOOKS() {
  fetch('/data/BIBLE/BOOKS.json')
    .then(response => response.json())
    .then(BOOKS => {
      BIBLEBOOKS = BOOKS;
      generateBIBLEBOOKS(); // Generate buttons for each BOOK after loading the list
      checkPreviousSession(); // Check if there's a last read BOOK stored
    })
    .catch(err => console.error('Failed to load BOOK list:', err));
}

// Check for last session or load random BOOK
function checkPreviousSession() {
  const lastVisitedBOOK = localStorage.getItem('lastVisitedBOOK');
  const lastVisitedCHAPTER = localStorage.getItem('lastVisitedCHAPTER');
  const savedTranslation = localStorage.getItem('selectedTranslation');

  // Restore saved translation if available
  if (savedTranslation) {
    currentTranslation = savedTranslation;
  }

  if (lastVisitedBOOK !== null && lastVisitedCHAPTER !== null) {
    // Load the last visited BOOK and CHAPTER
    currentBOOKindex = parseInt(lastVisitedBOOK);
    currentCHAPTERindex = parseInt(lastVisitedCHAPTER);
    loadBOOK(currentBOOKindex, currentCHAPTERindex);
  } else {
    // Load a random BOOK if no previous session
    loadRandomBOOK();
  }
}

// Load a random BOOK
function loadRandomBOOK() {
  currentBOOKindex = Math.floor(Math.random() * BIBLEBOOKS.length);
  loadRandomCHAPTERinBOOK(currentBOOKindex); // Load a random CHAPTER from the random BOOK
}

// Function to load a random CHAPTER in a specific BOOK
function loadRandomCHAPTERinBOOK(BOOKindex) {
  let BOOKabbrev = BIBLEBOOKS[BOOKindex]; // Get the abbreviation or name

  // Remove spaces from the BOOK name to match the filename
  BOOKabbrev = BOOKabbrev.replace(/\s+/g, '');

  // Fetch the json data for the selected BOOK
  fetch(`/data/BIBLE/${currentTranslation}/${BOOKabbrev}.json`)
    .then(response => response.json())
    .then(BOOKdata => {
      // Generate a random CHAPTER index within the range of available CHAPTERS
      const randomCHAPTERindex = Math.floor(Math.random() * BOOKdata.CHAPTERS.length);

      // Display the random CHAPTER
      loadBOOK(BOOKindex, randomCHAPTERindex);
    })
    .catch(err => console.error('Failed to load BOOK data:', err));
}

// Function to load a BOOK by index and display its CHAPTERS
function loadBOOK(BOOKindex, CHAPTERindex) {
  let BOOKabbrev = BIBLEBOOKS[BOOKindex]; // Get the abbreviation or name

  // Remove spaces from the BOOK name to match the filename
  BOOKabbrev = BOOKabbrev.replace(/\s+/g, '');

  // Fetch the json data for the selected BOOK
  fetch(`/data/BIBLE/${currentTranslation}/${BOOKabbrev}.json`)
    .then(response => response.json())
    .then(BOOKdata => {
      displayBook(BOOKdata, CHAPTERindex);
      saveLastVisited(BOOKindex, CHAPTERindex); // Save the BOOK and CHAPTER as the last visited
    })
    .catch(err => console.error('Failed to load BOOK data:', err));
}

// Display the BOOK and CHAPTER on the page
function displayBook(BOOKdata, CHAPTERindex) {
  const BOOKCHAPTERelement = document.getElementById('BOOKCHAPTER');
  const CHAPTERVERSESelement = document.getElementById('CHAPTERVERSES');

  // Update the BOOK title in the header
  BOOKCHAPTERelement.innerHTML = `${BOOKdata.BOOK}&nbsp;${CHAPTERindex + 1}`;

  // Clear previous CHAPTERVERSES
  CHAPTERVERSESelement.innerHTML = '';
  // Reset the scroll position to the top
  CHAPTERVERSESelement.scrollTop = 0;

  // Display the VERSES for the current CHAPTER
  const CHAPTER = BOOKdata.CHAPTERS[CHAPTERindex];
  CHAPTER.VERSES.forEach(VERSE => {
    const VERSEelement = document.createElement('p');
    VERSEelement.innerHTML = `<span style="color: red;">${VERSE.VERSE}&nbsp;</span>&nbsp;${VERSE.WORD}`;
    CHAPTERVERSESelement.appendChild(VERSEelement);
  });
}

// load the next CHAPTER
function loadNextCHAPTER() {
  fetch(`/data/BIBLE/${currentTranslation}/${BIBLEBOOKS[currentBOOKindex].replace(/\s+/g, '')}.json`)
    .then(response => response.json())
    .then(BOOKdata => {
      if (currentCHAPTERindex + 1 < BOOKdata.CHAPTERS.length) {
        currentCHAPTERindex++;
        loadBOOK(currentBOOKindex, currentCHAPTERindex);
      } else if (currentBOOKindex + 1 < BIBLEBOOKS.length) {
        currentBOOKindex++;
        currentCHAPTERindex = 0;
        loadBOOK(currentBOOKindex, currentCHAPTERindex);
      } else {
        console.log('Reached the end of the BIBLE');
      }
    })
    .catch(err => console.error('Failed to load next CHAPTER:', err));
}

// load the previous CHAPTER
function loadPreviousCHAPTER() {
  if (currentCHAPTERindex > 0) {
    currentCHAPTERindex--;
    loadBOOK(currentBOOKindex, currentCHAPTERindex);
  } else if (currentBOOKindex > 0) {
    currentBOOKindex--;
    fetch(`/data/BIBLE/${currentTranslation}/${BIBLEBOOKS[currentBOOKindex].replace(/\s+/g, '')}.json`)
      .then(response => response.json())
      .then(BOOKdata => {
        currentCHAPTERindex = BOOKdata.CHAPTERS.length - 1;
        loadBOOK(currentBOOKindex, currentCHAPTERindex);
      })
      .catch(err => console.error('Failed to load previous CHAPTER:', err));
  } else {
    console.log('Reached the beginning of the BIBLE');
  }
}

// Save the last visited BOOK and CHAPTER to localStorage
function saveLastVisited(BOOKindex, CHAPTERindex) {
  localStorage.setItem('lastVisitedBOOK', BOOKindex);
  localStorage.setItem('lastVisitedCHAPTER', CHAPTERindex);
}

// Handle translation selection
function initializeTranslationSelection() {
  const xtraNav = document.getElementById('xtraNav');

  // Add event listener for translation changes
  xtraNav.addEventListener('click', (event) => {
    event.preventDefault();

    const target = event.target.closest('a[data-translation]');
    if (target) {
      const selectedTranslation = target.getAttribute('data-translation');
      if (selectedTranslation && selectedTranslation !== currentTranslation) {
        currentTranslation = selectedTranslation;

        // Save the selected translation to localStorage
        localStorage.setItem('selectedTranslation', currentTranslation);

        // Reload the current BOOK and CHAPTER with the new translation
        loadBOOK(currentBOOKindex, currentCHAPTERindex);
      }
    }
  });
}

// Initialize the app when the DOM CHAPTERVERSES is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  loadBIBLEBOOKS();
  initializeTranslationSelection(); // Initialize translation selection
});
