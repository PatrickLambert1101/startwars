import { useCallback, useMemo, useState } from "react"
import { ActivityIndicator, View, ViewStyle, TextStyle, FlatList, Pressable } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { format } from "date-fns"

import { FriendlyEmpty, Screen, Text } from "@/components"
import { usePendingVaccinations } from "@/hooks/useVaccinationSchedules"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { bentoRadii } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export function PendingVaccinationsScreen({
  navigation,
  route,
}: AppStackScreenProps<"PendingVaccinations">) {
  const { themed, theme } = useAppTheme()
  const { vaccinations, isLoading } = usePendingVaccinations()
  const [filter, setFilter] = useState<"attention" | "all">(route.params?.initialFilter ?? "all")
  const visibleVaccinations = useMemo(
    () =>
      filter === "attention"
        ? vaccinations.filter((vaccination) => vaccination.daysUntilDue <= 7)
        : vaccinations,
    [filter, vaccinations],
  )

  const handleVaccinationPress = useCallback(
    (vaccination: any) => {
      navigation.navigate("AnimalDetail", {
        animalId: vaccination.animalId,
        initialTab: "vaccinations",
      })
    },
    [navigation],
  )

  const getUrgencyColor = (vaccination: any) => {
    if (vaccination.urgencyLevel === "critical" || vaccination.urgencyLevel === "overdue") {
      return theme.colors.error
    }
    if (vaccination.urgencyLevel === "soon") {
      return theme.colors.palette.accent500
    }
    return theme.colors.textDim
  }

  const renderVaccination = ({ item }: { item: any }) => {
    const urgencyColor = getUrgencyColor(item)
    const isOverdue = item.daysUntilDue < 0

    return (
      <Pressable
        style={[themed($vaccinationCard), { borderLeftColor: urgencyColor }]}
        onPress={() => handleVaccinationPress(item)}
      >
        <View style={themed($cardHeader)}>
          <View style={themed($headerLeft)}>
            <MaterialCommunityIcons name="needle" size={20} color={urgencyColor} />
            <View style={themed($headerInfo)}>
              <Text preset="bold" text={item.schedule?.name || "Unknown Vaccination"} />
              <Text
                text={item.animal?.displayName || `Tag: ${item.animal?.visualTag}`}
                size="sm"
                style={themed($animalName)}
              />
            </View>
          </View>
          {item.doseNumber > 1 && (
            <View style={themed($doseBadge)}>
              <Text text={`Dose ${item.doseNumber}`} size="xxs" style={themed($doseBadgeText)} />
            </View>
          )}
        </View>

        <View style={themed($cardDetails)}>
          <View style={themed($detailRow)}>
            <MaterialCommunityIcons name="calendar" size={14} color={theme.colors.textDim} />
            <Text
              text={`Due: ${format(item.dueDate, "dd MMM yyyy")}`}
              size="xs"
              style={themed($detailText)}
            />
          </View>

          <View style={themed($detailRow)}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={urgencyColor} />
            <Text
              text={
                isOverdue
                  ? `${Math.abs(item.daysUntilDue)} days overdue`
                  : `${item.daysUntilDue} days until due`
              }
              size="xs"
              style={[themed($detailText), themed($urgentDetailText), { color: urgencyColor }]}
            />
          </View>

          {item.schedule?.protocol && (
            <View style={themed($detailRow)}>
              <MaterialCommunityIcons name="medication" size={14} color={theme.colors.textDim} />
              <Text
                text={item.schedule.protocol.productName}
                size="xs"
                style={themed($detailText)}
              />
            </View>
          )}
        </View>

        <View style={themed($cardFooter)}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textDim} />
          <Text text="Tap to review and administer" size="xs" style={themed($footerText)} />
        </View>
      </Pressable>
    )
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <View style={themed($header)}>
        <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </Pressable>
        <Text preset="heading" text="Pending Vaccinations" style={themed($headerTitle)} />
        <View style={$headerSpacer} />
      </View>

      {isLoading ? (
        <View style={themed($loading)}>
          <ActivityIndicator color={theme.colors.tint} />
          <Text text="Loading vaccinations…" size="sm" style={themed($detailText)} />
        </View>
      ) : vaccinations.length > 0 ? (
        <>
          <View style={themed($filterRow)}>
            <Pressable
              onPress={() => setFilter("attention")}
              style={[themed($filterChip), filter === "attention" && themed($filterChipActive)]}
            >
              <Text
                text="Needs attention"
                size="xs"
                style={filter === "attention" ? themed($filterTextActive) : undefined}
              />
            </Pressable>
            <Pressable
              onPress={() => setFilter("all")}
              style={[themed($filterChip), filter === "all" && themed($filterChipActive)]}
            >
              <Text
                text="All pending"
                size="xs"
                style={filter === "all" ? themed($filterTextActive) : undefined}
              />
            </Pressable>
          </View>
          <Text
            text={`${visibleVaccinations.length} vaccination${
              visibleVaccinations.length === 1 ? "" : "s"
            } ${filter === "attention" ? "need attention" : "pending"}`}
            size="sm"
            style={themed($countText)}
          />
          {visibleVaccinations.length > 0 ? (
            <FlatList
              data={visibleVaccinations}
              renderItem={renderVaccination}
              keyExtractor={(item) => item.id}
              style={themed($list)}
              contentContainerStyle={themed($listContent)}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FriendlyEmpty
              icon="check-circle"
              heading="Nothing needs attention"
              content="There are pending vaccinations, but none are overdue or due within seven days."
            />
          )}
        </>
      ) : (
        <FriendlyEmpty
          icon="check-circle"
          heading="All caught up!"
          content="No pending vaccinations at this time."
        />
      )}
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: spacing.md,
  marginBottom: spacing.md,
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
  marginLeft: -spacing.xs,
})

const $headerTitle: ThemedStyle<TextStyle> = () => ({
  flex: 1,
  textAlign: "center",
})

const $headerSpacer: ViewStyle = {
  width: 40,
}

const $countText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.sm,
})

const $loading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
})

const $filterRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.sm,
})

const $filterChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 18,
  backgroundColor: colors.background,
})

const $filterChipActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.tint,
  backgroundColor: colors.tint,
})

const $filterTextActive: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  fontWeight: "700",
})

const $list: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
})

const $vaccinationCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: bentoRadii.card,
  padding: spacing.md,
  marginBottom: spacing.sm,
  borderWidth: 1,
  borderLeftWidth: 4,
  borderColor: colors.border,
})

const $cardHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: spacing.sm,
})

const $headerLeft: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.sm,
  flex: 1,
})

const $headerInfo: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $animalName: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "600",
})

const $doseBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 12,
})

const $doseBadgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "600",
})

const $cardDetails: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.xs,
  marginBottom: spacing.sm,
})

const $detailRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $detailText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $urgentDetailText: ThemedStyle<TextStyle> = () => ({
  fontWeight: "600",
})

const $cardFooter: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: spacing.xs,
  paddingTop: spacing.sm,
  borderTopWidth: 1,
  borderTopColor: "rgba(0,0,0,0.05)",
})

const $footerText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontStyle: "italic",
})
