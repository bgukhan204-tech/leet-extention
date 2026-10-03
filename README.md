# 🚀 LeetCode2Git

> Automatically and securely save your genuinely accepted LeetCode solutions to your own GitHub repository with clean difficulty-based organization, custom README summaries, and real GitHub commits.

---

## 📖 1. Project Overview

**LeetCode2Git** is a developer companion Chrome Extension (Manifest V3) backed by a Node.js/Express server and MongoDB. When you solve a problem on LeetCode and receive an **"Accepted"** verdict, LeetCode2Git detects the solution, prompts you with a clean in-page confirmation modal, and pushes the actual working code to your selected GitHub repository.

### 🛡️ Core Ethics & Integrity Principles
LeetCode2Git strictly abides by honest developer practices:
- **NO Fake Commits**: Commits are created only when a real solution is genuinely accepted.
- **NO Artificial Activity**: No automated scheduling, random commit generation, or green-square manipulation.
- **NO Automated Submissions**: You write and submit your own code; LeetCode2Git only manages the git sync upon acceptance.
- **Copyright Respectful**: Problem descriptions are summarized cleanly in generated READMEs without copying copyrighted problem text.

---

## ✨ 2. Key Features

- **⚡ Instant Accepted Detection**: Observes LeetCode DOM mutations to detect accepted submissions.
- **🗂️ Clean Difficulty Organization**: Automatically files solutions into `Easy/`, `Medium/`, and `Hard/` directories.
- **📝 Automated README Generation**: Creates informative `README.md` files for each solution with complexity analysis, problem summary, and syntax-highlighted code.
- **🔄 Multi-Language Support**: Supports Python, JavaScript, TypeScript, Java, C++, C, Go, Rust, C#, Ruby, Swift, Kotlin, and more.
- **🛡️ Duplicate & Conflict Protection**: Checks whether a problem was already solved and allows seamless updating without breaking history.
- **📊 Real Developer Dashboard**:
  - Total solved count
  - Difficulty distribution progress bars (Easy / Medium / Hard)
  - Weekly progress metrics
  - Real daily solving streak (🔥 Current Streak & 🏆 Best Streak)
- **🔐 Secure Authentication**: GitHub OAuth 2.0 with minimal required permissions (`repo`, `read:user`), JWT tokens, and optional Personal Access Token (PAT) quick connect.

---

## 🏗️ 3. Architecture & Data Flow

```
+-------------------------------------------------------------------------+
|                              CHROME BROWSER                             |
|                                                                         |
|   +-------------------+                     +-----------------------+   |
|   |  LeetCode Page    |                     |  Popup & Dashboard    |   |
|   |  (leetcode.com)   |                     |  (popup.html / .js)   |   |
|   +---------+---------+                     +-----------+-----------+   |
|             | MutationObserver                          |               |
|             v                                           |               |
|   +-------------------+                                 |               |
|   |  Content Script   |                                 |               |
|   |  (leetcode.js)    |                                 |               |
|   +---------+---------+                                 |               |
|             | Injected Confirmation Modal               |               |
|             v                                           |               |
|   +-----------------------------------------------------+-----------+   |
|   |                 Background Service Worker                       |   |
|   |                     (background.js)                             |   |
|   +---------------------------------+-------------------------------+   |
+-------------------------------------|-----------------------------------+
                                      | HTTPS / REST API
                                      v
+-------------------------------------------------------------------------+
|                        BACKEND SERVER (Node / Express)                  |
|                                                                         |
|   +------------------+   +--------------------+   +-----------------+   |
|   | Auth Controller  |   | GitHub Controller  |   | Sol. Controller |   |
|   +--------+---------+   +---------+----------+   +--------+--------+   |
|            |                       |                       |            |
|            | OAuth Exchange        | REST API Operations   | Git Commits|
|            v                       v                       v            |
|   +-----------------------------------------------------------------+   |
|   |                       GitHub REST API                           |   |
|   |                   (api.github.com / User Repo)                  |   |
|   +-----------------------------------------------------------------+   |
|                                    |                                    |
|                                    v                                    |
|   +-----------------------------------------------------------------+   |
|   |                       MongoDB Database                          |   |
|   |                  (Users, Solutions, Streaks)                    |   |
|   +-----------------------------------------------------------------+   |
+-------------------------------------------------------------------------+
```

