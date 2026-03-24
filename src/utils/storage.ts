import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_PREFIX = 'fedisuite.token.';

function sanitizeInstanceUrl(instanceUrl: string) {
  return instanceUrl.replace(/[^a-zA-Z0-9]/g, '_');
}

function tokenKey(instanceUrl: string) {
  return `${TOKEN_PREFIX}${sanitizeInstanceUrl(instanceUrl)}`;
}

export async function saveTokenForInstance(instanceUrl: string, token: string) {
  await SecureStore.setItemAsync(tokenKey(instanceUrl), token);
}

export async function getTokenForInstance(instanceUrl: string) {
  return SecureStore.getItemAsync(tokenKey(instanceUrl));
}

export async function deleteTokenForInstance(instanceUrl: string) {
  await SecureStore.deleteItemAsync(tokenKey(instanceUrl));
}

export async function clearAppStorage() {
  const keys = await AsyncStorage.getAllKeys();
  const appKeys = keys.filter((key) => key.startsWith('fedisuite.'));
  if (appKeys.length > 0) {
    await AsyncStorage.multiRemove(appKeys);
  }
}
