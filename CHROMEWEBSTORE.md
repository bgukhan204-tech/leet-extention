# Chrome Web Store Metadata & Publishing Guide: LeetCode2Git

**Extension Name**: LeetCode2Git  
**Current Version**: 1.0.0  
**Manifest Version**: 3  
**Category**: Developer Tools  
**Last Updated**: October 2026  

---

## 1. Store Listing Information

### Short Description (Max 132 chars)
Automatically and genuinely save your accepted LeetCode solutions directly to your personal GitHub repository.

### Detailed Description
LeetCode2Git is the cleanest developer-focused companion for your LeetCode journey. When you genuinely solve and receive an "Accepted" verdict on LeetCode, LeetCode2Git detects your success and helps you commit the actual working code directly to your GitHub repository organized cleanly by difficulty.

#### 🌟 Key Features:
- **Instant Accepted Detection**: Automatically detects genuine accepted submissions on LeetCode problem pages.
- **Structured GitHub Repository**: Organizes solutions neatly into `Easy/`, `Medium/`, and `Hard/` directories with dedicated `README.md` summaries and clean code files.
- **Multi-Language Support**: Supports Python, JavaScript, TypeScript, Java, C++, C, Go, Rust, and more.
- **Duplicate & Overwrite Protection**: Detects if you have previously solved the problem and offers seamless updating without breaking git history.
- **Developer Dashboard**: Track total solutions, weekly progress, difficulty distribution, and your real daily coding streak (🔥 Current Streak & 🏆 Best Streak).
- **Zero Fake Commits**: Strictly records genuine solutions—never generates artificial activity.

---

## 2. Permissions Justification

| Permission | Justification |
| :--- | :--- |
| `storage` | Required to store user authentication state, selected GitHub repository, target branch, and auto-prompt preferences locally in Chrome storage. |
| `activeTab` | Required to detect the active LeetCode tab context and trigger the in-page confirmation modal when an accepted solution is detected. |
| `scripting` | Used to inject helper overlays and communicate submission data safely within LeetCode problem pages. |
| `alarms` | Used for periodic streak and statistics synchronization without holding persistent background workers open. |
| `identity` | Required for secure 1-click GitHub OAuth web authentication flow with automatic token exchange. |
| `tabs` | Required to monitor completion of OAuth callback tabs and open repository links directly in new tabs. |

### Host Permissions Justification

| Host Pattern | Justification |
| :--- | :--- |
| `https://leetcode.com/*` | Required to monitor problem page submissions, parse difficulty and language metadata, and render the confirmation overlay. |
| `https://*.leetcode.com/*` | Covers regional or subdomain LeetCode problem exploration endpoints. |
| `https://leetcode2git-backend.onrender.com/*` | Primary production API backend for OAuth session verification, repository validation, and duplicate checking. |
| `https://*.onrender.com/*` | Supports custom/mirror backend instances deployed on Render. |
| `http://localhost:5000/*` | Required for local development API communication with the LeetCode2Git backend server. |
| `http://127.0.0.1:5000/*` | Localhost loopback address fallback for development. |
| `https://api.github.com/*` | Communicates directly with the GitHub REST API for repository write validation and solution commits. |

---

## 3. Privacy & Data Use

- **Data Collected**: GitHub username, selected repository target, and problem solution code.
- **Data Transmission**: Solution code is sent securely via TLS directly to the GitHub REST API through your authenticated session.
- **No Third-Party Sharing**: No code or user telemetry is sold or shared with any advertising or third-party tracking network.
