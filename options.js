// ⚙️ AI Browser Guard Options Page Controller
document.addEventListener('DOMContentLoaded', initOptions);

let settings = {};
let stats = {};

function initOptions() {
  loadSettings();
  loadStats();
  setupEventListeners();
  updateUI();
}

// 🔄 Load settings from storage
function loadSettings() {
  chrome.storage.local.get([
    'protectionLevel', 'autoCategorize', 'smartReminders', 
    'blockNotifications', 'autoPrivacy', 'cookieProtection'
  ], (result) => {
    settings = {
      protectionLevel: result.protectionLevel || 2,
      autoCategorize: result.autoCategorize !== false,
      smartReminders: result.smartReminders !== false,
      blockNotifications: result.blockNotifications || false,
      autoPrivacy: result.autoPrivacy !== false,
      cookieProtection: result.cookieProtection || false
    };
    
    // Update form
    document.getElementById('protectionLevel').value = settings.protectionLevel;
    document.getElementById('autoCategorize').checked = settings.autoCategorize;
    document.getElementById('smartReminders').checked = settings.smartReminders;
    document.getElementById('blockNotifications').checked = settings.blockNotifications;
    document.getElementById('autoPrivacy').checked = settings.autoPrivacy;
    document.getElementById('cookieProtection').checked = settings.cookieProtection;
    
    updateProtectionLabel();
    updateStatus('Settings loaded');
  });
}

// 📊 Load lifetime stats
function loadStats() {
  chrome.storage.local.get(['stats'], (result) => {
    stats = result.stats || {};
    updateStatsUI();
  });
}

// 🎧 Event listeners
function setupEventListeners() {
  // Sliders
  document.getElementById('protectionLevel').oninput = (e) => {
    settings.protectionLevel = parseInt(e.target.value);
    updateProtectionLabel();
  };

  // Toggles
  ['autoCategorize', 'smartReminders', 'blockNotifications', 
   'autoPrivacy', 'cookieProtection'].forEach(id => {
    document.getElementById(id).onchange = (e) => {
      settings[id] = e.target.checked;
    };
  });

  // Buttons
  document.getElementById('saveSettings').onclick = saveSettings;
  document.getElementById('resetAll').onclick = resetAll;
}

// 📱 Update UI elements
function updateUI() {
  updateProtectionLabel();
}

function updateProtectionLabel() {
  const slider = document.getElementById('protectionLevel');
  const label = document.getElementById('protectionLabel');
  
  const levels = ['Light', 'Normal', 'Aggressive'];
  label.textContent = levels[slider.value - 1];
  
  // Color coding
  const colors = ['#10b981', '#f59e0b', '#dc2626'];
  slider.style.accentColor = colors[slider.value - 1];
}

function updateStatsUI() {
  document.getElementById('totalAds').textContent = stats.adsBlocked || 0;
  document.getElementById('totalLinks').textContent = stats.linksBlocked || 0;
  document.getElementById('totalPages').textContent = stats.history?.length || 0;
}

// 💾 Save all settings
function saveSettings() {
  chrome.storage.local.set(settings, () => {
    // Notify all tabs to reload settings
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { type: 'settingsUpdated', settings });
      });
    });
    
    updateStatus('✅ Settings saved!');
    
    // Visual feedback
    const btn = document.getElementById('saveSettings');
    const original = btn.innerHTML;
    btn.innerHTML = '✅ Saved!';
    btn.style.background = '#10b981';
    
    setTimeout(() => {
      btn.innerHTML = original;
      btn.style.background = '';
    }, 1500);
  });
}

// 🔄 Reset everything
function resetAll() {
  if (!confirm('⚠️ Reset ALL settings and stats?\nThis cannot be undone.')) return;
  
  const defaultSettings = {
    protectionLevel: 2,
    autoCategorize: true,
    smartReminders: true,
    blockNotifications: false,
    autoPrivacy: true,
    cookieProtection: false
  };
  
  chrome.storage.local.clear(() => {
    settings = defaultSettings;
    stats = {};
    loadSettings();
    loadStats();
    updateStatus('🔄 Reset complete');
  });
}

// 📢 Status messages
function updateStatus(message) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = message.includes('✅') ? 'success' : 
                      message.includes('⚠️') ? 'warning' : 'default';
}

// 🌐 Listen for external messages
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'statsUpdate') {
    stats = message.data;
    updateStatsUI();
  }
});

// 💾 Auto-save on page unload
window.addEventListener('beforeunload', () => {
  chrome.storage.local.set(settings);
});

// 🔄 Refresh stats every 30 seconds
setInterval(loadStats, 30000);

console.log('⚙️ Options page loaded');
