/**
 * The app navigator is used for the primary navigation flows of the app.
 * It contains an auth flow (login) and the main tab-based flow for authenticated users.
 */
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { LoadingScreen } from "@/components"
import Config from "@/config"
import { useAuth } from "@/context/AuthContext"
import { AnimalDetailScreen } from "@/screens/AnimalDetailScreen/AnimalDetailScreen"
import { AnimalFormScreen } from "@/screens/AnimalFormScreen"
import { AuthScreen } from "@/screens/AuthScreen"
import { BreedingRecordFormScreen } from "@/screens/BreedingRecordFormScreen"
import { BulkAnimalAddScreen } from "@/screens/BulkAnimalAddScreen"
import { CustomerCenterScreen } from "@/screens/CustomerCenterScreen"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { HealthRecordFormScreen } from "@/screens/HealthRecordFormScreen"
import { IconGalleryScreen } from "@/screens/IconGalleryScreen"
import { LandingScreen } from "@/screens/LandingScreen"
import { LoginScreen } from "@/screens/LoginScreen"
import { MovementFormScreen } from "@/screens/MovementFormScreen"
import { OrgSetupScreen } from "@/screens/OrgSetupScreen"
import { PastureActivityFormScreen } from "@/screens/PastureActivityFormScreen"
import { PastureActivityListScreen } from "@/screens/PastureActivityListScreen"
import { PastureBoundaryScreen } from "@/screens/PastureBoundaryScreen"
import { PastureDetailScreen } from "@/screens/PastureDetailScreen"
import { PastureFormScreen } from "@/screens/PastureFormScreen"
import { PasturesMapScreen } from "@/screens/PasturesMapScreen"
import { PastureWizardScreen } from "@/screens/PastureWizardScreen"
import { PaywallScreen } from "@/screens/PaywallScreen"
import { PendingVaccinationsScreen } from "@/screens/PendingVaccinationsScreen"
import { ProtocolDetailScreen } from "@/screens/ProtocolDetailScreen"
import { ProtocolFormScreen } from "@/screens/ProtocolFormScreen"
import { ReportBuilderScreen } from "@/screens/ReportBuilderScreen"
import { ReportsScreen } from "@/screens/ReportsScreen"
import { ReportViewerScreen } from "@/screens/ReportViewerScreen"
import { SettingsScreen } from "@/screens/SettingsScreen"
import { TagScannerScreen } from "@/screens/TagScannerScreen"
import { TeamScreen } from "@/screens/TeamScreen"
import { TreatmentProtocolsScreen } from "@/screens/TreatmentProtocolsScreen"
import { UpgradeScreen } from "@/screens/UpgradeScreen"
import { VaccinationScheduleFormScreen } from "@/screens/VaccinationScheduleFormScreen"
import { VaccinationScheduleScreen } from "@/screens/VaccinationScheduleScreen"
import { WeightRecordFormScreen } from "@/screens/WeightRecordFormScreen"
import { useAppTheme } from "@/theme/context"

import { MainTabNavigator } from "./MainTabNavigator"
import type { AppStackParamList, NavigationProps } from "./navigationTypes"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"

const exitRoutes = Config.exitRoutes

const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = () => {
  const { isAuthenticated, isLoading } = useAuth()
  const {
    theme: { colors },
  } = useAppTheme()

  // Show animated loading screen while checking auth status
  if (isLoading) {
    return <LoadingScreen message="Loading..." />
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="OrgSetup" component={OrgSetupScreen} />
          <Stack.Screen name="Team" component={TeamScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="AnimalDetail" component={AnimalDetailScreen} />
          <Stack.Screen name="AnimalForm" component={AnimalFormScreen} />
          <Stack.Screen name="BulkAnimalAdd" component={BulkAnimalAddScreen} />
          <Stack.Screen name="HealthRecordForm" component={HealthRecordFormScreen} />
          <Stack.Screen name="WeightRecordForm" component={WeightRecordFormScreen} />
          <Stack.Screen name="BreedingRecordForm" component={BreedingRecordFormScreen} />
          <Stack.Screen name="TreatmentProtocols" component={TreatmentProtocolsScreen} />
          <Stack.Screen name="ProtocolForm" component={ProtocolFormScreen} />
          <Stack.Screen name="ProtocolDetail" component={ProtocolDetailScreen} />
          <Stack.Screen name="VaccinationSchedules" component={VaccinationScheduleScreen} />
          <Stack.Screen name="VaccinationScheduleForm" component={VaccinationScheduleFormScreen} />
          <Stack.Screen name="PendingVaccinations" component={PendingVaccinationsScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="ReportBuilder" component={ReportBuilderScreen} />
          <Stack.Screen name="ReportViewer" component={ReportViewerScreen} />
          <Stack.Screen name="PastureDetail" component={PastureDetailScreen} />
          <Stack.Screen name="PastureForm" component={PastureFormScreen} />
          <Stack.Screen name="PastureActivityForm" component={PastureActivityFormScreen} />
          <Stack.Screen name="PastureActivityList" component={PastureActivityListScreen} />
          <Stack.Screen name="PastureBoundary" component={PastureBoundaryScreen} />
          <Stack.Screen name="PasturesMap" component={PasturesMapScreen} />
          <Stack.Screen name="PastureWizard" component={PastureWizardScreen} />
          <Stack.Screen name="MovementForm" component={MovementFormScreen} />
          <Stack.Screen name="TagScanner" component={TagScannerScreen} />
          <Stack.Screen name="Upgrade" component={UpgradeScreen} />
          <Stack.Screen name="Paywall" component={PaywallScreen} />
          <Stack.Screen name="CustomerCenter" component={CustomerCenterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      )}
      <Stack.Screen name="IconGallery" component={IconGalleryScreen} />
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
