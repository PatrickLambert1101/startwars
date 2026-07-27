import { FC, ReactNode } from "react"
import { Pressable, View, ViewStyle, TextStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { Text } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ChartCardProps {
  title: string
  /** Plain-language one-liner under the title ("See how your herd is growing") */
  subtitle?: string
  onPress?: () => void
  children: ReactNode
}

/**
 * Dashboard card wrapper: title, farmer-friendly subtitle, and an optional
 * tap-through (drill-down) affordance. Big touch target, mobile-first.
 */
export const ChartCard: FC<ChartCardProps> = ({ title, subtitle, onPress, children }) => {
  const { themed, theme } = useAppTheme()

  const content = (
    <>
      <View style={themed($header)}>
        <View style={themed($headerText)}>
          <Text preset="subheading" text={title} />
          {subtitle ? <Text size="xs" text={subtitle} style={themed($subtitle)} /> : null}
        </View>
        {onPress ? (
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textDim} />
        ) : null}
      </View>
      {children}
    </>
  )

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [themed($card), pressed && themed($pressed)]}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    )
  }
  return <View style={themed($card)}>{content}</View>
}

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 14,
  padding: spacing.md,
  marginBottom: spacing.sm,
})

const $pressed: ThemedStyle<ViewStyle> = () => ({
  opacity: 0.85,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: spacing.sm,
})

const $headerText: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  marginTop: 2,
})
