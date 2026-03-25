import SoundPlayer from "react-native-sound-player"

/**
 * Sound feedback service for RFID scanning
 * Based on working implementation from Rental-Scanner-v2
 * Uses react-native-sound-player instead of expo-av for better reliability
 */
export class SoundFeedback {
  /**
   * Play success beep (when tag is scanned successfully)
   */
  static success(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        SoundPlayer.playSoundFile("beep_success", "mp3")
        resolve()
      } catch (error) {
        console.error("[SoundService] Failed to play beep_success:", error)
        reject(error)
      }
    })
  }

  /**
   * Play error/fail beep (when scan fails or error occurs)
   */
  static error(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        SoundPlayer.playSoundFile("beep_fail", "mp3")
        resolve()
      } catch (error) {
        console.error("[SoundService] Failed to play beep_fail:", error)
        reject(error)
      }
    })
  }

  /**
   * Play neutral beep (for general feedback like initialization)
   */
  static neutral(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        SoundPlayer.playSoundFile("beep_neutral", "mp3")
        resolve()
      } catch (error) {
        console.error("[SoundService] Failed to play beep_neutral:", error)
        reject(error)
      }
    })
  }
}
