import { useCallback } from "react"
import { View, ViewStyle, TextStyle, FlatList, Pressable } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { format } from "date-fns"

import { Screen, Text, EmptyState } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { usePendingVaccinations } from "@/hooks/useVaccinationSchedules"

export function PendingVaccinationsScreen({ navigation }: AppStackScreenProps<"PendingVaccinations">) {
  const { themed, theme } = useAppTheme()
  const { vaccinations, isLoading } = usePendingVaccinations()

  const handleVaccinationPress = useCallback((vaccination: any) => {
    // Navigate to the animal's detail screen, then to the health record form
    navigation.navigate("AnimalDetail", { animalId: vaccination.animalId })
  }, [navigation])

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
        style={[themed($vaccinationCard), { borderLeftColor: urgencyColor, borderLeftWidth: 4 }]}
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
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color={urgencyColor}
            />
            <Text
              text={isOverdue ? `${Math.abs(item.daysUntilDue)} days overdue` : `${item.daysUntilDue} days until due`}
              size="xs"
              style={[themed($detailText), { color: urgencyColor, fontWeight: "600" }]}
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
          <Text
            text="Tap to administer"
            size="xs"
            style={themed($footerText)}
          />
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
        <View style={{ width: 40 }} />
      </View>

      {vaccinations.length > 0 ? (
        <>
          <Text
            text={`${vaccinations.length} vaccination${vaccinations.length === 1 ? '' : 's'} pending`}
            size="sm"
            style={themed($countText)}
          />
          <FlatList
            data={vaccinations}
            renderItem={renderVaccination}
            keyExtractor={(item) => item.id}
            style={themed($list)}
            contentContainerStyle={themed($listContent)}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <EmptyState
          icon="check-circle"
          heading="All caught up!"
          description="No pending vaccinations at this time."
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

const $vaccinationCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.sm,
  borderWidth: 1,
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
