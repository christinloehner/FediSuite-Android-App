import Constants from 'expo-constants';

export const appVersion =
  Constants.expoConfig?.extra?.appVersion ??
  Constants.expoConfig?.version ??
  '1.0.0';
