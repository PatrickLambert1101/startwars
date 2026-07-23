import { Platform } from "react-native"
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av"

/**
 * Sound feedback service for RFID scanning and UI interactions.
 *
 * Plays the bundled beep MP3s via expo-av. The sounds are preloaded once on
 * first use so playback is instant, and the audio mode is configured so beeps
 * are still audible when the device is in silent mode / Do Not Disturb.
 *
 * Volume levels follow app/assets/sounds/README.md (neutral 50%, success 70%,
 * error 60%).
 */

type BeepKind = "success" | "error" | "neutral"

const SOUND_SOURCES: Record<BeepKind, number> = {
  success: require("@/assets/sounds/beep_success.mp3"),
  error: require("@/assets/sounds/beep_error.mp3"),
  neutral: require("@/assets/sounds/beep_neutral.mp3"),
}

const SOUND_VOLUMES: Record<BeepKind, number> = {
  success: 0.7,
  error: 0.6,
  neutral: 0.5,
}

const loadedSounds: Partial<Record<BeepKind, Audio.Sound>> = {}
let audioModeConfigured = false
let audioModePromise: Promise<void> | null = null

/** Configure audio mode once so beeps play even in silent mode. */
async function ensureAudioMode(): Promise<void> {
  if (audioModeConfigured) return
  if (!audioModePromise) {
    audioModePromise = Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    })
      .then(() => {
        audioModeConfigured = true
      })
      .catch((error) => {
        // Reset so a later call can retry configuring the audio mode.
        audioModePromise = null
        console.warn("[SoundService] Failed to set audio mode:", error)
      })
  }
  await audioModePromise
}

/** Lazily load (and cache) a beep sound. */
async function getSound(kind: BeepKind): Promise<Audio.Sound | null> {
  const existing = loadedSounds[kind]
  if (existing) return existing

  try {
    const { sound } = await Audio.Sound.createAsync(SOUND_SOURCES[kind], {
      volume: SOUND_VOLUMES[kind],
    })
    loadedSounds[kind] = sound
    return sound
  } catch (error) {
    console.error(`[SoundService] Failed to load '${kind}' beep:`, error)
    return null
  }
}

async function play(kind: BeepKind): Promise<void> {
  try {
    await ensureAudioMode()
    const sound = await getSound(kind)
    if (!sound) return
    // replayAsync restarts from the beginning, so rapid repeat scans re-trigger
    // the beep instead of being ignored while the previous one is still playing.
    await sound.replayAsync()
  } catch (error) {
    console.error(`[SoundService] Failed to play '${kind}' beep:`, error)
  }
}

export class SoundFeedback {
  /**
   * Preload all beep sounds and configure the audio mode. Safe to call on app
   * start; failures are logged and swallowed.
   */
  static async initialize(): Promise<void> {
    await ensureAudioMode()
    await Promise.all([getSound("success"), getSound("error"), getSound("neutral")])
  }

  /** Play success beep (when a tag is scanned successfully). */
  static async success(): Promise<void> {
    await play("success")
  }

  /** Play error/fail beep (when a scan fails or an error occurs). */
  static async error(): Promise<void> {
    await play("error")
  }

  /** Play neutral beep (for general feedback like initialization). */
  static async neutral(): Promise<void> {
    await play("neutral")
  }

  /** Release all loaded sounds. Optional; useful on teardown. */
  static async unload(): Promise<void> {
    await Promise.all(
      (Object.keys(loadedSounds) as BeepKind[]).map(async (kind) => {
        const sound = loadedSounds[kind]
        if (sound) {
          try {
            await sound.unloadAsync()
          } catch (error) {
            console.warn(`[SoundService] Failed to unload '${kind}' beep:`, error)
          }
          delete loadedSounds[kind]
        }
      }),
    )
  }
}

// Platform guard kept for parity with prior behavior; expo-av handles both
// platforms, so no early return is necessary, but we note web has no support.
if (Platform.OS === "web") {
  console.log("[SoundService] Web platform - beep playback may be limited")
}
