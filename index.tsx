import "@expo/metro-runtime" // this is for fast refresh on web w/o expo-router
import { registerRootComponent } from "expo"
import * as Sentry from "@sentry/react-native"

import { initSentry } from "@/services/sentry"
import { App } from "@/app"

// Initialize Sentry BEFORE app starts
initSentry()

// Wrap the App component with Sentry's error boundary
const SentryWrappedApp = Sentry.wrap(App)

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(SentryWrappedApp)
