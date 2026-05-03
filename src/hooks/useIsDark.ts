import { useColorScheme } from 'react-native';

import { useAppSettingsStore } from '../store/appSettingsStore';

export function useIsDark() {
  const theme = useAppSettingsStore((state) => state.theme);
  const systemColorScheme = useColorScheme();

  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return systemColorScheme !== 'light';
}
