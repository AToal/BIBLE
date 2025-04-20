let BIBLEBOOKS = [];
let currentBOOKindex = 0;
let currentCHAPTERindex = 0;
let currentTranslation = 'kjv'; // Default translation


//Hybrid‑URL routing helpers
// turns "Song of Solomon" to "songofsolomon" (same rule used for filenames)
function slugify(str) { return str.replace(/\s+/g,'').toLowerCase(); }

// read /Genesis/1/1?v=kjv {book:"Genesis", ch:1, v:1?, tr:"kjv"}
function parseLocation() {
  const [ , bookSeg = '', chSeg = '', vSeg = '' ] = location.pathname.split('/');
  const params = new URLSearchParams(location.search);
  const tr = params.get('v') || currentTranslation; // ?v=kjv (optional)
  return {
    bookPath : bookSeg, // empty string if root
    chapterNo : chSeg ? Number(chSeg) : null,
    verseNo : vSeg ? Number(vSeg) : null,
    tr
  };
}

// push the current view into the address bar
function updateLocation(bookName, chIndex, verseNo = null) {
  const path = `/${bookName}/${chIndex+1}` + (verseNo ? `/${verseNo}` : '');
  const query = `?v=${currentTranslation}`;
  history.pushState({}, '', path + query);
}

// Read BIBLE at "random"
function readBIBLE () {
  const crossElement = document.getElementById('cross');

  crossElement.addEventListener('click', () => {
    loadRandomBOOK();
  });
}

// Generate buttons for each BOOK in #BIBLEBOOKS
function generateBIBLEBOOKS() {
  const BIBLEBOOKSelement = document.getElementById('BIBLEBOOKS');

  // Clear existing CHAPTERVERSES in BOOKS list
  BIBLEBOOKSelement.innerHTML = '';

  // Loop through BOOKS and create button for each
  BIBLEBOOKS.forEach((BOOKabbrev, index) => {
    const button = document.createElement('button');
    button.innerText = BIBLEBOOKS[index]; // Use BOOK'S abbreviation or name

    // Load random CHAPTER when BOOK selected
    button.addEventListener('click', () => {
      loadRandomCHAPTERinBOOK(index); // Load random CHAPTER from selected BOOK
    });

    // Append button to BOOKS list
    BIBLEBOOKSelement.appendChild(button);
  });
}

// Load BOOKS list BOOKS.json
function loadBIBLEBOOKS() {
  fetch('/data/BIBLE/BOOKS.json')
    .then(response => response.json())
    .then(BOOKS => {
      BIBLEBOOKS = BOOKS;
      generateBIBLEBOOKS(); // Generate buttons for BOOKS
      const route = parseLocation(); // route on first load
      if (route.bookPath) {
        // match BOOK → index in BIBLEBOOKS (case‑insensitive)
        const idx = BIBLEBOOKS.findIndex(
            b => slugify(b) === slugify(route.bookPath));
        if (idx !== -1 && route.chapterNo) {
          currentTranslation = route.tr; // ?v=kjv
          loadBOOK(idx, route.chapterNo - 1); // zero‑based
          return; // stop fallback
        }
      }
      checkPreviousSession(); // Check if last read BOOK stored
    })
    .catch(err => console.error('Failed to load BOOK list:', err));
}

// Check last session or load random BOOK
function checkPreviousSession() {
  const lastVisitedBOOK = localStorage.getItem('lastVisitedBOOK');
  const lastVisitedCHAPTER = localStorage.getItem('lastVisitedCHAPTER');
  const savedTranslation = localStorage.getItem('selectedTranslation');

  // Restore translation
  if (savedTranslation) {
    currentTranslation = savedTranslation;
  }

  if (lastVisitedBOOK !== null && lastVisitedCHAPTER !== null) {
    // Load last visited BOOK & CHAPTER
    currentBOOKindex = parseInt(lastVisitedBOOK);
    currentCHAPTERindex = parseInt(lastVisitedCHAPTER);
    loadBOOK(currentBOOKindex, currentCHAPTERindex);
  } else {
    // Load random BOOK
    loadRandomBOOK();
  }
}

// Load random BOOK
function loadRandomBOOK() {
  currentBOOKindex = Math.floor(Math.random() * BIBLEBOOKS.length);
  loadRandomCHAPTERinBOOK(currentBOOKindex); // Load random CHAPTER from random BOOK
}

