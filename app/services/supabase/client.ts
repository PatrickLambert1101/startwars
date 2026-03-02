import { createClient } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"

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
