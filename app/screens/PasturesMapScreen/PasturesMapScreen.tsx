import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import MapView, { Marker, Polygon } from "react-native-maps"

import { Button, Icon, Screen, Text } from "@/components"
import { PASTURE_ACTIVITY_LABELS } from "@/db/models"
import type { Pasture, PastureActivity, PastureBoundary } from "@/db/models"
import { useAllPastureActivities } from "@/hooks/usePastureActivities"
import { usePastureBoundaries } from "@/hooks/usePastureBoundaries"
import { usePastures } from "@/hooks/usePastures"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import type { Colors, ThemedStyle } from "@/theme/types"
import { formatDate } from "@/utils/formatDate"
import {
  boundaryToMapShapes,
  formatBoundaryArea,
  getBoundaryCoordinates,
  SOUTH_AFRICA_REGION,
} from "@/utils/pastureBoundary"
import { getPastureMapStatus, PastureMapStatusLevel } from "@/utils/pastureMapStatus"

interface PasturesMapScreenProps extends AppStackScreenProps<"PasturesMap"> {}

interface MappedPasture {
  pasture: Pasture
  boundary: PastureBoundary
  latestTick: PastureActivity | null
  latestActivity: PastureActivity | null
}

function statusColor(level: PastureMapStatusLevel, colors: Colors): string {
  if (level === "green") return colors.palette.primary500
  if (level === "amber") return colors.palette.accent500
  if (level === "red") return colors.palette.angry500
  return colors.palette.neutral500
}

