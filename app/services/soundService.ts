import { NativeModules, Platform } from "react-native"

/**
 * Sound feedback service for RFID scanning
 * Uses native Android ToneGenerator for reliable beeps
 */

interface BeepModule {
  playBeep(): void
}

// Create a simple beep module reference
const BeepNative = NativeModules.BeepModule as BeepModule | undefined

export class SoundFeedback {
  /**
   * Play success beep (when tag is scanned successfully)
   */
  static async success(): Promise<void> {
    try {
      console.log("[SoundService] 🔊 Playing success beep...")

      if (Platform.OS === "android") {
        // Use native beep if available
        if (BeepNative) {
          BeepNative.playBeep()
          console.log("[SoundService] ✅ Native beep played")
        } else {
          console.log("[SoundService] ℹ️ Native beep module not available, using fallback")
          // Fallback: Do nothing for now
        }
      }
    } catch (error) {
      console.error("[SoundService] ❌ Failed to play beep:", error)
    }
  }

  /**
   * Play error/fail beep (when scan fails or error occurs)
   */
  static async error(): Promise<void> {
    try {
      console.log("[SoundService] 🔊 Playing error beep...")

      if (Platform.OS === "android") {
        // Use native beep if available
        if (BeepNative) {
          BeepNative.playBeep()
          console.log("[SoundService] ✅ Native error beep played")
        } else {
          console.log("[SoundService] ℹ️ Native beep module not available, using fallback")
          // Fallback: Do nothing for now
        }
      }
    } catch (error) {
      console.error("[SoundService] ❌ Failed to play error beep:", error)
    }
  }

  /**
   * Play neutral beep (for general feedback like initialization)
   */
  static async neutral(): Promise<void> {
    try {
      console.log("[SoundService] 🔊 Playing neutral beep...")

      if (Platform.OS === "android") {
        // Use native beep if available
        if (BeepNative) {
          BeepNative.playBeep()
          console.log("[SoundService] ✅ Native neutral beep played")
        } else {
          console.log("[SoundService] ℹ️ Native beep module not available, using fallback")
          // Fallback: Do nothing for now
        }
      }
    } catch (error) {
      console.error("[SoundService] ❌ Failed to play neutral beep:", error)
    }
  }
}
