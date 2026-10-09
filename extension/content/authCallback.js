/**
 * ==============================================================================
 * LeetCode2Git - OAuth Callback Bridge Content Script
 * ==============================================================================
 * Automatically reads authenticated JWT session from backend callback page
 * and securely transfers it to extension storage without triggering browser prompts.
 * ==============================================================================
 */

(() => {
  console.log('[LeetCode2Git Bridge] Content script initialized on:', window.location.href);

  let synced = false;

  function syncAuthSession() {
    if (synced) return;

    // 1. Try payload element in DOM
    const payloadEl = document.getElementById('leetcode2git-auth-payload');
    let jwtToken = payloadEl ? payloadEl.getAttribute('data-token') : null;
    let userStr = payloadEl ? payloadEl.getAttribute('data-user') : null;
    let user = null;

    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {}
    }

    // 2. Try URL query parameters fallback
    if (!jwtToken) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        jwtToken = urlParams.get('jwtToken') || urlParams.get('token');
        const uParam = urlParams.get('user');
        if (uParam) {
          try {
            user = JSON.parse(decodeURIComponent(uParam));
          } catch (e) {
            try { user = JSON.parse(uParam); } catch (e2) {}
          }
        }
      } catch (e) {}
    }

    // 3. Try URL hash parameters fallback
    if (!jwtToken && window.location.hash) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        jwtToken = hashParams.get('jwtToken') || hashParams.get('token');
        const uParam = hashParams.get('user');
        if (uParam) {
          try {
            user = JSON.parse(decodeURIComponent(uParam));
          } catch (e) {
            try { user = JSON.parse(uParam); } catch (e2) {}
          }
        }
      } catch (e) {}
    }

    // 4. Try localStorage / sessionStorage fallback
    if (!jwtToken) {
      try {
        const stored = localStorage.getItem('leetcode2git_auth') || sessionStorage.getItem('leetcode2git_auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          jwtToken = parsed.jwtToken || parsed.token;
          user = parsed.user;
        }
      } catch (e) {}
    }

    // 5. Try window.authData fallback
    if (!jwtToken && typeof window !== 'undefined' && window.authData) {
      jwtToken = window.authData.jwtToken || window.authData.token;
      user = window.authData.user;
    }

    if (jwtToken) {
      synced = true;
      console.log('[LeetCode2Git Bridge] Authenticated session token detected, transferring to extension...');

      chrome.runtime.sendMessage(
        {
          type: 'SAVE_AUTH_DATA',
          data: {
            jwtToken,
            user
          }
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn('[LeetCode2Git Bridge] Error saving auth data:', chrome.runtime.lastError.message);
            synced = false;
            return;
          }

          console.log('[LeetCode2Git Bridge] Session successfully saved in extension storage.');

          // Update page visual feedback
          const syncNotice = document.getElementById('syncNotice');
          if (syncNotice) {
            syncNotice.textContent = '✓ Successfully synchronized with LeetCode2Git extension!';
            syncNotice.style.color = '#7ee787';
            syncNotice.style.borderColor = '#238636';
          }

          const closeBtn = document.getElementById('closeBtn');
          if (closeBtn) {
            closeBtn.textContent = 'Close Window';
          }

          // Auto-close tab after short delay
          setTimeout(() => {
            try {
              window.close();
            } catch (e) {}
          }, 1500);
        }
      );
    }
  }

  // Execute immediately
  syncAuthSession();

  // Retry on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncAuthSession);
  }

  // Periodic check briefly in case DOM loads asynchronously
  const pollInterval = setInterval(() => {
    if (synced) {
      clearInterval(pollInterval);
    } else {
      syncAuthSession();
    }
  }, 300);

  setTimeout(() => clearInterval(pollInterval), 5000);

  // Listen for custom postMessage from page script
  window.addEventListener('message', (event) => {
    if (event.data && (event.data.type === 'LEETCODE2GIT_AUTH_SUCCESS' || event.data.authData)) {
      syncAuthSession();
    }
  });
})();
