// 🎯 AI Browser Guard Popup Controller
document.addEventListener('DOMContentLoaded', initPopup);

let stats = { adsBlocked: 0, linksBlocked: 0, history: [] };
let startTime = Date.now();

function initPopup() {
  loadStats();
  setupEventListeners();
  updateUptime();
  refreshData();
}

// 🔄 Load all data from storage
function loadStats() {
  chrome.storage.local.get(['stats', 'history'], (result) => {
    stats = { 
      ...stats, 
      ...result.stats,
      history: result.history || []
    };
    
    updateUI();
  });
}

// 📊 Update all UI elements
function updateUI() {
  document.getElementById('adsBlocked').textContent = stats.adsBlocked || 0;
  document.getElementById('linksBlocked').textContent = stats.linksBlocked || 0;
  document.getElementById('mostUsed').textContent = getMostUsedCategory();
  
  updateRecentList();
}

// 📈 Calculate most used category
function getMostUsedCategory() {
  const categoryCount = {};
  stats.history.forEach(item => {
    categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
  });
  
  return Object.keys(categoryCount).reduce((a, b) => 
    categoryCount[a] > categoryCount[b] ? a : b, 'Study'
  ) || '--';
}

// 📋 Update recent activity list
function updateRecentList() {
  const list = document.getElementById('recentList');
  list.innerHTML = '';
  
  if (!stats.history.length) {
    list.innerHTML = '<li class="empty">No activity yet</li>';
    return;
  }
  
  stats.history.slice(0, 5).forEach((item, i) => {
    const li = document.createElement('li');
    li.className = `category-${item.category}`;
    li.innerHTML = `
      <span class="time">${formatTime(item.timestamp)}</span>
      <span class="title">${item.title.slice(0, 25)}${item.title.length > 25 ? '...' : ''}</span>
      <span class="cat">${item.category}</span>
    `;
    list.appendChild(li);
  });
}

// ⏱️ Format timestamp
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// 🎧 Event listeners
function setupEventListeners() {
  document.getElementById('clearHistory').onclick = clearHistory;
  document.getElementById('exportData').onclick = exportData;
}

// 🗑️ Clear all history
function clearHistory() {
  if (confirm('Clear all history?')) {
    chrome.storage.local.set({ history: [], stats: { adsBlocked: 0, linksBlocked: 0 } });
    stats = { adsBlocked: 0, linksBlocked: 0, history: [] };
    updateUI();
  }
}

// 📤 Export data as JSON
function exportData() {
  const dataStr = JSON.stringify(stats, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `ai-browser-guard-${new Date().toISOString().slice(0,10)}.json`;
  link.click();
}

// ⏱️ Live uptime counter
function updateUptime() {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  document.getElementById('uptime').textContent = uptime;
  setTimeout(updateUptime, 1000);
}

// 🔄 Auto-refresh every 5 seconds
function refreshData() {
  loadStats();
  setTimeout(refreshData, 5000);
}

// 🌐 Listen for messages from content/background scripts
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'statsUpdate') {
    stats = { ...stats, ...message.data };
    updateUI();
  }
});

// 💾 Save stats when popup closes
window.addEventListener('beforeunload', () => {
  chrome.storage.local.set({ stats });
});