export function PasturesMapScreen({ navigation }: PasturesMapScreenProps) {
  const { pastures } = usePastures()
  const { boundaries } = usePastureBoundaries()
  const { activities } = useAllPastureActivities()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const mapRef = useRef<MapView>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapStyle, setMapStyle] = useState<"standard" | "satellite">("satellite")
  const [selectedPastureId, setSelectedPastureId] = useState<string | null>(null)

  const mappedPastures = useMemo<MappedPasture[]>(() => {
    const boundaryByPasture = new Map(boundaries.map((boundary) => [boundary.pastureId, boundary]))

    return pastures.flatMap((pasture) => {
      const boundary = boundaryByPasture.get(pasture.id)
      if (!boundary?.feature) return []

      const pastureActivities = activities.filter((activity) => activity.pastureId === pasture.id)
      return [
        {
          pasture,
          boundary,
          latestActivity: pastureActivities[0] ?? null,
          latestTick:
            pastureActivities.find((activity) => activity.activityType === "tick_observation") ??
            null,
        },
      ]
    })
  }, [activities, boundaries, pastures])

  const selected = mappedPastures.find(({ pasture }) => pasture.id === selectedPastureId) ?? null

  const fitAllBoundaries = useCallback(() => {
    const coordinates = mappedPastures.flatMap(({ boundary }) =>
      boundary.feature ? getBoundaryCoordinates(boundary.feature) : [],
    )
    if (coordinates.length === 0) return
    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 78, right: 48, bottom: selected ? 245 : 96, left: 48 },
      animated: true,
    })
  }, [mappedPastures, selected])

  useEffect(() => {
    if (!mapReady || mappedPastures.length === 0) return
    const frame = requestAnimationFrame(fitAllBoundaries)
    return () => cancelAnimationFrame(frame)
  }, [fitAllBoundaries, mapReady, mappedPastures.length])

  const selectedStatus = selected
    ? getPastureMapStatus(selected.pasture, selected.latestTick?.tickLoadScore ?? null)
    : null

  const unmappedCount = Math.max(0, pastures.length - mappedPastures.length)

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
        <View style={themed($titleContainer)}>
          <Text style={themed($title)}>All Pastures</Text>
          <Text style={themed($subtitle)}>
            {mappedPastures.length} mapped • {pastures.length} total
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

      <View style={$mapContainer}>
        <MapView
          ref={mapRef}
          style={$map}
          initialRegion={SOUTH_AFRICA_REGION}
          mapType={mapStyle}
          onMapReady={() => setMapReady(true)}
          onPress={() => setSelectedPastureId(null)}
          showsCompass
          toolbarEnabled={false}
        >
          {mappedPastures.flatMap(({ pasture, boundary, latestTick }) => {
            const feature = boundary.feature
            if (!feature) return []
            const status = getPastureMapStatus(pasture, latestTick?.tickLoadScore ?? null)
            const color = statusColor(status.level, colors)

            return boundaryToMapShapes(feature).map((shape, shapeIndex) => (
              <Polygon
                key={`${boundary.id}-${shapeIndex}`}
                coordinates={shape.coordinates}
                holes={shape.holes}
                fillColor={`${color}45`}
                strokeColor={color}
                strokeWidth={selectedPastureId === pasture.id ? 4 : 2}
                tappable
                onPress={(event) => {
                  event.stopPropagation()
                  setSelectedPastureId(pasture.id)
                }}
              />
            ))
          })}

          {mappedPastures.map(({ pasture, boundary, latestTick }) => {
            const status = getPastureMapStatus(pasture, latestTick?.tickLoadScore ?? null)
            const color = statusColor(status.level, colors)

            return (
              <Marker
                key={`label-${boundary.id}`}
                coordinate={{
                  latitude: boundary.centroidLatitude,
                  longitude: boundary.centroidLongitude,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={() => setSelectedPastureId(pasture.id)}
              >
                <View style={[themed($mapLabel), { borderColor: color }]}>
                  <Text style={themed($mapLabelName)} numberOfLines={1}>
                    {pasture.name}
                  </Text>
                  <Text style={themed($mapLabelStats)}>{pasture.currentAnimalCount} animals</Text>
                </View>
              </Marker>
            )
          })}
        </MapView>

        {mappedPastures.length > 0 && (
          <View style={themed($mapTopControls)}>
            <View style={themed($legend)}>
              {[
                ["green", "On track"],
                ["amber", "Watch"],
                ["red", "Action"],
                ["grey", "Needs data"],
              ].map(([level, label]) => (
                <View key={level} style={themed($legendItem)}>
                  <View
                    style={[
                      themed($legendDot),
                      { backgroundColor: statusColor(level as PastureMapStatusLevel, colors) },
                    ]}
                  />
                  <Text style={themed($legendText)}>{label}</Text>
                </View>
              ))}
            </View>
            <Pressable
              accessibilityLabel="Fit all pasture boundaries"
              onPress={fitAllBoundaries}
              style={themed($fitButton)}
            >
              <MaterialCommunityIcons name="fit-to-screen-outline" size={21} color={colors.text} />
            </Pressable>
          </View>
        )}

        {unmappedCount > 0 && mappedPastures.length > 0 && (
          <View style={themed($unmappedChip)}>
            <MaterialCommunityIcons
              name="map-marker-alert-outline"
              size={16}
              color={colors.textDim}
            />
            <Text style={themed($unmappedText)}>{unmappedCount} not mapped</Text>
          </View>
        )}

        {mappedPastures.length === 0 && (
          <View style={themed($emptyCard)}>
            <MaterialCommunityIcons
              name="map-marker-path"
              size={38}
              color={colors.palette.primary500}
            />
            <Text style={themed($emptyTitle)}>No pasture boundaries yet</Text>
            <Text style={themed($emptyDescription)}>
              Open a pasture and add its location to start building the farm map.
            </Text>
            {pastures[0] && (
              <Button
                text={`Map ${pastures[0].name}`}
                preset="filled"
                onPress={() =>
                  navigation.navigate("PastureBoundary", { pastureId: pastures[0].id })
                }
                style={themed($emptyButton)}
              />
            )}
          </View>
        )}

        {selected && selectedStatus && (
          <View style={themed($selectedCard)}>
            <View style={themed($selectedHeader)}>
              <View
                style={[
                  themed($selectedStatusBar),
                  { backgroundColor: statusColor(selectedStatus.level, colors) },
                ]}
              />
              <View style={$flexOne}>
                <Text style={themed($selectedName)}>{selected.pasture.name}</Text>
                <Text
                  style={[
                    themed($selectedStatus),
                    { color: statusColor(selectedStatus.level, colors) },
                  ]}
                >
                  {selectedStatus.label} • {selectedStatus.reason}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close pasture details"
                onPress={() => setSelectedPastureId(null)}
                style={themed($closeButton)}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textDim} />
              </Pressable>
            </View>

            <View style={themed($statRow)}>
              <View style={themed($stat)}>
                <Text style={themed($statValue)}>
                  {selected.pasture.currentAnimalCount}
                  {selected.pasture.maxCapacity !== null ? `/${selected.pasture.maxCapacity}` : ""}
                </Text>
                <Text style={themed($statLabel)}>Animals</Text>
              </View>
              <View style={themed($stat)}>
                <Text style={themed($statValue)}>
                  {selected.pasture.isOccupied ? selected.pasture.daysGrazed : "—"}
                </Text>
                <Text style={themed($statLabel)}>Days grazed</Text>
              </View>
              <View style={themed($stat)}>
                <Text style={themed($statValue)}>
                  {selected.latestTick?.tickLoadScore ?? "—"}
                  {selected.latestTick?.tickLoadScore !== null &&
                  selected.latestTick?.tickLoadScore !== undefined
                    ? "/5"
                    : ""}
                </Text>
                <Text style={themed($statLabel)}>Tick load</Text>
              </View>
              <View style={themed($stat)}>
                <Text style={themed($statValue)}>
                  {formatBoundaryArea(selected.boundary.calculatedAreaHectares).replace(" ha", "")}
                </Text>
                <Text style={themed($statLabel)}>Hectares</Text>
              </View>
            </View>

            {selected.latestActivity && (
              <Text style={themed($lastActivityText)}>
                Latest activity: {PASTURE_ACTIVITY_LABELS[selected.latestActivity.activityType]} •{" "}
                {formatDate(selected.latestActivity.activityDate.toISOString(), "PP")}
              </Text>
            )}

            <Pressable
              onPress={() =>
                navigation.navigate("PastureDetail", { pastureId: selected.pasture.id })
              }
              style={themed($openPastureButton)}
            >
              <Text style={themed($openPastureText)}>Open pasture</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={21}
                color={colors.palette.primary600}
              />
            </Pressable>
          </View>
        )}
      </View>
    </Screen>
  )
}

