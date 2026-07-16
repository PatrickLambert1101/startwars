import { FC, useState, useMemo } from "react"
import { View, ViewStyle, TextStyle, FlatList, Pressable, Modal } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { Screen, Text, AppHeader } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { MainTabScreenProps } from "@/navigators/navigationTypes"
import { usePendingVaccinations } from "@/hooks/useVaccinationSchedules"
import type { ScheduledVaccination } from "@/db/models"

type CalendarFilter = "all" | "today" | "week" | "month"

type CalendarEvent = {
  id: string
  title: string
  description?: string
  date: Date
  type: "vaccination" | "breeding" | "treatment" | "weight" | "pasture"
  urgency: "ok" | "soon" | "overdue" | "critical"
  animalName?: string
  animalId?: string
  animalTag?: string
  icon: string
}

export const CalendarScreen: FC<MainTabScreenProps<"Calendar">> = ({ navigation }) => {
  const { t } = useTranslation()
  const { themed, theme: { colors } } = useAppTheme()
  const { vaccinations } = usePendingVaccinations()
  const [activeFilter, setActiveFilter] = useState<CalendarFilter>("all")
  const [showManageMenu, setShowManageMenu] = useState(false)

  // These used to live only in the empty state, which meant they vanished the
  // moment a farm had a single event — i.e. exactly when they became useful.
  const manageDestinations = [
    {
      route: "VaccinationSchedules" as const,
      icon: "calendar-clock",
      color: colors.palette.accent500,
      title: t("calendarScreen.manage.schedules"),
      help: t("calendarScreen.manage.schedulesHelp"),
    },
    {
      route: "TreatmentProtocols" as const,
      icon: "medical-bag",
      color: colors.tint,
      title: t("calendarScreen.manage.protocols"),
      help: t("calendarScreen.manage.protocolsHelp"),
    },
  ]

  const goManage = (route: "VaccinationSchedules" | "TreatmentProtocols") => {
    setShowManageMenu(false)
    navigation.navigate(route)
  }

  const FILTER_OPTIONS: { value: CalendarFilter; label: string }[] = [
    { value: "all", label: t("calendarScreen.filters.all") },
    { value: "today", label: t("calendarScreen.filters.today") },
    { value: "week", label: t("calendarScreen.filters.week") },
    { value: "month", label: t("calendarScreen.filters.month") },
  ]

  // Convert vaccinations to calendar events
  const vaccinationEvents: CalendarEvent[] = useMemo(() => {
    return vaccinations
      .filter((v: any) => v.dueDate) // Only include vaccinations with valid dates
      .map((v: any) => ({
        id: v.id,
        title: v.schedule?.name || t("calendarScreen.unknownVaccination"),
        description: v.schedule?.protocol?.productName,
        date: v.dueDate,
        type: "vaccination" as const,
        urgency: v.urgencyLevel,
        animalName: v.animal?.displayName,
        animalId: v.animalId,
        animalTag: v.animal?.visualTag,
        icon: "needle",
      }))
  }, [vaccinations, t])

  // Combine all events
  const allEvents = useMemo(() => {
    return [...vaccinationEvents].sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [vaccinationEvents])

  // Filter events based on selected filter
  const filteredEvents = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    switch (activeFilter) {
      case "today":
        return allEvents.filter(e => {
          const eventDate = new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate())
          return eventDate.getTime() === today.getTime()
        })
      case "week":
        return allEvents.filter(e => e.date >= today && e.date <= weekFromNow)
      case "month":
        return allEvents.filter(e => e.date >= today && e.date <= monthFromNow)
      default:
        return allEvents
    }
  }, [allEvents, activeFilter])

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { date: string; events: CalendarEvent[] }[] = []

    filteredEvents.forEach(event => {
      const dateKey = event.date.toLocaleDateString()
      const existingGroup = groups.find(g => g.date === dateKey)

      if (existingGroup) {
        existingGroup.events.push(event)
      } else {
        groups.push({ date: dateKey, events: [event] })
      }
    })

    return groups
  }, [filteredEvents])

  const getUrgencyColor = (urgency: CalendarEvent["urgency"]) => {
    switch (urgency) {
      case "critical":
      case "overdue":
        return colors.error
      case "soon":
        return colors.palette.accent500
      default:
        return colors.textDim
    }
  }

  const getUrgencyBackground = (urgency: CalendarEvent["urgency"]) => {
    switch (urgency) {
      case "critical":
      case "overdue":
        return colors.errorBackground
      case "soon":
        return colors.palette.accent100
      default:
        return colors.palette.neutral100
    }
  }

  const renderFilterChips = () => (
    <View style={themed($filterRow)}>
      {FILTER_OPTIONS.map((option) => {
        const isActive = activeFilter === option.value
        return (
          <Pressable
            key={option.value}
            onPress={() => setActiveFilter(option.value)}
            style={[themed($filterChip), isActive && themed($filterChipActive)]}
          >
            <Text style={[themed($filterChipText), isActive && themed($filterChipTextActive)]}>
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )

  const handleEventPress = (event: CalendarEvent) => {
    if (event.animalId) {
      // Navigate to the animal's detail screen
      navigation.navigate("AnimalDetail", { animalId: event.animalId })
    }
  }

  const renderEvent = (event: CalendarEvent) => (
    <Pressable
      key={event.id}
      onPress={() => handleEventPress(event)}
      style={[themed($eventCard), { backgroundColor: getUrgencyBackground(event.urgency) }]}
    >
      <View style={themed($eventIcon)}>
        <MaterialCommunityIcons name={event.icon as any} size={20} color={getUrgencyColor(event.urgency)} />
      </View>
      <View style={themed($eventContent)}>
        <Text preset="bold" text={event.title} size="sm" />
        {(event.animalName || event.animalTag) && (
          <Text
            text={event.animalName || t("calendarScreen.tagPrefix", { tag: event.animalTag })}
            size="xs"
            style={themed($eventAnimal)}
          />
        )}
        {event.description && (
          <Text text={event.description} size="xs" style={themed($dimText)} />
        )}
      </View>
      {event.urgency !== "ok" && (
        <View style={themed($urgencyBadge)}>
          <Text
            text={
              event.urgency === "critical" || event.urgency === "overdue"
                ? t("calendarScreen.badges.overdue")
                : t("calendarScreen.badges.soon")
            }
            size="xxs"
            style={[themed($urgencyText), { color: getUrgencyColor(event.urgency) }]}
          />
        </View>
      )}
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDim} style={themed($chevron)} />
    </Pressable>
  )

  const renderDateGroup = ({ item }: { item: { date: string; events: CalendarEvent[] } }) => (
    <View style={themed($dateGroup)}>
      <View style={themed($dateHeader)}>
        <MaterialCommunityIcons name="calendar" size={16} color={colors.tint} />
        <Text preset="bold" text={item.date} size="sm" style={themed($dateText)} />
        <View style={themed($dateBadge)}>
          <Text text={`${item.events.length}`} size="xs" style={themed($dateBadgeText)} />
        </View>
      </View>
      {item.events.map(renderEvent)}
    </View>
  )

  const renderEmpty = () => (
    <View style={themed($emptyState)}>
      <MaterialCommunityIcons name="calendar-check" size={64} color={colors.palette.neutral300} />
      <Text preset="heading" text={t("calendarScreen.empty.title")} size="md" style={themed($emptyTitle)} />
      <Text
        text={
          activeFilter !== "all"
            ? t(`calendarScreen.empty.${activeFilter}`)
            : t("calendarScreen.empty.allCaughtUp")
        }
        style={themed($emptyText)}
      />

      {activeFilter === "all" && (
        <View style={themed($emptyActions)}>
          <Pressable
            onPress={() => navigation.navigate("VaccinationSchedules")}
            style={themed($emptyActionCard)}
          >
            <MaterialCommunityIcons name="calendar-clock" size={32} color={colors.palette.accent500} />
            <Text preset="bold" text={t("calendarScreen.manage.schedules")} style={themed($emptyActionTitle)} />
            <Text text={t("calendarScreen.manage.schedulesHelp")} size="xs" style={themed($emptyActionText)} />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("TreatmentProtocols")}
            style={themed($emptyActionCard)}
          >
            <MaterialCommunityIcons name="medical-bag" size={32} color={colors.tint} />
            <Text preset="bold" text={t("calendarScreen.manage.protocols")} style={themed($emptyActionTitle)} />
            <Text text={t("calendarScreen.manage.protocolsHelp")} size="xs" style={themed($emptyActionText)} />
          </Pressable>
        </View>
      )}
    </View>
  )

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <AppHeader
        title={t("calendarScreen.title")}
        showSettings={true}
        actions={
          <Pressable
            onPress={() => setShowManageMenu(true)}
            style={themed($manageButton)}
            accessibilityRole="button"
            accessibilityLabel={t("calendarScreen.manage.action")}
          >
            <MaterialCommunityIcons name="tune-variant" size={22} color={colors.text} />
          </Pressable>
        }
      />
      <View style={themed($header)}>
        <View style={themed($headerStats)}>
          <MaterialCommunityIcons name="bell-outline" size={20} color={colors.textDim} />
          <Text text={`${filteredEvents.length}`} preset="bold" style={themed($statsText)} />
        </View>
      </View>

      {renderFilterChips()}

      <FlatList
        data={groupedEvents}
        renderItem={renderDateGroup}
        keyExtractor={(item) => item.date}
        style={themed($list)}
        contentContainerStyle={themed($listContent)}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showManageMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowManageMenu(false)}
      >
        <Pressable style={themed($manageOverlay)} onPress={() => setShowManageMenu(false)}>
          <Pressable style={themed($manageSheet)} onPress={(e) => e.stopPropagation()}>
            <View style={themed($manageHeader)}>
              <Text preset="heading" text={t("calendarScreen.manage.title")} size="md" />
              <Pressable
                onPress={() => setShowManageMenu(false)}
                accessibilityRole="button"
                accessibilityLabel={t("common.cancel")}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {manageDestinations.map((d) => (
              <Pressable
                key={d.route}
                onPress={() => goManage(d.route)}
                style={themed($manageItem)}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name={d.icon as any} size={28} color={d.color} />
                <View style={themed($manageItemText)}>
                  <Text preset="bold" text={d.title} />
                  <Text text={d.help} size="xs" style={themed($manageItemHelp)} />
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={colors.textDim}
                />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  )
}

const $manageButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
})

