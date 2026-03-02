import { View, ViewStyle, TextStyle } from "react-native"
import { format } from "date-fns"

import { Text } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { WeightRecord } from "@/db/models/WeightRecord"

type WeightChartProps = {
  records: WeightRecord[]
}

export function WeightChart({ records }: WeightChartProps) {
  const { themed, theme } = useAppTheme()

  // Sort oldest → newest
  const sorted = [...records].sort(
    (a, b) => (a.recordDate?.getTime() ?? 0) - (b.recordDate?.getTime() ?? 0),
  )
  const weights = sorted.map((r) => r.weightKg)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1
  const latest = weights[weights.length - 1]
  const first = weights[0]
  const change = latest - first
  const changeLabel = change >= 0 ? `+${change.toFixed(0)} kg` : `${change.toFixed(0)} kg`
  const adg = sorted.length >= 2
    ? (() => {
        const days = (sorted[sorted.length - 1].recordDate.getTime() - sorted[0].recordDate.getTime()) / (1000 * 60 * 60 * 24)
        return days > 0 ? (change / days).toFixed(2) : null
      })()
    : null

  return (
    <View style={themed($card)}>
      <View style={themed($header)}>
        <Text preset="bold" text="Weight History" />
        <Text
          text={changeLabel}
          size="sm"
          preset="bold"
          style={{ color: change >= 0 ? "#4A8C3F" : "#D64220" }}
        />
      </View>

      <View style={themed($graphArea)}>
        <View style={themed($yAxis)}>
          <Text text={`${max.toFixed(0)}`} size="xxs" style={themed($dimText)} />
          <Text text={`${((max + min) / 2).toFixed(0)}`} size="xxs" style={themed($dimText)} />
          <Text text={`${min.toFixed(0)}`} size="xxs" style={themed($dimText)} />
        </View>

        <View style={themed($bars)}>
          {sorted.map((r, i) => {
            const pct = range > 0 ? ((r.weightKg - min) / range) * 100 : 50
            const height = Math.max(pct * 0.7 + 15, 15)
            const isLatest = i === sorted.length - 1
            return (
              <View key={r.id || i} style={themed($barCol)}>
                <Text
                  text={`${r.weightKg}`}
                  size="xxs"
                  preset={isLatest ? "bold" : "default"}
                  style={isLatest ? { color: "#4A8C3F" } : themed($dimText)}
                />
                <View
                  style={[
                    themed($bar),
                    {
                      height: `${height}%`,
                      backgroundColor: isLatest ? "#4A8C3F" : theme.colors.tint + "88",
                    },
                  ]}
                />
                <Text text={format(r.recordDate, "dd/MM")} size="xxs" style={themed($dimText)} />
              </View>
            )
          })}
        </View>
      </View>

      <View style={themed($footer)}>
        <View style={themed($statItem)}>
          <Text text="Min" size="xxs" style={themed($dimText)} />
          <Text text={`${min.toFixed(0)} kg`} size="xs" preset="bold" />
        </View>
        <View style={themed($statItem)}>
          <Text text="Latest" size="xxs" style={themed($dimText)} />
          <Text text={`${latest.toFixed(0)} kg`} size="xs" preset="bold" style={{ color: "#4A8C3F" }} />
        </View>
        {adg && (
          <View style={themed($statItem)}>
            <Text text="ADG" size="xxs" style={themed($dimText)} />
            <Text text={`${adg} kg/d`} size="xs" preset="bold" />
          </View>
        )}
        <View style={themed($statItem)}>
          <Text text="Max" size="xxs" style={themed($dimText)} />
          <Text text={`${max.toFixed(0)} kg`} size="xs" preset="bold" />
        </View>
      </View>
    </View>
  )
}

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 14,
  padding: spacing.md,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.sm,
})

const $graphArea: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  height: 120,
  gap: spacing.xxs,
})

const $yAxis: ThemedStyle<ViewStyle> = () => ({
  width: 30,
  justifyContent: "space-between",
  alignItems: "flex-end",
  paddingRight: 4,
})

const $bars: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "flex-end",
  gap: spacing.xxs,
})

const $barCol: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "flex-end",
  height: "100%",
})

const $bar: ThemedStyle<ViewStyle> = () => ({
  width: "70%",
  borderRadius: 4,
  minHeight: 4,
})

const $footer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-around",
  marginTop: spacing.sm,
  paddingTop: spacing.xs,
  borderTopWidth: 1,
  borderTopColor: colors.separator,
})

const $statItem: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})
