import { Audio } from "expo-av"

/**
 * Sound Service for playing audio feedback
 * Used for RFID scanner initialization and other UI interactions
 */

export type SoundType = "beep_neutral" | "beep_success" | "beep_error"

// Map of sound types to their file paths
const SOUND_FILES: Record<SoundType, any> = {
  beep_neutral: require("@/assets/sounds/beep_neutral.mp3"),
  beep_success: require("@/assets/sounds/beep_success.mp3"),
  beep_error: require("@/assets/sounds/beep_error.mp3"),
}

// Cache of loaded sounds
const soundCache = new Map<SoundType, Audio.Sound>()

/**
 * Initialize the audio system
 * Should be called once at app startup
 */
export async function initializeAudio(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    })
    console.log("[SoundService] Audio initialized")
  } catch (error) {
    console.error("[SoundService] Failed to initialize audio:", error)
  }
}

/**
 * Preload a sound into memory for faster playback
 */
async function preloadSound(soundType: SoundType): Promise<void> {
  if (soundCache.has(soundType)) {
    return // Already loaded
  }

  try {
    const { sound } = await Audio.Sound.createAsync(SOUND_FILES[soundType], {
      shouldPlay: false,
    })

    soundCache.set(soundType, sound)
    console.log(`[SoundService] Preloaded sound: ${soundType}`)
  } catch (error) {
    console.error(`[SoundService] Failed to preload sound ${soundType}:`, error)
  }
}

/**
 * Preload all sounds for immediate playback
 * Call this during app initialization
 */
export async function preloadAllSounds(): Promise<void> {
  console.log("[SoundService] Preloading all sounds...")
  const soundTypes: SoundType[] = ["beep_neutral", "beep_success", "beep_error"]

  await Promise.all(soundTypes.map((type) => preloadSound(type)))
  console.log("[SoundService] All sounds preloaded")
}

/**
 * Play a sound
 * @param soundType - Type of sound to play
 * @param volume - Volume level (0.0 to 1.0), default 1.0
 */
export async function playSound(soundType: SoundType, volume: number = 1.0): Promise<void> {
  try {
    // Try to get from cache first
    let sound = soundCache.get(soundType)

    if (!sound) {
      // Load sound if not cached
      const { sound: newSound } = await Audio.Sound.createAsync(SOUND_FILES[soundType], {
        shouldPlay: false,
      })
      sound = newSound
      soundCache.set(soundType, sound)
    }

    // Set volume and play
    await sound.setVolumeAsync(volume)
    await sound.setPositionAsync(0) // Reset to beginning
    await sound.playAsync()

    console.log(`[SoundService] Played sound: ${soundType} (volume: ${volume})`)
  } catch (error) {
    console.error(`[SoundService] Failed to play sound ${soundType}:`, error)
  }
}

/**
 * Stop a specific sound
 */
export async function stopSound(soundType: SoundType): Promise<void> {
  try {
    const sound = soundCache.get(soundType)
    if (sound) {
      await sound.stopAsync()
      console.log(`[SoundService] Stopped sound: ${soundType}`)
    }
  } catch (error) {
    console.error(`[SoundService] Failed to stop sound ${soundType}:`, error)
  }
}

/**
 * Stop all sounds
 */
export async function stopAllSounds(): Promise<void> {
  try {
    for (const [soundType, sound] of soundCache.entries()) {
      await sound.stopAsync()
    }
    console.log("[SoundService] All sounds stopped")
  } catch (error) {
    console.error("[SoundService] Failed to stop all sounds:", error)
  }
}

/**
 * Unload all sounds and free memory
 * Call this when cleaning up or app is backgrounded
 */
export async function unloadAllSounds(): Promise<void> {
  try {
    for (const [soundType, sound] of soundCache.entries()) {
      await sound.unloadAsync()
      soundCache.delete(soundType)
    }
    console.log("[SoundService] All sounds unloaded")
  } catch (error) {
    console.error("[SoundService] Failed to unload sounds:", error)
  }
}

/**
 * Convenience functions for common sounds
 */
export const SoundFeedback = {
  /** Play neutral beep (e.g., on initialization) */
  neutral: () => playSound("beep_neutral", 0.5),

  /** Play success beep (e.g., successful scan) */
  success: () => playSound("beep_success", 0.7),

  /** Play error beep (e.g., failed operation) */
  error: () => playSound("beep_error", 0.6),
}
