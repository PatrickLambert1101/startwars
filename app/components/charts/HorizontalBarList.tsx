import { FC } from "react"
import { Pressable, View, ViewStyle, TextStyle } from "react-native"

import { Text } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface BarItem {
  key: string
  label: string
  value: number
  /** Optional secondary text on the right, defaults to the value */
  valueLabel?: string
  color?: string
}

interface HorizontalBarListProps {
  items: BarItem[]
  /** Cap the list; the tail is collapsed into an "other" row */
  maxBars?: number
  otherLabel?: string
  onItemPress?: (item: BarItem) => void
}

/**
 * Label + proportional bar + count rows. Custom Views instead of a chart lib:
 * horizontal bars with long labels (breed names) stay legible on a phone, every
 * row is a 44pt+ touch target, and RTL flips for free.
 */
export const HorizontalBarList: FC<HorizontalBarListProps> = ({
  items,
  maxBars = 6,
  otherLabel = "Other",
  onItemPress,
}) => {
  const { themed, theme } = useAppTheme()

  const sorted = [...items].sort((a, b) => b.value - a.value)
  const shown = sorted.slice(0, maxBars)
  const rest = sorted.slice(maxBars)
  if (rest.length > 0) {
    shown.push({
      key: "__other__",
      label: `${otherLabel} (${rest.length})`,
      value: rest.reduce((sum, item) => sum + item.value, 0),
    })
  }

  const max = Math.max(...shown.map((item) => item.value), 1)

  return (
    <View>
      {shown.map((item) => {
        const isOther = item.key === "__other__"
        const pressable = onItemPress && !isOther
        const fillStyle: ViewStyle = {
          width: `${Math.max(4, Math.round((item.value / max) * 100))}%`,
          backgroundColor: item.color ?? theme.colors.palette.primary400,
          opacity: isOther ? 0.45 : 1,
        }
        const row = (
          <View style={themed($row)}>
            <View style={themed($labelColumn)}>
              <Text size="xs" text={item.label} numberOfLines={1} />
            </View>
            <View style={themed($barTrack)}>
              <View style={[themed($barFill), fillStyle]} />
            </View>
            <Text
              size="xs"
              preset="bold"
              text={item.valueLabel ?? String(item.value)}
              style={themed($value)}
            />
          </View>
        )
        return pressable ? (
          <Pressable
            key={item.key}
            onPress={() => onItemPress(item)}
            style={({ pressed }) => pressed && { opacity: 0.6 }}
            accessibilityRole="button"
          >
            {row}
          </Pressable>
        ) : (
          <View key={item.key}>{row}</View>
        )
      })}
    </View>
  )
}

const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  minHeight: 36,
})

const $labelColumn: ThemedStyle<ViewStyle> = () => ({
  width: 96,
})

const $barTrack: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  height: 14,
  borderRadius: 7,
  backgroundColor: colors.palette.neutral200,
  overflow: "hidden",
})

const $barFill: ThemedStyle<ViewStyle> = () => ({
  height: "100%",
  borderRadius: 7,
})

const $value: ThemedStyle<TextStyle> = () => ({
  minWidth: 34,
  textAlign: "right",
})
