import { FC } from "react"
import { View, ViewStyle, TextStyle } from "react-native"

import { Text } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface StatPillProps {
  label: string
  value: string
  /** "brand" green (default), "warn" amber, "alert" red */
  tone?: "brand" | "warn" | "alert" | "neutral"
}

/** Big-number KPI chip: the number first, the plain-language label under it. */
export const StatPill: FC<StatPillProps> = ({ label, value, tone = "brand" }) => {
  const { themed, theme } = useAppTheme()
  const toneColors: Record<string, { bg: string; fg: string }> = {
    brand: { bg: theme.colors.palette.primary100, fg: theme.colors.palette.primary600 },
    warn: { bg: theme.colors.palette.accent100, fg: theme.colors.palette.secondary500 },
    alert: { bg: theme.colors.errorBackground, fg: theme.colors.error },
    neutral: { bg: theme.colors.palette.neutral200, fg: theme.colors.text },
  }
  const { bg, fg } = toneColors[tone]

  return (
    <View style={[themed($pill), { backgroundColor: bg }]}>
      <Text preset="bold" size="lg" text={value} style={{ color: fg }} />
      <Text size="xs" text={label} style={themed($label)} numberOfLines={2} />
    </View>
  )
}

const $pill: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  borderRadius: 12,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.xs,
  alignItems: "center",
  minHeight: 64,
  justifyContent: "center",
})

const $label: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
  marginTop: 2,
})
