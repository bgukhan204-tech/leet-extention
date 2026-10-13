/**
 * ==============================================================================
 * LeetCode2Git - Chrome Extension Popup Script
 * Public Multi-User Authentication, Settings & Repository Manager
 * ==============================================================================
 */

// DOM Elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const disconnectedSection = document.getElementById('disconnectedSection');
const connectedSection = document.getElementById('connectedSection');
const connectGithubBtn = document.getElementById('connectGithubBtn');

const userAvatar = document.getElementById('userAvatar');
const usernameDisplay = document.getElementById('usernameDisplay');
const disconnectBtn = document.getElementById('disconnectBtn');

const repoSelect = document.getElementById('repoSelect');
const refreshReposBtn = document.getElementById('refreshReposBtn');
const toggleManualRepoBtn = document.getElementById('toggleManualRepoBtn');
const manualRepoContainer = document.getElementById('manualRepoContainer');
const repoInput = document.getElementById('repoInput');
const saveRepoBtn = document.getElementById('saveRepoBtn');

const autoSaveToggle = document.getElementById('autoSaveToggle');
const createReadmeToggle = document.getElementById('createReadmeToggle');
const dashboardBtn = document.getElementById('dashboardBtn');

// Dashboard View DOM Elements
const mainView = document.getElementById('mainView');
const dashboardView = document.getElementById('dashboardView');
const backToSettingsBtn = document.getElementById('backToSettingsBtn');
const refreshDashboardBtn = document.getElementById('refreshDashboardBtn');
const dashUserBadge = document.getElementById('dashUserBadge');
const dashboardLoading = document.getElementById('dashboardLoading');
const dashboardError = document.getElementById('dashboardError');
const dashboardErrorMsg = document.getElementById('dashboardErrorMsg');
const retryDashboardBtn = document.getElementById('retryDashboardBtn');
const dashboardContent = document.getElementById('dashboardContent');

// Stats Elements
const statTotalSolved = document.getElementById('statTotalSolved');
const statEasy = document.getElementById('statEasy');
const statMedium = document.getElementById('statMedium');
const statHard = document.getElementById('statHard');
const statCurrentStreak = document.getElementById('statCurrentStreak');
const statLongestStreak = document.getElementById('statLongestStreak');
const statThisWeek = document.getElementById('statThisWeek');

// Solutions Elements
const openRepoLinkBtn = document.getElementById('openRepoLinkBtn');
const emptySolutionsState = document.getElementById('emptySolutionsState');
const solutionList = document.getElementById('solutionList');

let alertTimeoutId = null;
let isManualEntryVisible = false;

// ==============================================================================
// 1. Initialization
// ==============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await refreshPopupState();
  listenForStorageUpdates();
});

/**
 * Register user interaction event listeners
 */
function setupEventListeners() {
  // Connect GitHub
  connectGithubBtn.addEventListener('click', handleConnectGithub);

  // Disconnect GitHub
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', handleDisconnect);
  }

  // Dashboard Navigation & Actions
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', handleOpenDashboard);
  }
  if (backToSettingsBtn) {
    backToSettingsBtn.addEventListener('click', handleBackToSettings);
  }
  if (refreshDashboardBtn) {
    refreshDashboardBtn.addEventListener('click', loadDashboardData);
  }
  if (retryDashboardBtn) {
    retryDashboardBtn.addEventListener('click', loadDashboardData);
  }
  if (openRepoLinkBtn) {
    openRepoLinkBtn.addEventListener('click', handleOpenGithubRepo);
  }

  // Repository actions
  saveRepoBtn.addEventListener('click', handleSaveRepository);
  refreshReposBtn.addEventListener('click', handleRefreshRepositories);
  toggleManualRepoBtn.addEventListener('click', handleToggleManualEntry);

  repoSelect.addEventListener('change', () => {
    if (repoSelect.value && !isManualEntryVisible) {
      repoInput.value = repoSelect.value;
    }
  });

  // Settings toggles
  autoSaveToggle.addEventListener('change', handleToggleAutoSave);
  createReadmeToggle.addEventListener('change', handleToggleCreateReadme);

  // Close alert notification
  closeAlertBtn.addEventListener('click', hideAlert);
}

/**
 * Real-time storage listener to sync popup if authentication completes in browser or background
 */
