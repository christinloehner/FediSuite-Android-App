import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeDashboardScreen } from '../screens/dashboard/HomeDashboardScreen';
import { AccountDashboardScreen } from '../screens/dashboard/AccountDashboardScreen';
import type { DashboardStackParamList } from './types';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export function DashboardStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeDashboardScreen} />
      <Stack.Screen name="AccountDashboard" component={AccountDashboardScreen} />
    </Stack.Navigator>
  );
}
