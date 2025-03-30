// Gestures
let isGestureInProgress = false;
let touchstartX = 0;
let touchstartY = 0;
let touchendX = 0;
let touchendY = 0;
let startGestureTime = 0;

const swipeThreshold = 50; // Movement above considered a swipe
const gestureTimeThreshold = 300; // Swipe within 300ms
const touchableElement = document.querySelector('body');

// touchstart/touchend
touchableElement.addEventListener('touchstart', function (event) {
  touchstartX = event.changedTouches[0].screenX;
  touchstartY = event.changedTouches[0].screenY;
  startGestureTime = Date.now(); // Record start
}, false);

touchableElement.addEventListener('touchend', function (event) {
  touchendX = event.changedTouches[0].screenX;
  touchendY = event.changedTouches[0].screenY;
  handleGesture();
}, false);

// Desktop swiping
touchableElement.addEventListener('mousedown', function (event) {
  // Ignore right mouse
  if (event.button === 2) return;

  touchstartX = event.screenX;
  touchstartY = event.screenY;
  startGestureTime = Date.now(); // Record start
}, false);

touchableElement.addEventListener('mouseup', function (event) {
  // Ignore right mouse
  if (event.button === 2) return;

  touchendX = event.screenX;
  touchendY = event.screenY;
  handleGesture();
}, false);

// Arrow key navigation
document.addEventListener('keydown', function (event) {
  if (event.key === 'ArrowLeft') {
    console.log('Left arrow key');
    loadPreviousCHAPTER();
  } else if (event.key === 'ArrowRight') {
    console.log('Right arrow key');
    loadNextCHAPTER();
  }
});

function handleGesture() {
  if (isGestureInProgress) return;
  isGestureInProgress = true;

  const deltaX = Math.abs(touchendX - touchstartX);
  const deltaY = Math.abs(touchendY - touchstartY);

  const elapsedGestureTime = Date.now() - startGestureTime;

  // Only register a swipe if:
  if ((deltaX > swipeThreshold || deltaY > swipeThreshold) && elapsedGestureTime < gestureTimeThreshold) {
    // Horizontal swipe
    if (deltaX > deltaY) {
      if (touchendX < touchstartX) {
        console.log('Swiped Left');
        loadNextCHAPTER();
      } else {
        console.log('Swiped Right');
        loadPreviousCHAPTER();
      }
    }
    // Vertical swipe
    else {
      if (touchendY < touchstartY) {
        console.log('Swiped Up');
      } else {
        console.log('Swiped Down');
      }
    }
  } else {
    console.log('Not a swipe)');
  }

  // Reset after short delay to prevent rapid gestures
  setTimeout(() => {
    isGestureInProgress = false;
  }, 100);
}

function initNav() {
  const mainElement = document.querySelector('main');
  const searchIcon = document.getElementById('search');
  const loginIcon = document.getElementById('login');
  const menuIcon = document.getElementById('menu');
  const xtraNav = document.getElementById('xtraNav');
  const comingSoon = document.getElementById('comingSoon');

  // comingSoon
  mainElement.appendChild(comingSoon);
  comingSoon.style.display = 'none';

  function toggleComingSoon() {
    if (comingSoon.style.display === 'block') {
      comingSoon.style.display = 'none';
    } else {
      comingSoon.style.display = 'block';
      setTimeout(() => {
        comingSoon.style.display = 'none';
      }, 5000);
    }
  }

  [searchIcon, loginIcon].forEach(icon => {
    icon.addEventListener('click', (evt) => {
      evt.stopPropagation();
      toggleComingSoon();
    });
  });

  // xtraNav
  mainElement.appendChild(xtraNav);
  xtraNav.style.display = 'none';

  function toggleXtraNav() {
    if (xtraNav.style.display === 'block') {
      xtraNav.style.display = 'none';
    } else {
      xtraNav.style.display = 'block';
    }
  }

  menuIcon.addEventListener('click', (evt) => {
    evt.stopPropagation();
    toggleXtraNav();
  });

  xtraNav.querySelectorAll('.xtraLink').forEach(item => {
    item.addEventListener('click', () => {
      xtraNav.style.display = 'none';
    });
  });
}

document.addEventListener('DOMContentLoaded', initNav);


// Color mode
(function initializeColorMode() {
  const savedMode = localStorage.getItem('colorMode') || 'light';
  document.documentElement.setAttribute('data-mode', savedMode);
})();

function toggleColorMode() {
  const currentMode = document.documentElement.getAttribute('data-mode');
  const newMode = (currentMode === 'light') ? 'dark' : 'light';
  document.documentElement.setAttribute('data-mode', newMode);
  localStorage.setItem('colorMode', newMode);
}

document.getElementById('mode').addEventListener('click', toggleColorMode);
