const fs = require('fs');
const path = require('path');

function readVersionFile(fallback) {
  const versionPath = path.join(__dirname, 'version');

  if (!fs.existsSync(versionPath)) {
    return fallback;
  }

  return fs.readFileSync(versionPath, 'utf8').trim() || fallback;
}

const appVersion = readVersionFile('1.0.0');

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
