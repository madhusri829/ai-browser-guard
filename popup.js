document.addEventListener('DOMContentLoaded', () => {
  updateStats();
  loadCurrentPage();
  setupButtons();
  
  // Update every 2 seconds
  setInterval(updateStats, 2000);
});

function updateStats() {
  chrome.storage.local.get(['adsBlocked', 'pagesProtected'], (data) => {
    document.getElementById('adsBlocked').textContent = 
      data.adsBlocked || 0;
    document.getElementById('pagesProtected').textContent = 
      data.pagesProtected || 0;
  });
}

function loadCurrentPage() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'getPageInfo'}, (response) => {
      document.getElementById('pageInfo').textContent = 
        response?.category ? `✅ ${response.category}` : 'Analyzing...';
    });
  });
}

function setupButtons() {
  document.getElementById('privacyToggle').onclick = () => {
    chrome.storage.local.set({ privacyMode: true });
    showNotification('Privacy Mode ON 🔒');
  };
  
  document.getElementById('clearData').onclick = () => {
    chrome.storage.local.clear();
    location.reload();
  };
}
