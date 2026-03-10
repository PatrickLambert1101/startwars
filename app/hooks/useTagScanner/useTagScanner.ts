import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Platform } from "react-native"
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor, runAtTargetFps, runAsync } from "react-native-vision-camera"
import type { Frame } from "react-native-vision-camera"
import { useTextRecognition } from "react-native-vision-camera-ocr-plus"
import { useSharedValue } from "react-native-reanimated"
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

  // Use shared values for worklet→JS communication
  const latestTag = useSharedValue<string>("")
  const tagCounter = useSharedValue<number>(0)

  // Helper function to add to scan history (must be called from JS thread)
  const addToScanHistory = useCallback((tag: string) => {
    setScanHistory((prev) => [tag, ...prev.slice(0, 9)]) // Keep last 10
  }, [])

  // Process tags from shared values
  const [lastProcessedCounter, setLastProcessedCounter] = useState(0)

  useEffect(() => {
    console.log("[JS] Starting shared value polling")
    let pollCount = 0
    const interval = setInterval(() => {
      pollCount++
      const currentCounter = tagCounter.value
      const tag = latestTag.value

      if (pollCount % 20 === 0) {
        console.log(`[JS] Poll #${pollCount}: counter=${currentCounter}, tag="${tag}", lastProcessed=${lastProcessedCounter}`)
      }

      if (currentCounter !== lastProcessedCounter && tag) {
        console.log(`[JS] Got tag from shared value: "${tag}" (counter: ${currentCounter})`)
        setLastProcessedCounter(currentCounter)

        // Process the tag
        {
          console.log(`[JS] Processing tag: "${tag}"`)

          // Add to history
          tagHistory.current.push(tag)
          if (tagHistory.current.length > 10) {
            tagHistory.current.shift()
          }

          console.log(`[JS] History now: [${tagHistory.current.join(', ')}]`)

          // Check if we have enough consecutive matches
          const recentTags = tagHistory.current.slice(-stabilityFrames)
          console.log(`[JS] Recent tags (need ${stabilityFrames}): [${recentTags.join(', ')}]`)

          if (recentTags.length >= stabilityFrames) {
            const firstTag = recentTags[0]
            const allSame = recentTags.every(t => t === firstTag)

            if (allSame && firstTag !== lastDetectedTag.current) {
              console.log(`[JS] ✅ STABLE TAG DETECTED: ${firstTag}`)
              lastDetectedTag.current = firstTag
              setStableTagNumber(firstTag)
              addToScanHistory(firstTag)
              onTagDetected?.(firstTag)
            } else if (!allSame) {
              console.log(`[JS] Not stable yet (tags differ)`)
            }
          }
        }
      }
    }, 50) // Check more frequently

    return () => clearInterval(interval)
  }, [lastProcessedCounter, stabilityFrames, addToScanHistory, onTagDetected])

  // Update debug info and detected text from worklet refs
  useEffect(() => {
    console.log("[JS] Starting debug info polling")
    let count = 0
    const interval = setInterval(() => {
      count++
      const debugValue = pendingDebugInfo.current
      const textLength = pendingDetectedText.current.length

      if (count % 20 === 0) {
        console.log(`[JS] Debug poll #${count}: debugInfo="${debugValue}", textBlocks=${textLength}`)
      }

      // Update debug info
      if (debugValue) {
        setDebugInfo(debugValue)
      }

      // Update detected text
      if (textLength > 0) {
        setDetectedText(pendingDetectedText.current)
      }
    }, 100) // Check every 100ms

    return () => clearInterval(interval)
  }, [])

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

            // Just store in debugInfo - this DOES work!
            pendingDebugInfo.current = `✅ DETECTED: ${bestTag.tagNumber}`
          } else {
            console.log(`Frame ${frameNum}: No tags extracted`)
            pendingDebugInfo.current = `Frame ${frameNum}: No tags`
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
