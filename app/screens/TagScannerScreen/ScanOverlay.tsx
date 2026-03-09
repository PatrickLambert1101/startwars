import { FC } from "react"
import { View, ViewStyle, Pressable, TextStyle } from "react-native"
import { Text } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ScanOverlayProps {
  detectedText?: string[]
  stableTagNumber?: string | null
  onClose?: () => void
  torchEnabled?: boolean
  onToggleTorch?: () => void
}

export const ScanOverlay: FC<ScanOverlayProps> = ({
  detectedText = [],
  stableTagNumber,
  onClose,
  torchEnabled = false,
  onToggleTorch,
}) => {
  const { themed } = useAppTheme()

  return (
    <View style={themed($overlay)}>
      {/* Top bar */}
      <View style={themed($topBar)}>
        <Pressable onPress={onClose} style={themed($closeButton)}>
          <Text text="✕" size="xl" style={themed($closeText)} />
        </Pressable>
        <Pressable onPress={onToggleTorch} style={themed($torchButton)}>
          <Text text={torchEnabled ? "🔦" : "💡"} size="xl" />
        </Pressable>
      </View>

      {/* Center viewfinder */}
      <View style={themed($viewfinderContainer)}>
        <View style={themed($viewfinder)}>
          {/* Corner markers */}
          <View style={[themed($corner), themed($cornerTopLeft)]} />
          <View style={[themed($corner), themed($cornerTopRight)]} />
          <View style={[themed($corner), themed($cornerBottomLeft)]} />
          <View style={[themed($corner), themed($cornerBottomRight)]} />

          {/* Detected tag display */}
          {stableTagNumber && (
            <View style={themed($detectedBadge)}>
              <Text text="✓" style={themed($checkmark)} size="md" />
              <Text text={stableTagNumber} preset="bold" style={themed($tagText)} size="xl" />
            </View>
          )}
        </View>

        {/* Instruction text */}
        <View style={themed($instructionBox)}>
          {!stableTagNumber ? (
            <>
              <Text
                text="Position ear tag within frame"
                preset="bold"
                style={themed($instruction)}
                size="md"
              />
              <Text
                text="Hold steady for best results"
                style={themed($subInstruction)}
                size="xs"
              />
            </>
          ) : (
            <Text
              text="Tag detected! Processing..."
              preset="bold"
              style={themed($successText)}
              size="md"
            />
          )}
        </View>
      </View>

      {/* Bottom info */}
      {detectedText.length > 0 && !stableTagNumber && (
        <View style={themed($debugInfo)}>
          <Text
            text={`Detecting: ${detectedText.slice(0, 3).join(", ")}`}
            size="xs"
            style={themed($debugText)}
          />
        </View>
      )}
    </View>
  )
}

// ─── Styles ───

const $overlay: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "space-between",
})

const $topBar: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.xl,
})

const $closeButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  width: 48,
  height: 48,
  borderRadius: 24,
  alignItems: "center",
  justifyContent: "center",
})

const $closeText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
})

const $torchButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  width: 48,
  height: 48,
  borderRadius: 24,
  alignItems: "center",
  justifyContent: "center",
})

const $viewfinderContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
})

const $viewfinder: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 280,
  height: 180,
  position: "relative",
  justifyContent: "center",
  alignItems: "center",
})

const $corner: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  width: 40,
  height: 40,
  borderColor: "#4A8C3F",
  borderWidth: 4,
})

const $cornerTopLeft: ThemedStyle<ViewStyle> = () => ({
  top: 0,
  left: 0,
  borderRightWidth: 0,
  borderBottomWidth: 0,
  borderTopLeftRadius: 12,
})

const $cornerTopRight: ThemedStyle<ViewStyle> = () => ({
  top: 0,
  right: 0,
  borderLeftWidth: 0,
  borderBottomWidth: 0,
  borderTopRightRadius: 12,
})

const $cornerBottomLeft: ThemedStyle<ViewStyle> = () => ({
  bottom: 0,
  left: 0,
  borderRightWidth: 0,
  borderTopWidth: 0,
  borderBottomLeftRadius: 12,
})

const $cornerBottomRight: ThemedStyle<ViewStyle> = () => ({
  bottom: 0,
  right: 0,
  borderLeftWidth: 0,
  borderTopWidth: 0,
  borderBottomRightRadius: 12,
})

const $detectedBadge: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  backgroundColor: "#4A8C3F",
  borderRadius: 16,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,
})

const $checkmark: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
})

const $tagText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
})

const $instructionBox: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xl,
  alignItems: "center",
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderRadius: 12,
})

const $instruction: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  textAlign: "center",
})

const $subInstruction: ThemedStyle<TextStyle> = () => ({
  color: "rgba(255, 255, 255, 0.8)",
  textAlign: "center",
  marginTop: 4,
})

const $successText: ThemedStyle<TextStyle> = () => ({
  color: "#4A8C3F",
  textAlign: "center",
})

const $debugInfo: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
  alignItems: "center",
})

const $debugText: ThemedStyle<TextStyle> = () => ({
  color: "rgba(255, 255, 255, 0.7)",
  textAlign: "center",
})
