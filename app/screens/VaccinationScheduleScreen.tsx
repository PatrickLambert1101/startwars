import { useState, useMemo } from "react"
import { View, ViewStyle, TextStyle, FlatList, Pressable, Alert } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { Screen, Text, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useVaccinationSchedules, useVaccinationScheduleActions } from "@/hooks/useVaccinationSchedules"
import { VaccinationSchedule, ScheduleType } from "@/db/models"

type FilterOption = "all" | ScheduleType

export function VaccinationScheduleScreen({ navigation }: AppStackScreenProps<"VaccinationSchedules">) {
  const { t } = useTranslation()
  const { themed, theme: { colors } } = useAppTheme()
  const { schedules, isLoading } = useVaccinationSchedules()
  const { toggleScheduleActive, deleteSchedule } = useVaccinationScheduleActions()
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all")

  const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
    { value: "all", label: t("vaccinationScheduleScreen.filters.all") },
    { value: "age_based", label: t("vaccinationScheduleScreen.filters.ageBased") },
    { value: "date_based", label: t("vaccinationScheduleScreen.filters.dateBased") },
    { value: "group_based", label: t("vaccinationScheduleScreen.filters.groupBased") },
  ]

  const filteredSchedules = useMemo(() => {
    if (activeFilter === "all") return schedules
    return schedules.filter((s) => s.scheduleType === activeFilter)
  }, [schedules, activeFilter])

  const filterCounts = useMemo(() => {
    const counts: Record<FilterOption, number> = {
      all: schedules.length,
      age_based: 0,
      date_based: 0,
      group_based: 0,
    }
    for (const s of schedules) {
      if (s.scheduleType in counts) {
        counts[s.scheduleType as ScheduleType]++
      }
    }
    return counts
  }, [schedules])

  const handleCreateSchedule = () => {
    navigation.navigate("VaccinationScheduleForm", { mode: "create" })
  }

  const handleEditSchedule = (scheduleId: string) => {
    navigation.navigate("VaccinationScheduleForm", { mode: "edit", scheduleId })
  }

  const handleToggleActive = async (scheduleId: string) => {
    try {
      await toggleScheduleActive(scheduleId)
    } catch (error) {
      console.error("Failed to toggle schedule:", error)
      Alert.alert(
        t("vaccinationScheduleScreen.alerts.toggleError.title"),
        t("vaccinationScheduleScreen.alerts.toggleError.message"),
      )
    }
  }

  const handleDeleteSchedule = (schedule: VaccinationSchedule) => {
    Alert.alert(
      t("vaccinationScheduleScreen.alerts.deleteConfirm.title"),
      t("vaccinationScheduleScreen.alerts.deleteConfirm.message", { name: schedule.name }),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSchedule(schedule.id)
            } catch (error) {
              console.error("Failed to delete schedule:", error)
              Alert.alert(
                t("vaccinationScheduleScreen.alerts.deleteError.title"),
                t("vaccinationScheduleScreen.alerts.deleteError.message"),
              )
            }
          },
        },
      ],
    )
  }

  const renderFilterChips = () => (
    <View style={themed($filterRow)}>
      {FILTER_OPTIONS.map((option) => {
        const isActive = activeFilter === option.value
        const count = filterCounts[option.value]
        if (option.value !== "all" && count === 0) return null
        return (
          <Pressable
            key={option.value}
            style={[themed($filterChip), isActive && themed($filterChipActive)]}
            onPress={() => setActiveFilter(option.value)}
          >
            <Text style={[themed($filterChipText), isActive && themed($filterChipTextActive)]}>
              {option.label}
            </Text>
            <View style={[themed($filterCount), isActive && themed($filterCountActive)]}>
              <Text style={[themed($filterCountText), isActive && themed($filterCountTextActive)]}>
                {count}
              </Text>
            </View>
          </Pressable>
        )
      })}
    </View>
  )

  const getScheduleIcon = (type: ScheduleType) => {
    switch (type) {
      case "age_based":
        return "calendar-clock"
      case "date_based":
        return "calendar"
      case "group_based":
        return "map-marker"
      default:
        return "calendar"
    }
  }

  const renderSchedule = ({ item }: { item: VaccinationSchedule }) => (
    <Pressable style={themed($scheduleCard)} onPress={() => handleEditSchedule(item.id)}>
      <View style={themed($scheduleHeader)}>
        <View style={themed($scheduleInfo)}>
          <View style={themed($scheduleTitleRow)}>
            <MaterialCommunityIcons
              name={getScheduleIcon(item.scheduleType)}
              size={20}
              color={colors.tint}
              style={themed($scheduleIcon)}
            />
            <Text style={themed($scheduleName)}>{item.name}</Text>
            {!item.isActive && (
              <View style={themed($inactiveBadge)}>
                <Text style={themed($inactiveBadgeText)}>
                  {t("vaccinationScheduleScreen.badges.inactive")}
                </Text>
              </View>
            )}
          </View>
          <Text style={themed($scheduleType)}>{item.scheduleTypeLabel}</Text>
          {item.description && (
            <Text style={themed($scheduleDescription)} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        <View style={themed($scheduleActions)}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation()
              handleToggleActive(item.id)
            }}
            style={[themed($toggleButton), item.isActive && themed($toggleButtonActive)]}
          >
            <MaterialCommunityIcons
              name={item.isActive ? "check" : "close"}
              size={18}
              color={item.isActive ? colors.palette.primary600 : colors.textDim}
            />
          </Pressable>
        </View>
      </View>

      <View style={themed($scheduleDetails)}>
        {item.requiresBooster && (
          <View style={themed($detailRow)}>
            <MaterialCommunityIcons name="needle" size={16} color={colors.palette.accent500} />
            <Text style={themed($detailText)}>
              {t("vaccinationScheduleScreen.details.booster", {
                count: item.boosterCount,
                days: item.boosterIntervalDays,
              })}
            </Text>
          </View>
        )}
        {item.targetSpecies && (
          <View style={themed($detailRow)}>
            <MaterialCommunityIcons name="cow" size={16} color={colors.tint} />
            <Text style={themed($detailText)}>
              {item.targetSpecies.charAt(0).toUpperCase() + item.targetSpecies.slice(1)}
              {item.targetSex && ` (${item.targetSex})`}
            </Text>
          </View>
        )}
      </View>

      <View style={themed($scheduleFooter)}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation()
            handleDeleteSchedule(item)
          }}
          style={themed($deleteButton)}
        >
          <MaterialCommunityIcons name="delete-outline" size={18} color={colors.error} />
          <Text style={themed($deleteButtonText)}>{t("common.delete")}</Text>
        </Pressable>
      </View>
    </Pressable>
  )

  const renderEmpty = () => (
    <View style={themed($emptyState)}>
      <MaterialCommunityIcons name="calendar-check" size={64} color={colors.palette.neutral300} />
      <Text style={themed($emptyTitle)}>{t("vaccinationScheduleScreen.empty.title")}</Text>
      <Text style={themed($emptyText)}>
        {activeFilter !== "all"
          ? t("vaccinationScheduleScreen.empty.withFilter", { filter: activeFilter })
          : t("vaccinationScheduleScreen.empty.noFilter")}
      </Text>
      {activeFilter !== "all" ? (
        <Button
          text={t("vaccinationScheduleScreen.empty.showAllButton")}
          onPress={() => setActiveFilter("all")}
          style={themed($emptyButton)}
        />
      ) : (
        <Button
          text={t("vaccinationScheduleScreen.empty.createButton")}
          onPress={handleCreateSchedule}
          style={themed($emptyButton)}
        />
      )}
    </View>
  )

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <View style={themed($header)}>
        <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text preset="heading" text={t("vaccinationScheduleScreen.title")} style={themed($headerTitle)} />
        <Button
          text={t("vaccinationScheduleScreen.createButton")}
          onPress={handleCreateSchedule}
          style={themed($createButton)}
        />
      </View>

      {schedules.length > 0 && renderFilterChips()}

      <Text
        text={t("vaccinationScheduleScreen.count", { count: filteredSchedules.length })}
        size="xs"
        style={themed($countText)}
      />
      <FlatList
        data={filteredSchedules}
        renderItem={renderSchedule}
        keyExtractor={(item) => item.id}
        style={themed($list)}
        contentContainerStyle={themed($listContent)}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!isLoading ? renderEmpty : undefined}
      />
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
  marginBottom: spacing.sm,
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
  marginLeft: -spacing.xs,
})

