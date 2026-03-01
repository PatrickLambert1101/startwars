import { FC, useCallback, useState } from "react"
import { Pressable, View, ViewStyle, TextStyle } from "react-native"
import { format } from "date-fns"

import { Screen, Text, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAnimal, useAnimalActions } from "@/hooks/useAnimals"
import { useHealthRecords, useWeightRecords, useBreedingRecords } from "@/hooks/useRecords"

type Tab = "overview" | "health" | "weight" | "breeding"

export const AnimalDetailScreen: FC<AppStackScreenProps<"AnimalDetail">> = ({ route, navigation }) => {
  const { themed, theme } = useAppTheme()
  const { animalId } = route.params
  const { animal, isLoading } = useAnimal(animalId)
  const { deleteAnimal } = useAnimalActions()
  const { records: healthRecords } = useHealthRecords(animalId)
  const { records: weightRecords } = useWeightRecords(animalId)
  const { records: breedingRecords } = useBreedingRecords(animalId)
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  const handleEdit = useCallback(() => {
    navigation.navigate("AnimalForm", { mode: "edit", animalId })
  }, [navigation, animalId])

  const handleDelete = useCallback(async () => {
    await deleteAnimal(animalId)
    navigation.goBack()
  }, [deleteAnimal, animalId, navigation])

  if (isLoading || !animal) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]}>
        <View style={themed($centered)}>
          <Text text={isLoading ? "Loading..." : "Animal not found"} />
        </View>
      </Screen>
    )
  }

  const formatDate = (d: Date | null) => d ? format(d, "dd MMM yyyy") : "—"

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($headerRow)}>
        <Button text="Back" preset="default" onPress={() => navigation.goBack()} />
        <Button text="Edit" preset="default" onPress={handleEdit} />
      </View>

      <Text preset="heading" text={animal.displayName} style={themed($heading)} />
      <View style={themed($metaRow)}>
        <View style={[$statusBadge, { backgroundColor: theme.colors.tint + "22" }]}>
          <Text text={animal.status} size="xxs" style={{ color: theme.colors.tint }} />
        </View>
        <Text text={`${animal.breed} | ${animal.sex}`} size="sm" style={themed($dimText)} />
      </View>

      {/* Tabs */}
      <View style={themed($tabRow)}>
        {(["overview", "health", "weight", "breeding"] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={themed(activeTab === tab ? $tabActive : $tab)}
          >
            <Text
              preset="formLabel"
              text={tab.charAt(0).toUpperCase() + tab.slice(1)}
              style={activeTab === tab ? themed($tabTextActive) : themed($tabText)}
            />
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <View style={themed($section)}>
          <DetailRow label="RFID Tag" value={animal.rfidTag} themed={themed} />
          <DetailRow label="Visual Tag" value={animal.visualTag} themed={themed} />
          <DetailRow label="Date of Birth" value={formatDate(animal.dateOfBirth)} themed={themed} />
          <DetailRow label="Registration #" value={animal.registrationNumber || "—"} themed={themed} />
          {animal.notes ? <DetailRow label="Notes" value={animal.notes} themed={themed} /> : null}

          <Button
            text="Delete Animal"
            preset="default"
            textStyle={themed($deleteText)}
            style={themed($deleteButton)}
            onPress={handleDelete}
          />
        </View>
      )}

      {activeTab === "health" && (
        <View style={themed($section)}>
          <Button
            text="+ Add Health Record"
            preset="filled"
            style={themed($addRecordButton)}
            onPress={() => navigation.navigate("HealthRecordForm", { animalId })}
          />
          {healthRecords.length === 0 ? (
            <Text text="No health records yet." style={themed($dimText)} />
          ) : (
            healthRecords.map((r) => (
              <View key={r.id} style={themed($recordCard)}>
                <View style={themed($recordHeader)}>
                  <Text preset="bold" text={r.recordType} />
                  <Text size="xs" text={formatDate(r.recordDate)} style={themed($dimText)} />
                </View>
                <Text text={r.description} size="sm" />
                {r.productName ? <Text text={`Product: ${r.productName}`} size="xs" style={themed($dimText)} /> : null}
              </View>
            ))
          )}
        </View>
      )}

      {activeTab === "weight" && (
        <View style={themed($section)}>
          <Button
            text="+ Add Weight Record"
            preset="filled"
            style={themed($addRecordButton)}
            onPress={() => navigation.navigate("WeightRecordForm", { animalId })}
          />
          {weightRecords.length >= 2 && <WeightTrend records={weightRecords} themed={themed} />}
          {weightRecords.length === 0 ? (
            <Text text="No weight records yet." style={themed($dimText)} />
          ) : (
            weightRecords.map((r) => (
              <View key={r.id} style={themed($recordCard)}>
                <View style={themed($recordHeader)}>
                  <Text preset="bold" text={`${r.weightKg} kg`} />
                  <Text size="xs" text={formatDate(r.recordDate)} style={themed($dimText)} />
                </View>
                {r.conditionScore ? <Text text={`Condition: ${r.conditionScore}/9`} size="sm" /> : null}
              </View>
            ))
          )}
        </View>
      )}

      {activeTab === "breeding" && (
        <View style={themed($section)}>
          <Button
            text="+ Add Breeding Record"
            preset="filled"
            style={themed($addRecordButton)}
            onPress={() => navigation.navigate("BreedingRecordForm", { animalId })}
          />
          {breedingRecords.length === 0 ? (
            <Text text="No breeding records yet." style={themed($dimText)} />
          ) : (
            breedingRecords.map((r) => (
              <View key={r.id} style={themed($recordCard)}>
                <View style={themed($recordHeader)}>
                  <Text preset="bold" text={r.method} />
                  <Text size="xs" text={r.outcome} style={themed($dimText)} />
                </View>
                <Text text={`Bred: ${formatDate(r.breedingDate)}`} size="sm" />
                {r.expectedCalvingDate ? (
                  <Text text={`Expected calving: ${formatDate(r.expectedCalvingDate)}`} size="xs" style={themed($dimText)} />
                ) : null}
              </View>
            ))
          )}
        </View>
      )}
    </Screen>
  )
}

