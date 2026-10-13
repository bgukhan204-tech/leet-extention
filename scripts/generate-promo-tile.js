const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const storeAssetsDir = path.resolve(__dirname, '../store-assets');
const tempFile = path.resolve(__dirname, '../temp-promo.html');
const promoPng = path.join(storeAssetsDir, 'promo-tile-440x280.png');

const promoHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 440px;
      height: 280px;
      background: radial-gradient(circle at 75% 25%, #1c2128 0%, #0d1117 100%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f0f6fc;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 28px;
      position: relative;
    }
    .accent-glow {
      position: absolute;
      top: -30px;
      right: -30px;
      width: 160px;
      height: 160px;
      background: rgba(255, 161, 22, 0.2);
      filter: blur(35px);
      border-radius: 50%;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      background: rgba(255, 161, 22, 0.15);
      border: 1px solid rgba(255, 161, 22, 0.35);
      border-radius: 20px;
      color: #ffa116;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      width: fit-content;
    }
    .title {
      font-size: 26px;
      font-weight: 800;
      color: #fff;
      line-height: 1.2;
      margin-bottom: 8px;
    }
    .title span {
      color: #ffa116;
    }
    .subtitle {
      font-size: 13px;
      color: #8b949e;
      line-height: 1.45;
      margin-bottom: 18px;
      max-width: 370px;
    }
    .features {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pill {
      font-size: 11px;
      padding: 4px 9px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      color: #7ee787;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  </style>
</head>
<body>
  <div class="accent-glow"></div>
  <div class="badge">DEVELOPER TOOLS</div>
  <h1 class="title">LeetCode<span>2Git</span></h1>
  <p class="subtitle">Automatically sync accepted solutions to your GitHub repositories with clean directory structures.</p>
  <div class="features">
    <span class="pill">✓ Auto-Sync</span>
    <span class="pill">✓ Multi-Language</span>
    <span class="pill">✓ Clean Git History</span>
  </div>
</body>
</html>`;

fs.writeFileSync(tempFile, promoHtml);
const fileUrl = 'file:///' + tempFile.replace(/\\/g, '/');
execSync(`"${chromePath}" --headless=new --window-size=440,280 --hide-scrollbars --screenshot="${promoPng}" "${fileUrl}"`, { stdio: 'inherit' });

if (fs.existsSync(tempFile)) {
  fs.unlinkSync(tempFile);
}

console.log('✓ Successfully created promo tile:', promoPng);
