/**
 * Privacy Policy Controller for LeetCode2Git
 * Serves the public, unauthenticated Privacy Policy page.
 */

function renderPrivacyPolicy(req, res) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - LeetCode2Git</title>
  <style>
    :root {
      --bg: #0d1117;
      --card-bg: #161b22;
      --border: #30363d;
      --text: #f0f6fc;
      --text-muted: #8b949e;
      --accent: #ffa116;
      --green: #238636;
      --green-light: #3fb950;
      --blue: #58a6ff;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.65;
      padding: 32px 16px;
    }
    .container {
      max-width: 840px;
      margin: 0 auto;
    }
    header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 24px;
      font-weight: 700;
      color: var(--text);
      text-decoration: none;
      margin-bottom: 12px;
    }
    .brand span {
      color: var(--accent);
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 20px;
      background: rgba(35, 134, 54, 0.2);
      color: var(--green-light);
      border: 1px solid rgba(63, 185, 80, 0.3);
      margin-left: 8px;
    }
    h1 {
      font-size: 30px;
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--text);
    }
    .meta-date {
      color: var(--text-muted);
      font-size: 14px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
    }
    h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--blue);
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    p {
      color: #c9d1d9;
      font-size: 15px;
      margin-bottom: 14px;
    }
    p:last-child {
      margin-bottom: 0;
    }
    ul, ol {
      margin-left: 20px;
      margin-bottom: 14px;
      color: #c9d1d9;
      font-size: 15px;
    }
    li {
      margin-bottom: 8px;
    }
    strong {
      color: var(--text);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 14px;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 10px 14px;
      text-align: left;
    }
    th {
      background: #21262d;
      color: var(--text);
    }
    td {
      color: #c9d1d9;
    }
    a {
      color: var(--blue);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    footer {
      border-top: 1px solid var(--border);
      padding-top: 24px;
      margin-top: 40px;
      color: var(--text-muted);
      font-size: 13px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        LeetCode<span>2Git</span>
        <span class="badge">Official Policy</span>
      </div>
      <h1>Privacy Policy</h1>
      <div class="meta-date">Effective Date: October 2026 &bull; Version 1.0.0</div>
    </header>

    <div class="card">
      <h2>1. Overview & Purpose</h2>
      <p>
        <strong>LeetCode2Git</strong> is a developer productivity browser extension and companion API service designed to automatically and genuinely save your accepted LeetCode solutions directly to your personal GitHub repositories.
      </p>
      <p>
        We respect your privacy and believe in absolute transparency. This Privacy Policy details what data is processed when you use the LeetCode2Git extension and backend service, why it is processed, and how your information is protected.
      </p>
    </div>

    <div class="card">
      <h2>2. GitHub OAuth Authentication</h2>
      <p>
        LeetCode2Git utilizes official <strong>GitHub OAuth 2.0 Web Application Flow</strong> to authenticate users.
      </p>
      <ul>
        <li>You explicitly authorize LeetCode2Git with your GitHub account.</li>
        <li>The backend exchanges your authorization code for a GitHub access token with <code>repo</code> and <code>read:user</code> scopes, allowing the service to read your accessible repositories and commit solutions on your behalf.</li>
        <li><strong>Security Architecture:</strong> The raw GitHub access token is stored securely on the backend server and is <em>never sent to or stored in</em> the Chrome extension browser storage. The extension receives only a signed application session JWT.</li>
      </ul>
    </div>

    <div class="card">
      <h2>3. Information We Collect</h2>
      <table>
        <thead>
          <tr>
            <th>Information Type</th>
            <th>Purpose</th>
            <th>Storage Location</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>GitHub Account Data</strong><br>(Username, GitHub ID, display name, avatar URL)</td>
            <td>Identifies your account, displays your profile in the extension popup, and scopes your repository list.</td>
            <td>MongoDB Atlas (server) & Chrome Local Storage (cached profile)</td>
          </tr>
          <tr>
            <td><strong>Selected Repository & Branch</strong><br>(e.g. <code>username/leetcode-solutions</code>)</td>
            <td>Identifies your chosen target repository and default branch for saving code files.</td>
            <td>MongoDB Atlas (server) & Chrome Local Storage</td>
          </tr>
          <tr>
            <td><strong>LeetCode Problem Information</strong><br>(Problem number, title, difficulty, language)</td>
            <td>Used to organize repository folders (e.g. <code>Easy/1-Two-Sum/</code>) and generate markdown documentation.</td>
            <td>MongoDB Atlas (server) & In-Page Modal (temporary)</td>
          </tr>
          <tr>
            <td><strong>Solution Code</strong></td>
            <td>The source code submitted by you on LeetCode, used solely to commit your solution to your chosen GitHub repository.</td>
            <td>Committed directly to your GitHub repository; metadata recorded in database</td>
          </tr>
          <tr>
            <td><strong>Application Session Token</strong><br>(Signed JWT)</td>
            <td>Maintains your active authenticated session between the browser extension and backend API.</td>
            <td>Chrome Local Storage (browser only)</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>4. How Your Information Is Used</h2>
      <p>We process your data strictly to provide the core functionality of LeetCode2Git:</p>
      <ol>
        <li>To authenticate your session and verify your GitHub identity.</li>
        <li>To retrieve your accessible repositories so you can choose where solutions are stored.</li>
        <li>To verify write access to your selected repository before attempting commits.</li>
        <li>To commit your genuine accepted LeetCode solution code and auto-generated problem <code>README.md</code> documentation into your repository.</li>
        <li>To display your solution history and difficulty statistics in the extension dashboard.</li>
      </ol>
      <p>
        <strong>Zero Fake Commits:</strong> LeetCode2Git records strictly genuine user solutions and never manipulates GitHub contribution graphs or generates artificial activity.
      </p>
    </div>

    <div class="card">
      <h2>5. Third-Party Services</h2>
      <p>LeetCode2Git communicates with the following trusted third-party services:</p>
      <ul>
        <li><strong>GitHub (GitHub, Inc.):</strong> Used for OAuth authentication and executing Git repository commits via the official GitHub REST API. Governed by the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub Privacy Statement</a>.</li>
        <li><strong>Render (Render Services, Inc.):</strong> Hosts the backend API server. Governed by the <a href="https://render.com/privacy" target="_blank" rel="noopener noreferrer">Render Privacy Policy</a>.</li>
        <li><strong>MongoDB Atlas (MongoDB, Inc.):</strong> Secure cloud database provider where user profiles and solution upload metadata are persisted. Governed by the <a href="https://www.mongodb.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">MongoDB Privacy Policy</a>.</li>
      </ul>
    </div>

    <div class="card">
      <h2>6. Data Security & Storage</h2>
      <ul>
        <li><strong>Encryption in Transit:</strong> All communications between the Chrome extension, backend API, and GitHub API are conducted strictly over HTTPS using modern TLS encryption.</li>
        <li><strong>Credential Isolation:</strong> The GitHub OAuth Client Secret is kept exclusively as a server-side environment variable and is never exposed in client code. Raw GitHub OAuth access tokens remain server-side and are never transmitted to extension storage.</li>
        <li><strong>Open Redirect Protection:</strong> All OAuth callback destinations are strictly validated to prevent redirection to untrusted domains.</li>
      </ul>
    </div>

    <div class="card">
      <h2>7. Data Sharing & Selling</h2>
      <p>
        <strong>We do not sell, rent, trade, or monetize your personal information or source code.</strong>
      </p>
      <p>
        Your data is processed solely for the functional purpose of committing your LeetCode solutions to your own GitHub account. We do not share user data with third-party advertising networks, data brokers, or analytics platforms.
      </p>
    </div>

    <div class="card">
      <h2>8. Data Retention & Deletion Rights</h2>
      <p>
        Your account profile and solution metadata are retained as long as your account remains connected to LeetCode2Git.
      </p>
      <ul>
        <li><strong>Disconnecting:</strong> You can disconnect your GitHub account at any time by clicking <strong>Disconnect</strong> in the extension popup. This immediately clears all session tokens from your browser storage.</li>
        <li><strong>Data Deletion Request:</strong> You have the right to request permanent deletion of your account and associated solution records from our database at any time. Simply open an issue or email us at the contact address below with your GitHub username, and your data will be permanently expunged within 7 business days.</li>
      </ul>
    </div>

    <div class="card">
      <h2>9. Contact & Support</h2>
      <p>
        If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact us:
      </p>
      <ul>
        <li><strong>GitHub Repository:</strong> <a href="https://github.com/bgukhan204-tech/leet-extention" target="_blank" rel="noopener noreferrer">https://github.com/bgukhan204-tech/leet-extention</a></li>
        <li><strong>Issue Tracker:</strong> <a href="https://github.com/bgukhan204-tech/leet-extention/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a></li>
      </ul>
    </div>

    <footer>
      &copy; 2026 LeetCode2Git &bull; Open-Source Developer Companion &bull; All rights reserved.
    </footer>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}

module.exports = {
  renderPrivacyPolicy
};
