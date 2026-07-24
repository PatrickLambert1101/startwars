import React, { useMemo } from "react"
import { View, ViewStyle, TextStyle, FlatList, Pressable, Image, ImageStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { Screen, Text, Button, AppHeader } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { usePastures } from "@/hooks/usePastures"
import { Pasture } from "@/db/models"
import type { MainTabScreenProps } from "@/navigators"

export const PasturesScreen: React.FC<MainTabScreenProps<"Pastures">> = ({ navigation }) => {
  const { t } = useTranslation()
  const { themed, theme: { colors } } = useAppTheme()
  const { pastures, isLoading } = usePastures()

  const stats = useMemo(() => {
    const totalAnimals = pastures.reduce((sum, p) => sum + p.currentAnimalCount, 0)
    const occupied = pastures.filter((p) => p.isOccupied).length
    const needsRotation = pastures.filter((p) => p.shouldRotate).length

    return { totalAnimals, occupied, needsRotation }
  }, [pastures])

  // Pastures are available to everyone — no paywall gate. (Previously this
  // screen showed an upgrade wall for non-premium plans.)

  const handleCreatePasture = () => {
    // Show wizard for first pasture, regular form after that
    if (pastures.length === 0) {
      navigation.navigate("PastureWizard")
    } else {
      navigation.navigate("PastureForm", {})
    }
  }

  const handlePressPassture = (pasture: Pasture) => {
    navigation.navigate("PastureDetail", { pastureId: pasture.id })
  }

  const renderPastureCard = ({ item: pasture }: { item: Pasture }) => {
    const statusColor = pasture.statusColor === "green"
      ? colors.palette.success500
      : pasture.statusColor === "yellow"
      ? colors.palette.warning500
      : colors.palette.angry500

    return (
      <Pressable onPress={() => handlePressPassture(pasture)} style={themed($card)}>
        <View style={themed($cardHeader)}>
          <View style={themed($cardTitleRow)}>
            <Text style={themed($cardTitle)}>{pasture.name}</Text>
            <View style={[themed($statusBadge), { backgroundColor: statusColor }]}>
              <View style={themed($statusDot)} />
            </View>
          </View>
          <Text style={themed($cardCode)}>{pasture.code}</Text>
        </View>

        <View style={themed($cardStats)}>
          <View style={themed($cardStat)}>
            <Text style={themed($statValue)}>
              {pasture.currentAnimalCount}
              {pasture.maxCapacity && ` / ${pasture.maxCapacity}`}
            </Text>
            <Text style={themed($statLabel)}>{t("pasturesScreen.card.animals")}</Text>
          </View>
          {pasture.isOccupied && (
            <View style={themed($cardStat)}>
              <Text style={themed($statValue)}>{pasture.daysGrazed}</Text>
              <Text style={themed($statLabel)}>{t("pasturesScreen.card.daysGrazed")}</Text>
            </View>
          )}
        </View>

        {pasture.isOccupied && pasture.targetGrazingDays && (
          <View style={themed($progressBarContainer)}>
            <View style={themed($progressBarBg)}>
              <View
                style={[
                  themed($progressBarFill),
                  {
                    width: `${pasture.grazingProgress}%`,
                    backgroundColor: statusColor,
                  }
                ]}
              />
            </View>
            <Text style={themed($progressText)}>
              {t("pasturesScreen.card.daysUntilRotation", { days: pasture.targetGrazingDays - pasture.daysGrazed })}
            </Text>
          </View>
        )}

        <View style={themed($cardDetails)}>
          {pasture.forageType && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MaterialCommunityIcons name="grass" size={14} color={colors.textDim} />
              <Text style={themed($cardDetail)}>{pasture.forageType}</Text>
            </View>
          )}
          {pasture.waterSource && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MaterialCommunityIcons name="water" size={14} color={colors.textDim} />
              <Text style={themed($cardDetail)}>{pasture.waterSource}</Text>
            </View>
          )}
          {pasture.sizeHectares && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MaterialCommunityIcons name="ruler-square" size={14} color={colors.textDim} />
              <Text style={themed($cardDetail)}>{pasture.sizeHectares} ha</Text>
            </View>
          )}
        </View>
      </Pressable>
    )
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <AppHeader title={t("pasturesScreen.title")} showSettings={true} />
      <View style={themed($header)}>
        <Button text={t("pasturesScreen.createButton")} onPress={handleCreatePasture} style={themed($createButton)} />
      </View>

      {/* Stats Summary */}
      <View style={themed($statsRow)}>
        <View style={themed($statCard)}>
          <Text style={themed($statCardValue)}>{pastures.length}</Text>
          <Text style={themed($statCardLabel)}>{t("pasturesScreen.stats.pastures")}</Text>
        </View>
        <View style={themed($statCard)}>
          <Text style={themed($statCardValue)}>{stats.totalAnimals}</Text>
          <Text style={themed($statCardLabel)}>{t("pasturesScreen.stats.animals")}</Text>
        </View>
        <View style={themed($statCard)}>
          <Text style={themed($statCardValue)}>{stats.occupied}</Text>
          <Text style={themed($statCardLabel)}>{t("pasturesScreen.stats.occupied")}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={themed($emptyContainer)}>
          <Text>{t("common.loading")}</Text>
        </View>
      ) : pastures.length === 0 ? (
        <View style={themed($emptyContainer)}>
          <Image
            source={require("@/assets/icons/herdtrackr/pasture.png")}
            style={$emptyImage}
            resizeMode="contain"
          />
          <Text style={themed($emptyTitle)}>{t("pasturesScreen.empty.title")}</Text>
          <Text style={themed($emptyDescription)}>
            {t("pasturesScreen.empty.description")}
          </Text>
          <Button text={t("pasturesScreen.empty.button")} preset="filled" onPress={handleCreatePasture} style={themed($emptyButton)} />
        </View>
      ) : (
        <FlatList
          data={pastures}
          renderItem={renderPastureCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={themed($listContent)}
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
  marginBottom: spacing.sm,
})

