// ─── Content Script for Activity Tracking ───
// This script runs in the context of visited websites

let pageStartTime = Date.now();
let lastActivityTime = Date.now();

// ─── Detect User Activity on the Page ───
function recordUserActivity() {
  lastActivityTime = Date.now();
}

// Mouse events
document.addEventListener('mousedown', recordUserActivity);
document.addEventListener('mousemove', recordUserActivity);
document.addEventListener('click', recordUserActivity);

// Keyboard events
document.addEventListener('keydown', recordUserActivity);
document.addEventListener('keyup', recordUserActivity);

// Scroll events
document.addEventListener('scroll', recordUserActivity);

// Touch events
document.addEventListener('touchstart', recordUserActivity);
document.addEventListener('touchend', recordUserActivity);

// ─── Track Page Visibility ───
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('[ContentScript] Page hidden');
  } else {
    console.log('[ContentScript] Page visible');
    pageStartTime = Date.now();
  }
});

// ─── Send Activity Status to Background ───
setInterval(() => {
  if (!document.hidden) {
    const timeSpentOnPage = Math.round((Date.now() - pageStartTime) / 1000);
    const timeSinceLastActivity = Math.round((Date.now() - lastActivityTime) / 1000);
    
    chrome.runtime.sendMessage({
      action: 'pageActivity',
      timeSpent: timeSpentOnPage,
      lastActivity: timeSinceLastActivity
    }).catch(() => {
      // Extension might not be ready yet
    });
  }
}, 5000);

console.log('[ContentScript] Activity tracking initialized');