function listenForStorageUpdates() {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.jwtToken || changes.githubUser || changes.selectedRepository || changes.isLoggedIn) {
        refreshPopupState();
      }
    }
  });
}

// ==============================================================================
// 2. State & UI Management
// ==============================================================================

/**
 * Fetch and render complete popup state
 */
async function refreshPopupState() {
  try {
    // 1. Instant local storage render to avoid UI flicker
    const localData = await chrome.storage.local.get([
      'jwtToken',
      'githubUser',
      'selectedRepository',
      'autoSave',
      'createReadme',
      'isLoggedIn'
    ]);

    if (localData.autoSave !== undefined) autoSaveToggle.checked = localData.autoSave !== false;
    if (localData.createReadme !== undefined) createReadmeToggle.checked = localData.createReadme !== false;

    if (localData.jwtToken && localData.githubUser) {
      renderConnectedState(localData.githubUser, localData.selectedRepository);
    }

    // 2. Query background worker for backend session verification
    chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' }, async (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Popup] Could not query background worker:', chrome.runtime.lastError.message);
        return;
      }

      if (!response) return;

      // Sync Settings Toggles
      autoSaveToggle.checked = response.autoSave !== false;
      createReadmeToggle.checked = response.createReadme !== false;

      // Render Verified Auth State
      if (response.isAuthenticated && response.user) {
        renderConnectedState(response.user, response.repository);
      } else {
        renderDisconnectedState();
      }
    });
  } catch (err) {
    console.error('[Popup] Error refreshing popup state:', err);
  }
}

/**
 * Render Disconnected State
 */
function renderDisconnectedState() {
  if (mainView && dashboardView) {
    mainView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
  }

  statusIndicator.className = 'status-dot disconnected';
  statusText.className = 'status-badge disconnected';
  statusText.textContent = 'Not connected';

  disconnectedSection.classList.remove('hidden');
  connectedSection.classList.add('hidden');

  repoSelect.innerHTML = '<option value="">-- Connect GitHub first --</option>';
  repoSelect.disabled = true;
  saveRepoBtn.disabled = true;
  refreshReposBtn.disabled = true;
}

/**
 * Render Connected State for the authenticated user
 */
async function renderConnectedState(user, selectedRepo) {
  statusIndicator.className = 'status-dot connected';
  statusText.className = 'status-badge connected';
  statusText.textContent = 'Connected';

  disconnectedSection.classList.add('hidden');
  connectedSection.classList.remove('hidden');

  // Populate User Profile
  const username = user.githubUsername || user.username || '';
  usernameDisplay.textContent = `@${username}`;
  if (user.avatarUrl) {
    userAvatar.src = user.avatarUrl;
    userAvatar.style.display = 'block';
  } else {
    userAvatar.src = 'https://github.com/identicons/app.png';
  }

  repoSelect.disabled = false;
  saveRepoBtn.disabled = false;
  refreshReposBtn.disabled = false;

  // Load repositories for this user
  await loadUserRepositories(selectedRepo || user.selectedRepository);
}

/**
 * Fetch and populate repository dropdown for authenticated user
 */
async function loadUserRepositories(currentSelectedRepo) {
  // Check cached repositories first for instant rendering
  const storage = await chrome.storage.local.get(['cachedRepositories', 'selectedRepository']);
  const activeRepo = currentSelectedRepo || storage.selectedRepository || '';

  if (storage.cachedRepositories && storage.cachedRepositories.length > 0) {
    populateRepoDropdown(storage.cachedRepositories, activeRepo);
  } else {
    repoSelect.innerHTML = '<option value="">Loading repositories...</option>';
  }

  // Fetch fresh repository list from backend
  chrome.runtime.sendMessage({ type: 'FETCH_REPOSITORIES' }, (res) => {
    if (chrome.runtime.lastError) {
      console.warn('[Popup] Fetch repos error:', chrome.runtime.lastError.message);
      return;
    }

    if (res && res.success && res.repositories) {
      populateRepoDropdown(res.repositories, activeRepo);
    } else if (res && !res.success) {
      if (res.error && res.error.includes('expired')) {
        renderDisconnectedState();
        showAlert(res.error, 'error');
      }
    }
  });
}

/**
 * Populate repository select dropdown with options
 */
