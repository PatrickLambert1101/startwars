import { useCallback, useState } from "react"
import { Alert, Pressable, TextStyle, View, ViewStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"

import { AppHeader, Screen, Text } from "@/components"
import { BentoPageIntro } from "@/components/BentoPageChrome"
import { useDatabase } from "@/context/DatabaseContext"
import type { DataImportBatch } from "@/db/models"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { getDataImportBatches, importTypeLabel, undoDataImport } from "@/services/dataImport"
import { bentoRadii } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface DataImportsScreenProps extends AppStackScreenProps<"DataImports"> {}

function importedRecordLabel(type: DataImportBatch["importType"], count: number): string {
  if (type === "animals") return count === 1 ? "animal" : "animals"
  if (type === "treatments") return count === 1 ? "treatment record" : "treatment records"
  return count === 1 ? "grazing period" : "grazing periods"
}

export function DataImportsScreen({ navigation }: DataImportsScreenProps) {
  const { currentOrg } = useDatabase()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const [batches, setBatches] = useState<DataImportBatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [undoingId, setUndoingId] = useState<string | null>(null)

  const loadBatches = useCallback(async () => {
    if (!currentOrg) {
      setBatches([])
      setIsLoading(false)
      return
    }
    try {
      setBatches(await getDataImportBatches(currentOrg.id))
    } finally {
      setIsLoading(false)
    }
  }, [currentOrg])

  useFocusEffect(
    useCallback(() => {
      void loadBatches()
    }, [loadBatches]),
  )

  const confirmUndo = (batch: DataImportBatch) => {
    Alert.alert(
      "Undo this import?",
      `${batch.importedRows} imported ${importedRecordLabel(batch.importType, batch.importedRows)} will be removed. Records added or edited separately are not affected.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Undo import",
          style: "destructive",
          onPress: async () => {
            setUndoingId(batch.id)
            try {
              await undoDataImport(batch.id)
              await loadBatches()
            } catch (error) {
              console.error("[DataImport] Could not undo import:", error)
              Alert.alert("Could not undo import", "Please try again.")
            } finally {
              setUndoingId(null)
            }
          },
        },
      ],
    )
  }

  return (
    <Screen preset="scroll" safeAreaEdges={["bottom"]} contentContainerStyle={themed($container)}>
      <AppHeader title="Data imports" showBack showSettings={false} />
      <BentoPageIntro
        title="Bring your records together"
        description="Import records and review your import history."
        icon="tray-arrow-down"
      />

      <View style={themed($content)}>
        <Text style={themed($intro)}>
          Bring existing CSV or Excel records into HerdTrackr. Files are read on this device and
          reviewed before anything is saved.
        </Text>

        <Pressable
          style={themed($importCard)}
          onPress={() => navigation.navigate("DataImport", { importType: "animals" })}
        >
          <View style={themed($iconCircle)}>
            <MaterialCommunityIcons name="cow" size={27} color={colors.tint} />
          </View>
          <View style={themed($cardText)}>
            <Text preset="subheading" size="md">
              Import animals
            </Text>
            <Text size="xs" style={themed($muted)}>
              Add cows or other livestock with tags, breed, sex, birth dates and parent links.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={26} color={colors.textDim} />
        </Pressable>

        <Pressable
          style={themed($importCard)}
          onPress={() => navigation.navigate("DataImport", { importType: "treatments" })}
        >
          <View style={themed($iconCircle)}>
            <MaterialCommunityIcons name="medical-bag" size={27} color={colors.tint} />
          </View>
          <View style={themed($cardText)}>
            <Text preset="subheading" size="md">
              Import treatment records
            </Text>
            <Text size="xs" style={themed($muted)}>
              Match animals by RFID or visual tag, validate dates and block duplicates.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={26} color={colors.textDim} />
        </Pressable>

        <Pressable
          style={themed($importCard)}
          onPress={() => navigation.navigate("DataImport", { importType: "grazing" })}
        >
          <View style={themed($iconCircle)}>
            <MaterialCommunityIcons name="grass" size={27} color={colors.tint} />
          </View>
          <View style={themed($cardText)}>
            <Text preset="subheading" size="md">
              Import grazing history
            </Text>
            <Text size="xs" style={themed($muted)}>
              Import pasture visits, herd groups, animal counts and grazing dates.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={26} color={colors.textDim} />
        </Pressable>

        <Pressable
          style={themed($importCard)}
          onPress={() => navigation.navigate("PastureKmlImport")}
        >
          <View style={themed($iconCircle)}>
            <MaterialCommunityIcons name="map-outline" size={27} color={colors.tint} />
          </View>
          <View style={themed($cardText)}>
            <Text preset="subheading" size="md">
              Import pasture map
            </Text>
            <Text size="xs" style={themed($muted)}>
              Create or update multiple named pastures from KML/KMZ polygons.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={26} color={colors.textDim} />
        </Pressable>

        <Text preset="formLabel" style={themed($sectionTitle)}>
          RECENT IMPORTS
        </Text>

        {isLoading ? (
          <Text size="xs" style={themed($muted)}>
            Loading import history…
          </Text>
        ) : batches.length === 0 ? (
          <View style={themed($emptyCard)}>
            <MaterialCommunityIcons name="file-upload-outline" size={30} color={colors.textDim} />
            <Text size="xs" style={themed($muted)}>
              No files have been imported yet.
            </Text>
          </View>
        ) : (
          batches.map((batch) => (
            <View key={batch.id} style={themed($historyCard)}>
              <View style={themed($historyTopRow)}>
                <View style={themed($cardText)}>
                  <Text weight="semiBold" numberOfLines={1}>
                    {batch.fileName}
                  </Text>
                  <Text size="xxs" style={themed($muted)}>
                    {importTypeLabel(batch.importType)} • {batch.importedAt.toLocaleDateString()}
                  </Text>
                </View>
                <View
                  style={[themed($statusBadge), batch.status === "undone" && themed($undoneBadge)]}
                >
                  <Text size="xxs" style={themed($statusText)}>
                    {batch.status === "undone" ? "Undone" : "Imported"}
                  </Text>
                </View>
              </View>
              <Text size="xs" style={themed($muted)}>
                {batch.importedRows} imported
                {batch.skippedRows > 0 ? ` • ${batch.skippedRows} skipped` : ""}
                {batch.sheetName ? ` • ${batch.sheetName}` : ""}
              </Text>
              {batch.status === "completed" && (
                <Pressable
                  style={themed($undoButton)}
                  disabled={undoingId === batch.id}
                  onPress={() => confirmUndo(batch)}
                >
                  <Text size="xs" style={themed($undoText)}>
                    {undoingId === batch.id ? "Undoing…" : "Undo this import"}
                  </Text>
                </Pressable>
              )}
            </View>
          ))
        )}
      </View>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  flexGrow: 1,
})

const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  paddingBottom: spacing.xxl,
  gap: spacing.md,
})

const $intro: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $importCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.md,
  padding: spacing.md,
  backgroundColor: colors.palette.neutral100,
  borderRadius: bentoRadii.card,
  borderColor: colors.separator,
})

const $iconCircle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: colors.palette.primary100,
  alignItems: "center",
  justifyContent: "center",
})

const $cardText: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $muted: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  letterSpacing: 1,
  marginTop: spacing.md,
})

const $emptyCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  gap: spacing.xs,
  padding: spacing.xl,
  borderRadius: bentoRadii.card,
  backgroundColor: colors.palette.neutral100,
  borderColor: colors.separator,
})

const $historyCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  gap: spacing.xs,
  padding: spacing.md,
  borderRadius: bentoRadii.card,
  backgroundColor: colors.palette.neutral100,
  borderColor: colors.separator,
})

const $historyTopRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $statusBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: 3,
  borderRadius: 12,
  backgroundColor: colors.palette.primary100,
})

const $undoneBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral300,
})

const $statusText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $undoButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignSelf: "flex-start",
  paddingVertical: spacing.xs,
})

const $undoText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
})
