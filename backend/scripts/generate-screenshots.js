const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const storeAssetsDir = path.resolve(__dirname, '../../store-assets');
const tempDir = path.resolve(__dirname, '../../temp-screenshots');

if (!fs.existsSync(storeAssetsDir)) {
  fs.mkdirSync(storeAssetsDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// -----------------------------------------------------------------------------
// 1. Template: Screenshot 1 - Extension Popup Connected
// -----------------------------------------------------------------------------
const popupCss = fs.readFileSync(path.resolve(__dirname, '../../extension/popup/popup.css'), 'utf-8');

const html1 = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Screenshot 1 - Connected</title>
  <style>
    ${popupCss}
    /* Wrap in browser backdrop */
    html, body {
      width: 1280px;
      height: 800px;
      margin: 0;
      padding: 0;
      background: radial-gradient(circle at 50% 30%, #1c2128 0%, #0d1117 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .browser-frame {
      width: 1100px;
      height: 700px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .browser-top {
      height: 44px;
      background: #0d1117;
      border-bottom: 1px solid #30363d;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
    }
    .window-dots {
      display: flex;
      gap: 8px;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .dot.red { background: #ff5f56; }
    .dot.yellow { background: #ffbd2e; }
    .dot.green { background: #27c93f; }
    .address-bar {
      flex: 1;
      height: 28px;
      background: #21262d;
      border-radius: 6px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      color: #8b949e;
      font-size: 13px;
    }
    .browser-body {
      flex: 1;
      background: #0d1117;
      position: relative;
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
      padding: 24px 48px;
      background-image: 
        radial-gradient(#21262d 1px, transparent 1px);
      background-size: 24px 24px;
    }
    .popup-wrapper {
      width: 380px;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 12px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08);
      overflow: hidden;
    }
    .feature-callout {
      position: absolute;
      left: 60px;
      top: 100px;
      max-width: 520px;
    }
    .feature-tag {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(255, 161, 22, 0.15);
      border: 1px solid rgba(255, 161, 22, 0.35);
      color: #ffa116;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
      letter-spacing: 0.5px;
    }
    .feature-title {
      font-size: 34px;
      font-weight: 700;
      color: #f0f6fc;
      line-height: 1.25;
      margin-bottom: 16px;
    }
    .feature-desc {
      font-size: 16px;
      color: #8b949e;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .feature-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #c9d1d9;
      font-size: 14px;
    }
    .check-icon {
      color: #3fb950;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="browser-frame">
    <div class="browser-top">
      <div class="window-dots">
        <div class="dot red"></div>
        <div class="dot yellow"></div>
        <div class="dot green"></div>
      </div>
      <div class="address-bar">https://leetcode.com/problems/two-sum/</div>
    </div>
    <div class="browser-body">
      
      <div class="feature-callout">
        <div class="feature-tag">CHROME EXTENSION POPUP</div>
        <h1 class="feature-title">Seamless GitHub Sync for LeetCode</h1>
        <p class="feature-desc">Connect your GitHub account in 1 click and automatically back up every genuinely solved problem to your preferred repository.</p>
        <div class="feature-list">
          <div class="feature-item"><span class="check-icon">✓</span> Multi-User OAuth with Secure Isolated Session</div>
          <div class="feature-item"><span class="check-icon">✓</span> Custom Repository & Default Branch Selection</div>
          <div class="feature-item"><span class="check-icon">✓</span> Automatic Prompt & Structured README Generation</div>
          <div class="feature-item"><span class="check-icon">✓</span> Zero Fake Commits &bull; 100% Genuine Activity</div>
        </div>
      </div>

      <div class="popup-wrapper">
        <div class="popup-container">
          <header class="app-header">
            <div class="brand-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </div>
            <div class="brand-headings">
              <h1 class="brand-title">LeetCode<span class="accent">2Git</span></h1>
              <p class="brand-subtitle">Sync accepted solutions to your GitHub</p>
            </div>
          </header>

          <section class="card status-card">
            <div class="status-row">
              <span class="status-label">GitHub</span>
              <div class="status-badge-container">
                <span class="status-dot connected"></span>
                <span class="status-badge connected">Connected</span>
              </div>
            </div>
            <div class="auth-section">
              <div class="user-profile-row">
                <img class="user-avatar" src="https://avatars.githubusercontent.com/u/583231" alt="Avatar" style="display:block; border-radius:50%;" />
                <div class="user-meta">
                  <span class="user-status-label">Connected as</span>
                  <span class="username-text">@developer</span>
                </div>
                <button class="btn btn-outline-danger btn-sm" type="button">Disconnect</button>
              </div>
            </div>
          </section>

          <section class="card form-card">
            <div class="form-header-row">
              <label class="form-label">Repository</label>
              <button class="btn-icon-link" type="button">
                <span>Refresh</span>
              </button>
            </div>
            <div class="select-wrapper">
              <select class="form-select">
                <option value="developer/leetcode-solutions" selected>developer/leetcode-solutions</option>
                <option value="developer/algorithms">developer/algorithms</option>
                <option value="developer/coding-practice">developer/coding-practice</option>
              </select>
            </div>
            <div class="repo-action-row" style="margin-top: 12px;">
              <button class="btn btn-primary btn-block" type="button">Save Repository</button>
            </div>
          </section>

          <section class="card settings-card">
            <h2 class="section-title">Settings</h2>
            <div class="setting-item">
              <div class="setting-text">
                <span class="setting-name">Auto Save</span>
                <span class="setting-desc">Prompt when LeetCode submission is Accepted</span>
              </div>
              <label class="switch-control">
                <input type="checkbox" checked />
                <span class="switch-slider"></span>
              </label>
            </div>
            <div class="setting-item">
              <div class="setting-text">
                <span class="setting-name">Create README</span>
                <span class="setting-desc">Include problem statement with solution</span>
              </div>
              <label class="switch-control">
                <input type="checkbox" checked />
                <span class="switch-slider"></span>
              </label>
            </div>
          </section>

          <section class="dashboard-section">
            <button class="btn btn-secondary btn-block" type="button">Dashboard</button>
          </section>

          <footer class="app-footer">
            <span class="footer-meta">LeetCode2Git • Public Multi-User • v1.0.0</span>
          </footer>
        </div>
      </div>

    </div>
  </div>
</body>
</html>`;

// -----------------------------------------------------------------------------
// 2. Template: Screenshot 2 - In-Page LeetCode Accepted Overlay
// -----------------------------------------------------------------------------
const contentCss = fs.readFileSync(path.resolve(__dirname, '../../extension/content/content.css'), 'utf-8');

const html2 = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Screenshot 2 - Accepted Modal</title>
  <style>
    ${contentCss}
    html, body {
      width: 1280px;
      height: 800px;
      margin: 0;
      padding: 0;
      background: #1a1a1a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      position: relative;
    }
    /* LeetCode Page Background Simulation */
    .lc-mock-bg {
      width: 1280px;
      height: 800px;
      background: #1a1a1a;
      display: flex;
      flex-direction: column;
    }
    .lc-nav {
      height: 50px;
      background: #282828;
      border-bottom: 1px solid #3e3e3e;
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 20px;
    }
    .lc-logo {
      color: #ffa116;
      font-weight: bold;
      font-size: 16px;
    }
    .lc-split {
      flex: 1;
      display: flex;
      background: #1e1e1e;
    }
    .lc-left {
      width: 50%;
      border-right: 1px solid #333;
      padding: 24px;
      color: #eff1f6;
    }
    .lc-problem-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .lc-easy-badge {
      font-size: 12px;
      background: rgba(0, 184, 163, 0.15);
      color: #00b8a3;
      padding: 2px 8px;
      border-radius: 12px;
    }
    .lc-right {
      width: 50%;
      background: #181818;
      padding: 20px;
      font-family: monospace;
      color: #abb2bf;
    }
    /* Modal Override to center in 1280x800 */
    #leetcode2git-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 1280px;
      height: 800px;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(5px);
    }
    #leetcode2git-modal {
      width: 580px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1);
    }
  </style>
</head>
<body>
  <div class="lc-mock-bg">
    <div class="lc-nav">
      <div class="lc-logo">LeetCode</div>
      <div style="color: #999; font-size: 14px;">Problems &bull; Two Sum</div>
    </div>
    <div class="lc-split">
      <div class="lc-left">
        <div class="lc-problem-title">
          1. Two Sum <span class="lc-easy-badge">Easy</span>
        </div>
        <p style="color: #8c8c8c; font-size: 14px; line-height: 1.6;">
          Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.
        </p>
        <div style="margin-top: 24px; padding: 12px; background: rgba(46,160,67,0.15); border: 1px solid #2ea043; border-radius: 6px; color: #3fb950; font-size: 14px; font-weight: 600;">
          ✓ Accepted &bull; Runtime: 48 ms &bull; Memory: 17.6 MB
        </div>
      </div>
      <div class="lc-right">
        <pre style="line-height: 1.5; font-size: 13px;">class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        prevMap = {} # val -> index
        for i, n in enumerate(nums):
            diff = target - n
            if diff in prevMap:
                return [prevMap[diff], i]
            prevMap[n] = i</pre>
      </div>
    </div>
  </div>

  <!-- LeetCode2Git Overlay Modal -->
  <div id="leetcode2git-overlay">
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
        <button class="lc2g-close-btn">&times;</button>
      </div>

      <div class="lc2g-body">
        <div class="lc2g-success-banner">
          <span>✓ Accepted Submission Detected!</span>
        </div>

        <div class="lc2g-info-card">
          <div class="lc2g-info-item full-width">
            <span class="lc2g-info-label">Problem</span>
            <span class="lc2g-info-value">
              #1 Two Sum
              <span class="lc2g-badge lc2g-badge-easy">Easy</span>
            </span>
          </div>
          <div class="lc2g-info-item">
            <span class="lc2g-info-label">Language</span>
            <span class="lc2g-info-value">Python3</span>
          </div>
          <div class="lc2g-info-item">
            <span class="lc2g-info-label">Target Repository</span>
            <span class="lc2g-info-value">developer/leetcode-solutions (main)</span>
          </div>
        </div>

        <div class="lc2g-code-section">
          <div class="lc2g-section-label">
            <span>Solution Code</span>
            <span style="font-size: 11px; color: #6e7681;">Review or edit before saving</span>
          </div>
          <textarea class="lc2g-code-editor" style="height: 120px;" spellcheck="false">class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        prevMap = {} # val -> index
        for i, n in enumerate(nums):
            diff = target - n
            if diff in prevMap:
                return [prevMap[diff], i]
            prevMap[n] = i</textarea>
        </div>

        <div class="lc2g-grid-inputs">
          <div class="lc2g-input-group">
            <label>Time Complexity</label>
            <input type="text" value="O(n)" />
          </div>
          <div class="lc2g-input-group">
            <label>Space Complexity</label>
            <input type="text" value="O(n)" />
          </div>
        </div>
      </div>

      <div class="lc2g-footer">
        <button class="lc2g-btn lc2g-btn-secondary">Cancel</button>
        <button class="lc2g-btn lc2g-btn-primary">
          <span>Save to GitHub</span>
        </button>
      </div>
    </div>
  </div>
</body>
</html>`;

// -----------------------------------------------------------------------------
// 3. Template: Screenshot 3 - GitHub Repository Upload View
// -----------------------------------------------------------------------------
const html3 = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Screenshot 3 - GitHub Upload</title>
  <style>
    html, body {
      width: 1280px;
      height: 800px;
      margin: 0;
      padding: 0;
      background: #0d1117;
      color: #c9d1d9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      overflow: hidden;
    }
    .gh-header {
      height: 60px;
      background: #161b22;
      border-bottom: 1px solid #30363d;
      display: flex;
      align-items: center;
      padding: 0 32px;
      gap: 16px;
    }
    .gh-logo {
      color: #fff;
      font-weight: 700;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .gh-repo-title {
      font-size: 18px;
      color: #58a6ff;
    }
    .gh-badge {
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 12px;
      color: #8b949e;
    }
    .main-wrap {
      max-width: 1120px;
      margin: 28px auto;
      padding: 0 16px;
    }
    .commit-bar {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .commit-msg {
      color: #f0f6fc;
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .commit-author {
      color: #8b949e;
      font-size: 13px;
    }
    .commit-hash {
      font-family: monospace;
      color: #58a6ff;
      background: rgba(56, 139, 253, 0.1);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .file-table {
      width: 100%;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .file-row {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      border-bottom: 1px solid #21262d;
      font-size: 13px;
    }
    .file-row:last-child {
      border-bottom: none;
    }
    .file-name {
      width: 280px;
      color: #58a6ff;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: monospace;
    }
    .file-desc {
      flex: 1;
      color: #8b949e;
    }
    .file-time {
      color: #6e7681;
      font-size: 12px;
    }
    .readme-card {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      overflow: hidden;
    }
    .readme-header {
      background: #161b22;
      padding: 10px 16px;
      border-bottom: 1px solid #30363d;
      font-size: 13px;
      font-weight: 600;
      color: #f0f6fc;
    }
    .readme-body {
      padding: 24px;
    }
    .readme-title {
      font-size: 24px;
      font-weight: 700;
      color: #f0f6fc;
      margin-bottom: 12px;
      border-bottom: 1px solid #21262d;
      padding-bottom: 8px;
    }
    .badges-row {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .pill {
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .pill.easy { background: rgba(0, 184, 163, 0.2); color: #00b8a3; border: 1px solid rgba(0, 184, 163, 0.3); }
    .pill.py { background: rgba(56, 139, 253, 0.2); color: #58a6ff; border: 1px solid rgba(56, 139, 253, 0.3); }
    .pill.stat { background: rgba(255, 161, 22, 0.2); color: #ffa116; border: 1px solid rgba(255, 161, 22, 0.3); }
    pre {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 16px;
      color: #f0f6fc;
      font-family: monospace;
      font-size: 13px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="gh-header">
    <div class="gh-logo">
      <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
      </svg>
      GitHub
    </div>
    <div class="gh-repo-title">developer / <strong>leetcode-solutions</strong></div>
    <div class="gh-badge">Public</div>
  </div>

  <div class="main-wrap">
    <div class="commit-bar">
      <div class="commit-msg">
        <span>📦 Add LeetCode #1 Two Sum solution</span>
        <span class="commit-author">by @developer &bull; synced via LeetCode2Git</span>
      </div>
      <div class="commit-hash">commit 7f3b8c2</div>
    </div>

    <div class="file-table">
      <div class="file-row">
        <div class="file-name">📁 Easy/1-Two-Sum/</div>
        <div class="file-desc">Add structured LeetCode #1 solution and README</div>
        <div class="file-time">Just now</div>
      </div>
      <div class="file-row">
        <div class="file-name" style="padding-left: 28px;">📄 solution.py</div>
        <div class="file-desc">Add optimal Python3 solution</div>
        <div class="file-time">Just now</div>
      </div>
      <div class="file-row">
        <div class="file-name" style="padding-left: 28px;">📄 README.md</div>
        <div class="file-desc">Generate problem summary & complexity analysis</div>
        <div class="file-time">Just now</div>
      </div>
    </div>

    <div class="readme-card">
      <div class="readme-header">📖 Easy/1-Two-Sum/README.md</div>
      <div class="readme-body">
        <div class="readme-title">1. Two Sum</div>
        <div class="badges-row">
          <span class="pill easy">Easy</span>
          <span class="pill py">Python3</span>
          <span class="pill stat">Time: O(n)</span>
          <span class="pill stat">Space: O(n)</span>
        </div>
        <p style="color: #8b949e; font-size: 14px; margin-bottom: 12px;">
          Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.
        </p>
        <pre><code>class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        prevMap = {} # val -> index
        for i, n in enumerate(nums):
            diff = target - n
            if diff in prevMap:
                return [prevMap[diff], i]
            prevMap[n] = i</code></pre>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(tempDir, 'screenshot-1.html'), html1);
fs.writeFileSync(path.join(tempDir, 'screenshot-2.html'), html2);
fs.writeFileSync(path.join(tempDir, 'screenshot-3.html'), html3);

const tasks = [
  { html: 'screenshot-1.html', png: 'screenshot-1-connected.png' },
  { html: 'screenshot-2.html', png: 'screenshot-2-accepted.png' },
  { html: 'screenshot-3.html', png: 'screenshot-3-github.png' }
];

tasks.forEach(({ html, png }) => {
  const htmlPath = path.join(tempDir, html);
  const pngPath = path.join(storeAssetsDir, png);
  const fileUrl = 'file:///' + htmlPath.replace(/\\\\/g, '/');

  const cmd = `"${chromePath}" --headless=new --window-size=1280,800 --hide-scrollbars --screenshot="${pngPath}" "${fileUrl}"`;
  console.log(`Rendering ${png}...`);
  execSync(cmd, { stdio: 'inherit' });
  console.log(`✓ Generated ${pngPath}`);
});

// Cleanup temp HTML
fs.rmSync(tempDir, { recursive: true, force: true });
console.log('All 3 store screenshots generated successfully!');
