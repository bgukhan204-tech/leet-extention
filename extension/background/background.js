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

    if (jwtToken) {
      const username = (user && (user.githubUsername || user.username)) || '';
      const selectedRepo = (user && user.selectedRepository) || '';
      const selectedBranch = (user && user.selectedBranch) || 'main';

      chrome.storage.local.set({
        jwtToken,
        githubUser: user || { githubUsername: username },
        isLoggedIn: true,
        githubUsername: username,
        selectedRepository: selectedRepo,
        selectedBranch: selectedBranch
      }, () => {
        updateBadge('✓', '#238636');
        setTimeout(() => clearBadge(), 4000);
        sendResponse({ success: true, message: 'Authentication saved in extension storage.' });
      });

      return true; // Keep async channel open
    }
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

          let token = data.jwtToken;
          let user = data.githubUser;

          if (token) {
            try {
              const res = await fetch(`${API_BASE_URL}/github/user`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json'
                }
              });

              if (res.status === 401) {
                // Session expired or invalid on backend -> clear local storage
                await chrome.storage.local.remove([
                  'jwtToken',
                  'githubUser',
                  'githubUsername',
                  'selectedRepository',
                  'selectedBranch',
                  'isLoggedIn',
                  'cachedRepositories'
                ]);
                sendResponse({
                  isAuthenticated: false,
                  user: null,
                  username: '',
                  repository: '',
                  branch: 'main',
                  autoSave: data.autoSave !== false,
                  createReadme: data.createReadme !== false
                });
                break;
              }

              if (res.ok) {
                const result = await res.json();
                if (result && result.success && result.user) {
                  user = result.user;
                  await chrome.storage.local.set({
                    githubUser: user,
                    githubUsername: user.githubUsername || user.username || data.githubUsername,
                    selectedRepository: user.selectedRepository || data.selectedRepository || '',
                    selectedBranch: user.selectedBranch || data.selectedBranch || 'main',
                    isLoggedIn: true
                  });
                }
              }
            } catch (netErr) {
              console.warn('[LeetCode2Git] Background verification network notice:', netErr.message);
            }
          }

          const isAuthenticated = Boolean(token && user);

          sendResponse({
            isAuthenticated,
            user: user || null,
            username: user ? (user.githubUsername || user.username) : (data.githubUsername || ''),
            repository: data.selectedRepository || (user ? user.selectedRepository : '') || '',
            branch: data.selectedBranch || (user ? user.selectedBranch : '') || 'main',
            autoSave: data.autoSave !== false,
            createReadme: data.createReadme !== false
          });
          break;
        }

        case 'LOGIN_GITHUB': {
          const extensionId = chrome.runtime.id;
          let redirectUri = '';

          if (chrome.identity && typeof chrome.identity.getRedirectURL === 'function') {
            try {
              redirectUri = chrome.identity.getRedirectURL();
            } catch (e) {
              console.warn('[LeetCode2Git] getRedirectURL error:', e);
            }
          }

          const authParams = new URLSearchParams();
          authParams.set('extensionId', extensionId);
          if (redirectUri) {
            authParams.set('redirect_uri', redirectUri);
          }

          const fullAuthUrl = `${AUTH_URL}?${authParams.toString()}`;

          // Primary: Launch web auth flow if identity API is available
          if (chrome.identity && typeof chrome.identity.launchWebAuthFlow === 'function' && redirectUri) {
            try {
              const responseUrl = await new Promise((resolve, reject) => {
                chrome.identity.launchWebAuthFlow(
                  {
                    url: fullAuthUrl,
                    interactive: true
                  },
                  (redirectResult) => {
                    if (chrome.runtime.lastError) {
                      return reject(new Error(chrome.runtime.lastError.message));
                    }
                    if (!redirectResult) {
                      return reject(new Error('Authentication was cancelled.'));
                    }
                    resolve(redirectResult);
                  }
                );
              });

              const url = new URL(responseUrl);
              const jwtToken = url.searchParams.get('jwtToken') || url.searchParams.get('token');
              const userParam = url.searchParams.get('user');
              let user = null;

              if (userParam) {
                try {
                  user = JSON.parse(decodeURIComponent(userParam));
                } catch (e) {
                  try {
                    user = JSON.parse(userParam);
                  } catch (e2) {}
                }
              }

              if (jwtToken) {
                if (!user || !user.githubUsername) {
                  try {
                    const userRes = await fetch(`${API_BASE_URL}/github/user`, {
                      headers: { 'Authorization': `Bearer ${jwtToken}` }
                    });
                    if (userRes.ok) {
                      const userData = await userRes.json();
                      if (userData && userData.user) {
                        user = userData.user;
                      }
                    }
                  } catch (fetchErr) {
                    console.warn('[LeetCode2Git] Error fetching user profile:', fetchErr);
                  }
                }

                const username = (user && (user.githubUsername || user.username)) || '';
                const selectedRepo = (user && user.selectedRepository) || '';
                const selectedBranch = (user && user.selectedBranch) || 'main';

                await chrome.storage.local.set({
                  jwtToken,
                  githubUser: user || { githubUsername: username },
                  githubUsername: username,
                  isLoggedIn: true,
                  selectedRepository: selectedRepo,
                  selectedBranch: selectedBranch
                });

                await updateBadge('✓', '#238636');
                setTimeout(() => clearBadge(), 4000);

                sendResponse({
                  success: true,
                  jwtToken,
                  user: user || { githubUsername: username }
                });
                break;
              }
            } catch (identityErr) {
              console.warn('[LeetCode2Git] launchWebAuthFlow notice, falling back to tab:', identityErr.message);
              await chrome.tabs.create({ url: fullAuthUrl });
              sendResponse({ success: true, fallback: true });
              break;
            }
          }

          // Fallback: Open tab
          await chrome.tabs.create({ url: fullAuthUrl });
          sendResponse({ success: true, fallback: true });
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
          if (request.data && (request.data.jwtToken || request.data.token)) {
            const jwtToken = request.data.jwtToken || request.data.token;
            let user = request.data.user || null;

            // If user data is missing or incomplete, fetch verified profile from backend
            if (!user || !user.githubUsername) {
              try {
                const userRes = await fetch(`${API_BASE_URL}/github/user`, {
                  headers: { 'Authorization': `Bearer ${jwtToken}` }
                });
                if (userRes.ok) {
                  const userData = await userRes.json();
                  if (userData && userData.user) {
                    user = userData.user;
                  }
                }
              } catch (fetchErr) {
                console.warn('[LeetCode2Git] Error fetching user profile in SAVE_AUTH_DATA:', fetchErr);
              }
            }

            const username = (user && (user.githubUsername || user.username)) || '';
            const selectedRepo = (user && user.selectedRepository) || '';
            const selectedBranch = (user && user.selectedBranch) || 'main';

            await chrome.storage.local.set({
              jwtToken,
              githubUser: user || { githubUsername: username },
              githubUsername: username,
              isLoggedIn: true,
              selectedRepository: selectedRepo,
              selectedBranch: selectedBranch
            });

            await updateBadge('✓', '#238636');
            setTimeout(() => clearBadge(), 4000);
            sendResponse({ success: true, user: user || { githubUsername: username } });
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
