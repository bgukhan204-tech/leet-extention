/**
 * LeetCode2Git - Content Script
 * Detects accepted LeetCode submissions and prompts the user to save to GitHub.
 */

(() => {
  let isObserverActive = false;
  let lastTriggeredTime = 0;
  let activeModal = null;
  let lastKnownUrl = window.location.href;

  console.log('[LeetCode2Git] Content script initialized on:', window.location.href);

  // Initialize submission watcher
  initSubmissionWatcher();

  // Watch for single-page application URL transitions (LeetCode SPA navigation)
  setInterval(() => {
    if (window.location.href !== lastKnownUrl) {
      lastKnownUrl = window.location.href;
      // Reset trigger cooldown on page/problem change
      lastTriggeredTime = 0;
    }
  }, 1000);

  function initSubmissionWatcher() {
    if (isObserverActive) return;

    // Observe DOM mutations to detect submission result overlays / banners
    const observer = new MutationObserver((mutations) => {
      // Debounce trigger (ignore within 4s of previous trigger)
      const now = Date.now();
      if (now - lastTriggeredTime < 4000) return;

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            checkForAcceptedResult(node);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    isObserverActive = true;
  }

  /**
   * Check if an element or its descendants contain "Accepted" submission result
   */
  async function checkForAcceptedResult(targetNode) {
    if (!targetNode || typeof targetNode.querySelector !== 'function') return;

    // Common LeetCode submission success selectors & texts
    const isAccepted =
      targetNode.matches?.('[data-e2e-locator="submission-result"]') ||
      targetNode.querySelector?.('[data-e2e-locator="submission-result"]') ||
      targetNode.matches?.('span[class*="text-green"], div[class*="text-green"], span[class*="text-sd-green"]') ||
      targetNode.querySelector?.('span[class*="text-green"], div[class*="text-green"], span[class*="text-sd-green"]') ||
      targetNode.textContent?.includes('Accepted');

    if (!isAccepted) return;

    // Confirm that the text literally contains "Accepted"
    const text = targetNode.textContent || '';
    if (!/\bAccepted\b/i.test(text)) return;

    // Ensure it is in a submission result context (not just problem description text)
    const isResultContext =
      targetNode.closest?.('[data-layout-path]') ||
      targetNode.closest?.('[class*="result"]') ||
      targetNode.closest?.('[class*="submission"]') ||
      targetNode.closest?.('div[role="tabpanel"]') ||
      document.querySelector('[data-e2e-locator="submission-result"]') ||
      text.includes('Runtime') ||
      text.includes('Memory') ||
      text.includes('Beats');

    if (!isResultContext) return;

    // Check with extension background if user is authenticated and autoSave is enabled
    chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' }, async (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[LeetCode2Git] Could not reach background worker:', chrome.runtime.lastError.message);
        return;
      }

      if (!response || !response.isAuthenticated) {
        console.log('[LeetCode2Git] Accepted detected, but user is not connected to GitHub.');
        return;
      }

      if (response.autoSave === false) {
        console.log('[LeetCode2Git] Auto-save prompt is disabled in settings.');
        return;
      }

      // Mark trigger timestamp
      lastTriggeredTime = Date.now();

      // Extract problem details
      const problemData = extractProblemDetails();
      const code = extractSolutionCode();

      // Show confirmation modal
      showConfirmationModal({
        ...problemData,
        code,
        repository: response.repository || 'Not configured',
        branch: response.branch || 'main'
      });
    });
  }

  /**
   * Extract problem number, title, difficulty, and language from LeetCode page
   */
  function extractProblemDetails() {
    let problemNumber = '';
    let problemTitle = '';
    let difficulty = 'Easy';
    let language = 'Python';

    // 1. Title & Number Extraction
    // Look for heading like "1. Two Sum"
    const titleCandidates = [
      document.querySelector('[data-cy="question-title"]'),
      document.querySelector('[data-e2e-locator="question-title"]'),
      document.querySelector('.text-title-large'),
      document.querySelector('div[class*="text-title-large"]'),
      document.querySelector('div[class*="text-lg"][class*="font-medium"]'),
      document.querySelector('a[href*="/problems/"][class*="text-"]')
    ];

    for (const el of titleCandidates) {
      if (el && el.textContent.trim()) {
        const fullText = el.textContent.trim();
        const match = fullText.match(/^(\d+)\.\s*(.+)$/);
        if (match) {
          problemNumber = match[1];
          problemTitle = match[2];
          break;
        } else if (fullText.length > 1 && fullText.length < 90) {
          problemTitle = fullText;
        }
      }
    }

    // 2. Fallback via document.title (e.g. "1. Two Sum - LeetCode" or "Two Sum - LeetCode")
    if (!problemTitle && document.title) {
      const docTitleMatch = document.title.match(/^(\d+)\.\s*(.+?)(?:\s*-\s*LeetCode)?$/i);
      if (docTitleMatch) {
        problemNumber = problemNumber || docTitleMatch[1];
        problemTitle = docTitleMatch[2].trim();
      } else {
        const cleanDocTitle = document.title.replace(/\s*-\s*LeetCode.*$/i, '').trim();
        if (cleanDocTitle && cleanDocTitle.length < 90) {
          problemTitle = cleanDocTitle;
        }
      }
    }

    // 3. Fallback: extract from URL path (e.g., leetcode.com/problems/two-sum/)
    const pathParts = window.location.pathname.split('/');
    const problemIdx = pathParts.indexOf('problems');
    if (problemIdx !== -1 && pathParts[problemIdx + 1]) {
      const slug = pathParts[problemIdx + 1];
      if (!problemTitle || problemTitle === 'Two Sum') {
        problemTitle = slug
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }

    // Default fallback values if title was not detected
    if (!problemTitle) problemTitle = 'Solution';
    if (!problemNumber) problemNumber = '1';

    // 4. Difficulty Extraction
    const diffCandidates = document.querySelectorAll(
      'div[class*="text-difficulty-"], div[class*="text-olive"], div[class*="text-yellow"], div[class*="text-pink"], span[class*="text-difficulty-"], div[class*="text-easy"], div[class*="text-medium"], div[class*="text-hard"], span[class*="text-easy"], span[class*="text-medium"], span[class*="text-hard"]'
    );

    for (const el of diffCandidates) {
      const txt = (el.textContent || '').trim();
      if (/^(Easy|Medium|Hard)$/i.test(txt)) {
        difficulty = txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
        break;
      }
    }

    // 5. Language Extraction
    const langBtn =
      document.querySelector('button[id^="headlessui-listbox-button"]') ||
      document.querySelector('[data-cy="lang-select"]') ||
      document.querySelector('.ant-select-selection-selected-value') ||
      document.querySelector('button[class*="rounded"][class*="text-xs"]');

    if (langBtn && langBtn.textContent) {
      const txt = langBtn.textContent.trim();
      if (txt.length > 0 && txt.length < 25) {
        language = txt;
      }
    }

    return { problemNumber, problemTitle, difficulty, language };
  }

  /**
   * Safely extract solution code from submission view, Monaco Editor, or Textarea
   */
  function extractSolutionCode() {
    try {
      // 1. Try submission detail panel code element first (exact submitted code)
      const submissionCodeEl =
        document.querySelector('[data-e2e-locator="submission-code"]') ||
        document.querySelector('.submission-detail pre') ||
        document.querySelector('div[class*="submission"] pre') ||
        document.querySelector('pre[class*="language-"]');

      if (submissionCodeEl && submissionCodeEl.textContent && submissionCodeEl.textContent.trim().length > 10) {
        return submissionCodeEl.textContent.trim();
      }

      // 2. Try Monaco view-lines
      const lines = document.querySelectorAll('.monaco-editor .view-lines .view-line');
      if (lines && lines.length > 0) {
        const codeLines = Array.from(lines).map((l) => l.textContent || '');
        const fullCode = codeLines.join('\n').trim();
        if (fullCode.length > 5) {
          return fullCode;
        }
      }

      // 3. Try textarea fallback
      const textareas = document.querySelectorAll('textarea');
      for (const ta of textareas) {
        if (ta.value && ta.value.length > 20) {
          return ta.value;
        }
      }
    } catch (e) {
      console.warn('[LeetCode2Git] Code extraction failed, using fallback paste:', e);
    }

    return '# Paste or review your submitted code here\n';
  }

  /**
   * Render in-page modal to confirm and upload solution
   */
  async function showConfirmationModal(details) {
    // Remove existing modal if any
    if (activeModal) {
      activeModal.remove();
      activeModal = null;
    }

    const overlay = document.createElement('div');
    overlay.id = 'leetcode2git-overlay';

    const diffClass = `lc2g-badge-${(details.difficulty || 'easy').toLowerCase()}`;

    overlay.innerHTML = `
      <div id="leetcode2git-modal">
        <div class="lc2g-header">
          <div class="lc2g-brand">
            <div class="lc2g-logo-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </div>
            <h2 class="lc2g-brand-title">LeetCode<span>2Git</span></h2>
          </div>
          <button id="lc2gCloseBtn" class="lc2g-close-btn" aria-label="Close modal">&times;</button>
        </div>

        <div id="lc2gModalBody" class="lc2g-body">
          <div class="lc2g-success-banner">
            <span>✓ Accepted Submission Detected!</span>
          </div>

          <div id="lc2gDuplicateNotice" class="lc2g-duplicate-banner" style="display: none;">
            ⚠️ <strong>Existing Solution Found:</strong> A solution file already exists in your repository for this problem. Clicking save will update it.
          </div>

          <div class="lc2g-info-card">
            <div class="lc2g-info-item full-width">
              <span class="lc2g-info-label">Problem</span>
              <span class="lc2g-info-value">
                #${details.problemNumber} ${details.problemTitle}
                <span class="lc2g-badge ${diffClass}">${details.difficulty}</span>
              </span>
            </div>
            <div class="lc2g-info-item">
              <span class="lc2g-info-label">Language</span>
              <span class="lc2g-info-value">${details.language}</span>
            </div>
            <div class="lc2g-info-item">
              <span class="lc2g-info-label">Target Repository</span>
              <span class="lc2g-info-value">${details.repository} (${details.branch})</span>
            </div>
          </div>

          <div class="lc2g-code-section">
            <div class="lc2g-section-label">
              <span>Solution Code</span>
              <span style="font-size: 11px; color: #6e7681;">Review or edit before saving</span>
            </div>
            <textarea id="lc2gCodeEditor" class="lc2g-code-editor" spellcheck="false">${escapeHtml(details.code)}</textarea>
          </div>

          <div class="lc2g-grid-inputs">
            <div class="lc2g-input-group">
              <label for="lc2gTimeComplexity">Time Complexity</label>
              <input type="text" id="lc2gTimeComplexity" placeholder="e.g. O(n)" value="O(n)" />
            </div>
            <div class="lc2g-input-group">
              <label for="lc2gSpaceComplexity">Space Complexity</label>
              <input type="text" id="lc2gSpaceComplexity" placeholder="e.g. O(1)" value="O(1)" />
            </div>
          </div>
        </div>

        <div id="lc2gModalFooter" class="lc2g-footer">
          <button id="lc2gCancelBtn" class="lc2g-btn lc2g-btn-secondary">Cancel</button>
          <button id="lc2gSaveBtn" class="lc2g-btn lc2g-btn-primary">
            <span>Save to GitHub</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    activeModal = overlay;

    // Attach Event Handlers
    const closeBtn = overlay.querySelector('#lc2gCloseBtn');
    const cancelBtn = overlay.querySelector('#lc2gCancelBtn');
    const saveBtn = overlay.querySelector('#lc2gSaveBtn');
    const codeEditor = overlay.querySelector('#lc2gCodeEditor');
    const timeCompInput = overlay.querySelector('#lc2gTimeComplexity');
    const spaceCompInput = overlay.querySelector('#lc2gSpaceComplexity');
    const duplicateNotice = overlay.querySelector('#lc2gDuplicateNotice');

    closeBtn.addEventListener('click', () => closeModal());
    cancelBtn.addEventListener('click', () => closeModal());

    // Check if duplicate solution already exists in repository
    let isOverwrite = false;
    chrome.runtime.sendMessage(
      {
        type: 'CHECK_DUPLICATE_SOLUTION',
        problemNumber: details.problemNumber,
        problemTitle: details.problemTitle,
        difficulty: details.difficulty,
        language: details.language,
        repository: details.repository,
        branch: details.branch
      },
      (res) => {
        if (res && res.exists) {
          isOverwrite = true;
          if (duplicateNotice) duplicateNotice.style.display = 'block';
          const btnSpan = saveBtn.querySelector('span');
          if (btnSpan) btnSpan.textContent = 'Update on GitHub';
        }
      }
    );

    // Handle Upload
    saveBtn.addEventListener('click', async () => {
      const codeToUpload = codeEditor.value.trim();
      if (!codeToUpload) {
        alert('Please provide your solution code.');
        return;
      }

      saveBtn.disabled = true;
      cancelBtn.disabled = true;
      saveBtn.innerHTML = '<div class="lc2g-spinner"></div><span>Uploading to GitHub...</span>';

      chrome.runtime.sendMessage(
        {
          type: 'UPLOAD_SOLUTION',
          problemNumber: details.problemNumber,
          problemTitle: details.problemTitle,
          difficulty: details.difficulty,
          language: details.language,
          code: codeToUpload,
          timeComplexity: timeCompInput.value.trim() || 'O(n)',
          spaceComplexity: spaceCompInput.value.trim() || 'O(1)',
          repository: details.repository,
          branch: details.branch,
          overwrite: isOverwrite
        },
        (uploadRes) => {
          if (uploadRes && uploadRes.success) {
            renderSuccessState(uploadRes);
          } else {
            saveBtn.disabled = false;
            cancelBtn.disabled = false;
            saveBtn.innerHTML = '<span>Retry Save</span>';
            const errorMsg = uploadRes?.message || uploadRes?.error || 'Unknown error occurred.';
            alert(`Upload Failed: ${errorMsg}`);
          }
        }
      );
    });
  }

  function renderSuccessState(res) {
    const modalBody = activeModal.querySelector('#lc2gModalBody');
    const modalFooter = activeModal.querySelector('#lc2gModalFooter');

    modalBody.innerHTML = `
      <div class="lc2g-success-view">
        <div class="lc2g-success-icon">🎉</div>
        <h3 class="lc2g-success-title">Solution Uploaded Successfully!</h3>
        <p class="lc2g-success-desc">
          Created commit: <code>${escapeHtml(res.commitMessage || 'Add LeetCode solution')}</code>
        </p>
      </div>
    `;

    modalFooter.innerHTML = `
      <button id="lc2gCloseDoneBtn" class="lc2g-btn lc2g-btn-secondary">Close</button>
      <a href="${res.commitUrl || res.fileUrl || '#'}" target="_blank" rel="noopener noreferrer" class="lc2g-btn lc2g-btn-primary">
        Open on GitHub ↗
      </a>
    `;

    modalFooter.querySelector('#lc2gCloseDoneBtn').addEventListener('click', () => closeModal());
  }

  function closeModal() {
    if (activeModal) {
      activeModal.remove();
      activeModal = null;
    }
  }

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
