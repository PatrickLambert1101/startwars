import { useMemo, useState } from "react"
import { ActivityIndicator, Alert, Pressable, TextStyle, View, ViewStyle } from "react-native"
import * as DocumentPicker from "expo-document-picker"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { AppHeader, Button, Screen, Text } from "@/components"
import { usePastureBoundaryActions } from "@/hooks/usePastureBoundaries"
import { usePastures } from "@/hooks/usePastures"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { formatBoundaryArea } from "@/utils/pastureBoundary"
import {
  BoundaryImportCandidate,
  buildPastureBoundaryImportPlan,
  importPastureBoundaryFile,
} from "@/utils/pastureBoundaryImport"

interface PastureKmlImportScreenProps extends AppStackScreenProps<"PastureKmlImport"> {}

type ImportSource = "kml" | "kmz"

const PICKER_TYPES = [
  "application/vnd.google-earth.kml+xml",
  "application/vnd.google-earth.kmz",
  "application/xml",
  "text/xml",
  "application/zip",
  "application/octet-stream",
]

export function PastureKmlImportScreen({ navigation }: PastureKmlImportScreenProps) {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const { pastures } = usePastures()
  const { importNamedPastures } = usePastureBoundaryActions()

  const [candidates, setCandidates] = useState<BoundaryImportCandidate[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [fileName, setFileName] = useState("")
  const [source, setSource] = useState<ImportSource>("kml")
  const [isReading, setIsReading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null)

  const plan = useMemo(
    () =>
      buildPastureBoundaryImportPlan(
        candidates,
        pastures.map((pasture) => ({
          id: pasture.id,
          name: pasture.name,
          code: pasture.code,
        })),
      ),
    [candidates, pastures],
  )
  const selectedItems = plan.filter((item) => selectedKeys.has(item.key))
  const selectedCreates = selectedItems.filter((item) => item.action === "create").length
  const selectedUpdates = selectedItems.filter((item) => item.action === "update").length

  const chooseFile = async () => {
    try {
      const selection = await DocumentPicker.getDocumentAsync({
        type: PICKER_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      })
      if (selection.canceled) return

      setIsReading(true)
      const asset = selection.assets[0]
      const imported = await importPastureBoundaryFile(asset)
      const nextPlan = buildPastureBoundaryImportPlan(
        imported.candidates,
        pastures.map((pasture) => ({
          id: pasture.id,
          name: pasture.name,
          code: pasture.code,
        })),
      )

      setCandidates(imported.candidates)
      setSelectedKeys(new Set(nextPlan.map((item) => item.key)))
      setFileName(asset.name)
      setSource(imported.source)
      setResult(null)
    } catch (error) {
      console.error("[PastureKmlImport] Could not read file:", error)
      Alert.alert(
        "Could not import pasture map",
        error instanceof Error ? error.message : "Choose a valid KML or KMZ file.",
      )
    } finally {
      setIsReading(false)
    }
  }

  const toggleSelected = (key: string) => {
    setSelectedKeys((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const importSelected = async () => {
    if (selectedItems.length === 0) return
    setIsSaving(true)
    try {
      const importResult = await importNamedPastures(selectedItems, source, fileName)
      setResult(importResult)
    } catch (error) {
      console.error("[PastureKmlImport] Could not save pastures:", error)
      Alert.alert(
        "Could not save pastures",
        error instanceof Error ? error.message : "Please try again.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (result) {
    return (
      <Screen preset="scroll" safeAreaEdges={["bottom"]} contentContainerStyle={themed($container)}>
        <AppHeader title="Import pasture map" showBack showSettings={false} />
        <View style={themed($completeContent)}>
          <View style={themed($completeIcon)}>
            <MaterialCommunityIcons name="check" size={42} color={colors.palette.neutral100} />
          </View>
          <Text preset="heading" size="lg">
            Pasture map imported
          </Text>
          <Text style={[themed($muted), $centerText]}>
            {result.created} new pasture{result.created === 1 ? "" : "s"} created
            {result.updated > 0
              ? ` and ${result.updated} existing pasture${result.updated === 1 ? "" : "s"} updated`
              : ""}
            .
          </Text>
          <Button
            text="View all on map"
            preset="reversed"
            onPress={() => navigation.replace("PasturesMap")}
            style={themed($wideButton)}
          />
          <Button
            text="Back to pastures"
            onPress={() => navigation.navigate("Main", { screen: "Pastures" })}
            style={themed($wideButton)}
          />
        </View>
      </Screen>
    )
  }

  return (
    <Screen preset="scroll" safeAreaEdges={["bottom"]} contentContainerStyle={themed($container)}>
      <AppHeader title="Import pasture map" showBack showSettings={false} />

      <View style={themed($content)}>
        {plan.length === 0 ? (
          <>
            <View style={themed($heroCard)}>
              <View style={themed($heroIcon)}>
                <MaterialCommunityIcons
                  name="map-marker-multiple-outline"
                  size={38}
                  color={colors.tint}
                />
              </View>
              <Text preset="heading" size="lg" style={$centerText}>
                Create pastures from a map
              </Text>
              <Text style={[themed($muted), $centerText]}>
                Choose a KML or KMZ file. Every named polygon becomes a pasture with its own saved
                boundary and calculated area.
              </Text>
            </View>

            <View style={themed($infoCard)}>
              <Text weight="semiBold">How names are handled</Text>
              <InfoRow text="The KML placemark name becomes the pasture name." />
              <InfoRow text="Polygons with the same name become one multi-part pasture." />
              <InfoRow text="A matching existing pasture is updated instead of duplicated." />
              <InfoRow text="New pastures receive a unique short code automatically." />
            </View>

            <Button
              text={isReading ? "Reading pasture map…" : "Choose KML/KMZ file"}
              preset="reversed"
              onPress={chooseFile}
              disabled={isReading}
              LeftAccessory={() =>
                isReading ? (
                  <ActivityIndicator size="small" color={colors.palette.neutral100} />
                ) : (
                  <MaterialCommunityIcons
                    name="file-upload-outline"
                    size={20}
                    color={colors.palette.neutral100}
                  />
                )
              }
            />
          </>
        ) : (
          <>
            <View style={themed($fileCard)}>
              <MaterialCommunityIcons name="map-outline" size={26} color={colors.tint} />
              <View style={$flexOne}>
                <Text weight="semiBold" numberOfLines={1}>
                  {fileName}
                </Text>
                <Text size="xxs" style={themed($muted)}>
                  {plan.length} named pasture{plan.length === 1 ? "" : "s"} found
                </Text>
              </View>
              <Pressable onPress={chooseFile} disabled={isReading}>
                <Text size="xs" style={themed($linkText)}>
                  Change
                </Text>
              </Pressable>
            </View>

            <View style={themed($summaryCard)}>
              <View style={themed($summaryItem)}>
                <Text preset="heading">{selectedCreates}</Text>
                <Text size="xxs" style={themed($muted)}>
                  New
                </Text>
              </View>
              <View style={themed($summaryDivider)} />
              <View style={themed($summaryItem)}>
                <Text preset="heading">{selectedUpdates}</Text>
                <Text size="xxs" style={themed($muted)}>
                  Existing updates
                </Text>
              </View>
              <View style={themed($summaryDivider)} />
              <View style={themed($summaryItem)}>
                <Text preset="heading">{selectedItems.length}</Text>
                <Text size="xxs" style={themed($muted)}>
                  Selected
                </Text>
              </View>
            </View>

            {selectedUpdates > 0 && (
              <View style={themed($warningCard)}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={20}
                  color={colors.palette.accent500}
                />
                <Text size="xs" style={$flexOne}>
                  Matching existing pastures will keep their records and animals, but their saved
                  boundaries will be replaced by the polygons in this file.
                </Text>
              </View>
            )}

            <View style={themed($listHeader)}>
              <Text weight="semiBold">Pastures to import</Text>
              <Pressable
                onPress={() =>
                  setSelectedKeys(
                    selectedItems.length === plan.length
                      ? new Set()
                      : new Set(plan.map((item) => item.key)),
                  )
                }
              >
                <Text size="xs" style={themed($linkText)}>
                  {selectedItems.length === plan.length ? "Select none" : "Select all"}
                </Text>
              </Pressable>
            </View>

            {plan.map((item) => {
              const selected = selectedKeys.has(item.key)
              return (
                <Pressable
                  key={item.key}
                  onPress={() => toggleSelected(item.key)}
                  style={[themed($pastureRow), selected && themed($pastureRowSelected)]}
                >
                  <MaterialCommunityIcons
                    name={selected ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={24}
                    color={selected ? colors.tint : colors.textDim}
                  />
                  <View style={$flexOne}>
                    <Text weight="semiBold" numberOfLines={1}>
                      {item.pastureName}
                    </Text>
                    <Text size="xxs" style={themed($muted)}>
                      {formatBoundaryArea(item.candidate.areaHectares)} •{" "}
                      {item.action === "create"
                        ? `New pasture • ${item.pastureCode}`
                        : `Update existing • ${item.pastureCode}`}
                    </Text>
                  </View>
                  <View
                    style={[themed($actionBadge), item.action === "update" && themed($updateBadge)]}
                  >
                    <Text size="xxs" style={themed($actionBadgeText)}>
                      {item.action === "create" ? "NEW" : "UPDATE"}
                    </Text>
                  </View>
                </Pressable>
              )
            })}

            <Button
              text={
                isSaving
                  ? "Importing pastures…"
                  : `Import ${selectedItems.length} pasture${selectedItems.length === 1 ? "" : "s"}`
              }
              preset="reversed"
              onPress={importSelected}
              disabled={isSaving || selectedItems.length === 0}
            />
            <Text size="xxs" style={[themed($footerNote), $centerText]}>
              Nothing is saved until you tap Import.
            </Text>
          </>
        )}
      </View>
    </Screen>
  )
}

function InfoRow({ text }: { text: string }) {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  return (
    <View style={themed($infoRow)}>
      <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.tint} />
      <Text size="xs" style={$flexOne}>
        {text}
      </Text>
    </View>
  )
}

const $flexOne: ViewStyle = { flex: 1 }
const $centerText: TextStyle = { textAlign: "center" }

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexGrow: 1,
  backgroundColor: colors.background,
})

const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.md,
  padding: spacing.lg,
  paddingBottom: spacing.xxl,
})

const $heroCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.xl,
  borderRadius: 16,
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.separator,
})

