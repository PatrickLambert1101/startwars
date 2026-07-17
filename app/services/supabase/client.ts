import { AppState } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"

import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./config"

/**
 * Supabase client for the mobile app.
 *
 * Uses the **publishable** key so every request goes through Row-Level
 * Security. Auth tokens are persisted in AsyncStorage for offline support.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Only refresh tokens while the app is foregrounded (Supabase's recommended
// React Native setup). The rotating refresh token has no expiry, so as long
// as the user opens the app occasionally the session lasts indefinitely.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
