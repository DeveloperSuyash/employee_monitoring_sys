function sendIdleAction(action, reason) {
  chrome.runtime.sendMessage({ action, reason }, () => {
    if (chrome.runtime.lastError) {
      console.warn('[IdleLock] Failed to send action:', chrome.runtime.lastError.message);
    }
  });
}

document.getElementById('workingBtn')?.addEventListener('click', () => {
  sendIdleAction('idleWorking', 'idle-lock-working');
});

document.getElementById('breakBtn')?.addEventListener('click', () => {
  sendIdleAction('idleBreak', 'idle-lock-break');
});
