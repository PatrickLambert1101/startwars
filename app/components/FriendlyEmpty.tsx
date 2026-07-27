import { FC } from "react"
import { StyleProp, View, ViewStyle, TextStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { Button, Text } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface FriendlyEmptyProps {
  /** MaterialCommunityIcons name, e.g. "file-chart" */
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  heading: string
  content: string
  buttonText?: string
  onButtonPress?: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * Encouraging empty state: brand-green icon badge instead of the generic
 * sad-face image. Used by the reports screens.
 */
export const FriendlyEmpty: FC<FriendlyEmptyProps> = ({
  icon,
  heading,
  content,
  buttonText,
  onButtonPress,
  style,
}) => {
  const { themed, theme } = useAppTheme()

  return (
    <View style={[themed($container), style]}>
      <View style={themed($badge)}>
        <MaterialCommunityIcons name={icon} size={40} color={theme.colors.palette.primary500} />
      </View>
      <Text preset="subheading" text={heading} style={themed($heading)} />
      <Text size="sm" text={content} style={themed($content)} />
      {buttonText && onButtonPress ? (
        <Button text={buttonText} onPress={onButtonPress} style={themed($button)} />
      ) : null}
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.xl,
})

const $badge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: colors.palette.primary100,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: spacing.md,
})

const $heading: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginBottom: spacing.xs,
})

const $content: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
})

const $button: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  minWidth: 160,
})
