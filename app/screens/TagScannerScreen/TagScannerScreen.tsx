import { FC, useCallback, useEffect, useRef, useState } from "react"
import { View, ViewStyle, StyleSheet, Alert, Pressable, TextInput } from "react-native"
import { useCameraDevice, useCameraPermission } from "react-native-vision-camera"
import { Camera } from "react-native-vision-camera-ocr-plus"
import type { Text as OCRText } from "react-native-vision-camera-ocr-plus"
import { extractTagNumbers } from "@/hooks/useTagScanner/tagParser"
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

  // State
  const [manualInput, setManualInput] = useState<string>("")
  const [torch, setTorch] = useState<"off" | "on">("off")

  const cameraRef = useRef<any>(null)

  // Camera setup
  const device = useCameraDevice("back")
  const { hasPermission, requestPermission } = useCameraPermission()

  // Clean up callback on unmount
  useEffect(() => {
    return () => {
      if (callbackId) {
        unregisterScanCallback(callbackId)
      }
    }
  }, [callbackId])

  // Request camera permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission()
    }
  }, [hasPermission, requestPermission])

  // Callback for OCR results - THIS RUNS ON JS THREAD!
  const handleOCRResult = useCallback((data: OCRText) => {
    if (!data || !data.blocks || data.blocks.length === 0) {
      return
    }

    // Extract tags from OCR results
    const ocrResults = data.blocks.map(block => ({
      text: block.blockText,
      confidence: 0.8,
      boundingBox: block.blockFrame ? {
        x: block.blockFrame.x,
        y: block.blockFrame.y,
        width: block.blockFrame.width,
        height: block.blockFrame.height,
      } : undefined,
    }))

    const tagResults = extractTagNumbers(ocrResults)

    if (tagResults.length > 0) {
      const bestTag = tagResults.sort((a, b) => b.confidence - a.confidence)[0]

      // Update input field directly
      setManualInput(bestTag.tagNumber)
    }
  }, [])

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

  const toggleTorch = useCallback(() => {
    setTorch(prev => prev === "off" ? "on" : "off")
  }, [])

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

  return (
    <Screen preset="fixed" contentContainerStyle={themed($screenContainer)} safeAreaEdges={["top"]}>
      {/* Camera View - Top Half */}
      <View style={themed($cameraContainer)}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          torch={torch}
          enableZoomGesture
          mode="recognize"
          callback={handleOCRResult}
          options={{
            language: "latin",
          }}
        />

        {/* Camera Overlay */}
        <View style={themed($overlay)}>
          {/* Top Bar */}
          <View style={themed($topBar)}>
            <Pressable onPress={handleClose} style={themed($closeButton)}>
              <Text text="✕" size="xl" style={{ color: "#FFF" }} />
            </Pressable>
            <Pressable onPress={toggleTorch} style={themed($torchButton)}>
              <Text text={torch === "on" ? "🔦" : "💡"} size="xl" />
            </Pressable>
          </View>

          {/* Viewfinder */}
          <View style={themed($viewfinder)} />

          {/* Bottom hint */}
          <View style={themed($bottomBar)}>
            <Text text="Point at ear tag" size="sm" style={{ color: "#FFF", textAlign: "center", opacity: 0.9 }} />
          </View>
        </View>
      </View>

      {/* Form View - Bottom Half */}
      <View style={themed($formContainer)}>
        <Text preset="subheading" text="Scanned Tag" style={themed($formTitle)} />
        <Text
          text="Tag appears automatically. Edit if needed."
          size="xs"
          style={themed($formSubtitle)}
        />

        <View style={themed($inputContainer)}>
          <TextInput
            style={themed($input)}
            value={manualInput}
            onChangeText={setManualInput}
            placeholder="Point camera at tag..."
            placeholderTextColor="#999"
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

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

const $overlay: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "space-between",
  padding: 20,
})

const $topBar: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const $closeButton: ThemedStyle<ViewStyle> = () => ({
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
})

const $torchButton: ThemedStyle<ViewStyle> = () => ({
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
})

const $viewfinder: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  marginVertical: 40,
  borderWidth: 2,
  borderColor: "#FFF",
  borderRadius: 12,
  backgroundColor: "transparent",
})

const $bottomBar: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
  paddingBottom: 20,
})
