import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { HomeDataProvider } from '../hooks/useHomeData';
import { FinancesScreen } from '../screens/FinancesScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PresenceScreen } from '../screens/PresenceScreen';
import { theme } from '../utils/theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = { Inicio: '🏡', Presencia: '💞', Finanzas: '💰' };

export function MainTabs() {
  return (
    <HomeDataProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: theme.colors.primary,
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICONS[route.name]}</Text>,
          headerStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
        })}
      >
        <Tab.Screen name="Inicio" component={HomeScreen} options={{ title: 'Dulce Hogar' }} />
        <Tab.Screen name="Presencia" component={PresenceScreen} />
        <Tab.Screen name="Finanzas" component={FinancesScreen} />
      </Tab.Navigator>
    </HomeDataProvider>
  );
}