const $heroIcon: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 72,
  height: 72,
  borderRadius: 36,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.primary100,
})

const $muted: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $infoCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  gap: spacing.sm,
  padding: spacing.md,
  borderRadius: 14,
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.separator,
})

const $infoRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.sm,
})

const $fileCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.md,
  borderRadius: 14,
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.separator,
})

const $linkText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "600",
})

const $summaryCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  padding: spacing.md,
  borderRadius: 14,
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.separator,
})

const $summaryItem: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  alignItems: "center",
})

const $summaryDivider: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 1,
  height: 38,
  backgroundColor: colors.separator,
})

const $warningCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.sm,
  padding: spacing.md,
  borderRadius: 12,
  backgroundColor: colors.palette.accent100,
})

const $listHeader: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})

const $pastureRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.md,
  borderRadius: 12,
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.separator,
})

const $pastureRowSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.tint,
  backgroundColor: colors.palette.primary100,
})

const $actionBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.xs,
  paddingVertical: 3,
  borderRadius: 8,
  backgroundColor: colors.palette.primary200,
})

const $updateBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.accent100,
})

const $actionBadgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontWeight: "700",
})

const $footerNote: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $completeContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  minHeight: 560,
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.md,
  padding: spacing.xl,
})

const $completeIcon: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 78,
  height: 78,
  borderRadius: 39,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.tint,
})

const $wideButton: ThemedStyle<ViewStyle> = () => ({
  alignSelf: "stretch",
})
