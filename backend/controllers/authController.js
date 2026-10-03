const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const githubService = require('../services/githubService');
const config = require('../config/config');

/**
 * Generate application session JWT.
 * SECURITY: Raw githubAccessToken is NEVER included in JWT payload.
 */
function generateJwt(user) {
  const userId = user._id ? user._id.toString() : user.id;
  return jwt.sign(
    {
      userId,
      githubUsername: user.githubUsername,
      name: user.name || '',
      avatarUrl: user.avatarUrl || ''
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

/**
 * Create a sanitized, safe user object for client transmission
 */
function sanitizeUser(user) {
  return {
    id: user._id ? user._id.toString() : user.id,
    githubId: user.githubId,
    githubUsername: user.githubUsername,
    name: user.name || '',
    email: user.email || '',
    avatarUrl: user.avatarUrl || '',
    selectedRepository: user.selectedRepository || '',
    selectedBranch: user.selectedBranch || 'main',
    autoSave: user.autoSave !== false
  };
}

/**
 * Redirect user to GitHub OAuth authorization screen
 */
async function initiateGithubOAuth(req, res) {
  const isPlaceholder =
    !config.githubClientId ||
    config.githubClientId === 'your_github_client_id' ||
    config.githubClientId.startsWith('mock_');

  if (isPlaceholder) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LeetCode2Git - OAuth Setup Required</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0d1117;
            color: #f0f6fc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 24px;
            box-sizing: border-box;
          }
          .card {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 12px;
            padding: 32px;
            max-width: 580px;
            box-shadow: 0 16px 32px rgba(0,0,0,0.5);
          }
          h2 {
            margin-top: 0;
            color: #ffa116;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 22px;
          }
          p {
            color: #8b949e;
            font-size: 14px;
            line-height: 1.6;
          }
          .step-box {
            background: #0d1117;
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 16px 20px;
            margin: 16px 0;
          }
          .step-title {
            font-size: 14px;
            font-weight: 700;
            color: #58a6ff;
            margin-bottom: 10px;
          }
          ol {
            margin: 0;
            padding-left: 20px;
            color: #c9d1d9;
            font-size: 13px;
            line-height: 1.8;
          }
          code {
            background: #21262d;
            color: #7ee787;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
            font-size: 12px;
          }
          .btn {
            display: inline-block;
            margin-top: 14px;
            padding: 10px 18px;
            background: #238636;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 13px;
            border: none;
            cursor: pointer;
          }
          .btn:hover {
            background: #2ea043;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>⚙️ GitHub OAuth Configuration Required</h2>
          <p>The backend application owner needs to configure the GitHub OAuth App credentials in <code>backend/.env</code> so any user can authorize with 1-click.</p>
          
          <div class="step-box">
            <div class="step-title">📋 Developer Setup Instructions:</div>
            <ol>
              <li>Go to <a href="https://github.com/settings/developers" target="_blank" style="color: #58a6ff;">GitHub Developer Settings &rarr; OAuth Apps</a>.</li>
              <li>Click <strong>New OAuth App</strong>.</li>
              <li>Set <strong>Application name</strong>: <code>LeetCode2Git</code></li>
              <li>Set <strong>Homepage URL</strong>: <code>${config.backendUrl}</code></li>
              <li>Set <strong>Authorization callback URL</strong>: <code>${config.githubCallbackUrl}</code></li>
              <li>Generate a Client Secret and copy <code>GITHUB_CLIENT_ID</code> and <code>GITHUB_CLIENT_SECRET</code> into <code>backend/.env</code>.</li>
              <li>Restart the backend server.</li>
            </ol>
          </div>

          <button class="btn" onclick="window.close()">Close this tab</button>
        </div>
      </body>
      </html>
    `);
  }

  // Parse extensionId from query if provided to return token back to the extension
  const extensionId = req.query.extensionId || '';
  const statePayload = {
    nonce: Math.random().toString(36).substring(2, 15),
    extensionId
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

  const redirectUri = config.githubCallbackUrl;
  const scope = 'repo read:user';

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
    config.githubClientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(
    scope
  )}&state=${encodeURIComponent(state)}`;

  res.redirect(authUrl);
}

/**
 * Handle OAuth callback from GitHub
 */
async function handleGithubCallback(req, res) {
  const { code, state, error, error_description } = req.query;

  if (error || !code) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LeetCode2Git - Authentication Cancelled</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0d1117; color: #f0f6fc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 32px; max-width: 460px; text-align: center; }
          h2 { color: #ff7b72; margin-top: 0; }
          p { color: #8b949e; font-size: 14px; line-height: 1.5; }
          .btn { margin-top: 16px; padding: 8px 16px; background: #21262d; border: 1px solid #30363d; color: #c9d1d9; border-radius: 6px; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Authentication Cancelled</h2>
          <p>${error_description || 'GitHub authorization was cancelled or failed. You can close this tab and try again.'}</p>
          <button class="btn" onclick="window.close()">Close Window</button>
        </div>
      </body>
      </html>
    `);
  }

  // Extract extensionId from state payload if present
  let extensionId = '';
  if (state) {
    try {
      const decodedState = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
      if (decodedState && decodedState.extensionId) {
        extensionId = decodedState.extensionId;
      }
    } catch (e) {
      // Non-JSON state string fallback
    }
  }

  try {
    // 1. Exchange OAuth code for GitHub access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code
      },
      {
        headers: { Accept: 'application/json' }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new Error(tokenResponse.data.error_description || 'Failed to obtain access token from GitHub.');
    }

    // 2. Fetch authenticated user profile from GitHub API
    const ghUser = await githubService.getUserProfile(accessToken);

    // 3. Upsert user in MongoDB (stores GitHub token securely on backend)
    let user;
    try {
      user = await User.findOneAndUpdate(
        { githubId: String(ghUser.id) },
        {
          githubId: String(ghUser.id),
          githubUsername: ghUser.login,
          name: ghUser.name || ghUser.login,
          email: ghUser.email || '',
          avatarUrl: ghUser.avatar_url || '',
          githubAccessToken: accessToken
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (dbErr) {
      console.warn('[OAuth] MongoDB upsert fallback:', dbErr.message);
      user = {
        _id: String(ghUser.id),
        id: String(ghUser.id),
        githubId: String(ghUser.id),
        githubUsername: ghUser.login,
        name: ghUser.name || ghUser.login,
        email: ghUser.email || '',
        avatarUrl: ghUser.avatar_url || '',
        githubAccessToken: accessToken,
        selectedRepository: '',
        selectedBranch: 'main',
        autoSave: true
      };
    }

    // 4. Generate JWT (WITHOUT the raw GitHub access token)
    const jwtToken = generateJwt(user);
    const safeUser = sanitizeUser(user);

    // 5. Render completion screen that securely transmits JWT to Chrome Extension
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LeetCode2Git - Connected Successfully</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0d1117;
            color: #f0f6fc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          .card {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 12px;
            padding: 36px 32px;
            max-width: 460px;
            width: 100%;
            text-align: center;
            box-shadow: 0 16px 32px rgba(0,0,0,0.5);
          }
          .avatar {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            border: 3px solid #238636;
            margin-bottom: 16px;
            object-fit: cover;
          }
          .title {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #3fb950;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .user-name {
            font-size: 16px;
            color: #c9d1d9;
            margin-bottom: 16px;
          }
          .hint {
            font-size: 14px;
            color: #8b949e;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .btn {
            display: inline-block;
            padding: 10px 22px;
            background: #238636;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            border: none;
            cursor: pointer;
            transition: background 0.2s;
          }
          .btn:hover {
            background: #2ea043;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <img class="avatar" src="${safeUser.avatarUrl || 'https://github.com/identicons/app.png'}" alt="Avatar" />
          <div class="title">✓ GitHub Connected</div>
          <div class="user-name">Welcome, <strong>@${safeUser.githubUsername}</strong></div>
          <p class="hint">Your GitHub account is connected. You can now select your repository in the extension popup and start solving LeetCode problems!</p>
          <button class="btn" id="closeBtn" onclick="window.close()">Close Window</button>
        </div>

        <script>
          const authData = {
            jwtToken: "${jwtToken}",
            user: ${JSON.stringify(safeUser)}
          };

          const targetExtensionId = "${extensionId}";

          // 1. Direct message to target extension ID if available
          if (targetExtensionId && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            try {
              chrome.runtime.sendMessage(targetExtensionId, {
                type: 'AUTH_SUCCESS',
                data: authData
              }, (response) => {
                if (chrome.runtime.lastError) {
                  console.log('Extension message notice:', chrome.runtime.lastError.message);
                }
              });
            } catch (e) {
              console.log('Direct extension dispatch notice:', e);
            }
          }

          // 2. Generic extension broadcast if in extension context
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            try {
              chrome.runtime.sendMessage({
                type: 'SAVE_AUTH_DATA',
                data: authData
              });
            } catch (e) {}
          }

          // 3. PostMessage to opener if opened in a popup window
          if (window.opener) {
            try {
              window.opener.postMessage({
                type: 'LEETCODE2GIT_AUTH_SUCCESS',
                authData
              }, '*');
            } catch (e) {}
          }

          // 4. LocalStorage bridge
          try {
            localStorage.setItem('leetcode2git_auth', JSON.stringify(authData));
          } catch (e) {}
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('[OAuth Callback Error]:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LeetCode2Git - Authentication Error</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0d1117; color: #f0f6fc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 32px; max-width: 480px; text-align: center; }
          h2 { color: #ff7b72; margin-top: 0; }
          p { color: #8b949e; font-size: 14px; line-height: 1.5; }
          .btn { margin-top: 16px; padding: 8px 16px; background: #21262d; border: 1px solid #30363d; color: #c9d1d9; border-radius: 6px; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Authentication Error</h2>
          <p>${error.message || 'Failed to complete GitHub authorization. Please reconnect your account.'}</p>
          <button class="btn" onclick="window.close()">Close Window</button>
        </div>
      </body>
      </html>
    `);
  }
}

/**
 * Get profile of current authenticated user
 */
async function getCurrentUser(req, res) {
  res.json({
    success: true,
    user: sanitizeUser(req.user)
  });
}

/**
 * Handle user logout
 */
async function logout(req, res) {
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
}

module.exports = {
  initiateGithubOAuth,
  handleGithubCallback,
  getCurrentUser,
  logout
};