function populateRepoDropdown(repositories, selectedRepo) {
  repoSelect.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Select Repository --';
  repoSelect.appendChild(defaultOption);

  const list = Array.isArray(repositories) ? repositories : [];
  let hasSelectedMatch = false;

  list.forEach((repo) => {
    if (!repo || !repo.fullName) return;
    const opt = document.createElement('option');
    opt.value = repo.fullName;
    opt.textContent = `${repo.fullName} ${repo.private ? '🔒' : ''}`;
    
    if (selectedRepo && repo.fullName.toLowerCase() === selectedRepo.toLowerCase()) {
      opt.selected = true;
      hasSelectedMatch = true;
    }

    repoSelect.appendChild(opt);
  });

  // If user has a saved repository not in the top list, append it
  if (selectedRepo && !hasSelectedMatch) {
    const customOpt = document.createElement('option');
    customOpt.value = selectedRepo;
    customOpt.textContent = `${selectedRepo} (saved)`;
    customOpt.selected = true;
    repoSelect.appendChild(customOpt);
  }

  repoInput.value = selectedRepo || '';
}

// ==============================================================================
// 3. Action Handlers
// ==============================================================================

let authPollInterval = null;

/**
 * Connect GitHub OAuth Flow
 */
function handleConnectGithub() {
  showAlert('Opening GitHub authorization window...', 'info');

  if (authPollInterval) clearInterval(authPollInterval);
  let pollAttempts = 0;
  authPollInterval = setInterval(async () => {
    pollAttempts++;
    if (pollAttempts > 45) {
      clearInterval(authPollInterval);
      return;
    }
    const data = await chrome.storage.local.get(['jwtToken', 'githubUser']);
    if (data.jwtToken) {
      clearInterval(authPollInterval);
      showAlert('GitHub connected successfully!', 'success');
      await refreshPopupState();
    }
  }, 1200);

  chrome.runtime.sendMessage({ type: 'LOGIN_GITHUB' }, (res) => {
    if (chrome.runtime.lastError) {
      showAlert('Unable to connect to LeetCode2Git server. Please try again.', 'error');
      return;
    }

    if (res && res.success && !res.fallback) {
      if (authPollInterval) clearInterval(authPollInterval);
      showAlert('GitHub connected successfully!', 'success');
      refreshPopupState();
    } else if (res && res.fallback) {
      showAlert('Please complete authorization in the opened browser tab.', 'info');
    }
  });
}

/**
 * Disconnect GitHub Account
 */
function handleDisconnect() {
  chrome.runtime.sendMessage({ type: 'LOGOUT' }, (res) => {
    renderDisconnectedState();
    showAlert('Disconnected successfully.', 'info');
  });
}

/**
 * Open In-Extension Dashboard View
 */
async function handleOpenDashboard() {
  const data = await chrome.storage.local.get(['jwtToken', 'githubUser', 'githubUsername', 'selectedRepository']);
  if (!data.jwtToken) {
    showAlert('Please connect your GitHub account first.', 'error');
    return;
  }

  const username = data.githubUsername || (data.githubUser && (data.githubUser.githubUsername || data.githubUser.username)) || '';
  if (dashUserBadge) {
    dashUserBadge.textContent = username ? `@${username}` : '';
  }

  // Switch to Dashboard View
  if (mainView && dashboardView) {
    mainView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
  }

  await loadDashboardData();
}

/**
 * Back to Main Settings View
 */
function handleBackToSettings() {
  if (mainView && dashboardView) {
    dashboardView.classList.add('hidden');
    mainView.classList.remove('hidden');
  }
}

/**
 * Open Configured Repository on GitHub
 */
async function handleOpenGithubRepo() {
  const data = await chrome.storage.local.get(['selectedRepository']);
  if (data.selectedRepository) {
    chrome.tabs.create({ url: `https://github.com/${data.selectedRepository}` });
  } else {
    showAlert('No repository configured yet.', 'info');
  }
}

/**
 * Fetch and Render In-Extension Dashboard Statistics and Recent Solutions
 */
