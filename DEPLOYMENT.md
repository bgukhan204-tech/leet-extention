# LeetCode2Git – Public Multi-User Deployment Guide

This guide details the end-to-end production deployment process for the **LeetCode2Git** Chrome extension, public backend API, and MongoDB Atlas database.

---

## Architecture Overview

```
               ┌──────────────────────────────┐
               │         LEETCODE2GIT         │
               │       Chrome Extension       │
               └──────────────┬───────────────┘
                              │
                              │ HTTPS
                              ▼
               ┌──────────────────────────────┐
               │        PUBLIC BACKEND        │
               │      Node.js + Express       │
               │      JWT + GitHub OAuth      │
               └──────────────┬───────────────┘
                              │
               ┌──────────────┴──────────────┐
               │                             │
               ▼                             ▼
      ┌─────────────────┐           ┌─────────────────┐
      │  MongoDB Atlas  │           │   GitHub API    │
      │ User Profiles   │           │ User's Account  │
      │ Solution Data   │           │ Repositories    │
      └─────────────────┘           └─────────────────┘
```

---

## Step 1: Create MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and sign in or create an account.
2. Create a new project (e.g. `LeetCode2Git`).
3. Deploy a free **Shared Cluster (M0)** or dedicated cluster in your target region.
4. In **Database Access**:
   - Create a database user (e.g. `leetcode2git-admin`) with read and write privileges.
   - Note the password.
5. In **Network Access**:
   - Add IP address `0.0.0.0/0` (Allow access from anywhere) so your cloud hosting provider can connect to MongoDB.
6. In **Database** -> Click **Connect** -> **Connect your application (Drivers)**:
   - Copy the connection string:
     ```
     mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/leetcode2git?retryWrites=true&w=majority
     ```

---

## Step 2: Deploy the Node.js Backend

You can deploy the backend to any modern Node.js hosting platform (Render, Railway, Fly.io, AWS App Runner, Heroku, etc.).

### Example: Deploying to Render
1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
3. Select your repository and configure:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Choose the Free or Starter instance type.

---

## Step 3: Configure Production Environment Variables

In your cloud hosting dashboard (e.g. Render/Railway Environment Settings), set the following environment variables:

| Variable | Production Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5000` (or leave default assigned by platform) |
| `MONGODB_URI` | `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/leetcode2git?retryWrites=true&w=majority` |
| `BACKEND_URL` | `https://api.yourdomain.com` (or `https://leetcode2git-backend.onrender.com`) |
| `GITHUB_CALLBACK_URL` | `https://api.yourdomain.com/api/auth/github/callback` |
| `GITHUB_CLIENT_ID` | *(From Step 4 below)* |
| `GITHUB_CLIENT_SECRET` | *(From Step 4 below)* |
| `JWT_SECRET` | *(Generate a random 64-char string)* |
| `JWT_EXPIRES_IN` | `30d` |
| `CORS_ORIGIN` | `*` |
| `FRONTEND_URL` | `chrome-extension://YOUR_EXTENSION_ID` |

---

## Step 4 & 5: Configure the Single GitHub OAuth Application

1. Log into your GitHub account and navigate to:  
   **Settings &rarr; Developer settings &rarr; OAuth Apps &rarr; New OAuth App**
2. Fill in the OAuth App details:
   - **Application name**: `LeetCode2Git`
   - **Homepage URL**: `https://api.yourdomain.com` (or your deployed backend URL)
   - **Application description**: `Automatically sync your accepted LeetCode solutions to your GitHub repositories.`
   - **Authorization callback URL**: `https://api.yourdomain.com/api/auth/github/callback`
3. Click **Register application**.
4. Generate a new **Client Secret**.
5. Copy the **Client ID** and **Client Secret** into your production backend environment variables (`GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`).

---

## Step 6 & 7: Verify Backend & Health Check

After deployment, test the backend health check in your browser or terminal:

```bash
curl https://api.yourdomain.com/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "LeetCode2Git backend is running",
  "environment": "production",
  "version": "1.0.0",
  "timestamp": "..."
}
```

---

## Step 8 & 9: Configure the Chrome Extension

Open [extension/config.js](file:///d:/chrome%20extention/extension/config.js) and set `BACKEND_URL` to your production HTTPS backend:

```javascript
// Change BACKEND_URL to your public HTTPS domain:
const BACKEND_URL = "https://api.yourdomain.com";

const CONFIG = {
  BACKEND_URL,
  API_BASE_URL: `${BACKEND_URL}/api`,
  AUTH_URL: `${BACKEND_URL}/api/auth/github`,
  VERSION: '1.0.0',
  APP_NAME: 'LeetCode2Git'
};
```

---

## Step 10 & 11: Test GitHub Authentication & Repository Selection

1. Open Chrome &rarr; `chrome://extensions` &rarr; Click **Reload** on LeetCode2Git.
2. Click the extension icon.
3. Click **Connect GitHub**.
4. Authorize the application on GitHub.
5. The extension popup will now show:
   - **Status**: `🟢 Connected`
   - **Username**: `@your_github_username`
   - **Repository**: Dropdown populated with your actual GitHub repositories.
6. Select a target repository with write access and click **Save Repository**.

---

## Step 12 & 13: Test Real LeetCode Solution Upload

1. Go to any problem on [LeetCode](https://leetcode.com/problems/two-sum/).
2. Submit your solution.
3. When LeetCode reports **Accepted**, the in-page confirmation modal will appear.
4. Review your solution code and click **Save to GitHub**.
5. Verify the commit link generated:
   - Problem file: `Easy/1-Two-Sum/solution.py`
   - README: `Easy/1-Two-Sum/README.md`
6. Click **Open on GitHub** to inspect your genuine commit.

---

## Step 14: Verify Multi-User Isolation (Two-User Test)

1. Open a second Chrome profile or different browser window with **User B**'s GitHub account.
2. Load the extension and click **Connect GitHub**.
3. Authorize as **User B**.
4. Verify:
   - User B sees only User B's repositories in the dropdown.
   - User B's solutions are committed to User B's repository.
   - User A and User B cannot access each other's data or tokens.
   - Disconnecting User B does not affect User A.

---

## Step 15: Prepare Chrome Web Store Release

1. Prepare extension zip file:
   - Include `manifest.json`, `config.js`, `background/`, `content/`, `popup/`, `assets/`.
2. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Upload the package zip file.
4. Complete the Store Listing (description, icons, screenshots, privacy policy).
5. Submit for review.
