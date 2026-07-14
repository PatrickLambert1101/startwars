import { FC, useState, useEffect } from "react"
import { View, Pressable, FlatList, ViewStyle, TextStyle } from "react-native"
import { format } from "date-fns"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Screen, Text, AppHeader } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { MainTabScreenProps } from "@/navigators/navigationTypes"
import { useAllBreedingRecords } from "@/hooks/useRecords"
import type { BreedingRecord } from "@/db/models/BreedingRecord"

interface BreedingRecordWithAnimal extends BreedingRecord {
  animalName?: string
}

export const BreedingScreen: FC<MainTabScreenProps<"Breeding">> = ({ navigation }) => {
  const { themed, theme: { colors } } = useAppTheme()
  const { records: allBreedingRecords, isLoading } = useAllBreedingRecords()
  const [recordsWithNames, setRecordsWithNames] = useState<BreedingRecordWithAnimal[]>([])

  // Load animal names for each breeding record
  useEffect(() => {
    const loadAnimalNames = async () => {
      const withNames: BreedingRecordWithAnimal[] = await Promise.all(
        allBreedingRecords.map(async (record) => {
          try {
            const animal = await record.animal.fetch()
            return Object.assign(record, {
              animalName: animal?.displayName || "Unknown Animal",
            })
          } catch {
            return Object.assign(record, {
              animalName: "Unknown Animal",
            })
          }
        })
      )
      setRecordsWithNames(withNames)
    }

    if (allBreedingRecords.length > 0) {
      loadAnimalNames()
    } else {
      setRecordsWithNames([])
    }
  }, [allBreedingRecords])

  // Sort by most recent first - add null check for safety
  const sortedRecords = [...recordsWithNames].sort((a, b) => {
    if (!b.breedingDate || !a.breedingDate) return 0
    return b.breedingDate.getTime() - a.breedingDate.getTime()
  })

  const upcomingCalvings = sortedRecords
    .filter(r => r.outcome === "pending" && r.expectedCalvingDate)
    .sort((a, b) => a.expectedCalvingDate!.getTime() - b.expectedCalvingDate!.getTime())

  const formatDate = (d: Date | null) => d ? format(d, "dd MMM yyyy") : "-"

  const renderBreedingCard = ({ item }: { item: BreedingRecordWithAnimal }) => (
    <Pressable
      style={themed($card)}
      onPress={() => {
        // Navigate to the animal detail screen, Breeding tab, with the record ID
        navigation.navigate("AnimalDetail", {
          animalId: item.animalId,
          initialTab: "breeding",
          breedingRecordId: item.id,
        })
      }}
    >
      <View style={themed($cardRow)}>
        {/* Left: Status Icon */}
        <View style={themed($statusIcon)}>
          <MaterialCommunityIcons
            name={item.outcome === "pending" ? "clock-outline" : "check-circle"}
            size={20}
            color={item.outcome === "pending" ? colors.palette.accent500 : colors.palette.primary500}
          />
        </View>

        {/* Center: Animal name and key details */}
        <View style={themed($cardMain)}>
          <Text text={item.animalName || "Unknown Animal"} preset="bold" size="sm" />
          <Text
            text={`${formatDate(item.breedingDate)} • ${item.method}`}
            size="xs"
            style={themed($dimText)}
          />
          {item.expectedCalvingDate && item.outcome === "pending" && (
            <Text
              text={`Due: ${formatDate(item.expectedCalvingDate)}`}
              size="xs"
              style={{ color: colors.palette.accent500 }}
            />
          )}
        </View>

        {/* Right: Chevron */}
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textDim} />
      </View>
    </Pressable>
  )

  const renderEmptyState = () => (
    <View style={themed($emptyState)}>
      <MaterialCommunityIcons name="heart-outline" size={64} color={colors.palette.neutral300} />
      <Text text="No Breeding Records" preset="subheading" style={themed($emptyText)} />
      <Text
        text="Breeding records will appear here when you record breeding events"
        size="sm"
        style={themed($dimText)}
      />
    </View>
  )

  return (
    <Screen preset="fixed" contentContainerStyle={themed($screenContent)} safeAreaEdges={["top"]}>
      <AppHeader title="Breeding" />

      {/* Quick Stats */}
      {sortedRecords.length > 0 && (
        <View style={themed($statsContainer)}>
          <View style={themed($statCard)}>
            <Text text={sortedRecords.length.toString()} preset="heading" style={{ color: colors.tint }} />
            <Text text="Total Records" size="xs" style={themed($dimText)} />
          </View>
          <View style={themed($statCard)}>
            <Text text={upcomingCalvings.length.toString()} preset="heading" style={{ color: colors.palette.accent500 }} />
            <Text text="Upcoming" size="xs" style={themed($dimText)} />
          </View>
        </View>
      )}

      <FlatList
        data={sortedRecords}
        renderItem={renderBreedingCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={themed($listContent)}
        ListEmptyComponent={renderEmptyState}
        refreshing={isLoading}
      />
    </Screen>
  )
}

// ────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────

const $screenContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.sm,
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.sm,
  paddingBottom: spacing.lg,
})

const $statsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  paddingVertical: spacing.sm,
  paddingBottom: 0,
})

const $statCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.sm,
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.border,
})

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 6,
  padding: spacing.xs,
  marginBottom: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border,
})

const $cardRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $statusIcon: ThemedStyle<ViewStyle> = () => ({
  width: 24,
  alignItems: "center",
  justifyContent: "center",
})

const $cardMain: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  gap: spacing.xxs,
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.md,
  marginTop: spacing.xl,
})

const $emptyText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  marginBottom: spacing.sm,
  textAlign: "center",
})
