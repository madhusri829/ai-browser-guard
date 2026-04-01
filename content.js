/**
 * 🎯 AI Browser Guard - Content Script
 * 100% Automatic ad removal, link blocking, privacy protection
 */

class AIBrowserGuard {
  constructor() {
    this.stats = { adsBlocked: 0, linksBlocked: 0 };
    this.initProtection();
  }

  initProtection() {
    // 🔥 Execute IMMEDIATELY
    this.killAds();
    this.blockHarmfulLinks();
    this.preventJumps();
    this.classifyPage();
    this.applyPrivacy();
    
    // 🔄 Watch for new content
    this.startObserver();
    
    // 📡 Send initial stats
    this.sendStats();
  }

  // 🛡️ 1. INSTANT AD REMOVAL
  killAds() {
    const adSelectors = [
      // Common ad classes
      '.ad, .ads, .advertisement, .advert, [class*="ad-"], [id*="ad-"]',
      // Banner & popup ads
      '.banner, .popup-ad, .promoted, .sponsored',
      // Google ads
      'ins.adsbygoogle, iframe[src*="googleadservices"], iframe[src*="doubleclick"]',
      // Social ads
      '[data-ad], [data-adtype], .fb_ad'
    ];

    let adCount = 0;
    adSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.remove();
        adCount++;
      });
    });

    // Keyword-based removal
    document.querySelectorAll('*').forEach(el => {
      if (this.isAdContent(el.textContent)) {
        el.style.display = 'none';
        adCount++;
      }
    });

    if (adCount > 0) {
      this.stats.adsBlocked += adCount;
      this.notifyUser(`🛡️ Removed ${adCount} ads`);
    }
  }

  isAdContent(text) {
    if (!text) return false;
    const keywords = ['free', 'offer', 'click here', 'win', 'sale', 'buy now', 'limited time'];
    return keywords.some(kw => text.toLowerCase().includes(kw));
  }

  // ⚠️ 2. HARMFUL LINK REMOVAL
  blockHarmfulLinks() {
    let blocked = 0;
    document.querySelectorAll('a[href]').forEach(link => {
      const url = link.href.toLowerCase();
      
      if (this.isHarmfulURL(url)) {
        link.remove();
        blocked++;
      }
    });

    if (blocked > 0) {
      this.stats.linksBlocked += blocked;
      this.notifyUser(`⚠️ Blocked ${blocked} harmful links`);
    }
  }

  isHarmfulURL(url) {
    const patterns = [
      /^http:/, // Insecure HTTP
      /free.*reward|offer|click|win|sale/,
      /phishing|spam|malware|virus/,
      /ads|doubleclick|googleadservices/,
      /\.tk$|\.ml$|\.ga$/ // Suspicious domains
    ];
    return patterns.some(pattern => pattern.test(url));
  }

  // 🚫 3. PREVENT TAB JUMPS & POPUPS
  preventJumps() {
    // Block window.open
    const originalOpen = window.open;
    window.open = (url, ...args) => {
      if (this.isHarmfulURL(url || '')) {
        console.log('🚫 Popup blocked:', url);
        return null;
      }
      return originalOpen(url, ...args);
    };

    // Block redirects
    const originalAssign = window.location.assign;
    window.location.assign = (url) => {
      if (this.isHarmfulURL(url)) {
        this.notifyUser('🚫 Redirect blocked');
        return;
      }
      originalAssign.call(window.location, url);
    };

    // Block beforeunload popups
    window.onbeforeunload = (e) => {
      if (this.isAdPage()) {
        return 'Ad popup blocked by AI Guard';
      }
    };
  }

  isAdPage() {
    return /free|offer|win|sale/i.test(document.title);
  }

  // 🧠 4. SMART CONTENT CLASSIFICATION
  classifyPage() {
    const pageData = {
      title: document.title,
      url: window.location.href,
      timestamp: Date.now(),
      category: this.predictCategory()
    };

    chrome.runtime.sendMessage({
      type: 'contentClassified',
      data: pageData
    });
  }

  predictCategory() {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();

    if (/leetcode|geeksforgeeks|study|learn/i.test(url + title)) return 'study';
    if (/devpost|hackathon|mlh|hack/i.test(url + title)) return 'hackathon';
    if (/netflix|youtube|movie|watch/i.test(url + title)) return 'movies';
    if (/bank|paypal|email|gmail/i.test(url + title)) return 'personal';
    if (this.isAdContent(title)) return 'spam';
    
    return 'others';
  }

  // 🔐 5. EXCLUSIVE TAB PRIVACY
  applyPrivacy() {
    if (this.isSensitivePage()) {
      const privacyShield = document.createElement('div');
      privacyShield.id = 'ai-privacy-shield';
      privacyShield.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); z-index: 999999;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        color: white; font-family: -apple-system, sans-serif; text-align: center;
        backdrop-filter: blur(20px);
      `;
      privacyShield.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 20px;">🔐</div>
        <h2 style="font-size: 24px; margin-bottom: 10px;">Private Mode Active</h2>
        <p style="font-size: 16px; opacity: 0.9;">This tab is protected</p>
      `;
      
      document.body.appendChild(privacyShield);
      this.notifyUser('🔐 Privacy shield activated');
    }
  }

  isSensitivePage() {
    const sensitiveKeywords = ['bank', 'paypal', 'stripe', 'email', 'gmail', 'password', 'account'];
    return sensitiveKeywords.some(kw => window.location.href.includes(kw));
  }

  // 👀 6. MUTATION OBSERVER - CONTINUOUS PROTECTION
  startObserver() {
    const observer = new MutationObserver(() => {
      this.killAds();
      this.blockHarmfulLinks();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
  }

  // 📡 7. COMMUNICATE WITH BACKGROUND/POPUP
  sendStats() {
    chrome.runtime.sendMessage({
      type: 'statsUpdate',
      data: this.stats
    });
  }

  // 🔔 8. USER NOTIFICATIONS
  notifyUser(message) {
    // Visual notification
    const notif = document.createElement('div');
    notif.textContent = message;
    notif.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white; padding: 16px 24px; border-radius: 12px;
      font-weight: 600; box-shadow: 0 8px 32px rgba(16,185,129,0.4);
      transform: translateX(400px); transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notif);
    requestAnimationFrame(() => notif.style.transform = 'translateX(0)');
    
    setTimeout(() => {
      notif.style.transform = 'translateX(400px)';
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  }
}

// 🚀 START AUTOMATICALLY
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AIBrowserGuard());
} else {
  new AIBrowserGuard();
}

// 🔄 RE-PROTECT ON NAVIGATION
window.addEventListener('load', () => new AIBrowserGuard());
