import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { useDatabase } from "@/context/DatabaseContext"
import {
  generateHerdInsights,
  type HerdInsightItem,
  type HerdInsightsResult,
} from "@/services/herdInsights"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { Button } from "./Button"
import { Text } from "./Text"

const priorityColor = (priority: HerdInsightItem["priority"]) => {
  if (priority === "high") return "#D64220"
  if (priority === "medium") return "#D08A00"
  return "#6E8B35"
}

export function HerdInsightsCard() {
  const { currentOrg } = useDatabase()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<HerdInsightsResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyse = useCallback(async () => {
    if (!currentOrg || loading) return
    setVisible(true)
    setLoading(true)
    setError(null)
    try {
      setResult(await generateHerdInsights(currentOrg.id))
    } catch (analysisError) {
      console.error("[HerdInsights] Analysis failed:", analysisError)
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Herd Insights could not run. Please try again.",
      )
    } finally {
      setLoading(false)
    }
  }, [currentOrg, loading])

  return (
    <>
      <View style={themed($card)}>
        <View style={themed($header)}>
          <View style={themed($icon)}>
            <MaterialCommunityIcons name="creation" size={24} color={colors.tint} />
          </View>
          <View style={$copy}>
            <View style={themed($titleRow)}>
              <Text preset="subheading" text="Herd Insights" />
              <View style={themed($badge)}>
                <Text text="AI assisted" size="xxs" style={themed($badgeText)} />
              </View>
            </View>
            <Text
              text="Review pasture pressure, animal health records, weights, breeding and vaccinations."
              size="xs"
              style={themed($description)}
            />
          </View>
        </View>
        <Button
          text={result ? "Refresh analysis" : "Analyse my farm"}
          preset="reversed"
          onPress={() => void analyse()}
          disabled={loading || !currentOrg}
          style={themed($button)}
        />
        <Text
          text="Only a compact farm summary is sent. Limited to 3 new analyses per farm daily."
          size="xxs"
          style={themed($finePrint)}
        />
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={themed($backdrop)}>
          <View style={themed($sheet)}>
            <View style={themed($sheetHeader)}>
              <View>
                <Text preset="heading" text="Herd Insights" />
                <Text
                  text={currentOrg?.name ?? "Current farm"}
                  size="xs"
                  style={themed($description)}
                />
              </View>
              <Pressable
                onPress={() => setVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close Herd Insights"
                style={themed($closeButton)}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {loading ? (
              <View style={themed($loading)}>
                <ActivityIndicator size="large" color={colors.tint} />
                <Text text="Reviewing your latest farm records…" style={themed($description)} />
              </View>
            ) : error ? (
              <View style={themed($errorCard)}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={26}
                  color={colors.error}
                />
                <Text text={error} style={themed($errorText)} />
                <Button text="Try again" onPress={() => void analyse()} />
              </View>
            ) : result ? (
              <ScrollView contentContainerStyle={themed($results)}>
                <View style={themed($summaryCard)}>
                  <Text preset="bold" text="Farm summary" />
                  <Text text={result.summary} style={themed($summaryText)} />
                </View>

                {result.insights.map((insight, index) => (
                  <View key={insight.title + "-" + index} style={themed($insightCard)}>
                    <View style={themed($insightHeader)}>
                      <View
                        style={[
                          themed($priorityDot),
                          { backgroundColor: priorityColor(insight.priority) },
                        ]}
                      />
                      <Text preset="bold" text={insight.title} style={$copy} />
                      <Text
                        text={insight.priority.toUpperCase()}
                        size="xxs"
                        style={{ color: priorityColor(insight.priority) }}
                      />
                    </View>
                    <Text text={insight.reason} size="xs" style={themed($description)} />
                    <View style={themed($actionRow)}>
                      <MaterialCommunityIcons name="arrow-right" size={18} color={colors.tint} />
                      <Text text={insight.action} size="sm" preset="bold" style={$copy} />
                    </View>
                  </View>
                ))}

                <Text
                  text={
                    (result.cached ? "Cached result" : "New analysis") +
                    " · " +
                    result.remainingToday +
                    " new analyses remaining today"
                  }
                  size="xxs"
                  style={themed($finePrint)}
                />
                <Text
                  text="AI suggestions can be wrong. Check important animal-health decisions with your veterinarian."
                  size="xxs"
                  style={themed($finePrint)}
                />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  )
}

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderColor: colors.palette.primary300,
  borderRadius: 16,
  borderWidth: 1,
  padding: spacing.md,
})
const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "flex-start",
  flexDirection: "row",
  gap: spacing.sm,
})
const $icon: ThemedStyle<ViewStyle> = ({ colors }) => ({
  alignItems: "center",
  backgroundColor: colors.palette.primary100,
  borderRadius: 22,
  height: 44,
  justifyContent: "center",
  width: 44,
})
const $copy: ViewStyle = { flex: 1 }
const $titleRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})
const $badge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderRadius: 20,
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
})
const $badgeText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.tint })
const $description: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xxs,
})
const $button: ThemedStyle<ViewStyle> = ({ spacing }) => ({ marginTop: spacing.md })
const $finePrint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xs,
  textAlign: "center",
})
const $backdrop: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.overlay50,
  flex: 1,
  justifyContent: "flex-end",
})
const $sheet: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  maxHeight: "90%",
  minHeight: "56%",
  padding: spacing.lg,
})
const $sheetHeader: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
  flexDirection: "row",
  justifyContent: "space-between",
})
const $closeButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  alignItems: "center",
  backgroundColor: colors.palette.neutral200,
  borderRadius: 22,
  height: 44,
  justifyContent: "center",
  width: 44,
})
const $loading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  flex: 1,
  gap: spacing.md,
  justifyContent: "center",
})
const $errorCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  backgroundColor: colors.palette.angry100,
  borderRadius: 12,
  gap: spacing.md,
  marginTop: spacing.xl,
  padding: spacing.lg,
})
const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
  textAlign: "center",
})
const $results: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.md,
  paddingBottom: spacing.xl,
  paddingTop: spacing.lg,
})
const $summaryCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderRadius: 12,
  padding: spacing.md,
})
const $summaryText: ThemedStyle<TextStyle> = ({ spacing }) => ({ marginTop: spacing.xs })
const $insightCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderColor: colors.border,
  borderRadius: 12,
  borderWidth: 1,
  gap: spacing.xs,
  padding: spacing.md,
})
const $insightHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  flexDirection: "row",
  gap: spacing.xs,
})
const $priorityDot: ThemedStyle<ViewStyle> = () => ({ borderRadius: 5, height: 10, width: 10 })
const $actionRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "flex-start",
  backgroundColor: colors.palette.neutral200,
  borderRadius: 8,
  flexDirection: "row",
  gap: spacing.xs,
  marginTop: spacing.xs,
  padding: spacing.sm,
})
