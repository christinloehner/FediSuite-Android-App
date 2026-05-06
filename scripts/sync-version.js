const fs = require('fs');
const path = require('path');
const { FALLBACK_VERSION, readVersionFile, versionCodeFromVersion } = require('./versioning');

const projectRoot = path.join(__dirname, '..');
const generatedDir = path.join(projectRoot, 'src', 'generated');
const generatedVersionFile = path.join(generatedDir, 'appVersion.ts');
const appVersion = readVersionFile(projectRoot, FALLBACK_VERSION);
const appVersionCode = versionCodeFromVersion(appVersion);

if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

fs.writeFileSync(
  generatedVersionFile,
  [
    `export const appVersion = ${JSON.stringify(appVersion)};`,
    `export const appVersionCode = ${appVersionCode};`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`Synced app version: ${appVersion} (${appVersionCode})`);
