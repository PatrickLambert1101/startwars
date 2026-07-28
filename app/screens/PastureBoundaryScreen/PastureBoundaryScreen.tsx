import { useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import * as DocumentPicker from "expo-document-picker"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import MapView, { MapPressEvent, Marker, Polygon, Polyline } from "react-native-maps"

import { Button, Icon, Screen, Text } from "@/components"
import { usePastureBoundary, usePastureBoundaryActions } from "@/hooks/usePastureBoundaries"
import { usePasture } from "@/hooks/usePastures"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { formatDate } from "@/utils/formatDate"
import {
  boundaryToEditableCoordinates,
  boundaryToMapShapes,
  createBoundaryFeature,
  formatBoundaryArea,
  getBoundaryCoordinates,
  getBoundaryMetrics,
  getBoundaryRegion,
  PastureBoundaryFeature,
  SOUTH_AFRICA_REGION,
} from "@/utils/pastureBoundary"
import { BoundaryImportCandidate, importPastureBoundaryFile } from "@/utils/pastureBoundaryImport"

interface PastureBoundaryScreenProps extends AppStackScreenProps<"PastureBoundary"> {}

type EditMode = "view" | "draw" | "import_preview"
type MapStyle = "standard" | "satellite"

export function PastureBoundaryScreen({ navigation, route }: PastureBoundaryScreenProps) {
  const { pastureId } = route.params
  const { pasture, isLoading: pastureLoading } = usePasture(pastureId)
  const { boundary, isLoading: boundaryLoading } = usePastureBoundary(pastureId)
  const { saveBoundary, clearBoundary } = usePastureBoundaryActions()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const mapRef = useRef<MapView>(null)
  const [mode, setMode] = useState<EditMode>("view")
  const [mapStyle, setMapStyle] = useState<MapStyle>("satellite")
  const [draftCoordinates, setDraftCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([])
  const [importCandidates, setImportCandidates] = useState<BoundaryImportCandidate[]>([])
  const [selectedImport, setSelectedImport] = useState<BoundaryImportCandidate | null>(null)
  const [importSource, setImportSource] = useState<"kml" | "kmz">("kml")
  const [importFileName, setImportFileName] = useState("")
  const [showCandidatePicker, setShowCandidatePicker] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const savedFeature = boundary?.feature ?? null

  const draftFeature = useMemo(() => {
    if (draftCoordinates.length < 3) return null
    try {
      return createBoundaryFeature(draftCoordinates, { name: pasture?.name })
    } catch {
      return null
    }
  }, [draftCoordinates, pasture?.name])

  const displayFeature: PastureBoundaryFeature | null =
    mode === "draw"
      ? draftFeature
      : mode === "import_preview"
        ? (selectedImport?.feature ?? null)
        : savedFeature

  const displayMetrics = useMemo(
    () => (displayFeature ? getBoundaryMetrics(displayFeature) : null),
    [displayFeature],
  )

  const fitFeature = (feature: PastureBoundaryFeature | null) => {
    if (!feature) return
    const coordinates = getBoundaryCoordinates(feature)
    if (coordinates.length === 0) return
    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 56, right: 44, bottom: 56, left: 44 },
      animated: true,
    })
  }

  useEffect(() => {
    if (!displayFeature) return
    const frame = requestAnimationFrame(() => fitFeature(displayFeature))
    return () => cancelAnimationFrame(frame)
  }, [displayFeature])

  const handleMapPress = (event: MapPressEvent) => {
    if (mode !== "draw") return

    // React Native may release the press event before the state updater runs,
    // and overlay presses can occasionally arrive without a coordinate.
    const coordinate = event.nativeEvent?.coordinate
    if (
      !coordinate ||
      !Number.isFinite(coordinate.latitude) ||
      !Number.isFinite(coordinate.longitude)
    ) {
      return
    }

    const nextCoordinate = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    }
    setDraftCoordinates((current) => [...current, nextCoordinate])
  }

  const startDrawing = (editExisting = false) => {
    if (editExisting && savedFeature) {
      if (savedFeature.geometry.type === "MultiPolygon") {
        Alert.alert(
          "Edit a multi-part boundary?",
          "Drawing edits the first polygon only. Import the file again if you need to preserve every separate shape.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Continue",
              onPress: () => {
                setDraftCoordinates(boundaryToEditableCoordinates(savedFeature))
                setMode("draw")
              },
            },
          ],
        )
        return
      }
      setDraftCoordinates(boundaryToEditableCoordinates(savedFeature))
    } else {
      setDraftCoordinates([])
    }
    setMode("draw")
  }

  const cancelEditing = () => {
    setDraftCoordinates([])
    setSelectedImport(null)
    setMode("view")
    requestAnimationFrame(() => fitFeature(savedFeature))
  }

  const saveDrawnBoundary = async () => {
    if (!draftFeature) {
      Alert.alert("Add more points", "Tap at least three corners to make a pasture boundary.")
      return
    }

    setIsSaving(true)
    try {
      await saveBoundary(pastureId, draftFeature, "draw")
      setMode("view")
      setDraftCoordinates([])
    } catch (error) {
      console.error("[PastureBoundary] Failed to save drawn boundary:", error)
      Alert.alert("Could not save boundary", "Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const chooseCandidate = (candidate: BoundaryImportCandidate) => {
    setSelectedImport(candidate)
    setShowCandidatePicker(false)
    setMode("import_preview")
  }

  const chooseBoundaryFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.google-earth.kml+xml",
          "application/vnd.google-earth.kmz",
          "application/xml",
          "text/xml",
          "application/zip",
          "application/octet-stream",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      })
      if (result.canceled) return

      setIsImporting(true)
      const asset = result.assets[0]
      const imported = await importPastureBoundaryFile(asset)
      setImportCandidates(imported.candidates)
      setImportSource(imported.source)
      setImportFileName(asset.name)

      if (imported.candidates.length === 1) {
        chooseCandidate(imported.candidates[0])
      } else {
        setShowCandidatePicker(true)
      }
    } catch (error) {
      console.error("[PastureBoundary] Import failed:", error)
      Alert.alert(
        "Could not import boundary",
        error instanceof Error ? error.message : "Choose a valid KML or KMZ file.",
      )
    } finally {
      setIsImporting(false)
    }
  }

  const saveImportedBoundary = async () => {
    if (!selectedImport) return

    setIsSaving(true)
    try {
      await saveBoundary(pastureId, selectedImport.feature, importSource, importFileName)
      setMode("view")
      setSelectedImport(null)
      setImportCandidates([])
    } catch (error) {
      console.error("[PastureBoundary] Failed to save imported boundary:", error)
      Alert.alert("Could not save boundary", "Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const confirmClearBoundary = () => {
    Alert.alert(
      "Remove pasture boundary?",
      "The saved polygon will be removed from this pasture and from the combined map.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await clearBoundary(pastureId)
            } catch (error) {
              console.error("[PastureBoundary] Failed to remove boundary:", error)
              Alert.alert("Could not remove boundary", "Please try again.")
            }
          },
        },
      ],
    )
  }

  const updateDraftPoint = (index: number, coordinate: { latitude: number; longitude: number }) => {
    setDraftCoordinates((current) =>
      current.map((point, pointIndex) => (pointIndex === index ? coordinate : point)),
    )
  }

  const initialRegion = savedFeature ? getBoundaryRegion(savedFeature) : SOUTH_AFRICA_REGION
  const isLoading = pastureLoading || boundaryLoading

  if (isLoading || !pasture) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
        <View style={themed($loadingContainer)}>
          <ActivityIndicator color={colors.palette.primary500} />
          <Text style={themed($loadingText)}>Loading pasture map…</Text>
        </View>
      </Screen>
    )
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <View style={themed($header)}>
        <Pressable
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
          style={themed($headerButton)}
        >
          <Icon icon="back" size={23} />
        </Pressable>
        <View style={themed($headerTitleContainer)}>
          <Text style={themed($headerTitle)}>Location & Boundary</Text>
          <Text style={themed($headerSubtitle)} numberOfLines={1}>
            {pasture.name}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={`Switch to ${mapStyle === "satellite" ? "standard" : "satellite"} map`}
          onPress={() =>
            setMapStyle((current) => (current === "satellite" ? "standard" : "satellite"))
          }
          style={themed($headerButton)}
        >
          <MaterialCommunityIcons
            name={mapStyle === "satellite" ? "map-outline" : "satellite-variant"}
            size={23}
            color={colors.text}
          />
        </Pressable>
      </View>

      <View style={themed($mapContainer)}>
        <MapView
          ref={mapRef}
          style={$map}
          initialRegion={initialRegion}
          mapType={mapStyle}
          onMapReady={() => fitFeature(displayFeature)}
          onPress={handleMapPress}
          showsCompass
          toolbarEnabled={false}
        >
          {displayFeature &&
            boundaryToMapShapes(displayFeature).map((shape, index) => (
              <Polygon
                key={`boundary-${index}`}
                coordinates={shape.coordinates}
                holes={shape.holes}
                fillColor="rgba(115, 145, 52, 0.30)"
                strokeColor={colors.palette.primary600}
                strokeWidth={3}
              />
            ))}

          {mode === "draw" && draftCoordinates.length > 1 && !draftFeature && (
            <Polyline
              coordinates={draftCoordinates}
              strokeColor={colors.palette.primary600}
              strokeWidth={3}
            />
          )}

          {mode === "draw" &&
            draftCoordinates.map((coordinate, index) => (
              <Marker
                key={`point-${index}`}
                coordinate={coordinate}
                draggable
                anchor={{ x: 0.5, y: 0.5 }}
                onDragEnd={(event) => updateDraftPoint(index, event.nativeEvent.coordinate)}
              >
                <View style={themed($vertexMarker)}>
                  <Text style={themed($vertexText)}>{index + 1}</Text>
                </View>
              </Marker>
            ))}
        </MapView>

        {mode === "draw" && (
          <View pointerEvents="none" style={themed($mapInstruction)}>
            <MaterialCommunityIcons name="gesture-tap" size={18} color={colors.text} />
            <Text style={themed($mapInstructionText)}>
              Tap each corner. Drag numbered points to adjust.
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={themed($panel)} contentContainerStyle={themed($panelContent)}>
        {mode === "view" && !savedFeature && (
          <>
            <Text style={themed($panelTitle)}>No boundary mapped yet</Text>
            <Text style={themed($panelDescription)}>
              Draw the pasture on the map or import the KML/KMZ file exported from Google My Maps.
            </Text>
            <View style={themed($primaryActions)}>
              <Button
                text="Draw boundary"
                preset="filled"
                onPress={() => startDrawing(false)}
                style={themed($actionButton)}
              />
              <Button
                text={isImporting ? "Reading file…" : "Import KML/KMZ"}
                onPress={chooseBoundaryFile}
                disabled={isImporting}
                style={themed($actionButton)}
              />
            </View>
          </>
        )}

        {mode === "view" && savedFeature && boundary && (
          <>
            <View style={themed($summaryHeader)}>
              <View>
                <Text style={themed($panelTitle)}>Boundary saved</Text>
                <Text style={themed($sourceText)}>
                  {boundary.boundarySource === "draw"
                    ? "Drawn in HerdTrackr"
                    : `Imported from ${boundary.boundarySourceName || boundary.boundarySource.toUpperCase()}`}
                </Text>
              </View>
              <View style={themed($areaBadge)}>
                <Text style={themed($areaBadgeText)}>
                  {formatBoundaryArea(boundary.calculatedAreaHectares)}
                </Text>
              </View>
            </View>
            <Text style={themed($updatedText)}>
              Updated {formatDate(boundary.boundaryUpdatedAt.toISOString(), "PP")}
            </Text>
            <View style={themed($primaryActions)}>
              <Button
                text="Edit shape"
                onPress={() => startDrawing(true)}
                style={themed($actionButton)}
              />
              <Button
                text={isImporting ? "Reading file…" : "Replace from file"}
                onPress={chooseBoundaryFile}
                disabled={isImporting}
                style={themed($actionButton)}
              />
            </View>
            <Pressable onPress={confirmClearBoundary} style={themed($removeButton)}>
              <MaterialCommunityIcons
                name="delete-outline"
                size={18}
                color={colors.palette.angry500}
              />
              <Text style={themed($removeButtonText)}>Remove boundary</Text>
            </Pressable>
          </>
        )}

        {mode === "draw" && (
          <>
            <View style={themed($summaryHeader)}>
              <View>
                <Text style={themed($panelTitle)}>
                  {savedFeature ? "Edit boundary" : "Draw boundary"}
                </Text>
                <Text style={themed($sourceText)}>
                  {draftCoordinates.length} point{draftCoordinates.length === 1 ? "" : "s"}
                  {displayMetrics ? ` • ${formatBoundaryArea(displayMetrics.areaHectares)}` : ""}
                </Text>
              </View>
              <View style={themed($toolRow)}>
                <Pressable
                  accessibilityLabel="Undo last point"
                  disabled={draftCoordinates.length === 0}
                  onPress={() => setDraftCoordinates((current) => current.slice(0, -1))}
                  style={themed($toolButton)}
                >
                  <MaterialCommunityIcons
                    name="undo"
                    size={21}
                    color={draftCoordinates.length ? colors.text : colors.palette.neutral400}
                  />
                </Pressable>
                <Pressable
                  accessibilityLabel="Clear all points"
                  disabled={draftCoordinates.length === 0}
                  onPress={() => setDraftCoordinates([])}
                  style={themed($toolButton)}
                >
                  <MaterialCommunityIcons
                    name="eraser"
                    size={21}
                    color={draftCoordinates.length ? colors.text : colors.palette.neutral400}
                  />
                </Pressable>
              </View>
            </View>
            <View style={themed($primaryActions)}>
              <Button text="Cancel" onPress={cancelEditing} style={themed($actionButton)} />
              <Button
                text={isSaving ? "Saving…" : "Save boundary"}
                preset="filled"
                onPress={saveDrawnBoundary}
                disabled={!draftFeature || isSaving}
                style={themed($actionButton)}
              />
            </View>
          </>
        )}

        {mode === "import_preview" && selectedImport && (
          <>
            <View style={themed($summaryHeader)}>
              <View style={$flexOne}>
                <Text style={themed($panelTitle)}>Preview imported boundary</Text>
                <Text style={themed($sourceText)} numberOfLines={1}>
                  {selectedImport.name} • {formatBoundaryArea(selectedImport.areaHectares)}
                </Text>
              </View>
            </View>
            {importCandidates.length > 1 && (
              <Pressable
                onPress={() => setShowCandidatePicker(true)}
                style={themed($chooseAnotherButton)}
              >
                <Text style={themed($chooseAnotherText)}>
                  Choose another polygon ({importCandidates.length})
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={19}
                  color={colors.palette.primary600}
                />
              </Pressable>
            )}
            <View style={themed($primaryActions)}>
              <Button text="Cancel" onPress={cancelEditing} style={themed($actionButton)} />
              <Button
                text={isSaving ? "Saving…" : "Use this boundary"}
                preset="filled"
                onPress={saveImportedBoundary}
                disabled={isSaving}
                style={themed($actionButton)}
              />
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showCandidatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCandidatePicker(false)}
      >
        <Pressable style={themed($modalBackdrop)} onPress={() => setShowCandidatePicker(false)}>
          <Pressable style={themed($modalCard)} onPress={() => undefined}>
            <View style={themed($modalHandle)} />
            <Text style={themed($modalTitle)}>Choose a pasture polygon</Text>
            <Text style={themed($modalDescription)}>
              This file contains {importCandidates.length} polygons. Select the one that belongs to{" "}
              {pasture.name}.
            </Text>
            <FlatList
              data={importCandidates}
              keyExtractor={(_, index) => `candidate-${index}`}
              style={themed($candidateList)}
              renderItem={({ item }) => (
                <Pressable onPress={() => chooseCandidate(item)} style={themed($candidateRow)}>
                  <View style={$flexOne}>
                    <Text style={themed($candidateName)} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={themed($candidateArea)}>
                      {formatBoundaryArea(item.areaHectares)}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={22}
                    color={colors.palette.primary500}
                  />
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  )
}

const $flexOne: ViewStyle = { flex: 1 }
const $map: ViewStyle = { flex: 1 }

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $header: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  minHeight: 58,
  paddingHorizontal: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
  backgroundColor: colors.palette.neutral100,
  zIndex: 2,
})

const $headerButton: ThemedStyle<ViewStyle> = () => ({
  width: 42,
  height: 42,
  borderRadius: 21,
  alignItems: "center",
  justifyContent: "center",
})

const $headerTitleContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  alignItems: "center",
})