// Weight trend mini-chart using bar visualization
function WeightTrend({ records, themed }: { records: any[]; themed: any }) {
  // Sort oldest → newest for trend display
  const sorted = [...records].sort(
    (a, b) => (a.recordDate?.getTime() ?? 0) - (b.recordDate?.getTime() ?? 0),
  )
  const weights = sorted.map((r) => r.weightKg)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1
  const latest = weights[weights.length - 1]
  const first = weights[0]
  const change = latest - first
  const changeLabel = change >= 0 ? `+${change.toFixed(0)} kg` : `${change.toFixed(0)} kg`

  return (
    <View style={themed($trendCard)}>
      <View style={themed($trendHeader)}>
        <Text preset="bold" text="Weight Trend" />
        <Text
          text={changeLabel}
          size="sm"
          preset="bold"
          style={{ color: change >= 0 ? "#4A8C3F" : "#D64220" }}
        />
      </View>
      <View style={themed($trendBars)}>
        {sorted.map((r, i) => {
          const pct = range > 0 ? ((r.weightKg - min) / range) * 100 : 50
          const height = Math.max(pct * 0.6 + 20, 20) // min 20%, max 80% height
          return (
            <View key={r.id || i} style={themed($trendBarCol)}>
              <View style={[themed($trendBar), { height: `${height}%` }]} />
              <Text text={`${r.weightKg}`} size="xxs" style={themed($dimText)} />
            </View>
          )
        })}
      </View>
      <View style={themed($trendFooter)}>
        <Text text={`Min: ${min.toFixed(0)} kg`} size="xxs" style={themed($dimText)} />
        <Text text={`Latest: ${latest.toFixed(0)} kg`} size="xxs" preset="bold" />
        <Text text={`Max: ${max.toFixed(0)} kg`} size="xxs" style={themed($dimText)} />
      </View>
    </View>
  )
}

// Simple detail row component
function DetailRow({ label, value, themed }: { label: string; value: string; themed: any }) {
  return (
    <View style={themed($detailRow)}>
      <Text text={label} size="sm" style={themed($detailLabel)} />
      <Text text={value} size="sm" />
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxl,
})

const $centered: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
})

const $headerRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: spacing.md,
  marginBottom: spacing.sm,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $metaRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  marginBottom: spacing.lg,
})

const $statusBadge: ViewStyle = {
  borderRadius: 6,
  paddingHorizontal: 8,
  paddingVertical: 2,
}

const $tabRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.lg,
})

const $tab: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.sm,
  alignItems: "center",
})

const $tabActive: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.tint,
  borderRadius: 8,
  padding: spacing.sm,
  alignItems: "center",
})

const $tabText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $tabTextActive: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
})

const $detailRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  paddingVertical: spacing.xs,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $detailLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $recordCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 10,
  padding: spacing.sm,
})

const $recordHeader: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $addRecordButton: ThemedStyle<ViewStyle> = () => ({
  alignSelf: "flex-start",
})

const $deleteButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xl,
})

const $deleteText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
})

const $trendCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
})

const $trendHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.sm,
})

const $trendBars: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-end",
  height: 80,
  gap: spacing.xs,
})

const $trendBarCol: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "flex-end",
  height: "100%",
})

const $trendBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: "70%",
  borderRadius: 4,
  backgroundColor: colors.tint,
})

const $trendFooter: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: spacing.xs,
})
