# Chrome Web Store Listing — LeetCode2Git

> Last Updated: 2026-10-13

## 1. Store Listing Information

**Extension Name** [REQUIRED]  
LeetCode2Git

**Short Description** [REQUIRED] (Max 132 chars)  
Automatically and genuinely save your accepted LeetCode solutions directly to your personal GitHub repository.

**Detailed Description** [REQUIRED] (For Chrome Web Store Dashboard)  
LeetCode2Git is a clean, developer-focused companion for your LeetCode journey. When you solve a problem and receive an "Accepted" verdict on LeetCode, LeetCode2Git detects your submission and helps you commit the working code directly to your personal GitHub repository, neatly organized by difficulty.

HOW IT WORKS
1. Install LeetCode2Git and click "Connect GitHub" in the extension popup.
2. Select your target GitHub repository (e.g., username/leetcode-solutions) and default branch.
3. Solve problems on LeetCode as usual. Upon an "Accepted" verdict, review your code in the in-page modal and click "Save to GitHub".

KEY FEATURES
• Instant Accepted Detection: Automatically recognizes genuine "Accepted" submissions on LeetCode problem pages.
• Clean Repository Structure: Organizes solutions neatly into Easy/, Medium/, and Hard/ directories with dedicated README.md summaries and source code.
• Multi-Language Support: Works with Python, JavaScript, TypeScript, Java, C++, C, Go, Rust, and more.
• Duplicate & Overwrite Protection: Detects previously solved problems and provides seamless updating without breaking Git history.
• In-Page Code Review: Inspect and edit your solution, time complexity, and space complexity before committing.
• Secure Multi-User OAuth: Authenticates via official GitHub OAuth 2.0. Sensitive credentials remain server-side; the extension never stores raw tokens.
• Zero Fake Activity Policy: Exclusively saves genuine user solutions. Does not manipulate contribution graphs, create empty commits, or generate artificial activity.

PRIVACY & DATA USE
LeetCode2Git respects developer privacy. Your solution code and repository target are processed solely to perform the requested commits to GitHub. We never sell or share user data with advertising networks or third-party trackers.
Review our full Privacy Policy at: https://leetcode2git-backend.onrender.com/privacy

SUPPORT & ISSUES
Found a bug or have a suggestion?
• GitHub Repository: https://github.com/bgukhan204-tech/leet-extention
• Issue Tracker: https://github.com/bgukhan204-tech/leet-extention/issues

**Category** [REQUIRED]  
Developer Tools

**Single Purpose** [REQUIRED]  
Automatically commits accepted LeetCode problem solutions and summary notes to the user's selected GitHub repository.

**Primary Language** [REQUIRED]  
English

---

## 2. Graphics & Assets

| Asset | Dimensions | Status | Filename / Location |
|-------|-----------|--------|---------------------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `extension/assets/icon-128.png` |
| Extension Icon 48 | 48×48 PNG | ✅ Ready | `extension/assets/icon-48.png` |
| Extension Icon 16 | 16×16 PNG | ✅ Ready | `extension/assets/icon-16.png` |
| Screenshot 1 [REQUIRED] | 1280×800 PNG | ✅ Ready | `store-assets/screenshot-1-connected.png` |
| Screenshot 2 [RECOMMENDED] | 1280×800 PNG | ✅ Ready | `store-assets/screenshot-2-accepted.png` |
| Screenshot 3 [RECOMMENDED] | 1280×800 PNG | ✅ Ready | `store-assets/screenshot-3-github.png` |
| Small Promo Tile [RECOMMENDED] | 440×280 PNG | ✅ Ready | `store-assets/promo-tile-440x280.png` |

