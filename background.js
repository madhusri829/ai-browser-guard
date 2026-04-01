// Web Request Blocking (Ads + Harmful Sites)
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url.toLowerCase();
    
    // Block ad networks
    const adNetworks = [
      'doubleclick.net', 'googleadservices.com',
      'adservice.google.com', 'googlesyndication.com'
    ];
    
    if (adNetworks.some(network => url.includes(network))) {
      return { cancel: true };
    }
    
    // Block auto-jumps to suspicious domains
    if (isSuspiciousUrl(url)) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '🚫 Auto-Jump Blocked',
        message: `Blocked redirect to: ${details.url}`
      });
      return { cancel: true };
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// Navigation Listener (Prevent platform jumps)
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (isAdRedirect(details.url)) {
    chrome.tabs.update(details.tabId, { url: 'about:blank' });
    showNotification('Platform jump prevented!');
  }
});

// Privacy Protection
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && shouldHideTab(tab)) {
      // Blur/hide sensitive tabs
      chrome.tabs.sendMessage(activeInfo.tabId, { action: 'hideTab' });
    }
  });
});

function isSuspiciousUrl(url) {
  const patterns = [/\.tk$/, /\.ml$/, /\.ga$/, /phishing/];
  return patterns.some(pattern => pattern.test(url));
}

function showNotification(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'AI Browser Guard',
    message: message
  });
}

// Smart Reminders (Usage-based)
setInterval(() => {
  chrome.storage.local.get(['usageStats'], (result) => {
    const mostUsed = getMostUsedCategory(result.usageStats);
    if (mostUsed && shouldRemind(mostUsed)) {
      showNotification(`Continue your ${mostUsed} session! 📚`);
    }
  });
}, 300000); // 5 minutes
