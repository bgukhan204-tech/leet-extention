# Chrome Web Store Metadata & Publishing Guide: LeetCode2Git

**Extension Name**: LeetCode2Git  
**Current Version**: 1.0.0  
**Manifest Version**: 3  
**Category**: Developer Tools  
**Privacy Policy URL**: `https://leetcode2git-backend.onrender.com/privacy`  
**Last Updated**: October 2026  

---

## 1. Store Listing Information

### Short Description (Max 132 chars)
Automatically and genuinely save your accepted LeetCode solutions directly to your personal GitHub repository.

### Detailed Description (For Chrome Web Store Dashboard)
LeetCode2Git is a clean, developer-focused companion for your LeetCode journey. When you solve a problem and receive an "Accepted" verdict on LeetCode, LeetCode2Git detects your submission and helps you commit the working code directly to your personal GitHub repository, neatly organized by difficulty.

HOW IT WORKS
1. Install LeetCode2Git and click "Connect GitHub" in the extension popup.
2. Select your target GitHub repository (e.g., username/leetcode-solutions) and default branch.
3. Solve problems on LeetCode as usual. Upon an "Accepted" verdict, review your code and click "Save to GitHub".

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

---

## 2. Permissions Justification

| Permission | Justification |
| :--- | :--- |
| `storage` | Required to store user authentication state, selected GitHub repository, target branch, and auto-prompt preferences locally in Chrome storage. |
| `activeTab` | Required to detect the active LeetCode tab context and trigger the in-page confirmation modal when an accepted solution is detected. |
| `scripting` | Used to inject helper overlays and communicate submission data safely within LeetCode problem pages. |
| `identity` | Required for secure 1-click GitHub OAuth web authentication flow with automatic token exchange. |
| `tabs` | Required to monitor completion of OAuth callback tabs and open repository links directly in new tabs. |

### Host Permissions Justification

| Host Pattern | Justification |
| :--- | :--- |
| `https://leetcode.com/*` | Required to monitor problem page submissions, parse difficulty and language metadata, and render the confirmation overlay. |
| `https://*.leetcode.com/*` | Covers regional or subdomain LeetCode problem exploration endpoints. |
| `https://leetcode2git-backend.onrender.com/*` | Primary production API backend for OAuth session verification, repository validation, duplicate checking, and solution uploads. |

### Externally Connectable Justification

| Origin Pattern | Justification |
| :--- | :--- |
| `https://leetcode2git-backend.onrender.com/*` | Allows the verified production backend OAuth completion page to securely notify the extension upon successful authentication. |

---

## 3. Privacy & Data Use Disclosure

- **Official Privacy Policy**: https://leetcode2git-backend.onrender.com/privacy
- **Data Collected**: GitHub account username/ID, selected repository target, and problem solution code.
- **Data Transmission**: Solution code is sent securely via TLS directly to the GitHub REST API through your authenticated session.
- **No Third-Party Sharing**: No code or user telemetry is sold or shared with any advertising or third-party tracking network.

---

## 4. Store Graphics Assets

The following 1280×800 screenshots are prepared in `store-assets/` for the Chrome Web Store listing:

1. `store-assets/screenshot-1-connected.png`: Extension popup showing LeetCode2Git, GitHub connected state (`@developer`), repository selector, Auto Save, and Create README settings.
2. `store-assets/screenshot-2-accepted.png`: Real LeetCode problem page with the in-page "✓ Accepted Submission Detected!" confirmation modal, code review editor, and complexity inputs.
3. `store-assets/screenshot-3-github.png`: Target GitHub repository view displaying structured directories (`Easy/1-Two-Sum/`), committed `solution.py`, and auto-generated `README.md`.

