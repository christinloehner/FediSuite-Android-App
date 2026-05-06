const fs = require('fs');
const path = require('path');

const FALLBACK_VERSION = '1.0.0';
const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

function readVersionFile(projectRoot, fallback = FALLBACK_VERSION) {
  const versionPath = path.join(projectRoot, 'version');

  if (!fs.existsSync(versionPath)) {
    return fallback;
  }

  return fs.readFileSync(versionPath, 'utf8').trim() || fallback;
}

function parseVersion(version) {
  const match = VERSION_PATTERN.exec(version);

  if (!match) {
    throw new Error(`Unsupported version format "${version}". Expected MAJOR.MINOR.PATCH.`);
  }

  const [, major, minor, patch] = match;
  return {
    major: Number.parseInt(major, 10),
    minor: Number.parseInt(minor, 10),
    patch: Number.parseInt(patch, 10),
  };
}

function versionCodeFromVersion(version) {
  const { major, minor, patch } = parseVersion(version);

  if (minor > 99 || patch > 99) {
    throw new Error(`Unsupported version "${version}". Minor and patch must stay below 100.`);
  }

  return major * 10000 + minor * 100 + patch;
}

module.exports = {
  FALLBACK_VERSION,
  parseVersion,
  readVersionFile,
  versionCodeFromVersion,
};
