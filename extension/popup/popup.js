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

const statusAlert = document.getElementById('statusAlert');
const statusAlertText = document.getElementById('statusAlertText');
const closeAlertBtn = document.getElementById('closeAlertBtn');

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

  // Dashboard Button
  if (dashboardBtn) {
    dashboardBtn.addEventListener('click', handleOpenDashboard);
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
 * Open Dashboard / Repository
 */
async function handleOpenDashboard() {
  const data = await chrome.storage.local.get(['jwtToken', 'selectedRepository']);
  if (!data.jwtToken) {
    showAlert('Please connect your GitHub account first.', 'error');
    return;
  }

  if (data.selectedRepository) {
    chrome.tabs.create({ url: `https://github.com/${data.selectedRepository}` });
  } else {
    showAlert('Please select a GitHub repository before opening Dashboard.', 'info');
  }
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
