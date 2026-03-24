const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const versionPath = path.join(projectRoot, 'version');
const generatedDir = path.join(projectRoot, 'src', 'generated');
const generatedVersionFile = path.join(generatedDir, 'appVersion.ts');

const fallbackVersion = '1.0.0';
const appVersion = fs.existsSync(versionPath)
  ? fs.readFileSync(versionPath, 'utf8').trim() || fallbackVersion
  : fallbackVersion;

if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

fs.writeFileSync(
  generatedVersionFile,
  `export const appVersion = ${JSON.stringify(appVersion)};\n`,
  'utf8',
);

console.log(`Synced app version: ${appVersion}`);
