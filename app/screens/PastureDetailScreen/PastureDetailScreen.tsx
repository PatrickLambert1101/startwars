import React from "react"
import { View, ViewStyle, TextStyle, ScrollView, Pressable, FlatList, Alert } from "react-native"
import { Screen, Text, Button, Icon } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { AppStackScreenProps } from "@/navigators"
import { usePasture, usePastureStats, usePastureAnimals, usePastureMovements, usePastureActions } from "@/hooks/usePastures"
import { Animal, PastureMovement } from "@/db/models"
import { formatDate } from "@/utils/formatDate"

interface PastureDetailScreenProps extends AppStackScreenProps<"PastureDetail"> {}

export function PastureDetailScreen({ navigation, route }: PastureDetailScreenProps) {
  const { pastureId } = route.params
  const { pasture, isLoading } = usePasture(pastureId)
  const stats = usePastureStats(pastureId)
  const { animals } = usePastureAnimals(pastureId)
  const { movements } = usePastureMovements(pastureId)
  const { moveAnimalsOut, moveAllAnimalsOut, togglePastureActive } = usePastureActions()
  const { themed, theme: { colors } } = useAppTheme()

  const handleEdit = () => {
    navigation.navigate("PastureForm", { pastureId })
  }

  const handleScanIn = () => {
    navigation.navigate("MovementForm", { pastureId, movementType: "move_in" })
  }

  const handleScanOut = () => {
    navigation.navigate("MovementForm", { pastureId, movementType: "move_out" })
  }

  const handleMoveAnimalOut = async (animal: Animal) => {
    try {
      await moveAnimalsOut(pastureId, [animal.id])
    } catch (error) {
      console.error("Failed to move animal out:", error)
      Alert.alert("Error", "Failed to move animal out")
    }
  }

  const handleMoveAllOut = async () => {
    if (animals.length === 0) return

    Alert.alert(
      "Move All Animals Out?",
      `This will move all ${animals.length} animals out of this pasture.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Move Out",
          style: "destructive",
          onPress: async () => {
            try {
              await moveAllAnimalsOut(pastureId)
            } catch (error) {
              console.error("Failed to move animals out:", error)
              Alert.alert("Error", "Failed to move animals out")
            }
          },
        },
      ],
    )
  }

  const handleToggleActive = async () => {
    try {
      await togglePastureActive(pastureId)
    } catch (error) {
      console.error("Failed to toggle pasture:", error)
      Alert.alert("Error", "Failed to update pasture")
    }
  }

  if (isLoading || !pasture) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
        <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
          <Icon icon="back" size={24} />
        </Pressable>
        <Text>Loading...</Text>
      </Screen>
    )
  }

  const statusColor =
    pasture.statusColor === "green"
      ? colors.palette.success500
      : pasture.statusColor === "yellow"
      ? colors.palette.warning500
      : colors.palette.angry500

  const renderAnimal = ({ item: animal }: { item: Animal }) => (
    <View style={themed($animalRow)}>
      <View style={themed($animalInfo)}>
        <Text style={themed($animalTag)}>{animal.visualTag || animal.rfidTag}</Text>
        <Text style={themed($animalDetails)}>
          {animal.breed} • {animal.sexLabel}
        </Text>
      </View>
      <Pressable onPress={() => handleMoveAnimalOut(animal)} style={themed($moveOutButton)}>
        <Text style={themed($moveOutButtonText)}>⬆ Out</Text>
      </Pressable>
    </View>
  )

  const renderMovement = ({ item: movement }: { item: PastureMovement }) => (
    <View style={themed($movementRow)}>
      <View style={themed($movementIcon)}>
        <Text style={themed($movementIconText)}>
          {movement.movementType === "move_in" ? "⬇" : "⬆"}
        </Text>
      </View>
      <View style={themed($movementInfo)}>
        <Text style={themed($movementText)}>
          Animal {movement.animalId.slice(0, 8)} {movement.movementType === "move_in" ? "moved in" : "moved out"}
        </Text>
        <Text style={themed($movementDate)}>{formatDate(movement.movementDate, "PPp")}</Text>
      </View>
    </View>
  )

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <View style={themed($header)}>
        <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
          <Icon icon="back" size={24} />
        </Pressable>
        <View style={themed($titleRow)}>
          <View style={themed($titleContainer)}>
            <Text preset="heading" text={pasture.name} style={themed($title)} />
            <Text style={themed($code)}>({pasture.code})</Text>
          </View>
          {!pasture.isActive && (
            <View style={themed($inactiveBadge)}>
              <Text style={themed($inactiveBadgeText)}>Inactive</Text>
            </View>
          )}
          <View style={[themed($statusBadge), { backgroundColor: statusColor }]}>
            <View style={themed($statusDot)} />
          </View>
        </View>
        <Pressable onPress={handleEdit} style={themed($editButton)}>
          <Icon icon="settings" size={24} />
        </Pressable>
      </View>

      <ScrollView style={themed($content)} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={themed($statsRow)}>
          <View style={themed($statCard)}>
            <Text style={themed($statValue)}>
              {pasture.currentAnimalCount}
              {pasture.maxCapacity && `/${pasture.maxCapacity}`}
            </Text>
            <Text style={themed($statLabel)}>Occupancy</Text>
          </View>
          <View style={themed($statCard)}>
            <Text style={themed($statValue)}>{pasture.daysGrazed}</Text>
            <Text style={themed($statLabel)}>Days Grazed</Text>
          </View>
          <View style={themed($statCard)}>
            <Text style={themed($statValue)}>{stats.totalMovementsIn + stats.totalMovementsOut}</Text>
            <Text style={themed($statLabel)}>Movements</Text>
          </View>
        </View>

        {/* Current Animals */}
        {animals.length > 0 && (
          <View style={themed($section)}>
            <View style={themed($sectionHeader)}>
              <Text style={themed($sectionTitle)}>Current Animals ({animals.length})</Text>
              <Button
                text="Move All Out"
                preset="default"
                onPress={handleMoveAllOut}
                style={themed($moveAllButton)}
              />
            </View>
            <FlatList
              data={animals}
              renderItem={renderAnimal}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Movement History */}
        {movements.length > 0 && (
          <View style={themed($section)}>
            <Text style={themed($sectionTitle)}>Movement History</Text>
            <FlatList
              data={movements.slice(0, 10)}
              renderItem={renderMovement}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
            {movements.length > 10 && (
              <Text style={themed($moreText)}>+ {movements.length - 10} more movements</Text>
            )}
          </View>
        )}

        {/* Pasture Details */}
        <View style={themed($section)}>
          <Text style={themed($sectionTitle)}>Pasture Details</Text>

          {pasture.sizeHectares && (
            <View style={themed($detailRow)}>
              <Text style={themed($detailLabel)}>Size</Text>
              <Text style={themed($detailValue)}>{pasture.sizeHectares} hectares</Text>
            </View>
          )}

          {pasture.forageType && (
            <View style={themed($detailRow)}>
              <Text style={themed($detailLabel)}>Forage Type</Text>
              <Text style={themed($detailValue)}>{pasture.forageType}</Text>
            </View>
          )}

          {pasture.waterSource && (
            <View style={themed($detailRow)}>
              <Text style={themed($detailLabel)}>Water Source</Text>
              <Text style={themed($detailValue)}>{pasture.waterSource}</Text>
            </View>
          )}

          {pasture.fenceType && (
            <View style={themed($detailRow)}>
              <Text style={themed($detailLabel)}>Fence Type</Text>
              <Text style={themed($detailValue)}>{pasture.fenceType}</Text>
            </View>
          )}

          {(pasture.hasSaltBlocks || pasture.hasMineralFeeders) && (
            <View style={themed($detailRow)}>
              <Text style={themed($detailLabel)}>Supplements</Text>
              <Text style={themed($detailValue)}>
                {[
                  pasture.hasSaltBlocks && "Salt Blocks",
                  pasture.hasMineralFeeders && "Mineral Feeders"
                ].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}

          {pasture.maxCapacity && (
            <View style={themed($detailRow)}>
              <Text style={themed($detailLabel)}>Max Capacity</Text>
              <Text style={themed($detailValue)}>{pasture.maxCapacity} animals</Text>
            </View>
          )}

          {pasture.targetGrazingDays && (
            <View style={themed($detailRow)}>
              <Text style={themed($detailLabel)}>Target Grazing</Text>
              <Text style={themed($detailValue)}>{pasture.targetGrazingDays} days</Text>
            </View>
          )}

          {pasture.targetRestDays && (
            <View style={themed($detailRow)}>
              <Text style={themed($detailLabel)}>Target Rest</Text>
              <Text style={themed($detailValue)}>{pasture.targetRestDays} days</Text>
            </View>
          )}

          {pasture.locationNotes && (
            <View style={themed($detailRow)}>
              <Text style={themed($detailLabel)}>Location</Text>
              <Text style={themed($detailValue)}>{pasture.locationNotes}</Text>
            </View>
          )}

          {pasture.notes && (
            <View style={themed($detailRow)}>
              <Text style={themed($detailLabel)}>Notes</Text>
              <Text style={themed($detailValue)}>{pasture.notes}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={themed($actionsSection)}>
          <Button
            text="📷 Scan Animals In"
            preset="filled"
            onPress={handleScanIn}
            style={themed($actionButton)}
          />
          <Button
            text="📷 Scan Animals Out"
            preset="default"
            onPress={handleScanOut}
            style={themed($actionButton)}
          />
          <Button
            text={pasture.isActive ? "Deactivate Pasture" : "Activate Pasture"}
            preset="default"
            onPress={handleToggleActive}
            style={themed($actionButton)}
          />
        </View>
      </ScrollView>
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

const $titleRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  marginHorizontal: spacing.sm,
})

const $titleContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $title: ThemedStyle<TextStyle> = () => ({
  flex: 0,
})

const $code: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.palette.neutral600,
  marginTop: 2,
})

const $inactiveBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral400,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 4,
})

const $inactiveBadgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontSize: 12,
  fontWeight: "600",
})

const $statusBadge: ThemedStyle<ViewStyle> = () => ({
  width: 24,
  height: 24,
  borderRadius: 12,
  justifyContent: "center",
  alignItems: "center",
})

const $statusDot: ThemedStyle<ViewStyle> = () => ({
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: "rgba(255, 255, 255, 0.9)",
})

const $editButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.xs,
  borderRadius: 8,
  backgroundColor: colors.palette.neutral200,
})

const $content: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $statsRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  marginBottom: spacing.lg,
})

const $statCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
})

const $statValue: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 24,
  fontWeight: "700",
  color: colors.palette.primary500,
  marginBottom: spacing.xxs,
})

const $statLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.palette.neutral600,
  textAlign: "center",
})

const $section: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  marginBottom: spacing.md,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
})

const $sectionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.sm,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
  marginBottom: spacing.sm,
})

const $moveAllButton: ThemedStyle<ViewStyle> = () => ({
  minHeight: 32,
  paddingVertical: 4,
  paddingHorizontal: 12,
})

const $animalRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral200,
})

const $animalInfo: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $animalTag: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
})

const $animalDetails: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.palette.neutral600,
  marginTop: 2,
})

const $moveOutButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: 6,
})

const $moveOutButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  fontWeight: "600",
  color: colors.palette.neutral700,
})

const $movementRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral200,
  gap: spacing.sm,
})

const $movementIcon: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.palette.neutral200,
  justifyContent: "center",
  alignItems: "center",
})

const $movementIconText: ThemedStyle<TextStyle> = () => ({
  fontSize: 16,
})

const $movementInfo: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $movementText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.text,
})

const $movementDate: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.palette.neutral600,
  marginTop: 2,
})

const $moreText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 12,
  color: colors.palette.neutral600,
  textAlign: "center",
  marginTop: spacing.xs,
})

const $detailRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  paddingVertical: spacing.xs,
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral200,
  marginBottom: spacing.xs,
})

const $detailLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "600",
  color: colors.palette.neutral600,
  flex: 1,
})

const $detailValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.text,
  flex: 2,
  textAlign: "right",
})

const $actionsSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.md,
  marginTop: spacing.lg,
  marginBottom: spacing.xxxl,
})

const $actionButton: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
})
