/* eslint-disable import/first */
/**
 * HerdTrackr — Cattle management, offline-first.
 *
 * Main entry point for the app. Sets up providers, loads fonts/i18n,
 * and renders the root navigator.
 */
if (__DEV__) {
  require("./devtools/ReactotronConfig.ts")
}
import "./utils/gestureHandler"

import { useEffect, useState } from "react"
import { useFonts } from "expo-font"
import * as Linking from "expo-linking"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context"

import { AuthProvider } from "./context/AuthContext"
import { DatabaseProvider } from "./context/DatabaseContext"
import { initI18n } from "./i18n"
import { AppNavigator } from "./navigators/AppNavigator"
import { useNavigationPersistence } from "./navigators/navigationUtilities"
import { ThemeProvider } from "./theme/context"
import { customFontsToLoad } from "./theme/typography"
import { loadDateFnsLocale } from "./utils/formatDate"
import * as storage from "./utils/storage"

export const NAVIGATION_PERSISTENCE_KEY = "NAVIGATION_STATE"

const prefix = Linking.createURL("/")
const config = {
  screens: {
    Login: {
      path: "",
    },
    Main: {
      screens: {
        Dashboard: "dashboard",
        HerdList: "herd",
        Chute: "chute",
        Reports: "reports",
        Settings: "settings",
      },
    },
    OrgSetup: "org/setup",
    AnimalDetail: "animal/:animalId",
    AnimalForm: "animal/form",
    HealthRecordForm: "animal/:animalId/health/new",
    WeightRecordForm: "animal/:animalId/weight/new",
    BreedingRecordForm: "animal/:animalId/breeding/new",
  },
}

export function App() {
  const {
    initialNavigationState,
    onNavigationStateChange,
    isRestored: isNavigationStateRestored,
  } = useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY)

  const [areFontsLoaded, fontLoadError] = useFonts(customFontsToLoad)
  const [isI18nInitialized, setIsI18nInitialized] = useState(false)

  useEffect(() => {
    initI18n()
      .then(() => setIsI18nInitialized(true))
      .then(() => loadDateFnsLocale())
  }, [])

  if (!isNavigationStateRestored || !isI18nInitialized || (!areFontsLoaded && !fontLoadError)) {
    return null
  }

  const linking = {
    prefixes: [prefix],
    config,
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <KeyboardProvider>
        <AuthProvider>
          <DatabaseProvider>
            <ThemeProvider>
              <AppNavigator
                linking={linking}
                initialState={initialNavigationState}
                onStateChange={onNavigationStateChange}
              />
            </ThemeProvider>
          </DatabaseProvider>
        </AuthProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  )
}
