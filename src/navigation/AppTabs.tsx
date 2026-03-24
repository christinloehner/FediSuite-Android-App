import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, useColorScheme } from 'react-native';

import type { AppTabsParamList } from './types';
import { DashboardStackNavigator } from './DashboardStackNavigator';
import { ComposerScreen } from '../screens/composer/ComposerScreen';
import { QueueScreen } from '../screens/queue/QueueScreen';
import { AccountsScreen } from '../screens/accounts/AccountsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { AdminScreen } from '../screens/admin/AdminScreen';
import { fedisuiteDarkTheme, fedisuiteLightTheme } from '../theme';
import { useBootstrap } from '../hooks/useBootstrap';

const Tab = createBottomTabNavigator<AppTabsParamList>();

export function AppTabs() {
  const isDark = useColorScheme() !== 'light';
  const theme = isDark ? fedisuiteDarkTheme : fedisuiteLightTheme;
  const bootstrapQuery = useBootstrap();
  const showAdmin = Boolean(bootstrapQuery.data?.user.is_admin);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: isDark ? '#8FA0BC' : '#61718B',
        tabBarStyle: {
          height: 72,
          paddingTop: 10,
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          paddingBottom: 8,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackNavigator}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>◫</Text>,
        }}
      />
      <Tab.Screen
        name="Composer"
        component={ComposerScreen}
        options={{
          title: 'Composer',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>＋</Text>,
        }}
      />
      <Tab.Screen
        name="Queue"
        component={QueueScreen}
        options={{
          title: 'Queue',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>≣</Text>,
        }}
      />
      <Tab.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>◎</Text>,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⚙</Text>,
        }}
      />
      {showAdmin ? (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            title: 'Admin',
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⌘</Text>,
          }}
        />
      ) : null}
    </Tab.Navigator>
  );
}