const $headerTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 17,
  fontWeight: "700",
})

const $headerSubtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
  marginTop: 1,
})

const $mapContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  minHeight: 280,
})

const $mapInstruction: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  top: spacing.sm,
  left: spacing.sm,
  right: spacing.sm,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  borderRadius: 10,
  backgroundColor: `${colors.palette.neutral100}EE`,
})

const $mapInstructionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 12,
  flex: 1,
})

const $vertexMarker: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 28,
  height: 28,
  borderRadius: 14,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.primary600,
  borderWidth: 2,
  borderColor: colors.palette.neutral100,
})

const $vertexText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontSize: 11,
  fontWeight: "800",
})

const $panel: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexGrow: 0,
  maxHeight: 278,
  backgroundColor: colors.palette.neutral100,
  borderTopWidth: 1,
  borderTopColor: colors.separator,
})

const $panelContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  paddingBottom: spacing.xl,
})

const $panelTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 18,
  fontWeight: "700",
})

const $panelDescription: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 13,
  lineHeight: 19,
  marginTop: spacing.xs,
})

const $primaryActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  marginTop: spacing.md,
})

const $actionButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  minHeight: 46,
})

const $summaryHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: spacing.sm,
})

const $sourceText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 12,
  marginTop: spacing.xxs,
})