const $headerTitle: ThemedStyle<TextStyle> = () => ({
  flex: 1,
  marginLeft: 0,
})

const $createButton: ThemedStyle<ViewStyle> = () => ({
  minHeight: 36,
  paddingVertical: 6,
  paddingHorizontal: 16,
})

const $filterRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.md,
  flexWrap: "wrap",
})

const $filterChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
  minHeight: 36,
  borderRadius: 20,
  borderWidth: 1.5,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.palette.neutral100,
})

const $filterChipActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
})

const $filterChipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "500",
  color: colors.palette.neutral600,
})

const $filterChipTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
  fontWeight: "600",
})

const $filterCount: ThemedStyle<ViewStyle> = ({ colors }) => ({
  minWidth: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: colors.palette.neutral200,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 4,
})

const $filterCountActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary500,
})

const $filterCountText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 11,
  fontWeight: "700",
  color: colors.palette.neutral500,
})

const $filterCountTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
})

const $countText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.sm,
})

const $list: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
})

const $scheduleCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.sm,
})

const $scheduleHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: spacing.sm,
})

const $scheduleInfo: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $scheduleTitleRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  marginBottom: spacing.xxs,
})

const $scheduleIcon: ThemedStyle<ViewStyle> = () => ({
  marginRight: 4,
})

const $scheduleName: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  fontWeight: "700",
  color: colors.text,
  flex: 1,
})

const $inactiveBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral400,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 4,
})

const $inactiveBadgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontSize: 11,
  fontWeight: "600",
})

const $scheduleType: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.tint,
  marginBottom: spacing.xxs,
  fontWeight: "500",
})

const $scheduleDescription: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.textDim,
  lineHeight: 20,
})

const $scheduleActions: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
})

const $toggleButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.palette.neutral200,
  alignItems: "center",
  justifyContent: "center",
  padding: spacing.xs,
})

const $toggleButtonActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary100,
})

const $scheduleDetails: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.xs,
  marginBottom: spacing.sm,
})

const $detailRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $detailText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.text,
})

const $scheduleFooter: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  borderTopWidth: 1,
  borderTopColor: "rgba(0,0,0,0.05)",
  paddingTop: spacing.sm,
  flexDirection: "row",
  justifyContent: "flex-end",
})

const $deleteButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  padding: spacing.xs,
})

const $deleteButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.error,
  fontWeight: "500",
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xxl,
  alignItems: "center",
})

const $emptyTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 18,
  fontWeight: "600",
  color: colors.text,
  marginTop: spacing.md,
  marginBottom: spacing.xs,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 15,
  color: colors.textDim,
  marginBottom: spacing.lg,
  textAlign: "center",
  paddingHorizontal: spacing.lg,
})

const $emptyButton: ThemedStyle<ViewStyle> = () => ({
  minWidth: 180,
})
