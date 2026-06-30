const BACKDROP_KEY = 'idle_lock_backdrop';

function applyStoredBackdrop() {
  chrome.storage.local.get([BACKDROP_KEY], (result) => {
    const imageUrl = result[BACKDROP_KEY];
    if (!imageUrl) {
      return;
    }

    document.documentElement.style.setProperty('--idle-backdrop', `url("${imageUrl}")`);
  });
}

function sendIdleAction(action, reason) {
  chrome.runtime.sendMessage({ action, reason }, () => {
    if (chrome.runtime.lastError) {
      console.warn('[IdleLock] Failed to send action:', chrome.runtime.lastError.message);
    }
  });
}

applyStoredBackdrop();

document.getElementById('workingBtn')?.addEventListener('click', () => {
  sendIdleAction('idleWorking', 'idle-lock-working');
});

document.getElementById('breakBtn')?.addEventListener('click', () => {
  sendIdleAction('idleBreak', 'idle-lock-break');
});
