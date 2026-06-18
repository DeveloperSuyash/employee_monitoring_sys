// Extension Configuration
const CONFIG = {
  SUPABASE_URL: 'https://lrvwbtfqdjjjqmpfbfvz.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_4B52bbGWu0RjvGW95_aicA_YLOvJDOt',
  API_ENDPOINT: 'http://localhost:3000/api/activity'  // Will sync to dashboard API
};

// ─── Storage Keys ───
const STORAGE_KEYS = {
  USER_ID: 'employee_user_id',
  SESSION_TOKEN: 'session_token',
  EMAIL: 'employee_email',
  NAME: 'employee_name',
  LAST_PING: 'last_ping_time',
  CURRENT_TAB: 'current_tab_data'
};

// ─── Tab Tracking ───
let activeTabId = null;
let tabStartTime = null;
let currentDomain = null;
let isTracking = false;

// ─── Supabase Client (Simple Implementation) ───
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
  }

  async query(table, method = 'GET', data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.key,
        'Authorization': `Bearer ${this.key}`
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${this.url}/rest/v1/${table}`, options);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Supabase query failed for ${table}:`, error);
      throw error;
    }
  }

  // Insert activity log
  async insertActivityLog(logData) {
    try {
      console.log('[Extension] Inserting activity log:', logData);
      const response = await fetch(`${this.url}/rest/v1/activity_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.key,
          'Authorization': `Bearer ${this.key}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(logData)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[Extension] Insert failed (${response.status}):`, error);
        return false;
      }

      console.log('[Extension] Activity log inserted successfully');
      return true;
    } catch (error) {
      console.error('[Extension] Failed to insert activity log:', error);
      return false;
    }
  }
}

const supabase = new SupabaseClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ─── Track Active Tab Changes ───
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    // Save previous tab if any
    if (activeTabId !== null && tabStartTime !== null) {
      await saveTabActivity();
    }

    activeTabId = activeInfo.tabId;
    tabStartTime = Date.now();

    // Get tab details
    const tab = await chrome.tabs.get(activeTabId);
    const url = new URL(tab.url);
    currentDomain = url.hostname || 'unknown';

    console.log(`[Extension] Tab switched to: ${currentDomain}`);

    // Update popup
    updatePopupStatus();
  } catch (error) {
    console.error('[Extension] Tab change error:', error);
  }
});

// ─── Track Tab Updates ───
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tabId === activeTabId) {
    try {
      const url = new URL(tab.url);
      const newDomain = url.hostname || 'unknown';
      
      if (newDomain !== currentDomain) {
        currentDomain = newDomain;
        updatePopupStatus();
      }
    } catch (error) {
      console.error('[Extension] Tab update error:', error);
    }
  }
});

// ─── Save Tab Activity to Supabase ───
async function saveTabActivity() {
  if (!activeTabId || !tabStartTime || !currentDomain) {
    return;
  }

  const userId = await getStorageValue(STORAGE_KEYS.USER_ID);
  if (!userId) {
    console.warn('[Extension] No user ID, skipping activity save');
    return;
  }

  const timeSpent = Math.round((Date.now() - tabStartTime) / 1000); // in seconds

  try {
    const tab = await chrome.tabs.get(activeTabId);
    const activityLog = {
      user_id: userId,
      domain: currentDomain,
      url: tab.url || 'unknown',
      time_spent: timeSpent,
      visit_count: 1,
      created_at: new Date().toISOString()
    };

    // Insert into Supabase
    const success = await supabase.insertActivityLog(activityLog);
    
    if (success) {
      console.log('[Extension] Activity saved:', activityLog);
      
      // Also send ping to dashboard to update online status
      await sendPingToDashboard(userId);
    }
  } catch (error) {
    console.error('[Extension] Failed to save activity:', error);
  }
}

// ─── Send Ping to Dashboard (for online status) ───
async function sendPingToDashboard(userId) {
  try {
    await setStorageValue(STORAGE_KEYS.LAST_PING, Date.now().toString());
    console.log('[Extension] Ping sent to dashboard');
  } catch (error) {
    console.error('[Extension] Ping failed:', error);
  }
}

// ─── Periodic Activity Save (every 30 seconds) ───
chrome.alarms.create('saveActivity', { periodInMinutes: 0.5 }); // 30 seconds

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'saveActivity') {
    try {
      if (activeTabId !== null && isTracking) {
        await saveTabActivity();
        tabStartTime = Date.now(); // Reset timer
        updatePopupStatus();
      }
    } catch (error) {
      console.error('[Extension] Periodic save error:', error);
    }
  }
});

// ─── Storage Helpers ───
async function setStorageValue(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

async function getStorageValue(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || null);
    });
  });
}

// ─── Clear All Storage ───
async function clearUserSession() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(
      [STORAGE_KEYS.USER_ID, STORAGE_KEYS.SESSION_TOKEN, STORAGE_KEYS.EMAIL, STORAGE_KEYS.NAME],
      resolve
    );
  });
}

// ─── Message Handling (from popup) ───
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  try {
    console.log('[Extension] Message received:', request.action);

    if (request.action === 'login') {
      // Store user info after login
      await setStorageValue(STORAGE_KEYS.USER_ID, request.userId);
      await setStorageValue(STORAGE_KEYS.SESSION_TOKEN, request.token);
      await setStorageValue(STORAGE_KEYS.EMAIL, request.email);
      await setStorageValue(STORAGE_KEYS.NAME, request.name);
      isTracking = true;
      sendResponse({ success: true, message: 'Logged in successfully' });
    } 
    else if (request.action === 'logout') {
      // Save activity before logout
      if (activeTabId !== null && tabStartTime !== null) {
        await saveTabActivity();
      }
      await clearUserSession();
      isTracking = false;
      activeTabId = null;
      tabStartTime = null;
      sendResponse({ success: true, message: 'Logged out successfully' });
    }
    else if (request.action === 'getStatus') {
      const userId = await getStorageValue(STORAGE_KEYS.USER_ID);
      const email = await getStorageValue(STORAGE_KEYS.EMAIL);
      const name = await getStorageValue(STORAGE_KEYS.NAME);
      
      sendResponse({
        isLoggedIn: !!userId,
        userId,
        email,
        name,
        isTracking,
        currentDomain,
        currentTimeSpent: activeTabId && tabStartTime ? Math.round((Date.now() - tabStartTime) / 1000) : 0
      });
    }
    else if (request.action === 'startTracking') {
      isTracking = true;
      tabStartTime = Date.now();
      sendResponse({ success: true });
    }
    else if (request.action === 'stopTracking') {
      isTracking = false;
      if (activeTabId && tabStartTime) {
        await saveTabActivity();
      }
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error('[Extension] Message handling error:', error);
    sendResponse({ error: error.message });
  }
});

// ─── Update Popup UI ───
function updatePopupStatus() {
  // Notify popup to update
  chrome.runtime.sendMessage({
    action: 'updateStatus'
  }).catch(() => {
    // Popup might not be open
  });
}

console.log('[Extension] Background service worker initialized');
