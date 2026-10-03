/**
 * ==============================================================================
 * LeetCode2Git - Background Service Worker (Manifest V3)
 * ==============================================================================
 * Multi-user coordinator handling OAuth callbacks, storage sync, and backend API.
 * ==============================================================================
 */

// Import centralized configuration
importScripts('../config.js');

const API_BASE_URL = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) 
  ? CONFIG.API_BASE_URL 
  : 'http://localhost:5000/api';

const AUTH_URL = (typeof CONFIG !== 'undefined' && CONFIG.AUTH_URL)
  ? CONFIG.AUTH_URL
  : 'http://localhost:5000/api/auth/github';

// Initialize defaults on installation or update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[LeetCode2Git] Extension initialized:', details.reason);
  chrome.storage.local.get(['autoSave', 'createReadme'], (res) => {
    const defaults = {};
    if (res.autoSave === undefined) defaults.autoSave = true;
    if (res.createReadme === undefined) defaults.createReadme = true;
    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults);
    }
  });
});

/**
 * Handle external messages from the OAuth completion page (externally_connectable)
 */
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.type === 'AUTH_SUCCESS' && request.data) {
    const { jwtToken, user } = request.data;

    chrome.storage.local.set({
      jwtToken,
      githubUser: user,
      isLoggedIn: true,
      githubUsername: user.githubUsername,
      selectedRepository: user.selectedRepository || '',
      selectedBranch: user.selectedBranch || 'main'
    }, () => {
      updateBadge('✓', '#238636');
      setTimeout(() => clearBadge(), 4000);
      sendResponse({ success: true, message: 'Authentication saved in extension storage.' });
    });

    return true; // Keep async channel open
  }
});

