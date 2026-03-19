import "@expo/metro-runtime" // this is for fast refresh on web w/o expo-router
import { registerRootComponent } from "expo"
import * as Sentry from "sentry-expo"

import { initSentry } from "@/services/sentry"
import { App } from "@/app"

// Initialize Sentry BEFORE app starts
initSentry()

// Wrap the app with Sentry for error boundary and crash reporting
const SentryWrappedApp = Sentry.Native.wrap(App)

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(SentryWrappedApp)
