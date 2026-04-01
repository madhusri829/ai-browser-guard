/**
 * 🎯 AI Browser Guard - Background Service Worker
 * Handles stats, notifications, reminders, organization
 */

let globalStats = {
  adsBlocked: 0,
  linksBlocked: 0,
  history: [],
  usageStats: {},
  monthlyOrg: {}
};

// 🔥 Initialize on startup
chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 AI Browser Guard activated!');
  loadStats();
  scheduleReminders();
});

// 📡 Listen for messages from content scripts & popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
});

// 🔄 Handle all incoming messages
function handleMessage(message, sender, sendResponse) {
  switch (message.type) {
    case 'statsUpdate':
      updateStats(message.data);
      break;
    
    case 'contentClassified':
      classifyContent(message.data);
      break;
      
    default:
      console.log('Unknown message:', message);
  }
  
  sendResponse({ received: true });
  return true; // Keep message channel open
}

// 📊 Update global statistics
function updateStats(newStats) {
  globalStats.adsBlocked += newStats.adsBlocked || 0;
  globalStats.linksBlocked += newStats.linksBlocked || 0;
  
  chrome.storage.local.set({ stats: globalStats });
  
  // Notify popup
  chrome.runtime.sendMessage({
    type: 'statsUpdate',
    data: globalStats
  });
}

// 🧠 Smart content classification & organization
function classifyContent(data) {
  // Add to history
  globalStats.history.unshift(data);
  globalStats.history.splice(50, globalStats.history.length); // Keep last 50
  
  // Update usage stats
  const category = data.category;
  globalStats.usageStats[category] = (globalStats.usageStats[category] || 0) + 1;
  
  // Monthly organization
  const month = new Date(data.timestamp).toISOString().slice(0, 7); // YYYY-MM
  if (!globalStats.monthlyOrg[month]) globalStats.monthlyOrg[month] = {};
  globalStats.monthlyOrg[month][category] = (globalStats.monthlyOrg[month][category] || 0) + 1;
  
  saveAllStats();
  checkSmartReminders(data);
}

// 💾 Save all stats to storage
function saveAllStats() {
  chrome.storage.local.set({
    stats: globalStats,
    history: globalStats.history,
    usageStats: globalStats.usageStats,
    monthlyOrg: globalStats.monthlyOrg
  });
}

// 🔔 Smart usage-based reminders
function checkSmartReminders(data) {
  const now = new Date();
  const hour = now.getHours();
  
  // Study reminder (8AM or 8PM for study users)
  if (data.category === 'study' && (hour === 8 || hour === 20)) {
    if (globalStats.usageStats.study > 3) {
      setTimeout(() => {
        showNotification('📚 Study Time!', 
          `You usually study now. Continue your session! (${globalStats.usageStats.study} sessions)`);
      }, 2000);
    }
  }
  
  // Hackathon reminder
  if (data.category === 'hackathon') {
    showNotification('💻 Hackathon Detected!', 
      `Saved to March/Hackathon. Stay focused!`);
  }
}

// 🔔 Browser notifications
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: title,
    message: message,
    priority: 2
  });
}

// 📅 Schedule recurring reminders
function scheduleReminders() {
  // Daily productivity reminder
  chrome.alarms.create('dailyReminder', { periodInMinutes: 60 });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dailyReminder' && globalStats.usageStats.study > 0) {
      showNotification('🎯 Keep Going!', 
        `Today: ${globalStats.usageStats.study} study sessions. Great work!`);
    }
  });
}

// 👤 Track active tabs for privacy
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && isSensitiveURL(tab.url)) {
      chrome.tabs.sendMessage(activeInfo.tabId, { type: 'applyPrivacy' });
    }
  });
});

function isSensitiveURL(url) {
  const sensitive = ['bank', 'paypal', 'email', 'gmail', 'password', 'account'];
  return sensitive.some(keyword => url.includes(keyword));
}

// 🌐 Auto-inject protection to new tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Re-inject content script for full protection
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }).catch(console.error);
  }
});

// 💾 Load stats on startup
function loadStats() {
  chrome.storage.local.get(null, (result) => {
    globalStats = {
      ...globalStats,
      ...result.stats,
      history: result.history || [],
      usageStats: result.usageStats || {},
      monthlyOrg: result.monthlyOrg || {}
    };
    console.log('📊 Stats loaded:', globalStats);
  });
}

// 🔍 Export stats API (for popup)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getStats') {
    sendResponse(globalStats);
  }
});

// 🧹 Cleanup old data monthly
setInterval(() => {
  const now = new Date().toISOString().slice(0, 7);
  Object.keys(globalStats.monthlyOrg).forEach(month => {
    if (month < now.slice(0, 4) + '-01') { // Older than 1 year
      delete globalStats.monthlyOrg[month];
    }
  });
  saveAllStats();
}, 24 * 60 * 60 * 1000); // Daily cleanup

console.log('🎯 AI Browser Guard background ready!');
