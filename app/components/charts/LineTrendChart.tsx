import { FC } from "react"
import { useWindowDimensions, View, ViewStyle } from "react-native"
import { LineChart } from "react-native-gifted-charts"

import { Text } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface TrendPoint {
  label: string
  value: number
}

interface LineTrendChartProps {
  points: TrendPoint[]
  /** Unit shown in the y-axis tooltip context, e.g. "kg" */
  unit?: string
  emptyText: string
}

/** Smooth line trend sized to the phone width; shows emptyText under 2 points. */
export const LineTrendChart: FC<LineTrendChartProps> = ({ points, unit = "", emptyText }) => {
  const { themed, theme } = useAppTheme()
  const { width } = useWindowDimensions()

  if (points.length < 2) {
    return (
      <View style={themed($empty)}>
        <Text size="xs" text={emptyText} style={{ color: theme.colors.textDim }} />
      </View>
    )
  }

  const values = points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const padding = Math.max(1, Math.round((max - min) * 0.2))

  // Card padding (md * 2) + chart's own y-axis gutter
  const chartWidth = width - 140

  const axisTextStyle = { color: theme.colors.textDim, fontSize: 10 }
  const axisLabelStyle = { color: theme.colors.textDim, fontSize: 9 }

  return (
    <LineChart
      data={points.map((point) => ({ value: point.value, label: point.label }))}
      width={chartWidth}
      height={140}
      curved
      thickness={3}
      color={theme.colors.palette.primary500}
      dataPointsColor={theme.colors.palette.primary600}
      startFillColor={theme.colors.palette.primary200}
      endFillColor={theme.colors.palette.primary100}
      startOpacity={0.6}
      endOpacity={0.05}
      areaChart
      yAxisOffset={Math.max(0, min - padding)}
      noOfSections={3}
      yAxisTextStyle={axisTextStyle}
      xAxisLabelTextStyle={axisLabelStyle}
      yAxisColor={theme.colors.separator}
      xAxisColor={theme.colors.separator}
      rulesColor={theme.colors.palette.neutral200}
      yAxisLabelSuffix={unit}
      hideDataPoints={points.length > 8}
      spacing={Math.max(28, Math.floor(chartWidth / Math.max(points.length, 1)))}
      initialSpacing={12}
      disableScroll
    />
  )
}

const $empty: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.lg,
  alignItems: "center",
})