const $areaBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  borderRadius: 999,
  backgroundColor: colors.palette.primary100,
})

const $areaBadgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
  fontSize: 12,
  fontWeight: "700",
})

const $updatedText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.palette.neutral500,
  fontSize: 11,
  marginTop: spacing.sm,
})

const $removeButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "center",
  gap: spacing.xxs,
  paddingTop: spacing.md,
})

const $removeButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.angry500,
  fontSize: 13,
  fontWeight: "600",
})

const $toolRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
})

const $toolButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 38,
  height: 38,
  borderRadius: 19,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.neutral200,
})

const $chooseAnotherButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginTop: spacing.sm,
})

const $chooseAnotherText: ThemedStyle<TextStyle> = ({ colors }) => ({
  flex: 1,
  color: colors.palette.primary600,
  fontSize: 13,
  fontWeight: "600",
})

const $loadingContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $modalBackdrop: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  justifyContent: "flex-end",
  backgroundColor: colors.palette.overlay50,
})

const $modalCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  maxHeight: "70%",
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
  borderTopLeftRadius: 22,
  borderTopRightRadius: 22,
  backgroundColor: colors.palette.neutral100,
})

const $modalHandle: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 44,
  height: 5,
  borderRadius: 3,
  alignSelf: "center",
  marginVertical: spacing.sm,
  backgroundColor: colors.palette.neutral300,
})

const $modalTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 20,
  fontWeight: "700",
})

const $modalDescription: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 13,
  lineHeight: 19,
  marginTop: spacing.xs,
  marginBottom: spacing.md,
})

const $candidateList: ThemedStyle<ViewStyle> = () => ({
  flexGrow: 0,
})

const $candidateRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.sm,
  borderWidth: 1,
  borderColor: colors.separator,
  borderRadius: 10,
  marginBottom: spacing.xs,
})

const $candidateName: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 14,
  fontWeight: "600",
})

const $candidateArea: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
  marginTop: 2,
})
