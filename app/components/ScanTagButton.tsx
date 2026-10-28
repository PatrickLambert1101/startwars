import { FC } from "react"
import { Pressable, View } from "react-native"
import type { StyleProp, TextStyle, ViewStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"

import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { registerScanCallback } from "@/screens/TagScannerScreen/TagScannerScreen"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Text } from "./Text"

interface ScanTagButtonProps {
  onTagScanned: (tagNumber: string) => void
  style?: StyleProp<ViewStyle>
  compact?: boolean
  label?: string
}

export const ScanTagButton: FC<ScanTagButtonProps> = ({
  onTagScanned,
  style,
  compact = false,
  label = "Scan Tag",
}) => {
  const { themed } = useAppTheme()
  const navigation = useNavigation<AppStackScreenProps<"TagScanner">["navigation"]>()

  const handlePress = () => {
    // Register callback and pass only the ID (serializable)
    const callbackId = registerScanCallback(onTagScanned)
    navigation.navigate("TagScanner", { callbackId })
  }

  if (compact) {
    return (
      <Pressable
        onPress={handlePress}
        style={[themed($compactButton), style]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <MaterialCommunityIcons name="camera-outline" size={20} color="#FFF" />
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={handlePress}
      style={[themed($button), style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={themed($buttonContent)}>
        <MaterialCommunityIcons name="camera-outline" size={20} color="#FFF" />
        <Text text={label} size="sm" style={themed($buttonText)} />
      </View>
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

const $buttonContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $buttonText: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  fontWeight: "600",
  textAlign: "center",
})

const $compactButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary500,
  borderRadius: 8,
  width: 40,
  height: 40,
  alignItems: "center",
  justifyContent: "center",
})