async function loadDashboardData() {
  if (!dashboardLoading || !dashboardError || !dashboardContent) return;

  dashboardLoading.classList.remove('hidden');
  dashboardError.classList.add('hidden');
  dashboardContent.classList.add('hidden');

  try {
    const [statsResult, solutionsResult] = await Promise.all([
      new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'FETCH_DASHBOARD_STATS' }, (res) => {
          if (chrome.runtime.lastError) {
            return resolve({ success: false, error: chrome.runtime.lastError.message });
          }
          resolve(res || { success: false, error: 'No response from background service worker.' });
        });
      }),
      new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'FETCH_RECENT_SOLUTIONS', limit: 10 }, (res) => {
          if (chrome.runtime.lastError) {
            return resolve({ success: false, error: chrome.runtime.lastError.message });
          }
          resolve(res || { success: false, error: 'No response from background service worker.' });
        });
      })
    ]);

    dashboardLoading.classList.add('hidden');

    if (!statsResult || !statsResult.success || !solutionsResult || !solutionsResult.success) {
      const errMsg = (statsResult && statsResult.error) || (solutionsResult && solutionsResult.error) || 'Failed to load dashboard data from server.';
      if (dashboardErrorMsg) dashboardErrorMsg.textContent = errMsg;
      dashboardError.classList.remove('hidden');
      return;
    }

    // Render Stats
    if (statTotalSolved) statTotalSolved.textContent = Number(statsResult.total) || 0;
    if (statEasy) statEasy.textContent = Number(statsResult.easy) || 0;
    if (statMedium) statMedium.textContent = Number(statsResult.medium) || 0;
    if (statHard) statHard.textContent = Number(statsResult.hard) || 0;
    if (statCurrentStreak) statCurrentStreak.textContent = `${Number(statsResult.currentStreak) || 0}d`;
    if (statLongestStreak) statLongestStreak.textContent = `${Number(statsResult.longestStreak) || 0}d`;
    if (statThisWeek) statThisWeek.textContent = Number(statsResult.thisWeek) || 0;

    // Render Recent Solutions
    const solutions = Array.isArray(solutionsResult.solutions) ? solutionsResult.solutions : [];
    renderRecentSolutions(solutions);

    dashboardContent.classList.remove('hidden');
  } catch (err) {
    dashboardLoading.classList.add('hidden');
    if (dashboardErrorMsg) dashboardErrorMsg.textContent = err.message || 'Unexpected error loading dashboard.';
    dashboardError.classList.remove('hidden');
  }
}

/**
 * Render List of Recent Solutions
 */
function renderRecentSolutions(solutions) {
  if (!solutionList || !emptySolutionsState) return;
  solutionList.innerHTML = '';

  if (!solutions || solutions.length === 0) {
    emptySolutionsState.classList.remove('hidden');
    solutionList.classList.add('hidden');
    return;
  }

  emptySolutionsState.classList.add('hidden');
  solutionList.classList.remove('hidden');

  solutions.forEach((sol) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'solution-item';

    const diff = sol.difficulty || 'Easy';
    const diffClass = `sol-pill-${diff.toLowerCase()}`;
    const problemNum = sol.problemNumber || '';
    const problemTitle = escapeHtml(sol.problemTitle || 'Untitled Solution');
    const lang = escapeHtml(sol.language || 'Code');
    const dateStr = formatDate(sol.submittedAt || sol.createdAt);

    // Commit URL with fallback to repo file path
    const targetUrl = sol.githubCommitUrl || (sol.githubPath ? `https://github.com/${sol.githubPath}` : '');
    const hasValidLink = Boolean(targetUrl);

    itemEl.innerHTML = `
      <div class="sol-header">
        <div class="sol-title-wrap">
          <span class="sol-number">#${escapeHtml(String(problemNum))}</span>
          <span class="sol-title" title="${problemTitle}">${problemTitle}</span>
        </div>
        <span class="sol-pill ${diffClass}">${escapeHtml(diff)}</span>
      </div>
      <div class="sol-meta-row">
        <div class="sol-meta-left">
          <span class="sol-lang">${lang}</span>
          <span class="sol-date">${dateStr}</span>
        </div>
        ${hasValidLink ? `<button type="button" class="sol-commit-btn">View Commit ↗</button>` : ''}
      </div>
    `;

    if (hasValidLink) {
      const commitBtn = itemEl.querySelector('.sol-commit-btn');
      if (commitBtn) {
        commitBtn.addEventListener('click', (e) => {
          e.preventDefault();
          chrome.tabs.create({ url: targetUrl });
        });
      }
    }

    solutionList.appendChild(itemEl);
  });
}

/**
 * Friendly Date Formatter
 */
function formatDate(isoString) {
  if (!isoString) return 'Recent';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Recent';
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Recent';
  }
}

/**
 * HTML Escape Helper
 */
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Refresh Repositories List
 */
