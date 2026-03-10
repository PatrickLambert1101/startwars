import { FC, useCallback, useEffect, useRef, useState } from "react"
import { View, ViewStyle, StyleSheet, Alert, ActivityIndicator, Pressable, TextInput } from "react-native"
import { Camera } from "react-native-vision-camera"
import { useTagScanner } from "@/hooks/useTagScanner"
import { ScanOverlay } from "./ScanOverlay"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { Text, Screen, Button } from "@/components"

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

  // Pending scan state - shows in form before approval
  const [pendingScan, setPendingScan] = useState<string>("")
  const [manualInput, setManualInput] = useState<string>("")

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
    stabilityFrames: 2, // Reduced from 3 to be more responsive
    targetFps: 3,
    onTagDetected: useCallback(
      (tagNumber: string) => {
        // Update pending scan instead of immediately submitting
        setPendingScan(tagNumber)
        setManualInput(tagNumber)
      },
      [],
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

  const handleApprove = useCallback(() => {
    const finalTag = manualInput.trim()
    if (!finalTag) {
      Alert.alert("Empty Tag", "Please scan or enter a tag number")
      return
    }

    if (onTagScanned) {
      onTagScanned(finalTag)
      navigation.goBack()
    } else {
      navigation.navigate("HerdList", { scannedTag: finalTag })
    }
  }, [manualInput, onTagScanned, navigation])

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
    <Screen preset="fixed" contentContainerStyle={themed($screenContainer)} safeAreaEdges={["top"]}>
      {/* Camera View - Top Half */}
      <View style={themed($cameraContainer)}>
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

      {/* Form View - Bottom Half */}
      <View style={themed($formContainer)}>
        <Text preset="subheading" text="Scanned Tag" style={themed($formTitle)} />
        <Text
          text="Point camera at ear tag. Edit below if needed."
          size="xs"
          style={themed($formSubtitle)}
        />

        <View style={themed($inputContainer)}>
          <TextInput
            style={themed($input)}
            value={manualInput}
            onChangeText={setManualInput}
            placeholder="Tag will appear here..."
            placeholderTextColor="#999"
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        {pendingScan && (
          <View style={themed($detectedBadge)}>
            <Text text={`📸 Detected: ${pendingScan}`} size="sm" style={{ color: "#10B981" }} />
          </View>
        )}

        <View style={themed($buttonRow)}>
          <Pressable onPress={handleClose} style={themed($cancelButton)}>
            <Text text="Cancel" style={themed($cancelButtonText)} />
          </Pressable>
          <Pressable
            onPress={handleApprove}
            style={[themed($approveButton), !manualInput && themed($approveButtonDisabled)]}
            disabled={!manualInput}
          >
            <Text text="Use This Tag" style={themed($approveButtonText)} />
          </Pressable>
        </View>
      </View>
    </Screen>
  )
}

// ─── Styles ───

const $screenContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $cameraContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  position: "relative",
})

const $formContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  padding: spacing.lg,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 5,
})

const $formTitle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $formSubtitle: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.md,
})

const $inputContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $input: ThemedStyle<any> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  fontSize: 24,
  fontWeight: "700",
  color: colors.text,
  textAlign: "center",
  borderWidth: 2,
  borderColor: colors.palette.primary500,
})

const $detectedBadge: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  backgroundColor: "#10B98122",
  padding: spacing.sm,
  borderRadius: 8,
  alignItems: "center",
  marginBottom: spacing.md,
})

const $buttonRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $cancelButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral200,
  padding: spacing.md,
  borderRadius: 12,
  alignItems: "center",
})

const $cancelButtonText: ThemedStyle<any> = ({ colors }) => ({
  color: colors.text,
  fontWeight: "600",
  fontSize: 16,
})

const $approveButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 2,
  backgroundColor: colors.palette.primary500,
  padding: spacing.md,
  borderRadius: 12,
  alignItems: "center",
})

const $approveButtonDisabled: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral300,
  opacity: 0.5,
})

const $approveButtonText: ThemedStyle<any> = () => ({
  color: "#FFF",
  fontWeight: "700",
  fontSize: 16,
})

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