### Screenshot Notes
1. **Screenshot 1 (`screenshot-1-connected.png`)**: Extension popup UI showcasing active GitHub authentication state (`@developer`), target repository dropdown, Auto Save toggle, and Create README setting.
2. **Screenshot 2 (`screenshot-2-accepted.png`)**: Real LeetCode problem page showing the in-page "✓ Accepted Submission Detected!" modal, solution code editor, and time/space complexity inputs.
3. **Screenshot 3 (`screenshot-3-github.png`)**: Target GitHub repository view displaying structured directories (`Easy/1-Two-Sum/`), committed `solution.py`, and auto-generated `README.md`.
4. **Promo Tile (`promo-tile-440x280.png`)**: High-contrast store promo card emphasizing key capabilities: Auto-Sync, Multi-Language, and Clean Git History.

---

## 3. Permissions Justification

| Permission | Type | Plain-English Justification for Review Team |
|------------|------|---------------------------------------------|
| `storage` | permissions | Required to store the user's authentication JWT, selected target GitHub repository, default branch name, and auto-save preferences locally in Chrome storage. |
| `activeTab` | permissions | Required to detect the active LeetCode tab context and trigger the in-page confirmation modal when an accepted solution is detected. |
| `scripting` | permissions | Required to extract authentication completion payloads from the verified OAuth completion window. |
| `identity` | permissions | Required for secure GitHub OAuth 2.0 authentication flow with automatic token exchange via `chrome.identity.launchWebAuthFlow`. |
| `tabs` | permissions | Required to monitor completion of OAuth callback tabs (`tabs.onUpdated`) and open repository links in new browser tabs (`tabs.create`). |
| `https://leetcode.com/*` | host_permissions | Required to monitor problem page submissions, parse difficulty and language metadata, and render the confirmation overlay. |
| `https://*.leetcode.com/*` | host_permissions | Covers regional or subdomain LeetCode problem exploration endpoints. |
| `https://leetcode2git-backend.onrender.com/*` | host_permissions | Production API backend for OAuth session verification, repository validation, duplicate checking, and solution uploads. |

### Externally Connectable Justification

| Origin Pattern | Justification |
|----------------|---------------|
| `https://leetcode2git-backend.onrender.com/*` | Allows the verified production backend OAuth completion page to securely notify the extension upon successful authentication. |

---

## 4. Privacy & Data Use Disclosure

### Data Collection Checklist (For Chrome Web Store Dashboard Form)

**Does the extension collect user data?** Yes

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|:----------:|:-----------------------:|---------|:--------------------------:|
| Personally identifiable info | Yes (GitHub username/ID) | Yes (to GitHub API via Backend) | User authentication & target repository access | No |
| Authentication info | Yes (OAuth JWT session) | Yes (to secure Backend) | Authorizing commits to user's GitHub repo | No |
| User activity / Content | Yes (Solution code) | Yes (to GitHub API) | Committing accepted solution code to user's repository | No |
| Health / Financial / Location info | No | No | N/A | No |
| Web history / Browse tracking | No | No | N/A | No |

### Data Use Certification
- [x] Data is NOT sold to third parties.
- [x] Data is NOT used for purposes unrelated to the extension's core functionality (LeetCode solution backup).
- [x] Data is NOT used for creditworthiness or lending purposes.

---

## 5. Privacy Policy

- **Live URL**: `https://leetcode2git-backend.onrender.com/privacy`
- **Verification Status**: Verified live and responding with HTTP 200.
- **Content**: Discloses GitHub OAuth usage, user data handling, encryption in transit (TLS/HTTPS), and zero third-party data sharing policy.

---

## 6. Distribution & Pricing

- **Visibility**: Public
- **Regions**: All regions
- **Pricing**: Free

---

## 7. Developer Info

- **Publisher / Developer**: bgukhan204-tech
- **GitHub Repository**: https://github.com/bgukhan204-tech/leet-extention
- **Issue Tracker**: https://github.com/bgukhan204-tech/leet-extention/issues
- **Production Backend**: https://leetcode2git-backend.onrender.com

---

## 8. Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-10-13 | Initial release: Multi-user GitHub OAuth, LeetCode accepted detection, repository sync, difficulty directory structure, README generator | Ready for Submission |
