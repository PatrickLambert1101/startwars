import { FC, useEffect, useMemo, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, View, ViewStyle, TextStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { format } from "date-fns"

import { AnimalPicker, AppHeader, Button, Screen, Text, TextField } from "@/components"
import { PlanSwitcher } from "@/components/PlanSwitcher"
import type { Animal } from "@/db/models/Animal"
import type { BreedingMethod, BreedingOutcome, BreedingRecord } from "@/db/models/BreedingRecord"
import { useAnimals } from "@/hooks/useAnimals"
import { useAllBreedingRecords } from "@/hooks/useRecords"
import type { MainTabScreenProps } from "@/navigators/navigationTypes"
import { bentoRadii } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import {
  filterAndSortBreedingRecords,
  getCalvingTiming,
  summarizeBreedingRecords,
  type BreedingDashboardFilter,
  type BreedingDashboardItem,
  type CalvingTimingStatus,
} from "@/utils/breedingDashboard"

interface BreedingListItem extends BreedingDashboardItem {
  record: BreedingRecord
  animalBreed?: string
  bullName?: string
}

const METHOD_LABELS: Record<BreedingMethod, string> = {
  natural: "Natural service",
  ai: "Artificial insemination",
  embryo_transfer: "Embryo transfer",
}

const OUTCOME_LABELS: Record<BreedingOutcome, string> = {
  pending: "Pending",
  live_calf: "Live calf",
  stillborn: "Stillborn",
  aborted: "Aborted",
  open: "Open",
}

const FILTERS: Array<{ key: BreedingDashboardFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "attention", label: "Needs attention" },
  { key: "pending", label: "Pending" },
  { key: "history", label: "History" },
]