function handleRefreshRepositories() {
  refreshReposBtn.disabled = true;
  refreshReposBtn.style.opacity = '0.6';
  showAlert('Fetching repositories from GitHub...', 'info');

  chrome.runtime.sendMessage({ type: 'FETCH_REPOSITORIES' }, (res) => {
    refreshReposBtn.disabled = false;
    refreshReposBtn.style.opacity = '1';

    if (res && res.success) {
      chrome.storage.local.get(['selectedRepository'], (data) => {
        populateRepoDropdown(res.repositories, data.selectedRepository || '');
        const count = Array.isArray(res.repositories) ? res.repositories.length : 0;
        showAlert(`Loaded ${count} repositories.`, 'success');
      });
    } else {
      showAlert(res?.error || 'Unable to load your GitHub repositories.', 'error');
    }
  });
}

/**
 * Save Selected Repository with Write Permission Verification
 */
function handleSaveRepository() {
  let repoValue = '';

  if (isManualEntryVisible && repoInput.value.trim()) {
    repoValue = repoInput.value.trim();
  } else {
    repoValue = repoSelect.value.trim() || repoInput.value.trim();
  }

  if (!repoValue) {
    showAlert('Please select a GitHub repository before saving.', 'error');
    return;
  }

  // Support full GitHub URLs (e.g., https://github.com/owner/repo or github.com/owner/repo)
  let cleanedRepo = repoValue.trim().replace(/\/+$/, '');
  const urlMatch = cleanedRepo.match(/github\.com\/([^\/]+\/[^\/]+)/i);
  if (urlMatch) {
    cleanedRepo = urlMatch[1];
  }

  // Validate format: owner/repo
  const repoPattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
  if (!repoPattern.test(cleanedRepo) || cleanedRepo.includes('http://') || cleanedRepo.includes('https://')) {
    showAlert('Invalid format. Please use username/repository (e.g., alice/leetcode-solutions).', 'error');
    return;
  }

  saveRepoBtn.disabled = true;
  saveRepoBtn.textContent = 'Validating write access...';

  chrome.runtime.sendMessage(
    {
      type: 'SET_REPOSITORY',
      repository: cleanedRepo,
      branch: 'main'
    },
    (res) => {
      saveRepoBtn.disabled = false;
      saveRepoBtn.textContent = 'Save Repository';

      if (res && res.success) {
        showAlert(`Repository saved: ${cleanedRepo}`, 'success');
        repoInput.value = cleanedRepo;
      } else {
        showAlert(res?.error || "This repository cannot be used because you don't have write access.", 'error');
      }
    }
  );
}

/**
 * Toggle between Dropdown and Manual Repository Input
 */
function handleToggleManualEntry() {
  isManualEntryVisible = !isManualEntryVisible;
  if (isManualEntryVisible) {
    manualRepoContainer.classList.remove('hidden');
    toggleManualRepoBtn.textContent = 'Use dropdown selection';
    repoInput.focus();
  } else {
    manualRepoContainer.classList.add('hidden');
    toggleManualRepoBtn.textContent = 'Enter repository manually';
  }
}

/**
 * Handle Auto Save toggle change
 */
async function handleToggleAutoSave() {
  const isEnabled = autoSaveToggle.checked;
  await chrome.storage.local.set({ autoSave: isEnabled });
  showAlert(`Auto Save ${isEnabled ? 'ON' : 'OFF'}`, 'info');
}

/**
 * Handle Create README toggle change
 */
async function handleToggleCreateReadme() {
  const isEnabled = createReadmeToggle.checked;
  await chrome.storage.local.set({ createReadme: isEnabled });
  showAlert(`Create README ${isEnabled ? 'ON' : 'OFF'}`, 'info');
}

// ==============================================================================
// 4. Alert Helper
// ==============================================================================

function showAlert(message, type = 'info') {
  if (alertTimeoutId) {
    clearTimeout(alertTimeoutId);
  }

  statusAlert.className = `status-alert alert-${type}`;
  statusAlertText.textContent = message;
  statusAlert.classList.remove('hidden');

  alertTimeoutId = setTimeout(() => {
    hideAlert();
  }, 4000);
}

function hideAlert() {
  statusAlert.classList.add('hidden');
  if (alertTimeoutId) {
    clearTimeout(alertTimeoutId);
    alertTimeoutId = null;
  }
}
