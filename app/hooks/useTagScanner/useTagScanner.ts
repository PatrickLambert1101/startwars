import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Platform } from "react-native"
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor, runAtTargetFps, runAsync } from "react-native-vision-camera"
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
  const [debugInfo, setDebugInfo] = useState<string>("")

  // Stability checker - history array on JS thread
  const tagHistory = useRef<string[]>([])

  // Prevent duplicate callbacks
  const lastDetectedTag = useRef<string | null>(null)

  // Frame counter for logging
  const frameCountRef = useRef(0)

  // Refs to pass data from worklet to JS thread
  const pendingDebugInfo = useRef<string>("")
  const pendingDetectedText = useRef<OCRResult[]>([])
  const pendingBestTag = useRef<{ tag: string | null; timestamp: number } | null>(null) // Use object with timestamp to detect changes

  // Helper function to add to scan history (must be called from JS thread)
  const addToScanHistory = useCallback((tag: string) => {
    setScanHistory((prev) => [tag, ...prev.slice(0, 9)]) // Keep last 10
  }, [])

  // Watch for updates from worklet and do stability checking on JS thread
  useEffect(() => {
    console.log("[OCR] Starting state update interval")
    let updateCount = 0
    const interval = setInterval(() => {
      updateCount++
      if (updateCount % 10 === 0) {
        console.log(`[OCR] Interval running (${updateCount} checks)`)
      }

      // Update debug info
      if (pendingDebugInfo.current) {
        setDebugInfo(pendingDebugInfo.current)
      }

      // Update detected text
      if (pendingDetectedText.current.length > 0) {
        setDetectedText(pendingDetectedText.current)
      }

      // Stability checking on JS thread
      if (pendingBestTag.current) {
        const pending = pendingBestTag.current
        pendingBestTag.current = null // Clear immediately

        if (pending.tag === null) {
          // No tag detected, reset history
          console.log(`[OCR] No tag detected, resetting history`)
          tagHistory.current = []
        } else {
          console.log(`[OCR] Got best tag from worklet: "${pending.tag}"`)

          // Add to history
          tagHistory.current.push(pending.tag)
          if (tagHistory.current.length > 10) {
            tagHistory.current.shift()
          }

          console.log(`[OCR] History now: [${tagHistory.current.join(', ')}]`)

          // Check if we have enough consecutive matches
          const recentTags = tagHistory.current.slice(-stabilityFrames)
          console.log(`[OCR] Recent tags (need ${stabilityFrames}): [${recentTags.join(', ')}]`)

          if (recentTags.length >= stabilityFrames) {
            const firstTag = recentTags[0]
            const allSame = recentTags.every(tag => tag === firstTag)

            if (allSame && firstTag !== lastDetectedTag.current) {
              console.log(`[OCR] ✅ STABLE TAG DETECTED: ${firstTag}`)
              lastDetectedTag.current = firstTag
              setStableTagNumber(firstTag)
              addToScanHistory(firstTag)
              onTagDetected?.(firstTag)
            } else if (!allSame) {
              console.log(`[OCR] Not stable yet (tags differ)`)
            }
          }
        }
      }
    }, 100) // Check every 100ms

    return () => {
      console.log("[OCR] Stopping state update interval")
      clearInterval(interval)
    }
  }, [onTagDetected, addToScanHistory, stabilityFrames])

  /**
   * Frame processor - runs OCR on each camera frame
   */
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet"

      if (!isScanning) {
        console.log("Frame processor: not scanning")
        return
      }

      runAtTargetFps(targetFps, () => {
        "worklet"
        try {
          frameCountRef.current++
          const frameNum = frameCountRef.current

          console.log(`Processing frame ${frameNum}`)

          const data = scanText(frame)

          // Log frame processing
          pendingDebugInfo.current = `Frame ${frameNum}: Processing...`

          console.log(`Frame ${frameNum}: Got OCR data:`, data ? `${data.blocks?.length || 0} blocks` : 'null')

          // Skip if no blocks detected
          if (!data || !data.blocks || data.blocks.length === 0) {
            pendingDebugInfo.current = `Frame ${frameNum}: No blocks detected`
            return
          }

          pendingDebugInfo.current = `Frame ${frameNum}: Found ${data.blocks.length} blocks`

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

          // Log detected text
          console.log(`Frame ${frameNum}: Detected text:`, ocrResults.map(r => `"${r.text}"`).join(', '))

          // Extract tag numbers
          const tagResults = extractTagNumbers(ocrResults)

          console.log(`Frame ${frameNum}: Extracted ${tagResults.length} tags:`, tagResults.map(t => `${t.tagNumber}(${t.confidence.toFixed(2)})`).join(', '))

          pendingDebugInfo.current = `Frame ${frameNum}: Extracted ${tagResults.length} tags: ${tagResults.map(t => t.tagNumber).join(', ')}`

          // Get the highest confidence tag and send to JS thread for stability checking
          const bestTag = tagResults.sort((a, b) => b.confidence - a.confidence)[0]

          if (bestTag) {
            console.log(`Frame ${frameNum}: Best tag: ${bestTag.tagNumber} (conf: ${bestTag.confidence.toFixed(2)})`)
            pendingDebugInfo.current = `Frame ${frameNum}: Best tag: ${bestTag.tagNumber} (conf: ${bestTag.confidence.toFixed(2)})`
            // Create new object each time so JS thread sees the change
            pendingBestTag.current = { tag: bestTag.tagNumber, timestamp: Date.now() }
            console.log(`Frame ${frameNum}: Wrote to pendingBestTag.current`)
          } else {
            console.log(`Frame ${frameNum}: No tags extracted`)
            pendingDebugInfo.current = `Frame ${frameNum}: No tags`
            // Signal no tag to reset history
            pendingBestTag.current = { tag: null, timestamp: Date.now() }
          }

          pendingDetectedText.current = ocrResults
        } catch (error) {
          pendingDebugInfo.current = `Frame error: ${error}`
        }
      })
    },
    [isScanning, targetFps, scanText],
  )

  /**
   * Start scanning
   */
  const startScanning = useCallback(() => {
    console.log("Starting OCR scanning...")
    setIsScanning(true)
    tagHistory.current = []
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
    tagHistory.current = []
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

  // Log debug info
  useEffect(() => {
    if (debugInfo) {
      console.log("[OCR]", debugInfo)
    }
  }, [debugInfo])

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
    debugInfo,

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
