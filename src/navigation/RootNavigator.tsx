import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { HouseholdProvider, useHousehold } from '../hooks/useHousehold';
import { useSession } from '../hooks/useSession';
import { AuthScreen } from '../screens/AuthScreen';
import { HouseholdSetupScreen } from '../screens/HouseholdSetupScreen';
import { theme } from '../utils/theme';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  );
}

function AuthenticatedStack() {
  const { household, loading } = useHousehold();
  if (loading && !household) return <Loading />;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {household ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="HouseholdSetup" component={HouseholdSetupScreen} />
      )}
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const { user, loading } = useSession();
  if (loading) return <Loading />;

  return (
    <NavigationContainer>
      {user ? (
        <HouseholdProvider key={user.id} userId={user.id}>
          <AuthenticatedStack />
        </HouseholdProvider>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
