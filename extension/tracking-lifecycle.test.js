/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function run() {
  const source = fs.readFileSync(path.join(__dirname, 'background.js'), 'utf8');
  const baseTime = new Date('2026-06-20T10:00:00.000Z').getTime();
  let now = baseTime;
  const storage = {
    employee_user_id: 'test-user',
    session_token: 'test-token',
    employee_email: 'test@example.com',
    employee_name: 'Test User'
  };
  const supabaseWrites = [];
  const listeners = {};
  const activeTab = {
    id: 7,
    url: 'https://example.com/work',
    title: 'Example Work'
  };

  class MockDate extends Date {
    constructor(value) {
      super(arguments.length ? value : now);
    }

    static now() {
      return now;
    }
  }

  const chrome = {
    runtime: {
      lastError: null,
      onMessage: {
        addListener(listener) {
          listeners.message = listener;
        }
      },
      sendMessage() {
        return Promise.resolve();
      }
    },
    storage: {
      local: {
        get(keys, callback) {
          const requestedKeys = Array.isArray(keys) ? keys : [keys];
          const result = {};
          for (const key of requestedKeys) {
            result[key] = storage[key];
          }
          callback(result);
        },
        set(values, callback) {
          Object.assign(storage, values);
          callback?.();
        },
        remove(keys, callback) {
          for (const key of keys) {
            delete storage[key];
          }
          callback?.();
        }
      }
    },
    tabs: {
      query: async () => [activeTab],
      get: async () => activeTab,
      onActivated: { addListener(listener) { listeners.activated = listener; } },
      onUpdated: { addListener(listener) { listeners.updated = listener; } }
    },
    windows: {
      WINDOW_ID_NONE: -1,
      onFocusChanged: { addListener(listener) { listeners.focusChanged = listener; } }
    },
    history: {
      onVisited: { addListener(listener) { listeners.historyVisited = listener; } }
    }
  };

  const context = vm.createContext({
    chrome,
    Date: MockDate,
    URL,
    fetch: async (_url, options = {}) => {
      if (options.body) {
        supabaseWrites.push(JSON.parse(options.body));
      }
      return { ok: true, status: 201, text: async () => '' };
    },
    console: { log() {}, warn() {}, error() {} }
  });
  vm.runInContext(source, context, { filename: 'background.js' });

  for (let index = 0; index < 10; index += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.equal(typeof listeners.message, 'function', 'runtime message listener should be registered');

  const sendMessage = (action, sender = {}) => new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        reject(new Error(`Timed out waiting for ${action}`));
      }
    }, 1000);
    listeners.message({ action }, sender, (response) => {
      settled = true;
      clearTimeout(timeout);
      resolve(response);
    });
  });

  let status;
  for (let index = 0; index < 10; index += 1) {
    now += 900;
    status = await sendMessage('getStatus');
  }

  const history = storage.recent_browser_history;
  const currentRecord = history.find((record) => record.source === 'tracking');

  assert.equal(status.currentTimeSpent, 9, 'live session duration should reach 9 seconds');
  assert.equal(status.totalUsageSeconds, 9, 'cumulative usage should preserve sub-second remainders');
  assert.equal(status.productiveSeconds, 9, 'productive time should equal active tracked time');
  assert.equal(status.totalVisits, 1, 'the active page should count as one visit');
  assert.equal(currentRecord.timeSpent, 9, 'history duration should follow the active session');
  assert.equal(currentRecord.visitCount, 1, 'history record should retain its visit count');

  const reopenedStatus = await sendMessage('getStatus');
  assert.equal(reopenedStatus.totalUsageSeconds, 9, 'popup reopen should not reset cumulative usage');

  Object.assign(activeTab, {
    id: 8,
    url: 'https://second.example.com/page',
    title: 'Second Page'
  });
  await listeners.activated({ tabId: activeTab.id });
  assert.equal(supabaseWrites.length, 1, 'leaving a page should write its activity to Supabase');
  assert.equal(supabaseWrites[0].time_spent, 9, 'Supabase should receive the real page duration');
  assert.equal(supabaseWrites[0].visit_count, 1, 'Supabase should receive the page visit');

  console.log(JSON.stringify({
    currentTimeSpent: status.currentTimeSpent,
    totalUsageSeconds: status.totalUsageSeconds,
    productiveSeconds: status.productiveSeconds,
    totalVisits: status.totalVisits,
    historyTimeSpent: currentRecord.timeSpent,
    historyVisitCount: currentRecord.visitCount,
    supabaseTimeSpent: supabaseWrites[0].time_spent,
    supabaseVisitCount: supabaseWrites[0].visit_count
  }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
