// ─── DOM Elements ───
const authSection = document.getElementById('authSection');
const userSection = document.getElementById('userSection');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const statusBadge = document.getElementById('statusBadge');
const userNameSpan = document.getElementById('userName');
const userEmailSpan = document.getElementById('userEmail');
const currentDomainSpan = document.getElementById('currentDomain');
const currentTimeSpan = document.getElementById('currentTime');
const startTrackingBtn = document.getElementById('startTrackingBtn');
const stopTrackingBtn = document.getElementById('stopTrackingBtn');

// ─── Configuration ───
const SUPABASE_URL = 'https://lrvwbtfqdjjjqmpfbfvz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4B52bbGWu0RjvGW95_aicA_YLOvJDOt';
const DASHBOARD_URL = 'http://localhost:3000';

// ─── Supabase Auth Client ───
class SupabaseAuth {
  constructor(url, key) {
    this.url = url;
    this.key = key;
  }

  async signUp(email, password) {
    return this._authRequest('signup', { email, password });
  }

  async signIn(email, password) {
    return this._authRequest('signin', { email, password });
  }

  async signOut() {
    return this._authRequest('signout', {});
  }

  async getUser() {
    return this._authRequest('user', {}, 'GET');
  }

  async _authRequest(endpoint, data, method = 'POST') {
    try {
      const url = `${this.url}/auth/v1/${endpoint}`;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.key
        }
      };

      if (method === 'POST') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || result.message || 'Auth failed');
      }

      return result;
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  }
}

const auth = new SupabaseAuth(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Storage Helpers ───
function setStorage(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

function getStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || null);
    });
  });
}

function removeStorage(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(keys, resolve);
  });
}

// ─── Message Helpers ───
function sendMessage(action, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// ─── Show Messages ───
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
  successMessage.classList.remove('show');
  setTimeout(() => errorMessage.classList.remove('show'), 5000);
}

function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.classList.add('show');
  errorMessage.classList.remove('show');
  setTimeout(() => successMessage.classList.remove('show'), 5000);
}

// ─── Update UI ───
function updateStatusBadge(status) {
  statusBadge.className = `status-badge ${status}`;
  const dot = statusBadge.querySelector('.dot');
  dot.className = `dot ${status}`;

  if (status === 'online') {
    statusBadge.innerHTML = '<span class="dot online"></span> Online';
  } else if (status === 'tracking') {
    statusBadge.innerHTML = '<span class="dot tracking"></span> Tracking';
  } else {
    statusBadge.innerHTML = '<span class="dot offline"></span> Offline';
  }
}

async function updateUI() {
  try {
    const response = await sendMessage('getStatus');
    
    if (response.isLoggedIn) {
      // Show user section
      authSection.classList.remove('show');
      userSection.classList.add('show');
      
      userNameSpan.textContent = response.name || 'Employee';
      userEmailSpan.textContent = response.email || '-';
      currentDomainSpan.textContent = response.currentDomain || '-';
      
      if (response.isTracking) {
        updateStatusBadge('tracking');
        stopTrackingBtn.style.display = 'block';
        startTrackingBtn.style.display = 'none';
      } else {
        updateStatusBadge('online');
        startTrackingBtn.style.display = 'block';
        stopTrackingBtn.style.display = 'none';
      }

      // Update time spent
      const timeSpent = response.currentTimeSpent || 0;
      if (timeSpent < 60) {
        currentTimeSpan.textContent = `${timeSpent}s`;
      } else {
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;
        currentTimeSpan.textContent = `${minutes}m ${seconds}s`;
      }
    } else {
      // Show auth section
      authSection.classList.add('show');
      userSection.classList.remove('show');
      updateStatusBadge('offline');
    }
  } catch (error) {
    console.error('Failed to update UI:', error);
  }
}

// ─── Handle Login ───
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError('Email and password are required');
    return;
  }

  const submitBtn = loginForm.querySelector('button');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';

  try {
    // Attempt to sign in with Supabase
    const { user, session, error } = await auth.signIn(email, password);

    if (error) {
      throw new Error(error.message || 'Login failed');
    }

    if (!user || !session) {
      throw new Error('No session returned from auth');
    }

    // Store user info and token
    const userData = {
      userId: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email,
      token: session.access_token
    };

    await setStorage('employee_user_id', user.id);
    await setStorage('session_token', session.access_token);
    await setStorage('employee_email', user.email);
    await setStorage('employee_name', userData.name);

    // Tell background script
    await sendMessage('login', userData);

    showSuccess('Logged in successfully!');
    
    // Update UI
    setTimeout(updateUI, 500);
    emailInput.value = '';
    passwordInput.value = '';

  } catch (error) {
    console.error('Login error:', error);
    showError(error.message || 'Login failed. Check your credentials.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
});

// ─── Handle Logout ───
logoutBtn.addEventListener('click', async () => {
  logoutBtn.disabled = true;
  logoutBtn.textContent = 'Signing out...';

  try {
    await sendMessage('logout');
    await removeStorage(['employee_user_id', 'session_token', 'employee_email', 'employee_name']);
    
    showSuccess('Logged out successfully');
    setTimeout(updateUI, 500);
  } catch (error) {
    console.error('Logout error:', error);
    showError('Logout failed');
  } finally {
    logoutBtn.disabled = false;
    logoutBtn.textContent = 'Sign Out';
  }
});

// ─── Handle Tracking Controls ───
startTrackingBtn.addEventListener('click', async () => {
  try {
    await sendMessage('startTracking');
    updateStatusBadge('tracking');
    stopTrackingBtn.style.display = 'block';
    startTrackingBtn.style.display = 'none';
    showSuccess('Tracking started');
  } catch (error) {
    showError('Failed to start tracking');
  }
});

stopTrackingBtn.addEventListener('click', async () => {
  try {
    await sendMessage('stopTracking');
    updateStatusBadge('online');
    startTrackingBtn.style.display = 'block';
    stopTrackingBtn.style.display = 'none';
    showSuccess('Tracking stopped');
  } catch (error) {
    showError('Failed to stop tracking');
  }
});

// ─── Listen for Background Updates ───
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStatus') {
    updateUI();
  }
});

// ─── Update Time Every Second ───
setInterval(() => {
  sendMessage('getStatus').then((response) => {
    if (response.currentTimeSpent !== undefined) {
      const timeSpent = response.currentTimeSpent;
      if (timeSpent < 60) {
        currentTimeSpan.textContent = `${timeSpent}s`;
      } else {
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;
        currentTimeSpan.textContent = `${minutes}m ${seconds}s`;
      }
      currentDomainSpan.textContent = response.currentDomain || '-';
    }
  }).catch(err => console.error('Status update error:', err));
}, 1000);

// ─── Initialize ───
document.addEventListener('DOMContentLoaded', updateUI);
