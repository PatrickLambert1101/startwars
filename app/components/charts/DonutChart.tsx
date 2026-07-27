import { FC } from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import { PieChart } from "react-native-gifted-charts"

import { Text } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface DonutSlice {
  key: string
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  slices: DonutSlice[]
  centerValue: string
  centerLabel: string
  onSlicePress?: (slice: DonutSlice) => void
}

/**
 * Donut with a big number in the middle and a tappable legend below —
 * legends stay readable at any slice count where the chart labels would not.
 */
export const DonutChart: FC<DonutChartProps> = ({
  slices,
  centerValue,
  centerLabel,
  onSlicePress,
}) => {
  const { themed, theme } = useAppTheme()
  const visible = slices.filter((slice) => slice.value > 0)

  return (
    <View style={themed($container)}>
      <PieChart
        donut
        data={visible.map((slice) => ({ value: slice.value, color: slice.color }))}
        radius={80}
        innerRadius={52}
        innerCircleColor={theme.colors.palette.neutral100}
        onPress={(_: unknown, index: number) => onSlicePress?.(visible[index])}
        centerLabelComponent={() => (
          <View style={themed($center)}>
            <Text preset="bold" size="xl" text={centerValue} />
            <Text size="xxs" text={centerLabel} style={themed($centerLabel)} />
          </View>
        )}
      />
      <View style={themed($legend)}>
        {visible.map((slice) => (
          <Text
            key={slice.key}
            size="xs"
            style={themed($legendItem)}
            onPress={onSlicePress ? () => onSlicePress(slice) : undefined}
          >
            <Text size="xs" text="⬤ " style={{ color: slice.color }} />
            <Text size="xs" text={`${slice.label} (${slice.value})`} />
          </Text>
        ))}
      </View>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
})

const $center: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
})

const $centerLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $legend: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: spacing.xs,
  marginTop: spacing.sm,
})

const $legendItem: ThemedStyle<TextStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.xxs,
  paddingVertical: 2,
})
