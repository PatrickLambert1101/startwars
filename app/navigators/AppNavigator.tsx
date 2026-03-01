/**
 * The app navigator is used for the primary navigation flows of the app.
 * It contains an auth flow (login) and the main tab-based flow for authenticated users.
 */
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import Config from "@/config"
import { useAuth } from "@/context/AuthContext"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { LoginScreen } from "@/screens/LoginScreen"
import { AnimalDetailScreen } from "@/screens/AnimalDetailScreen/AnimalDetailScreen"
import { AnimalFormScreen } from "@/screens/AnimalFormScreen"
import { HealthRecordFormScreen } from "@/screens/HealthRecordFormScreen"
import { WeightRecordFormScreen } from "@/screens/WeightRecordFormScreen"
import { BreedingRecordFormScreen } from "@/screens/BreedingRecordFormScreen"
import { OrgSetupScreen } from "@/screens/OrgSetupScreen"
import { useAppTheme } from "@/theme/context"

import { MainTabNavigator } from "./MainTabNavigator"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"
import type { AppStackParamList, NavigationProps } from "./navigationTypes"

const exitRoutes = Config.exitRoutes

const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = () => {
  const { isAuthenticated } = useAuth()
  const {
    theme: { colors },
  } = useAppTheme()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
      initialRouteName={isAuthenticated ? "Main" : "Login"}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="OrgSetup" component={OrgSetupScreen} />
          <Stack.Screen name="AnimalDetail" component={AnimalDetailScreen} />
          <Stack.Screen name="AnimalForm" component={AnimalFormScreen} />
          <Stack.Screen name="HealthRecordForm" component={HealthRecordFormScreen} />
          <Stack.Screen name="WeightRecordForm" component={WeightRecordFormScreen} />
          <Stack.Screen name="BreedingRecordForm" component={BreedingRecordFormScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      )}
    </Stack.Navigator>
  )
}

export const AppNavigator = (props: NavigationProps) => {
  const { navigationTheme } = useAppTheme()

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
      <ErrorBoundary catchErrors={Config.catchErrors}>
        <AppStack />
      </ErrorBoundary>
    </NavigationContainer>
  )
}
