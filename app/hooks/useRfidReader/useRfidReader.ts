import { useState, useEffect, useCallback } from "react"
import { NativeEventEmitter, Platform } from "react-native"

import {
  KeyEventModule,
  UHFReader,
  VolumeUpEventModule,
} from "@/services/nativeModules"

import { RfidReaderHook } from "./types"

const uhfEventEmitter = UHFReader ? new NativeEventEmitter(UHFReader as any) : null
const keyEventEmitter = KeyEventModule ? new NativeEventEmitter(KeyEventModule as any) : null
const volumeUpEventEmitter = VolumeUpEventModule ? new NativeEventEmitter(VolumeUpEventModule as any) : null

export const useRfidReader = (): RfidReaderHook => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedTag, setScannedTag] = useState<{ data: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const initialize = useCallback(async () => {
    try {
      // Only initialize on Android
      if (Platform.OS === "android" && UHFReader) {
        await UHFReader.initialize()
      }
      setIsInitialized(true)
      setError(null)
    } catch (err) {
      setError(`Initialization error: ${err}`)
    }
  }, [])

  const setOutputPower = useCallback(async (power: number) => {
    try {
      if (Platform.OS === "android" && UHFReader) {
        await UHFReader.setOutputPower(power)
      }
      setError(null)
    } catch (err) {
      setError(`Power setting error: ${err}`)
    }
  }, [])

  const startScanning = useCallback(async () => {
    try {
      if (Platform.OS === "android" && UHFReader) {
        await UHFReader.startScanning()
      }
      setIsScanning(true)
      setError(null)
    } catch (err) {
      setError(`Scanning start error: ${err}`)
    }
  }, [])

  const stopScanning = useCallback(async () => {
    try {
      if (Platform.OS === "android" && UHFReader) {
        await UHFReader.stopScanning()
      }
      setIsScanning(false)
      setError(null)
    } catch (err) {
      setError(`Scanning stop error: ${err}`)
    }
  }, [])

  useEffect(() => {
    if (!uhfEventEmitter || !keyEventEmitter || !volumeUpEventEmitter) {
      return
    }

    const keyDownSubscription = keyEventEmitter.addListener("onKeyDown", () => {
      setScannedTag(null)
      startScanning()
    })

    const keyUpSubscription = keyEventEmitter.addListener("onKeyUp", () => {
      stopScanning()
    })

    const tagSubscription = uhfEventEmitter.addListener(
      "onTagScanned",
      (tag) => {
        setScannedTag(tag)
      },
    )

    const volumeUpPressListenerForEmulator = volumeUpEventEmitter.addListener(
      "onVolumeUpPress",
      () => {
        setScannedTag(null)
        startScanning()
      },
    )

    const volumeUpReleaseListenerForEmulator = volumeUpEventEmitter.addListener(
      "onVolumeUpRelease",
      () => {
        stopScanning()
      },
    )

    const errorSubscription = uhfEventEmitter.addListener(
      "onScanError",
      (err) => {
        setError(`Scanning error: ${err}`)
      },
    )

    return () => {
      tagSubscription.remove()
      errorSubscription.remove()
      keyDownSubscription.remove()
      keyUpSubscription.remove()
      volumeUpPressListenerForEmulator.remove()
      volumeUpReleaseListenerForEmulator.remove()
    }
  }, [startScanning, stopScanning])

  return {
    initialize,
    setOutputPower,
    startScanning,
    stopScanning,
    isInitialized,
    isScanning,
    scannedTag,
    error,
  }
}
