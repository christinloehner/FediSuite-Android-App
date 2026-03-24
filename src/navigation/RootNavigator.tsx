import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { LoadingView } from '../components/LoadingView';
import { Screen } from '../components/Screen';
import { useForegroundRefresh } from '../hooks/useForegroundRefresh';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { InstanceScreen } from '../screens/instance/InstanceScreen';
import { useInstanceStore } from '../store/instanceStore';
import { useSessionStore } from '../store/sessionStore';
import { fedisuiteDarkTheme, fedisuiteLightTheme } from '../theme';
import { getTokenForInstance } from '../utils/storage';
import { AppTabs } from './AppTabs';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function RootNavigator() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'light' ? fedisuiteLightTheme : fedisuiteDarkTheme;
  const isHydrating = useSessionStore((state) => state.isHydrating);
  const token = useSessionStore((state) => state.token);
  const setHydrating = useSessionStore((state) => state.setHydrating);
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);
  const activeInstanceUrl = useInstanceStore((state) => state.activeInstanceUrl);

  useForegroundRefresh();

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!activeInstanceUrl) {
        clearSession();
        setHydrating(false);
        return;
      }

      const storedToken = await getTokenForInstance(activeInstanceUrl);

      if (cancelled) {
        return;
      }

      if (storedToken) {
        setSession({
          token: storedToken,
          user: {
            id: 0,
            email: '',
            isAdmin: false,
          },
        });
      } else {
        clearSession();
      }

      setHydrating(false);
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [activeInstanceUrl, clearSession, setHydrating, setSession]);

  if (isHydrating) {
    return (
      <NavigationContainer theme={theme}>
        <Screen>
          <LoadingView label="App-Sitzung wird wiederhergestellt..." />
        </Screen>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={theme}>
      {activeInstanceUrl && token ? (
        <AppTabs />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!activeInstanceUrl ? (
            <Stack.Screen name="Instance" component={InstanceScreen} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
