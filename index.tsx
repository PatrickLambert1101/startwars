import "@expo/metro-runtime" // this is for fast refresh on web w/o expo-router
import { registerRootComponent } from "expo"
import * as Sentry from "@sentry/react-native"
import { Alert } from "react-native"

import { initSentry } from "@/services/sentry"
import { App } from "@/app"

// Initialize Sentry BEFORE app starts
console.log("==========================================")
console.log("[DEBUG] About to initialize Sentry")
console.log("==========================================")
try {
  initSentry()
  console.log("[DEBUG] Sentry initialization completed")
  // Alert.alert("Debug", "Sentry init called")
} catch (error) {
  console.error("[DEBUG] Error initializing Sentry:", error)
  // Alert.alert("Debug Error", String(error))
}

// Wrap the app with Sentry for error boundary and crash reporting
const SentryWrappedApp = Sentry.wrap(App)

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(SentryWrappedApp)
