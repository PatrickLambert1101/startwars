import { NativeModules, Platform } from "react-native"

// First, let's see what we actually have
console.log("[NativeModules] Platform:", Platform.OS)
console.log("[NativeModules] NativeModules object exists:", !!NativeModules)
console.log("[NativeModules] NativeModules type:", typeof NativeModules)

/**
 * UHF RFID Reader Native Module
 * Provides access to the Chafon C6 UHF RFID scanner hardware
 */
interface UHFReaderModule {
  /**
   * Initialize the RFID reader hardware
   * @returns Promise that resolves when initialization is complete
   */
  initialize(): Promise<boolean>

  /**
   * Start scanning for RFID tags
   * @returns Promise that resolves when scanning starts
   */
  startScanning(): Promise<boolean>

  /**
   * Stop scanning for RFID tags
   * @returns Promise that resolves when scanning stops
   */
  stopScanning(): Promise<boolean>

  /**
   * Set UHF inventory/read power in dBm. This is transmit power, not receiver sensitivity.
   * @param power - Read power from 5 dBm (lowest) to 30 dBm (highest)
   * @returns Promise that resolves when power is set
   */
  setPower(power: number): Promise<boolean>

  /** Return the read power last accepted by the native reader manager. */
  getPower(): Promise<number>

  /**
   * Alias for setPower (for backwards compatibility)
   */
  setOutputPower?(power: number): Promise<boolean>

  /**
   * Check if RFID reader is initialized
   * @returns Promise that resolves with initialization status
   */
  isInitialized(): Promise<boolean>

  /**
   * Check if currently scanning
   * @returns Promise that resolves with scanning status
   */
  isScanning(): Promise<boolean>
}

/**
 * Hardware Button Event Module
 * Handles physical scan button presses on the scanner device
 */
interface KeyEventModuleType {
  /**
   * Send a key down event (for testing)
   */
  sendKeyDownEvent(): void

  /**
   * Send a key up event (for testing)
   */
  sendKeyUpEvent(): void
}

/**
 * Volume Up Button Module
 * Alternative trigger using volume up button
 */
interface VolumeUpEventModuleType {
  /**
   * Send volume up event (for testing)
   */
  sendVolumeUpEvent(): void
}

// Export the native modules with type safety
export const UHFReader: UHFReaderModule | undefined = NativeModules.UHFReader
export const KeyEventModule: KeyEventModuleType | undefined = NativeModules.KeyEventModule
export const VolumeUpEventModule: VolumeUpEventModuleType | undefined =
  NativeModules.VolumeUpEventModule

// Log what's available for debugging
console.log("[NativeModules] ALL available native modules:", Object.keys(NativeModules))
console.log("[NativeModules] Looking for UHFReader:", NativeModules.UHFReader)
console.log("[NativeModules] Looking for KeyEventModule:", NativeModules.KeyEventModule)

console.log("[NativeModules] Available modules:", {
  UHFReader: !!UHFReader,
  KeyEventModule: !!KeyEventModule,
  VolumeUpEventModule: !!VolumeUpEventModule,
})

if (!UHFReader) {
  console.warn(
    "[NativeModules] UHFReader not found. Make sure UHFPackage is registered in MainApplication.kt",
  )
}

if (!KeyEventModule) {
  console.warn(
    "[NativeModules] KeyEventModule not found. Make sure KeyPackage is registered in MainApplication.kt",
  )
}