---

## 🛠️ 4. Technology Stack

- **Frontend / Chrome Extension**:
  - Google Chrome Extension **Manifest V3**
  - Modern HTML5, CSS3 (Custom Dark Theme, Glassmorphism, CSS Grid/Flexbox)
  - Vanilla JavaScript (ES6+, Async/Await, MutationObserver API)
- **Backend API**:
  - Node.js (v18+)
  - Express.js
  - JSON Web Tokens (`jsonwebtoken`)
  - CORS, Axios, Morgan
- **Database**:
  - MongoDB / Mongoose ODM
- **GitHub Integration**:
  - GitHub OAuth 2.0
  - GitHub REST API v3

---

## 📂 5. Folder Structure

```
LeetCode2Git/
│
├── extension/
│   ├── manifest.json            # Manifest V3 configuration
│   │
│   ├── popup/
│   │   ├── popup.html           # Developer popup & dashboard UI
│   │   ├── popup.css            # Dark theme stylesheet
│   │   └── popup.js             # State manager, repo selector & charts
│   │
│   ├── content/
│   │   ├── leetcode.js          # In-page submission detector & modal
│   │   └── content.css          # In-page confirmation modal stylesheet
│   │
│   ├── background/
│   │   └── background.js        # Service worker for API sync & badges
│   │
│   └── assets/
│       ├── icon-16.png          # 16x16 icon
│       ├── icon-48.png          # 48x48 icon
│       └── icon-128.png         # 128x128 icon
│
├── backend/
│   ├── package.json             # Server dependencies & test scripts
│   ├── server.js                # Express app entrypoint & middleware
│   ├── .env.example             # Environment variable template
│   ├── .env                     # Local configuration
│   ├── .gitignore
│   │
│   ├── config/
│   │   └── database.js          # MongoDB connection & reconnect logic
│   │
│   ├── models/
│   │   ├── User.js              # User profile & repo settings schema
│   │   └── Solution.js          # Solution log & streak tracking schema
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification
│   │   └── errorHandler.js      # Centralized error formatter
│   │
│   ├── routes/
│   │   ├── auth.js              # OAuth & token routes
│   │   ├── github.js            # Repository discovery & validation
│   │   └── solutions.js         # Upload & stats routes
│   │
│   ├── controllers/
│   │   ├── authController.js    # OAuth exchange & PAT login
│   │   ├── githubController.js  # Repo listing & write validation
│   │   └── solutionController.js# Commit builder & streak calculator
│   │
│   ├── services/
│   │   └── githubService.js     # GitHub REST API client
│   │
│   ├── utils/
│   │   ├── languageMap.js       # Language extension mapper
│   │   ├── readmeGenerator.js   # Solution README markdown builder
│   │   └── streakCalculator.js  # Daily solving streak algorithm
│   │
│   └── tests/
│       ├── api.test.js          # Express route tests
│       ├── languageMap.test.js  # Language mapping tests
│       ├── readmeGenerator.test.js # README formatting tests
│       └── streakCalculator.test.js# Streak logic tests
│
├── CHROMEWEBSTORE.md            # Chrome Web Store listing & justifications
├── README.md                    # Project documentation
└── .gitignore
```

---

## 📥 6. Installation & Setup Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local Community Server or free MongoDB Atlas URI)
- Google Chrome or Chromium-based browser (Brave, Edge)

---

### 7. Node.js Setup

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

### 8. MongoDB Setup

#### Option A: Local MongoDB
Start MongoDB locally on the default port `27017`:
```bash
mongod
```

#### Option B: MongoDB Atlas (Cloud)
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Obtain your connection URI: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/leetcode2git?retryWrites=true&w=majority`.
3. Set `MONGODB_URI` in `backend/.env`.

---

### 9. GitHub OAuth App Setup

To use standard one-click GitHub login:

1. Visit [GitHub Developer Settings - OAuth Apps](https://github.com/settings/developers).
2. Click **New OAuth App**.
3. Fill in the fields:
   - **Application name**: `LeetCode2Git`
   - **Homepage URL**: `http://localhost:5000`
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
4. Click **Register application**.
5. Copy your **Client ID** and generate a new **Client Secret**.
6. Paste these into `backend/.env`.