export const BreedingScreen: FC<MainTabScreenProps<"Breeding">> = ({ navigation, route }) => {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const { records, isLoading } = useAllBreedingRecords()
  const { animals } = useAnimals()
  const [filter, setFilter] = useState<BreedingDashboardFilter>("all")
  const [search, setSearch] = useState("")
  const [showAnimalPicker, setShowAnimalPicker] = useState(false)

  useEffect(() => {
    if (!route.params?.initialFilter) return
    setFilter(route.params.initialFilter)
    setSearch("")
  }, [route.params?.initialFilter, route.params?.requestId])

  const listItems = useMemo<BreedingListItem[]>(() => {
    const animalsById = new Map(animals.map((animal) => [animal.id, animal]))

    return records.map((record) => {
      const animal = animalsById.get(record.animalId)
      const bull = record.bullId ? animalsById.get(record.bullId) : undefined
      return {
        id: record.id,
        record,
        animalName: animal?.displayName || "Unknown animal",
        animalBreed: animal?.breed,
        bullName: bull?.displayName,
        breedingDate: record.breedingDate,
        expectedCalvingDate: record.expectedCalvingDate,
        outcome: record.outcome,
      }
    })
  }, [animals, records])

  const today = new Date()
  const summary = useMemo(
    () => summarizeBreedingRecords(listItems, today),
    [listItems, today.toDateString()],
  )
  const visibleRecords = useMemo(
    () => filterAndSortBreedingRecords(listItems, filter, search, today),
    [filter, listItems, search, today.toDateString()],
  )

  const filterCount = (key: BreedingDashboardFilter) => {
    if (key === "attention") return summary.attention
    if (key === "pending") return summary.pending
    if (key === "history") return summary.history
    return summary.total
  }

  const timingColor = (status: CalvingTimingStatus) => {
    if (status === "overdue") return colors.error
    if (status === "today" || status === "soon") return colors.palette.accent500
    if (status === "complete") return colors.palette.primary500
    return colors.textDim
  }

  const handleAnimalSelected = (animal: Animal | null) => {
    if (!animal) return
    navigation.navigate("BreedingRecordForm", { animalId: animal.id })
  }

  const renderRecord = ({ item }: { item: BreedingListItem }) => {
    const timing = getCalvingTiming(item, today)
    const tone = timingColor(timing.status)
    const isPending = item.outcome === "pending"

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open breeding records for ${item.animalName}`}
        style={[themed($recordCard), { borderLeftColor: tone }]}
        onPress={() =>
          navigation.navigate("AnimalDetail", {
            animalId: item.record.animalId,
            initialTab: "breeding",
          })
        }
      >
        <View style={themed($recordHeader)}>
          <View style={themed($animalIcon)}>
            <MaterialCommunityIcons name="cow" size={22} color={colors.tint} />
          </View>
          <View style={themed($recordTitleBlock)}>
            <Text text={item.animalName} preset="bold" size="md" />
            <Text
              text={[item.animalBreed, METHOD_LABELS[item.record.method]]
                .filter(Boolean)
                .join(" • ")}
              size="xs"
              style={themed($dimText)}
            />
          </View>
          <View style={[themed($statusPill), { backgroundColor: `${tone}18` }]}>
            <Text
              text={isPending ? timing.label : OUTCOME_LABELS[item.outcome]}
              size="xxs"
              preset="bold"
              style={{ color: tone }}
            />
          </View>
        </View>

        <View style={themed($recordDetails)}>
          <View style={themed($detailItem)}>
            <MaterialCommunityIcons name="calendar-heart" size={16} color={colors.textDim} />
            <Text
              text={`Bred ${format(item.breedingDate, "dd MMM yyyy")}`}
              size="xs"
              style={themed($dimText)}
            />
          </View>
          {item.expectedCalvingDate && (
            <View style={themed($detailItem)}>
              <MaterialCommunityIcons name="calendar-clock" size={16} color={tone} />
              <Text
                text={`Expected ${format(item.expectedCalvingDate, "dd MMM yyyy")}`}
                size="xs"
                style={{ color: tone }}
              />
            </View>
          )}
          {item.bullName && (
            <View style={themed($detailItem)}>
              <MaterialCommunityIcons name="gender-male" size={16} color={colors.textDim} />
              <Text text={`Bull: ${item.bullName}`} size="xs" style={themed($dimText)} />
            </View>
          )}
          {item.record.notes && (
            <Text
              text={item.record.notes}
              size="xs"
              numberOfLines={2}
              style={themed($recordNotes)}
            />
          )}
        </View>

        <View style={themed($openRow)}>
          <Text text="View animal breeding details" size="xxs" style={themed($openText)} />
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.tint} />
        </View>
      </Pressable>
    )
  }

  const listHeader = (
    <View>
      <View style={themed($heroCard)}>
        <View style={themed($heroText)}>
          <Text preset="subheading" text="Breeding overview" />
          <Text
            text="See pregnancies, expected calvings and breeding history in one place."
            size="xs"
            style={themed($dimText)}
          />
        </View>
        <Button
          text="Record breeding"
          preset="filled"
          onPress={() => setShowAnimalPicker(true)}
          style={themed($recordButton)}
        />
      </View>

      {summary.overdue > 0 && (
        <Pressable
          onPress={() => setFilter("attention")}
          style={themed($alertBanner)}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="alert-circle-outline" size={22} color={colors.error} />
          <View style={themed($alertText)}>
            <Text
              text={`${summary.overdue} expected calving${summary.overdue === 1 ? "" : "s"} overdue`}
              preset="bold"
              size="sm"
            />
            <Text
              text="Tap to review animals needing attention."
              size="xs"
              style={themed($dimText)}
            />
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.error} />
        </Pressable>
      )}

      <View style={themed($statsRow)}>
        <Pressable onPress={() => setFilter("pending")} style={themed($statCard)}>
          <Text text={summary.pending.toString()} preset="heading" style={{ color: colors.tint }} />
          <Text text="Pending" size="xxs" style={themed($dimText)} />
        </Pressable>
        <Pressable onPress={() => setFilter("attention")} style={themed($statCard)}>
          <Text
            text={summary.attention.toString()}
            preset="heading"
            style={{ color: colors.palette.accent500 }}
          />
          <Text text="Due ≤ 60 days" size="xxs" style={themed($dimText)} />
        </Pressable>
        <Pressable onPress={() => setFilter("history")} style={themed($statCard)}>
          <Text
            text={summary.history.toString()}
            preset="heading"
            style={{ color: colors.palette.primary500 }}
          />
          <Text text="Completed" size="xxs" style={themed($dimText)} />
        </Pressable>
      </View>

      {listItems.length > 0 && (
        <>
          <TextField
            value={search}
            onChangeText={setSearch}
            placeholder="Search animal name or tag"
            autoCapitalize="none"
            autoCorrect={false}
            LeftAccessory={({ style }) => (
              <View style={style as ViewStyle}>
                <MaterialCommunityIcons name="magnify" size={20} color={colors.textDim} />
              </View>
            )}
            containerStyle={themed($searchField)}
          />

          <View style={themed($filterRow)}>
            {FILTERS.map((option) => {
              const selected = filter === option.key
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setFilter(option.key)}
                  style={[themed($filterChip), selected && themed($filterChipSelected)]}
                >
                  <Text
                    text={`${option.label} ${filterCount(option.key)}`}
                    size="xs"
                    style={selected ? themed($filterTextSelected) : themed($filterText)}
                  />
                </Pressable>
              )
            })}
          </View>

          <View style={themed($listHeading)}>
            <Text
              preset="subheading"
              text={
                filter === "attention"
                  ? "Needs attention"
                  : filter === "pending"
                    ? "Pending breeding"
                    : filter === "history"
                      ? "Breeding history"
                      : "All breeding records"
              }
            />
            <Text
              text={`${visibleRecords.length} record${visibleRecords.length === 1 ? "" : "s"}`}
              size="xs"
              style={themed($dimText)}
            />
          </View>
        </>
      )}
    </View>
  )

  return (
    <Screen preset="fixed" contentContainerStyle={themed($screenContent)} safeAreaEdges={["top"]}>
      <AppHeader title="Plan" />
      <PlanSwitcher selected="Breeding" />

      <FlatList
        data={visibleRecords}
        renderItem={renderRecord}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={themed($listContent)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          isLoading ? (
            <View style={themed($emptyState)}>
              <ActivityIndicator color={colors.tint} />
              <Text text="Loading breeding records…" size="sm" style={themed($dimText)} />
            </View>
          ) : (
            <View style={themed($emptyState)}>
              <View style={themed($emptyIcon)}>
                <MaterialCommunityIcons
                  name={listItems.length === 0 ? "heart-plus-outline" : "filter-outline"}
                  size={42}
                  color={colors.tint}
                />
              </View>
              <Text
                text={listItems.length === 0 ? "No breeding records yet" : "No matching records"}
                preset="subheading"
                style={themed($emptyTitle)}
              />
              <Text
                text={
                  listItems.length === 0
                    ? "Start by choosing a female and recording a breeding event."
                    : "Try another filter or clear the search."
                }
                size="sm"
                style={themed($emptyDescription)}
              />
              {listItems.length === 0 ? (
                <Button
                  text="Record first breeding"
                  preset="filled"
                  onPress={() => setShowAnimalPicker(true)}
                  style={themed($emptyButton)}
                />
              ) : (
                <Button
                  text="Show all"
                  preset="default"
                  onPress={() => {
                    setFilter("all")
                    setSearch("")
                  }}
                  style={themed($emptyButton)}
                />
              )}
            </View>
          )
        }
      />

      <AnimalPicker
        visible={showAnimalPicker}
        onClose={() => setShowAnimalPicker(false)}
        onSelect={handleAnimalSelected}
        filterSex="female"
        title="Choose female to breed"
        allowClear={false}
      />
    </Screen>
  )
}

const $screenContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.sm,
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
})

const $heroCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.md,
  marginTop: spacing.xs,
  marginBottom: spacing.sm,
  borderRadius: bentoRadii.card,
  backgroundColor: colors.palette.primary100,
})

const $heroText: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  gap: spacing.xxs,
})

const $recordButton: ThemedStyle<ViewStyle> = () => ({
  minHeight: 44,
  paddingHorizontal: 14,
})

const $alertBanner: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.sm,
  marginBottom: spacing.sm,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.error,
  backgroundColor: `${colors.error}0D`,
})

const $alertText: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $statsRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.sm,
})

const $statCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  alignItems: "center",
  paddingVertical: spacing.sm,
  borderRadius: bentoRadii.card,
  backgroundColor: colors.palette.neutral100,
})

const $searchField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
  marginBottom: spacing.sm,
})

const $filterRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
  marginBottom: spacing.md,
})

const $filterChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.background,
})

const $filterChipSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.tint,
  backgroundColor: colors.tint,
})

const $filterText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontWeight: "600",
})

const $filterTextSelected: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  fontWeight: "700",
})

const $listHeading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.sm,
})

const $recordCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.md,
  marginBottom: spacing.sm,
  borderRadius: bentoRadii.card,
  borderLeftWidth: 4,
  backgroundColor: colors.background,
  shadowColor: "#000000",
  shadowOpacity: 0.04,
  shadowRadius: 5,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
})

const $recordHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $animalIcon: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 42,
  height: 42,
  borderRadius: 21,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.primary100,
})

const $recordTitleBlock: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  gap: spacing.xxs,
})

const $statusPill: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  maxWidth: "38%",
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  borderRadius: 12,
})

const $recordDetails: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.xs,
  marginTop: spacing.sm,
  paddingLeft: 50,
})

const $detailItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $recordNotes: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontStyle: "italic",
})

const $openRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "flex-end",
  alignItems: "center",
  marginTop: spacing.sm,
  paddingTop: spacing.xs,
  borderTopWidth: 1,
  borderTopColor: colors.separator,
})

const $openText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "600",
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.xl,
  paddingHorizontal: spacing.lg,
  gap: spacing.sm,
})

const $emptyIcon: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 72,
  height: 72,
  borderRadius: 36,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.primary100,
})

const $emptyTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
  textAlign: "center",
})

const $emptyDescription: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
  lineHeight: 20,
})

const $emptyButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  minWidth: 190,
  marginTop: spacing.sm,
})
