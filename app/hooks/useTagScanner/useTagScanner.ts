import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Platform } from "react-native"
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from "react-native-vision-camera"
import { runAtTargetFps } from "react-native-vision-camera"
import type { Frame } from "react-native-vision-camera"
import { useTextRecognition } from "react-native-vision-camera-ocr-plus"
import { extractTagNumbers, TagStabilityChecker } from "./tagParser"
import type { OCRResult, ScannerState, TagScanResult } from "./types"

export interface UseTagScannerOptions {
  /**
   * Whether to start scanning immediately
   */
  autoStart?: boolean
  /**
   * Number of consecutive frames required to confirm a tag
   */
  stabilityFrames?: number
  /**
   * Target FPS for OCR processing (lower = better performance)
   */
  targetFps?: number
  /**
   * Callback when a stable tag is detected
   */
  onTagDetected?: (tagNumber: string) => void
  /**
   * Viewfinder bounds for filtering detections (optional)
   */
  viewfinderBounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export function useTagScanner(options: UseTagScannerOptions = {}) {
  const {
    autoStart = false,
    stabilityFrames = 3,
    targetFps = 3, // Process every 3rd frame at 30fps = ~10 scans/second
    onTagDetected,
    viewfinderBounds,
  } = options

  // Camera setup
  const device = useCameraDevice("back")
  const { hasPermission, requestPermission } = useCameraPermission()

  // OCR plugin
  const { scanText } = useTextRecognition({
    language: "latin",
    frameSkipThreshold: targetFps,
  })

  // Scanner state
  const [isScanning, setIsScanning] = useState(autoStart)
  const [detectedText, setDetectedText] = useState<OCRResult[]>([])
  const [stableTagNumber, setStableTagNumber] = useState<string | null>(null)
  const [scanHistory, setScanHistory] = useState<string[]>([])
  const [torch, setTorch] = useState<"off" | "on">("off")

  // Stability checker
  const stabilityChecker = useRef(new TagStabilityChecker(stabilityFrames))

  // Prevent duplicate callbacks
  const lastDetectedTag = useRef<string | null>(null)

  /**
   * Frame processor - runs OCR on each camera frame
   */
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet"

      if (!isScanning) return

      runAtTargetFps(targetFps, () => {
        "worklet"
        try {
          const data = scanText(frame)

          // Convert OCR results to our format
          const ocrResults: OCRResult[] = data.blocks.map((block) => ({
            text: block.blockText,
            confidence: 0.8, // ML Kit doesn't provide confidence scores
            boundingBox: block.blockFrame
              ? {
                  x: block.blockFrame.x,
                  y: block.blockFrame.y,
                  width: block.blockFrame.width,
                  height: block.blockFrame.height,
                }
              : undefined,
          }))

          // Extract tag numbers
          const tagResults = extractTagNumbers(ocrResults)

          // Get the highest confidence tag
          const bestTag = tagResults.sort((a, b) => b.confidence - a.confidence)[0]

          // Check stability
          const stableTag = stabilityChecker.current.addReading(bestTag?.tagNumber || null)

          // Update state on main thread
          if (stableTag && stableTag !== lastDetectedTag.current) {
            lastDetectedTag.current = stableTag
            setStableTagNumber(stableTag)
            setScanHistory((prev) => [stableTag, ...prev.slice(0, 9)]) // Keep last 10
            onTagDetected?.(stableTag)
          }

          setDetectedText(ocrResults)
        } catch (error) {
          // Silently handle OCR errors to avoid spamming console
          // Most OCR errors are transient and self-recovering
        }
      })
    },
    [isScanning, targetFps, onTagDetected, scanText],
  )

  /**
   * Start scanning
   */
  const startScanning = useCallback(() => {
    setIsScanning(true)
    stabilityChecker.current.reset()
    setStableTagNumber(null)
    lastDetectedTag.current = null
  }, [])

  /**
   * Stop scanning
   */
  const stopScanning = useCallback(() => {
    setIsScanning(false)
    setDetectedText([])
  }, [])

  /**
   * Toggle torch
   */
  const toggleTorch = useCallback(() => {
    setTorch((prev) => (prev === "off" ? "on" : "off"))
  }, [])

  /**
   * Reset scanner state
   */
  const reset = useCallback(() => {
    stabilityChecker.current.reset()
    setStableTagNumber(null)
    setDetectedText([])
    lastDetectedTag.current = null
  }, [])

  /**
   * Clear scan history
   */
  const clearHistory = useCallback(() => {
    setScanHistory([])
  }, [])

  const state: ScannerState = useMemo(
    () => ({
      isScanning,
      detectedText,
      stableTagNumber,
      scanHistory,
    }),
    [isScanning, detectedText, stableTagNumber, scanHistory],
  )

  return {
    // State
    state,
    device,
    hasPermission,
    torch,

    // Methods
    requestPermission,
    startScanning,
    stopScanning,
    toggleTorch,
    reset,
    clearHistory,
    frameProcessor,
  }
}
