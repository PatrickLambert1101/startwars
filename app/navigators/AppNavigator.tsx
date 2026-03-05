/**
 * The app navigator is used for the primary navigation flows of the app.
 * It contains an auth flow (login) and the main tab-based flow for authenticated users.
 */
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import Config from "@/config"
import { useAuth } from "@/context/AuthContext"
import { useDatabase } from "@/context/DatabaseContext"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { LandingScreen } from "@/screens/LandingScreen"
import { LoginScreen } from "@/screens/LoginScreen"
import { AnimalDetailScreen } from "@/screens/AnimalDetailScreen/AnimalDetailScreen"
import { AnimalFormScreen } from "@/screens/AnimalFormScreen"
import { HealthRecordFormScreen } from "@/screens/HealthRecordFormScreen"
import { WeightRecordFormScreen } from "@/screens/WeightRecordFormScreen"
import { BreedingRecordFormScreen } from "@/screens/BreedingRecordFormScreen"
import { OrgSetupScreen } from "@/screens/OrgSetupScreen"
import { UpgradeScreen } from "@/screens/UpgradeScreen"
import { useAppTheme } from "@/theme/context"

import { MainTabNavigator } from "./MainTabNavigator"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"
import type { AppStackParamList, NavigationProps } from "./navigationTypes"

const exitRoutes = Config.exitRoutes

const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = () => {
  const { isAuthenticated } = useAuth()
  const { currentOrg, isOrgLoading } = useDatabase()
  const {
    theme: { colors },
  } = useAppTheme()

  // New users (authenticated but no org) go straight to onboarding
  const needsOnboarding = isAuthenticated && !isOrgLoading && !currentOrg
  const initialRoute = !isAuthenticated ? "Landing" : needsOnboarding ? "OrgSetup" : "Main"

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
      initialRouteName={initialRoute}
    >
      {isAuthenticated ? (
        <>
          {needsOnboarding && <Stack.Screen name="OrgSetup" component={OrgSetupScreen} />}
          <Stack.Screen name="Main" component={MainTabNavigator} />
          {!needsOnboarding && <Stack.Screen name="OrgSetup" component={OrgSetupScreen} />}
          <Stack.Screen name="AnimalDetail" component={AnimalDetailScreen} />
          <Stack.Screen name="AnimalForm" component={AnimalFormScreen} />
          <Stack.Screen name="HealthRecordForm" component={HealthRecordFormScreen} />
          <Stack.Screen name="WeightRecordForm" component={WeightRecordFormScreen} />
          <Stack.Screen name="BreedingRecordForm" component={BreedingRecordFormScreen} />
          <Stack.Screen name="Upgrade" component={UpgradeScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
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
