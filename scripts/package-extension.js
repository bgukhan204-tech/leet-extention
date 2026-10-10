const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('🚀 LeetCode2Git - Chrome Web Store Package Builder');
console.log('====================================================');

const projectRoot = path.resolve(__dirname, '..');
const extensionDir = path.resolve(projectRoot, 'extension');
const distDir = path.resolve(projectRoot, 'dist');
const zipOutput = path.resolve(distDir, 'leetcode2git-extension.zip');

// 1. Validate manifest.json
console.log('1. Validating manifest.json...');
const manifestPath = path.resolve(extensionDir, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('❌ Missing extension/manifest.json!');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
if (manifest.manifest_version !== 3) {
  console.error(`❌ Expected manifest_version: 3, found: ${manifest.manifest_version}`);
  process.exit(1);
}
console.log(`✓ Manifest Version: ${manifest.manifest_version} (${manifest.name} v${manifest.version})`);

// 2. Validate all referenced files exist
console.log('2. Verifying referenced assets and scripts...');
const filesToCheck = [
  manifest.icons['16'],
  manifest.icons['48'],
  manifest.icons['128'],
  manifest.action?.default_popup,
  manifest.background?.service_worker,
  'config.js'
];

if (Array.isArray(manifest.content_scripts)) {
  manifest.content_scripts.forEach(cs => {
    if (cs.js) filesToCheck.push(...cs.js);
    if (cs.css) filesToCheck.push(...cs.css);
  });
}

filesToCheck.forEach(relPath => {
  if (!relPath) return;
  const fullPath = path.resolve(extensionDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing referenced file: ${relPath} (expected at ${fullPath})`);
    process.exit(1);
  }
  const stat = fs.statSync(fullPath);
  console.log(`  ✓ Found ${relPath} (${stat.size} bytes)`);
});

// 3. Verify config.js contains production URL and no secrets
console.log('3. Validating extension configuration & security...');
const configContent = fs.readFileSync(path.resolve(extensionDir, 'config.js'), 'utf-8');
if (!configContent.includes('https://leetcode2git-backend.onrender.com')) {
  console.error('❌ extension/config.js does not contain the production backend URL!');
  process.exit(1);
}
console.log('  ✓ Production backend URL confirmed in config.js');

// Security scan for secrets in extension directory
const forbiddenKeywords = ['client_secret', 'jwt_secret', 'mongodb+srv', 'ghp_', 'gho_secret'];
const extensionFiles = [];
function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(full);
    } else {
      extensionFiles.push(full);
    }
  }
}
scanDir(extensionDir);

for (const f of extensionFiles) {
  const content = fs.readFileSync(f, 'utf-8');
  for (const kw of forbiddenKeywords) {
    if (content.toLowerCase().includes(kw)) {
      console.error(`❌ Security Scan Alert: Found forbidden token "${kw}" in ${f}`);
      process.exit(1);
    }
  }
}
console.log(`  ✓ Security Scan Clean: ${extensionFiles.length} files scanned with zero secret strings.`);

// 4. Prepare output directory
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
if (fs.existsSync(zipOutput)) {
  fs.unlinkSync(zipOutput);
}

// 5. Create ZIP package containing ONLY extension contents at root
console.log('4. Packaging extension into dist/leetcode2git-extension.zip...');
// In PowerShell on Windows:
const psCommand = `powershell.exe -NoProfile -Command "Compress-Archive -Path '${extensionDir}\\*' -DestinationPath '${zipOutput}' -Force"`;
execSync(psCommand, { stdio: 'inherit' });

if (!fs.existsSync(zipOutput)) {
  console.error('❌ Failed to create zip file!');
  process.exit(1);
}

const zipStat = fs.statSync(zipOutput);
console.log(`✓ Package created: ${zipOutput} (${(zipStat.size / 1024).toFixed(2)} KB)`);

// 6. Inspect ZIP contents to confirm manifest.json is at root
console.log('5. Inspecting ZIP file structure...');
const inspectCmd = `powershell.exe -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('${zipOutput}').Entries | Select-Object -Property FullName, Length | Format-Table -AutoSize"`;
const inspectOutput = execSync(inspectCmd, { encoding: 'utf-8' });
console.log(inspectOutput);

// Confirm manifest.json is at root
if (!inspectOutput.includes('manifest.json')) {
  console.error('❌ manifest.json not found in ZIP!');
  process.exit(1);
}
if (inspectOutput.includes('extension/manifest.json') || inspectOutput.includes('backend') || inspectOutput.includes('.env')) {
  console.error('❌ Invalid ZIP structure: Contains nested directories or backend files!');
  process.exit(1);
}

console.log('====================================================');
console.log('🎉 SUCCESS: Chrome Web Store production package is ready!');
console.log(`📦 Output: dist/leetcode2git-extension.zip (${(zipStat.size / 1024).toFixed(2)} KB)`);
console.log('====================================================');
