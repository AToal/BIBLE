// xtraNav
document.onclick = hideXtraNav;
document.oncontextmenu = rightClick;

function hideXtraNav() {
  document.getElementById("xtraNav").style.display = "none";
}

function rightClick(e) {
  e.preventDefault(); // Prevent the default context menu

  const menu = document.getElementById("xtraNav");

  if (menu.style.display === "block") {
    hideXtraNav();
  } else {
    menu.style.display = "block";
    menu.style.left = (e.pageX - 75) + "px";
    menu.style.top = (e.pageY - 193) + "px";
  }
}

// gestures
let isGestureInProgress = false;
let touchstartX = 0;
let touchstartY = 0;
let touchendX = 0;
let touchendY = 0;
let startGestureTime = 0; // Record the timestamp when the touch/mouse starts

const swipeThreshold = 50; // Movement above this is considered a swipe
const gestureTimeThreshold = 200; // Swipe must happen in under 300ms to be considered a swipe
const touchableElement = document.querySelector('body');

// Add event listeners for touchstart/touchend
touchableElement.addEventListener('touchstart', function (event) {
  touchstartX = event.changedTouches[0].screenX;
  touchstartY = event.changedTouches[0].screenY;
  startGestureTime = Date.now(); // Record the start time
}, false);

touchableElement.addEventListener('touchend', function (event) {
  touchendX = event.changedTouches[0].screenX;
  touchendY = event.changedTouches[0].screenY;
  handleGesture();
}, false);

// Optional desktop swiping support for mouse
touchableElement.addEventListener('mousedown', function (event) {
  // Ignore right mouse button (button code 2)
  if (event.button === 2) return;

  touchstartX = event.screenX;
  touchstartY = event.screenY;
  startGestureTime = Date.now(); // Record the start time
}, false);

touchableElement.addEventListener('mouseup', function (event) {
  // Ignore right mouse button
  if (event.button === 2) return;

  touchendX = event.screenX;
  touchendY = event.screenY;
  handleGesture();
}, false);

// Add arrow key navigation for chapters
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
  // 1) Movement is large enough
  // 2) It happens quickly
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
    // Otherwise, do nothing special
    console.log('Long movement or slow movement (no swipe)');
  }

  // Reset lock after short delay to prevent rapid gestures
  setTimeout(() => {
    isGestureInProgress = false;
  }, 100);
}

// On page load, set color mode from localStorage or default to 'light'
(function initializeColorMode() {
  const savedMode = localStorage.getItem('colorMode') || 'light';
  document.documentElement.setAttribute('data-mode', savedMode);
})();

// Toggle color mode when #mode is clicked
function toggleColorMode() {
  const currentMode = document.documentElement.getAttribute('data-mode');
  const newMode = (currentMode === 'light') ? 'dark' : 'light';
  document.documentElement.setAttribute('data-mode', newMode);
  localStorage.setItem('colorMode', newMode);
}

// Add click event to the SVG icon
document.getElementById('mode').addEventListener('click', toggleColorMode);