const $headerTitle: ThemedStyle<TextStyle> = () => ({
  flex: 1,
})

const $createButton: ThemedStyle<ViewStyle> = () => ({
  minHeight: 36,
  paddingVertical: 6,
  paddingHorizontal: 16,
})

const $statsRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  marginBottom: spacing.md,
})

const $statCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.sm,
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
})

const $statCardValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 24,
  fontWeight: "700",
  color: colors.palette.primary500,
})

const $statCardLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 11,
  color: colors.palette.neutral600,
  marginTop: 2,
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxxl,
})

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.sm,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
})

const $cardHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $cardTitleRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.xxs,
})

const $cardTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  fontWeight: "600",
  color: colors.text,
  flex: 1,
})

const $cardCode: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.palette.neutral600,
  fontWeight: "500",
})

const $statusBadge: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 24,
  height: 24,
  borderRadius: 12,
  justifyContent: "center",
  alignItems: "center",
  marginLeft: spacing.xs,
})

const $statusDot: ThemedStyle<ViewStyle> = () => ({
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: "rgba(255, 255, 255, 0.9)",
})

const $cardStats: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.md,
  marginBottom: spacing.sm,
})

const $cardStat: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $statValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 20,
  fontWeight: "700",
  color: colors.text,
})

const $statLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.palette.neutral600,
})

const $progressBarContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $progressBarBg: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  height: 6,
  backgroundColor: colors.palette.neutral200,
  borderRadius: 3,
  overflow: "hidden",
  marginBottom: spacing.xxs,
})

const $progressBarFill: ThemedStyle<ViewStyle> = () => ({
  height: "100%",
  borderRadius: 3,
})

const $progressText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 11,
  color: colors.palette.neutral600,
})

const $cardDetails: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
})

const $cardDetail: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.palette.neutral600,
})

const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: spacing.xl,
  paddingVertical: spacing.xxxl,
})

const $emptyImage: ImageStyle = {
  width: 96,
  height: 96,
}

const $emptyTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 20,
  fontWeight: "600",
  color: colors.text,
  marginTop: spacing.md,
  marginBottom: spacing.xs,
})

const $emptyDescription: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.textDim,
  textAlign: "center",
  lineHeight: 20,
  marginBottom: spacing.lg,
})

const $emptyButton: ThemedStyle<ViewStyle> = () => ({
  minWidth: 200,
})