const $flexOne: ViewStyle = { flex: 1 }
const $mapContainer: ViewStyle = { flex: 1 }
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

const $titleContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  alignItems: "center",
})

const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 17,
  fontWeight: "700",
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 12,
  marginTop: 1,
})

const $mapTopControls: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  top: spacing.sm,
  left: spacing.sm,
  right: spacing.sm,
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
})

const $legend: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  maxWidth: "84%",
  gap: spacing.sm,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  borderRadius: 10,
  backgroundColor: `${colors.palette.neutral100}EE`,
})

const $legendItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xxs,
})

const $legendDot: ThemedStyle<ViewStyle> = () => ({
  width: 8,
  height: 8,
  borderRadius: 4,
})

const $legendText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 10,
  fontWeight: "600",
})

const $fitButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: `${colors.palette.neutral100}EE`,
})

const $mapLabel: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  maxWidth: 118,
  minWidth: 72,
  paddingVertical: 4,
  paddingHorizontal: spacing.xs,
  borderRadius: 7,
  borderWidth: 2,
  backgroundColor: `${colors.palette.neutral100}F2`,
  alignItems: "center",
})

const $mapLabelName: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 11,
  fontWeight: "800",
})

const $mapLabelStats: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 9,
  marginTop: 1,
})

const $unmappedChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  left: spacing.sm,
  bottom: spacing.sm,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xxs,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  borderRadius: 999,
  backgroundColor: `${colors.palette.neutral100}EE`,
})

const $unmappedText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 11,
  fontWeight: "600",
})

const $selectedCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  left: spacing.sm,
  right: spacing.sm,
  bottom: spacing.sm,
  padding: spacing.md,
  borderRadius: 15,
  backgroundColor: colors.palette.neutral100,
  shadowColor: colors.palette.neutral900,
  shadowOpacity: 0.18,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 6,
})

const $selectedHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.sm,
})

const $selectedStatusBar: ThemedStyle<ViewStyle> = () => ({
  width: 5,
  height: 38,
  borderRadius: 3,
})

const $selectedName: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 17,
  fontWeight: "800",
})

const $selectedStatus: ThemedStyle<TextStyle> = () => ({
  fontSize: 11,
  fontWeight: "600",
  marginTop: 2,
})

const $closeButton: ThemedStyle<ViewStyle> = () => ({
  width: 32,
  height: 32,
  alignItems: "center",
  justifyContent: "center",
})

const $statRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  marginTop: spacing.sm,
  paddingVertical: spacing.sm,
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderColor: colors.separator,
})

const $stat: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  alignItems: "center",
})

const $statValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 14,
  fontWeight: "800",
})

const $statLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 9,
  marginTop: 2,
})

const $openPastureButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingTop: spacing.sm,
})

const $lastActivityText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 10,
  textAlign: "center",
  marginTop: spacing.xs,
})

const $openPastureText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
  fontSize: 13,
  fontWeight: "700",
})

const $emptyCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  left: spacing.lg,
  right: spacing.lg,
  top: "25%",
  alignItems: "center",
  padding: spacing.xl,
  borderRadius: 16,
  backgroundColor: `${colors.palette.neutral100}F5`,
})

const $emptyTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text,
  fontSize: 18,
  fontWeight: "800",
  marginTop: spacing.sm,
})

const $emptyDescription: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 13,
  lineHeight: 19,
  textAlign: "center",
  marginTop: spacing.xs,
})

const $emptyButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  minHeight: 44,
  alignSelf: "stretch",
  marginTop: spacing.md,
})