/**
 * Handle internal extension messages from Popup and Content Scripts
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.type) {
        case 'GET_AUTH_STATUS': {
          const data = await chrome.storage.local.get([
            'jwtToken',
            'githubUser',
            'githubUsername',
            'selectedRepository',
            'selectedBranch',
            'autoSave',
            'createReadme',
            'isLoggedIn'
          ]);

          const isAuthenticated = Boolean(data.jwtToken && data.githubUser);

          sendResponse({
            isAuthenticated,
            user: data.githubUser || null,
            username: data.githubUsername || (data.githubUser ? data.githubUser.githubUsername : ''),
            repository: data.selectedRepository || (data.githubUser ? data.githubUser.selectedRepository : '') || '',
            branch: data.selectedBranch || 'main',
            autoSave: data.autoSave !== false,
            createReadme: data.createReadme !== false
          });
          break;
        }

        case 'LOGIN_GITHUB': {
          const extensionId = chrome.runtime.id;
          const authUrlWithExtension = `${AUTH_URL}?extensionId=${encodeURIComponent(extensionId)}`;
          await chrome.tabs.create({ url: authUrlWithExtension });
          sendResponse({ success: true });
          break;
        }

        case 'LOGOUT': {
          // Clear current user's authentication and repository state from extension storage
          await chrome.storage.local.remove([
            'jwtToken',
            'githubUser',
            'githubUsername',
            'selectedRepository',
            'selectedBranch',
            'isLoggedIn',
            'cachedRepositories'
          ]);
          await clearBadge();
          sendResponse({ success: true, message: 'Logged out successfully.' });
          break;
        }

        case 'SAVE_AUTH_DATA': {
          if (request.data && request.data.jwtToken && request.data.user) {
            await chrome.storage.local.set({
              jwtToken: request.data.jwtToken,
              githubUser: request.data.user,
              githubUsername: request.data.user.githubUsername,
              isLoggedIn: true,
              selectedRepository: request.data.user.selectedRepository || '',
              selectedBranch: request.data.user.selectedBranch || 'main'
            });
            await updateBadge('✓', '#238636');
            setTimeout(() => clearBadge(), 3000);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'Invalid auth payload.' });
          }
          break;
        }

        case 'FETCH_REPOSITORIES': {
          const { jwtToken } = await chrome.storage.local.get(['jwtToken']);

          if (!jwtToken) {
            sendResponse({
              success: false,
              error: 'GitHub account is not connected.'
            });
            return;
          }

          try {
            const res = await fetch(`${API_BASE_URL}/github/repositories`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Accept': 'application/json'
              }
            });

            const data = await res.json();

            if (res.status === 401) {
              // Session expired, clear local auth
              await chrome.storage.local.remove(['jwtToken', 'githubUser', 'isLoggedIn']);
              sendResponse({
                success: false,
                error: 'Your GitHub authorization has expired. Please reconnect your account.'
              });
              return;
            }

            if (!res.ok) {
              sendResponse({
                success: false,
                error: data.message || 'Failed to fetch repositories from GitHub.'
              });
              return;
            }

            // Cache repositories in storage for instant popup reload
            await chrome.storage.local.set({ cachedRepositories: data.repositories || [] });

            sendResponse({
              success: true,
              repositories: data.repositories || []
            });
          } catch (netErr) {
            sendResponse({
              success: false,
              error: 'Backend server is unreachable. Please verify the server is running.'
            });
          }
          break;
        }

        case 'VALIDATE_REPOSITORY': {
          const { jwtToken } = await chrome.storage.local.get(['jwtToken']);

          if (!jwtToken) {
            sendResponse({ success: false, error: 'GitHub account is not connected.' });
            return;
          }

          try {
            const res = await fetch(`${API_BASE_URL}/github/validate-repository`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
              },
              body: JSON.stringify({
                repository: request.repository,
                branch: request.branch
              })
            });

            const data = await res.json();
            sendResponse(data);
          } catch (netErr) {
            sendResponse({ success: false, error: 'Backend connection failed.' });
          }
          break;
        }

        case 'SET_REPOSITORY': {
          const { jwtToken } = await chrome.storage.local.get(['jwtToken']);

          if (!jwtToken) {
            sendResponse({ success: false, error: 'GitHub account is not connected.' });
            return;
          }

          try {
            const res = await fetch(`${API_BASE_URL}/github/set-repository`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
              },
              body: JSON.stringify({
                repository: request.repository,
                branch: request.branch || 'main'
              })
            });

            const data = await res.json();

            if (!res.ok) {
              sendResponse({
                success: false,
                error: data.message || 'Failed to save repository preferences.'
              });
              return;
            }

            // Update local storage
            await chrome.storage.local.set({
              selectedRepository: request.repository,
              selectedBranch: request.branch || 'main'
            });

            sendResponse({
              success: true,
              selectedRepository: request.repository,
              selectedBranch: request.branch || 'main'
            });
          } catch (netErr) {
            sendResponse({ success: false, error: 'Backend connection failed.' });
          }
          break;
        }

        case 'CHECK_DUPLICATE_SOLUTION': {
          const { jwtToken, selectedRepository, selectedBranch } = await chrome.storage.local.get([
            'jwtToken',
            'selectedRepository',
            'selectedBranch'
          ]);

          if (!jwtToken) {
            sendResponse({ success: false, error: 'GitHub is not connected.' });
            return;
          }

          const targetRepo = request.repository || selectedRepository;
          const targetBranch = request.branch || selectedBranch || 'main';

          if (!targetRepo) {
            sendResponse({ success: false, error: 'No GitHub repository configured.' });
            return;
          }

          try {
            const res = await fetch(`${API_BASE_URL}/solutions/check-duplicate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
              },
              body: JSON.stringify({
                repository: targetRepo,
                branch: targetBranch,
                problemNumber: request.problemNumber,
                problemTitle: request.problemTitle,
                difficulty: request.difficulty,
                language: request.language
              })
            });

            const result = await res.json();
            sendResponse(result);
          } catch (netErr) {
            sendResponse({ success: false, error: 'Could not connect to backend to check duplicates.' });
          }
          break;
        }

        case 'UPLOAD_SOLUTION': {
          const { jwtToken, selectedRepository, selectedBranch } = await chrome.storage.local.get([
            'jwtToken',
            'selectedRepository',
            'selectedBranch'
          ]);

          if (!jwtToken) {
            sendResponse({ success: false, error: 'GitHub is not connected.' });
            return;
          }

          const targetRepo = request.repository || selectedRepository;
          const targetBranch = request.branch || selectedBranch || 'main';

          if (!targetRepo) {
            sendResponse({
              success: false,
              error: 'No GitHub repository selected. Please configure in the extension popup.'
            });
            return;
          }

          try {
            const res = await fetch(`${API_BASE_URL}/solutions/upload`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
              },
              body: JSON.stringify({
                repository: targetRepo,
                branch: targetBranch,
                problemNumber: request.problemNumber,
                problemTitle: request.problemTitle,
                difficulty: request.difficulty,
                language: request.language,
                code: request.code,
                approach: request.approach,
                timeComplexity: request.timeComplexity,
                spaceComplexity: request.spaceComplexity,
                overwrite: request.overwrite || false
              })
            });

            const data = await res.json();
            if (res.ok && data.success) {
              await updateBadge('✓', '#238636');
              setTimeout(() => clearBadge(), 4000);
            }
            sendResponse(data);
          } catch (netErr) {
            sendResponse({ success: false, error: 'Failed to communicate with solution upload service.' });
          }
          break;
        }

        case 'SET_BADGE': {
          await updateBadge(request.text || '', request.color || '#238636');
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ success: false, error: `Unknown message type: ${request.type}` });
      }
    } catch (err) {
      console.error('[LeetCode2Git Service Worker Error]:', err);
      sendResponse({ success: false, error: err.message || 'Internal service worker error' });
    }
  })();

  return true; // Keep message channel open for asynchronous responses
});

async function updateBadge(text, color) {
  try {
    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color });
  } catch (e) {}
}

async function clearBadge() {
  try {
    await chrome.action.setBadgeText({ text: '' });
  } catch (e) {}
}
