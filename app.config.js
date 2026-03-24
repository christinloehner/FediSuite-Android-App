const fs = require('fs');
const path = require('path');

function readEnvValue(key, fallback) {
  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    return fallback;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const envKey = trimmed.slice(0, separatorIndex).trim();
    if (envKey !== key) {
      continue;
    }

    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    return rawValue.replace(/^['"]|['"]$/g, '') || fallback;
  }

  return fallback;
}

const appVersion = readEnvValue('APP_VERSION', '1.0.0');

module.exports = {
  expo: {
    name: 'FediSuite',
    slug: 'fedisuite-mobile',
    version: appVersion,
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0B1220',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'org.fedisuite.mobile',
    },
    android: {
      package: 'org.fedisuite.mobile',
      adaptiveIcon: {
        backgroundColor: '#0B1220',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: ['expo-secure-store', 'expo-localization'],
    experiments: {
      typedRoutes: false,
    },
    extra: {
      appVersion,
    },
  },
};
