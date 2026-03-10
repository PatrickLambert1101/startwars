import { FC, useCallback, useEffect, useRef } from "react"
import { View, ViewStyle, StyleSheet, Alert, ActivityIndicator } from "react-native"
import { Camera } from "react-native-vision-camera"
import { useTagScanner } from "@/hooks/useTagScanner"
import { ScanOverlay } from "./ScanOverlay"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { Text, Screen } from "@/components"

interface TagScannerScreenProps {
  navigation: any
  route: {
    params?: {
      // Use a callback ID instead of the function itself
      callbackId?: string
    }
  }
}

// Global store for scan callbacks to avoid serialization issues
const scanCallbacks = new Map<string, (tagNumber: string) => void>()

// Helper to register a callback
export function registerScanCallback(callback: (tagNumber: string) => void): string {
  const id = Math.random().toString(36).substring(7)
  scanCallbacks.set(id, callback)
  return id
}

// Helper to unregister a callback
export function unregisterScanCallback(id: string): void {
  scanCallbacks.delete(id)
}

export const TagScannerScreen: FC<TagScannerScreenProps> = ({ navigation, route }) => {
  const { themed } = useAppTheme()
  const callbackId = route.params?.callbackId
  const onTagScanned = callbackId ? scanCallbacks.get(callbackId) : undefined

  // Clean up callback on unmount
  useEffect(() => {
    return () => {
      if (callbackId) {
        unregisterScanCallback(callbackId)
      }
    }
  }, [callbackId])

  // Tag scanner hook
  const {
    state,
    device,
    hasPermission,
    torch,
    requestPermission,
    startScanning,
    toggleTorch,
    frameProcessor,
  } = useTagScanner({
    autoStart: true,
    stabilityFrames: 3,
    targetFps: 3,
    onTagDetected: useCallback(
      (tagNumber: string) => {
        // Haptic feedback would go here
        if (onTagScanned) {
          onTagScanned(tagNumber)
          navigation.goBack()
        } else {
          // No callback provided, just go back with the tag
          navigation.navigate("HerdList", { scannedTag: tagNumber })
        }
      },
      [onTagScanned, navigation],
    ),
  })

  // Request camera permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission()
    }
  }, [hasPermission, requestPermission])

  // Start scanning once permission granted
  useEffect(() => {
    if (hasPermission && device) {
      startScanning()
    }
  }, [hasPermission, device, startScanning])

  const handleClose = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  // No permission
  if (hasPermission === false) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
        <View style={themed($errorContainer)}>
          <Text
            text="Camera permission required"
            preset="heading"
            style={themed($errorTitle)}
          />
          <Text
            text="HerdTrackr needs camera access to scan ear tags. Please enable it in Settings."
            style={themed($errorText)}
          />
        </View>
      </Screen>
    )
  }

  // No device (shouldn't happen on real devices)
  if (!device) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
        <View style={themed($errorContainer)}>
          <ActivityIndicator size="large" />
          <Text text="Initializing camera..." style={themed($errorText)} />
        </View>
      </Screen>
    )
  }

  // Extract detected text for display
  const detectedTextArray = state.detectedText.map((ocr) => ocr.text)

  return (
    <View style={StyleSheet.absoluteFill}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={state.isScanning}
        frameProcessor={frameProcessor}
        torch={torch}
        enableZoomGesture
        photo={false}
        video={false}
      />
      <ScanOverlay
        detectedText={detectedTextArray}
        stableTagNumber={state.stableTagNumber}
        onClose={handleClose}
        torchEnabled={torch === "on"}
        onToggleTorch={toggleTorch}
      />
    </View>
  )
}

// ─── Styles ───

const $container: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
})

const $errorContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  gap: spacing.md,
})

const $errorTitle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $errorText: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  textAlign: "center",
})
