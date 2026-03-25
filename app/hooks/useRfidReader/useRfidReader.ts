import { useState, useEffect, useCallback } from "react"
import { NativeEventEmitter, Platform } from "react-native"

import {
  KeyEventModule,
  UHFReader,
  VolumeUpEventModule,
  SoundFeedback,
} from "@/services"

import { RfidReaderHook } from "./types"

const uhfEventEmitter = UHFReader ? new NativeEventEmitter(UHFReader as any) : null
const keyEventEmitter = KeyEventModule ? new NativeEventEmitter(KeyEventModule as any) : null
const volumeUpEventEmitter = VolumeUpEventModule ? new NativeEventEmitter(VolumeUpEventModule as any) : null

export const useRfidReader = (): RfidReaderHook => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedTag, setScannedTag] = useState<{ epc: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if RFID hardware is available
  const hasRfidHardware = Platform.OS === "android" && !!UHFReader

  console.log("[RFID] Hook initialized:", {
    platform: Platform.OS,
    hasUHFReader: !!UHFReader,
    hasKeyEventModule: !!KeyEventModule,
    hasVolumeUpModule: !!VolumeUpEventModule,
    hasRfidHardware,
  })

  const initialize = useCallback(async () => {
    console.log("[RFID] initialize() called")
    try {
      // Only initialize on Android if module exists
      if (Platform.OS === "android" && UHFReader) {
        console.log("[RFID] Calling UHFReader.initialize()...")
        await UHFReader.initialize()
        console.log("[RFID] ✅ UHFReader.initialize() completed successfully")

        // Play success beep
        await SoundFeedback.neutral()
      } else if (Platform.OS === "android") {
        console.warn("[RFID] UHFReader module not available - native module needs to be implemented")
      }
      setIsInitialized(true)
      setError(null)
      console.log("[RFID] Initialization state set to true")
    } catch (err) {
      console.error("[RFID] ❌ Initialization failed:", err)
      setError(`Initialization error: ${err}`)

      // Play error beep
      await SoundFeedback.error()
    }
  }, [])

  const setOutputPower = useCallback(async (power: number) => {
    // Guard: Don't attempt to set power if not initialized
    if (!isInitialized) {
      console.warn(`[RFID] Cannot set power to ${power} - reader not initialized yet`)
      return
    }

    try {
      if (Platform.OS === "android" && UHFReader) {
        console.log(`[RFID] Setting power to ${power}...`)
        await UHFReader.setPower(power)
        console.log(`[RFID] ✅ Power set to ${power}`)
      }
      setError(null)
    } catch (err) {
      console.error(`[RFID] ❌ Failed to set power to ${power}:`, err)
      setError(`Power setting error: ${err}`)
    }
  }, [isInitialized])

  const startScanning = useCallback(async () => {
    console.log("[RFID] startScanning() called")
    try {
      if (Platform.OS === "android" && UHFReader) {
        console.log("[RFID] Calling UHFReader.startScanning()...")
        await UHFReader.startScanning()
        console.log("[RFID] ✅ UHFReader.startScanning() completed")
      } else {
        console.warn("[RFID] Cannot start scanning - UHFReader not available")
      }
      setIsScanning(true)
      setError(null)
    } catch (err) {
      console.error("[RFID] ❌ Start scanning failed:", err)
      setError(`Scanning start error: ${err}`)
    }
  }, [])

  const stopScanning = useCallback(async () => {
    console.log("[RFID] stopScanning() called")
    try {
      if (Platform.OS === "android" && UHFReader) {
        console.log("[RFID] Calling UHFReader.stopScanning()...")
        await UHFReader.stopScanning()
        console.log("[RFID] ✅ UHFReader.stopScanning() completed")
      } else {
        console.warn("[RFID] Cannot stop scanning - UHFReader not available")
      }
      setIsScanning(false)
      setError(null)
    } catch (err) {
      console.error("[RFID] ❌ Stop scanning failed:", err)
      setError(`Scanning stop error: ${err}`)
    }
  }, [])

  const clearScannedTag = useCallback(() => {
    console.log("[RFID] Manually clearing scanned tag")
    setScannedTag(null)
  }, [])

  useEffect(() => {
    console.log("[RFID] Setting up event listeners...")
    console.log("[RFID] Event emitters available:", {
      uhfEventEmitter: !!uhfEventEmitter,
      keyEventEmitter: !!keyEventEmitter,
      volumeUpEventEmitter: !!volumeUpEventEmitter,
    })

    // We need at least UHF and Key event emitters (VolumeUp is optional for emulator testing)
    if (!uhfEventEmitter || !keyEventEmitter) {
      console.warn("[RFID] Required event emitters not available (UHF or Key), skipping listener setup")
      return
    }

    console.log("[RFID] Registering event listeners...")

    const keyDownSubscription = keyEventEmitter.addListener("onKeyDown", () => {
      console.log("[RFID] 🔑 KEY DOWN EVENT - Clearing previous tag and starting scan...")
      setScannedTag(null)  // Clear previous tag state
      startScanning()
    })

    const keyUpSubscription = keyEventEmitter.addListener("onKeyUp", () => {
      console.log("[RFID] 🔑 KEY UP EVENT - Stopping scan...")
      stopScanning()
    })

    const tagSubscription = uhfEventEmitter.addListener(
      "onTagScanned",
      (tag) => {
        console.log("[RFID] 📡 TAG SCANNED EVENT:", tag)
        setScannedTag(tag)

        // Play success beep when tag is scanned
        console.log("[RFID] 🔊 Attempting to play success beep...")
        SoundFeedback.success()
          .then(() => console.log("[RFID] ✅ Success beep played"))
          .catch((err) =>
            console.warn("[RFID] ❌ Failed to play success sound:", err)
          )
      },
    )

    const errorSubscription = uhfEventEmitter.addListener(
      "onScanError",
      (err) => {
        console.error("[RFID] ❌ SCAN ERROR:", err)
        setError(`Scanning error: ${err}`)

        // Play error beep when scan fails
        SoundFeedback.error().catch((e) =>
          console.warn("[RFID] Failed to play error sound:", e)
        )
      },
    )

    // Optional: Volume up listener for emulator testing
    let volumeUpPressListenerForEmulator: any = null
    let volumeUpReleaseListenerForEmulator: any = null

    if (volumeUpEventEmitter) {
      volumeUpPressListenerForEmulator = volumeUpEventEmitter.addListener(
        "onVolumeUpPress",
        () => {
          console.log("[RFID] 🔊 VOLUME UP PRESS - Clearing previous tag and starting scan...")
          setScannedTag(null)  // Clear previous tag state
          startScanning()
        },
      )

      volumeUpReleaseListenerForEmulator = volumeUpEventEmitter.addListener(
        "onVolumeUpRelease",
        () => {
          console.log("[RFID] 🔊 VOLUME UP RELEASE - Stopping scan...")
          stopScanning()
        },
      )
    }

    console.log("[RFID] ✅ All event listeners registered successfully")

    return () => {
      console.log("[RFID] Cleaning up event listeners...")
      tagSubscription.remove()
      errorSubscription.remove()
      keyDownSubscription.remove()
      keyUpSubscription.remove()
      if (volumeUpPressListenerForEmulator) volumeUpPressListenerForEmulator.remove()
      if (volumeUpReleaseListenerForEmulator) volumeUpReleaseListenerForEmulator.remove()
    }
  }, [startScanning, stopScanning])

  return {
    initialize,
    setOutputPower,
    startScanning,
    stopScanning,
    clearScannedTag,
    isInitialized,
    isScanning,
    scannedTag,
    error,
    hasRfidHardware,
  }
}
