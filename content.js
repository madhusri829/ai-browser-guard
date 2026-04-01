// AI Content Classification
const categories = {
  study: ['learn', 'course', 'tutorial', 'education', 'university'],
  hackathon: ['hack', 'devpost', 'competition', 'github', 'code'],
  movies: ['watch', 'stream', 'netflix', 'movie', 'film'],
  personal: ['gmail', 'bank', 'login', 'profile']
};

// Ad Detection Keywords & Patterns
const adKeywords = ['free', 'offer', 'click', 'win', 'reward', 'sale', 'buy'];
const adSelectors = [
  '[class*="ad"]', '[id*="ad"]', '.advertisement', '.banner',
  '[class*="promo"]', 'iframe[src*="doubleclick"]'
];

// Initialize
function initContentModerator() {
  // 1. Remove Ads Immediately
  removeAds();
  
  // 2. Classify Current Page
  classifyPage();
  
  // 3. Block Auto-Jumps
  blockAutoJumps();
  
  // 4. Scan Cookies
  scanCookies();
}

// Remove Ads (Core Feature)
function removeAds() {
  adSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.style.display = 'none';
      el.remove();
    });
  });
  
  // Keyword-based removal
  document.querySelectorAll('*').forEach(el => {
    if (el.textContent && hasAdKeywords(el.textContent)) {
      el.style.display = 'none';
    }
  });
}

function hasAdKeywords(text) {
  return adKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  );
}

// Classify Page Content
function classifyPage() {
  const title = document.title.toLowerCase();
  const url = window.location.href;
  
  let category = 'others';
  for (let cat in categories) {
    if (categories[cat].some(word => 
      title.includes(word) || url.includes(word)
    )) {
      category = cat;
      break;
    }
  }
  
  chrome.storage.local.set({
    currentPage: { category, title, url, timestamp: Date.now() }
  });
}

// Block Auto-Jumps & Popups
function blockAutoJumps() {
  // Block new windows/popups
  window.open = () => false;
  
  // Block form submissions to ad sites
  document.addEventListener('submit', (e) => {
    const formAction = e.target.action;
    if (isAdUrl(formAction)) {
      e.preventDefault();
      showNotification('Ad redirect blocked!');
    }
  });
}

function scanCookies() {
  chrome.cookies.getAll({}, (cookies) => {
    const suspicious = cookies.filter(cookie => 
      cookie.name.includes('tracking') || 
      cookie.domain.includes('ads')
    );
    
    if (suspicious.length > 0) {
      chrome.runtime.sendMessage({
        type: 'cookies_suspicious',
        count: suspicious.length
      });
    }
  });
}

showNotification('AI Browser Guard Active!')();
initContentModerator();

// Mutation Observer for dynamic content
const observer = new MutationObserver(() => {
  removeAds();
});
observer.observe(document.body, { childList: true, subtree: true });
