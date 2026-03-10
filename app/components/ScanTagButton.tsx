import { FC } from "react"
import { Pressable, ViewStyle, TextStyle } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Text } from "./Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators"
import { registerScanCallback } from "@/screens/TagScannerScreen/TagScannerScreen"

interface ScanTagButtonProps {
  onTagScanned: (tagNumber: string) => void
  style?: ViewStyle
  compact?: boolean
}

export const ScanTagButton: FC<ScanTagButtonProps> = ({ onTagScanned, style, compact = false }) => {
  const { themed } = useAppTheme()
  const navigation = useNavigation<AppStackScreenProps<"TagScanner">["navigation"]>()

  const handlePress = () => {
    // Register callback and pass only the ID (serializable)
    const callbackId = registerScanCallback(onTagScanned)
    navigation.navigate("TagScanner", { callbackId })
  }

  if (compact) {
    return (
      <Pressable onPress={handlePress} style={[themed($compactButton), style]}>
        <Text text="📷" size="lg" />
      </Pressable>
    )
  }

  return (
    <Pressable onPress={handlePress} style={[themed($button), style]}>
      <Text text="📷 Scan Tag" size="sm" style={themed($buttonText)} />
    </Pressable>
  )
}

// ─── Styles ───

const $button: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary500,
  borderRadius: 12,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.md,
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
})

const $buttonText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  fontWeight: "600",
  textAlign: "center",
})

const $compactButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary500,
  borderRadius: 8,
  width: 40,
  height: 40,
  alignItems: "center",
  justifyContent: "center",
})
