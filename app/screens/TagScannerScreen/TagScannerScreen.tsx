import { FC, useCallback, useEffect, useRef, useState } from "react"
import { View, ViewStyle, StyleSheet, Alert, Pressable, TextInput, ActivityIndicator } from "react-native"
import { useCameraDevice, useCameraPermission } from "react-native-vision-camera"
import { Camera } from "react-native-vision-camera-ocr-plus"
import type { Text as OCRText } from "react-native-vision-camera-ocr-plus"
import { MaterialCommunityIcons } from "@expo/vector-icons"
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
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </Pressable>
            <Text text="Scan Ear Tag" preset="bold" size="md" style={{ color: "#FFF" }} />
            <Pressable onPress={toggleTorch} style={themed($torchButton)}>
              <MaterialCommunityIcons
                name={torch === "on" ? "flashlight" : "flashlight-off"}
                size={24}
                color={torch === "on" ? "#FFD700" : "#FFF"}
              />
            </Pressable>
          </View>

          {/* Instructions Card */}
          <View style={themed($instructionsCard)}>
            <View style={themed($instructionRow)}>
              <MaterialCommunityIcons name="camera-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text text="Position tag within frame" size="xs" style={{ color: "#FFF", flex: 1 }} />
            </View>
            <View style={themed($instructionRow)}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text text="Use torch for low light" size="xs" style={{ color: "#FFF", flex: 1 }} />
            </View>
            <View style={themed($instructionRow)}>
              <MaterialCommunityIcons name="hand-back-right-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text text="Hold steady for best results" size="xs" style={{ color: "#FFF", flex: 1 }} />
            </View>
          </View>

          {/* Viewfinder with corner guides */}
          <View style={themed($viewfinderContainer)}>
            <View style={themed($viewfinder)}>
              {/* Corner guides */}
              <View style={[themed($corner), themed($cornerTopLeft)]} />
              <View style={[themed($corner), themed($cornerTopRight)]} />
              <View style={[themed($corner), themed($cornerBottomLeft)]} />
              <View style={[themed($corner), themed($cornerBottomRight)]} />

              {/* Center guide */}
              <View style={themed($centerGuide)}>
                <MaterialCommunityIcons name="crosshairs" size={32} color="rgba(255,255,255,0.6)" />
              </View>
            </View>
            <Text text="Align tag number here" size="xs" style={themed($viewfinderHint)} />
          </View>

          {/* Bottom hint */}
          <View style={themed($bottomBar)}>
            <Text text="Tag number will appear automatically when detected" size="sm" style={{ color: "#FFF", textAlign: "center", opacity: 0.9 }} />
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
  marginBottom: 12,
})

const $closeButton: ThemedStyle<ViewStyle> = () => ({
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: "rgba(0,0,0,0.6)",
  justifyContent: "center",
  alignItems: "center",
})

const $torchButton: ThemedStyle<ViewStyle> = () => ({
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: "rgba(0,0,0,0.6)",
  justifyContent: "center",
  alignItems: "center",
})

const $instructionsCard: ThemedStyle<ViewStyle> = () => ({
  backgroundColor: "rgba(0,0,0,0.7)",
  borderRadius: 12,
  padding: 12,
  gap: 8,
  marginBottom: 16,
})

const $instructionRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
})

const $viewfinderContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  marginVertical: 20,
})

const $viewfinder: ThemedStyle<ViewStyle> = () => ({
  width: "85%",
  aspectRatio: 3 / 2,
  borderWidth: 3,
  borderColor: "#0E95D8",
  borderRadius: 16,
  backgroundColor: "rgba(14, 149, 216, 0.1)",
  position: "relative",
  justifyContent: "center",
  alignItems: "center",
})

const $corner: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  width: 30,
  height: 30,
  borderColor: "#FFF",
})

const $cornerTopLeft: ThemedStyle<ViewStyle> = () => ({
  top: -3,
  left: -3,
  borderTopWidth: 4,
  borderLeftWidth: 4,
  borderTopLeftRadius: 16,
})

const $cornerTopRight: ThemedStyle<ViewStyle> = () => ({
  top: -3,
  right: -3,
  borderTopWidth: 4,
  borderRightWidth: 4,
  borderTopRightRadius: 16,
})

const $cornerBottomLeft: ThemedStyle<ViewStyle> = () => ({
  bottom: -3,
  left: -3,
  borderBottomWidth: 4,
  borderLeftWidth: 4,
  borderBottomLeftRadius: 16,
})

const $cornerBottomRight: ThemedStyle<ViewStyle> = () => ({
  bottom: -3,
  right: -3,
  borderBottomWidth: 4,
  borderRightWidth: 4,
  borderBottomRightRadius: 16,
})

const $centerGuide: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  justifyContent: "center",
  alignItems: "center",
})

const $viewfinderHint: ThemedStyle<any> = () => ({
  color: "#FFF",
  textAlign: "center",
  marginTop: 12,
  backgroundColor: "rgba(0,0,0,0.6)",
  paddingHorizontal: 16,
  paddingVertical: 6,
  borderRadius: 20,
})

const $bottomBar: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
  paddingBottom: 10,
  paddingHorizontal: 20,
})