*(Note: You can also use a GitHub Personal Access Token (PAT) with `repo` scope directly from the extension popup without creating an OAuth app).*

---

### 10. Environment Variables Configuration

Copy `.env.example` to `.env` inside the `backend/` folder:

```bash
cp backend/.env.example backend/.env
```

Ensure your `backend/.env` file contains:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/leetcode2git
JWT_SECRET=super_secret_jwt_key_leetcode2git_change_in_production_998877
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5000
```

---

### 11. Running the Backend Server

To start the backend server in development mode with hot-reloading:

```bash
cd backend
npm run dev
```

Or for production:
```bash
npm start
```

Verify that the server is up:
- Open `http://localhost:5000/api/health` in your browser. You should see:
  ```json
  {
    "status": "healthy",
    "service": "LeetCode2Git Backend API"
  }
  ```

---

### 12. Loading the Chrome Extension

1. Open Google Chrome.
2. Navigate to `chrome://extensions`.
3. Toggle on **Developer mode** in the top right corner.
4. Click **Load unpacked** in the top left corner.
5. Select the `extension/` folder from this project (`d:\chrome extention\extension`).
6. The **LeetCode2Git** extension icon will appear in your Chrome toolbar! 🧩

---

## 🎯 13. How to Use

1. **Connect GitHub**:
   - Click the **LeetCode2Git** extension icon in your Chrome toolbar.
   - Click **Connect GitHub** (or paste a Personal Access Token).
2. **Select Repository**:
   - Select your target repository from the dropdown (e.g. `username/leetcode-solutions`) or type a custom repo name.
   - Click **Save Repository Settings**.
3. **Solve a LeetCode Problem**:
   - Go to any problem on [leetcode.com/problems](https://leetcode.com/problems) (e.g. *1. Two Sum*).
   - Write your solution in any supported language and click **Submit**.
4. **Confirm & Commit**:
   - When LeetCode displays **Accepted**, the LeetCode2Git confirmation modal appears over the page.
   - Review or edit your code, verify time/space complexity, and click **Save to GitHub**.
5. **View Commit on GitHub**:
   - Once saved, click **Open on GitHub ↗** to view your real commit!
   - Solutions are organized as:
     ```
     leetcode-solutions/
     ├── Easy/
     │   └── 1-Two-Sum/
     │       ├── solution.py
     │       └── README.md
     ```
6. **Track Progress on Dashboard**:
   - Click the extension icon and select **Dashboard** to view your solving streak, total solved count, and recent commit history.

---

## 🧪 14. Testing

Run the automated test suite in `backend/`:

```bash
cd backend
npm test
```

Test coverage includes:
- ✅ Language extension and markdown tag mappings
- ✅ README markdown formatting and code block generation
- ✅ Consecutive daily streak calculations and weekly counters
- ✅ Express API health checks, route protection, and error formatting

---

## ⚠️ 15. Common Errors & Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **"GitHub is not connected"** | No active session or token stored. | Open the extension popup and click "Connect GitHub" or enter a PAT. |
| **"Repository not found"** | Repository does not exist or account lacks push access. | Ensure the repository exists on your GitHub account and your token has `repo` scope. |
| **"You don't have write permission"** | The authenticated user is not an owner or collaborator. | Select a repository owned by your account or where you have collaborator push permissions. |
| **"Cannot connect to MongoDB"** | Local MongoDB service is not running. | Start `mongod` or update `MONGODB_URI` in `backend/.env` with your free MongoDB Atlas connection string. |
| **"Accepted not detected"** | Page layout mutation variation. | Make sure you are on `https://leetcode.com/problems/*` and the solution has fully returned "Accepted". You can also open the popup directly. |

---

## 🚀 16. Future Improvements

- [ ] Support for LeetCode Contest and Explore Module submissions.
- [ ] Automated Tagging & Topics in READMEs (e.g. `Array`, `Hash Table`, `Dynamic Programming`).
- [ ] Multi-platform sync (GeeksforGeeks, HackerRank, Codeforces).
- [ ] Exportable solution stats badge in SVG for GitHub Profile READMEs.

---

## 📄 License

MIT License © 2026 LeetCode2Git. Built for developers by developers.
