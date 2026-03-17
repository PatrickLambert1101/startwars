import { FC } from "react"
import { View, Pressable, FlatList, ViewStyle, TextStyle } from "react-native"
import { format } from "date-fns"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Screen, Text, AppHeader } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { MainTabScreenProps } from "@/navigators/navigationTypes"
import { useAllBreedingRecords } from "@/hooks/useRecords"

export const BreedingScreen: FC<MainTabScreenProps<"Breeding">> = ({ navigation }) => {
  const { themed, theme: { colors } } = useAppTheme()
  const { records: allBreedingRecords, isLoading } = useAllBreedingRecords()

  // Sort by most recent first
  const sortedRecords = [...allBreedingRecords].sort((a, b) =>
    b.breedingDate.getTime() - a.breedingDate.getTime()
  )

  const upcomingCalvings = sortedRecords
    .filter(r => r.outcome === "pending" && r.expectedCalvingDate)
    .sort((a, b) => a.expectedCalvingDate!.getTime() - b.expectedCalvingDate!.getTime())

  const formatDate = (d: Date | null) => d ? format(d, "dd MMM yyyy") : "-"

  const renderBreedingCard = ({ item }: { item: any }) => (
    <View style={themed($card)}>
      <View style={themed($cardHeader)}>
        <View style={{ flex: 1 }}>
          <Text text={item.animal?.displayName || "Unknown Animal"} preset="bold" />
          <Text
            text={`${item.method} | ${item.outcome}`}
            size="xs"
            style={themed($dimText)}
          />
        </View>
        <MaterialCommunityIcons
          name={item.outcome === "pending" ? "clock-outline" : "check-circle"}
          size={24}
          color={item.outcome === "pending" ? colors.palette.accent500 : colors.palette.primary500}
        />
      </View>

      <View style={themed($cardContent)}>
        <View style={themed($infoRow)}>
          <MaterialCommunityIcons name="calendar" size={16} color={colors.textDim} />
          <Text text={`Bred: ${formatDate(item.breedingDate)}`} size="sm" />
        </View>

        {item.expectedCalvingDate && (
          <View style={themed($infoRow)}>
            <MaterialCommunityIcons name="calendar-clock" size={16} color={colors.textDim} />
            <Text text={`Expected: ${formatDate(item.expectedCalvingDate)}`} size="sm" />
          </View>
        )}

        {item.bullId && (
          <View style={themed($infoRow)}>
            <MaterialCommunityIcons name="gender-male" size={16} color={colors.tint} />
            <Text text="Bull recorded" size="xs" style={themed($dimText)} />
          </View>
        )}
      </View>

      {item.notes && (
        <Text text={item.notes} size="xs" style={themed($notes)} />
      )}
    </View>
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
    <Screen preset="fixed" safeAreaEdges={["top"]}>
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

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
  paddingBottom: spacing.xxl,
})

const $statsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  padding: spacing.md,
  paddingBottom: 0,
})

const $statCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.border,
})

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.sm,
  borderWidth: 1,
  borderColor: colors.border,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
})

const $cardHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  marginBottom: spacing.sm,
  gap: spacing.sm,
})

const $cardContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.xs,
})

const $infoRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $notes: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.sm,
  paddingTop: spacing.sm,
  borderTopWidth: 1,
  borderTopColor: colors.separator,
  color: colors.textDim,
  fontStyle: "italic",
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.xl,
  marginTop: spacing.xxxl,
})

const $emptyText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  marginBottom: spacing.sm,
  textAlign: "center",
})