// Load random CHAPTER in specific BOOK
function loadRandomCHAPTERinBOOK(BOOKindex) {
  let BOOKabbrev = BIBLEBOOKS[BOOKindex]; // Get abbreviation or name

  // Remove spaces from BOOK name to match filename
  BOOKabbrev = BOOKabbrev.replace(/\s+/g, '');

  // Fetch json data for selected BOOK
  fetch(`/data/BIBLE/${currentTranslation}/${BOOKabbrev}.json`)
    .then(response => response.json())
    .then(BOOKdata => {
      // Generate random CHAPTER index within range of available CHAPTERS
      const randomCHAPTERindex = Math.floor(Math.random() * BOOKdata.CHAPTERS.length);

      // Display random CHAPTER
      loadBOOK(BOOKindex, randomCHAPTERindex);
    })
    .catch(err => console.error('Failed to load BOOK data:', err));
}

// Load BOOK by index & display CHAPTERS
function loadBOOK(BOOKindex, CHAPTERindex) {
  let BOOKabbrev = BIBLEBOOKS[BOOKindex]; // Get abbreviation or name

  // Remove spaces from BOOK name to match filename
  BOOKabbrev = BOOKabbrev.replace(/\s+/g, '');

  // Fetch json data for selected BOOK
  fetch(`/data/BIBLE/${currentTranslation}/${BOOKabbrev}.json`)
    .then(response => response.json())
    .then(BOOKdata => {
      displayBook(BOOKdata, CHAPTERindex);
      updateLocation(BOOKdata.BOOK, CHAPTERindex); // keep the address bar in sync
      saveLastVisited(BOOKindex, CHAPTERindex); // Save BOOK & CHAPTER as last visited
    })
    .catch(err => console.error('Failed to load BOOK data:', err));
}

// Display BOOK & CHAPTER on page
function displayBook(BOOKdata, CHAPTERindex) {
  const BOOKCHAPTERelement = document.getElementById('BOOKCHAPTER');
  const CHAPTERVERSESelement = document.getElementById('CHAPTERVERSES');

  // Update BOOK title in header
  BOOKCHAPTERelement.innerHTML = `${BOOKdata.BOOK}&nbsp;${CHAPTERindex + 1}`;

  // Clear previous CHAPTERVERSES
  CHAPTERVERSESelement.innerHTML = '';
  // Reset scroll position to top
  CHAPTERVERSESelement.scrollTop = 0;

  // Display VERSES for current CHAPTER
  const CHAPTER = BOOKdata.CHAPTERS[CHAPTERindex];
  CHAPTER.VERSES.forEach(VERSE => {
    const VERSEelement = document.createElement('p');
    VERSEelement.innerHTML = `<span style="color:var(--red);font-weight:var(--fw7);">${VERSE.VERSE}&nbsp;</span>&nbsp;${VERSE.WORD}`;
    CHAPTERVERSESelement.appendChild(VERSEelement);
  });
}

// Load next CHAPTER
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

// Load previous CHAPTER
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

// Save last visited BOOK & CHAPTER to localStorage
function saveLastVisited(BOOKindex, CHAPTERindex) {
  localStorage.setItem('lastVisitedBOOK', BOOKindex);
  localStorage.setItem('lastVisitedCHAPTER', CHAPTERindex);
}

// Handle translation selection
function initializeTranslationSelection() {
  const xtraNav = document.getElementById('xtraNav');

  xtraNav.addEventListener('click', (event) => {
    event.preventDefault();

    const target = event.target.closest('button[data-translation]');
    if (target) {
      const selectedTranslation = target.getAttribute('data-translation');
      if (selectedTranslation && selectedTranslation !== updateLocation) {
        updateLocation = selectedTranslation;

        // Save selected translation to localStorage
        localStorage.setItem('selectedTranslation', updateLocation);

        // Reload BOOK & CHAPTER with new translation
        loadBOOK(currentBOOKindex, currentCHAPTERindex);
      }
    }
  });
}

// browser back / forward for re‑parse & load
window.addEventListener('popstate', () => {
  const r = parseLocation();
  if (r.bookPath && r.chapterNo) {
    const idx = BIBLEBOOKS.findIndex(b => slugify(b) === slugify(r.bookPath));
    if (idx !== -1) {
      currentTranslation = r.tr;
      loadBOOK(idx, r.chapterNo - 1);
    }
  }
});

// Initialize when BIBLE loaded
document.addEventListener('DOMContentLoaded', () => {
  loadBIBLEBOOKS();
  readBIBLE();
  initializeTranslationSelection();
});