const $manageOverlay: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.palette.overlay50,
  justifyContent: "flex-end",
})

const $manageSheet: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: spacing.lg,
  paddingBottom: spacing.xxl,
  gap: spacing.sm,
})

const $manageHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: spacing.xs,
})

const $manageItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.md,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
})

const $manageItemText: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $manageItemHelp: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: spacing.md,
  marginBottom: spacing.md,
})

const $headerStats: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $statsText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $filterRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.md,
})

const $filterChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 20,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
  borderWidth: 1.5,
  borderColor: colors.palette.neutral300,
})

const $filterChipActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary100,
  borderColor: colors.tint,
})

const $filterChipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.textDim,
})

const $filterChipTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "600",
})

const $list: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
})

const $dateGroup: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $dateHeader: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  paddingBottom: spacing.xs,
  marginBottom: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $dateText: ThemedStyle<TextStyle> = ({ colors }) => ({
  flex: 1,
  color: colors.text,
})

const $dateBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderRadius: 10,
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
})

const $dateBadgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "600",
})

const $eventCard: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  borderRadius: 8,
  padding: spacing.sm,
  marginBottom: spacing.xs,
  flexDirection: "row",
  alignItems: "center",
})

const $eventIcon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.sm,
})

const $eventContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $eventAnimal: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $urgencyBadge: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
})

const $urgencyText: ThemedStyle<TextStyle> = () => ({
  fontWeight: "600",
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $chevron: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginLeft: spacing.xs,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: spacing.xxxl,
})

const $emptyTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  marginBottom: spacing.xs,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.lg,
})

const $emptyActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  gap: spacing.md,
  marginTop: spacing.md,
})

const $emptyActionCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.lg,
  alignItems: "center",
  borderWidth: 1.5,
  borderColor: colors.palette.neutral200,
})

const $emptyActionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
  marginBottom: spacing.xxs,
})

const $emptyActionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
})
