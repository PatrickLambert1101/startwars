import { FC, useCallback, useEffect, useRef, useState } from "react"
import { Alert, FlatList, Pressable, ScrollView, TextInput, View, ViewStyle, TextStyle } from "react-native"
import { format } from "date-fns"

import { Screen, Text, TextField, Button } from "@/components"
import { WeightChart } from "@/components/WeightChart"
import { RfidTagIcon } from "@/components/icons"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { WeightRecord } from "@/db/models/WeightRecord"
import { HealthRecord } from "@/db/models/HealthRecord"
import { useDatabase } from "@/context/DatabaseContext"
import { useSubscription } from "@/context/SubscriptionContext"
import { useWeightRecordActions, useHealthRecordActions } from "@/hooks/useRecords"
import { Q } from "@nozbe/watermelondb"

type SessionMode = "weight" | "treatment" | "condition"

type ProcessedEntry = {
  id: string
  animalName: string
  action: SessionMode
  value: string
  timestamp: Date
}

export const ChuteScreen: FC<any> = ({ navigation }: any) => {
  const { themed, theme } = useAppTheme()
  const { currentOrg } = useDatabase()
  const { hasFeature } = useSubscription()
  const { createWeightRecord } = useWeightRecordActions()
  const { createHealthRecord } = useHealthRecordActions()

  const rfidInputRef = useRef<TextInput>(null)
  const weightInputRef = useRef<TextInput>(null)

  // Session mode — pre-select the action for batch processing
  const [sessionMode, setSessionMode] = useState<SessionMode | null>(null)

  // Scan state
  const [rfidInput, setRfidInput] = useState("")
  const [scannedAnimal, setScannedAnimal] = useState<Animal | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Animal history (loaded after scan)
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([])
  const [healthHistory, setHealthHistory] = useState<HealthRecord[]>([])

  // Weight form
  const [weightValue, setWeightValue] = useState("")
  const [conditionScore, setConditionScore] = useState("")

  // Treatment form
  const [treatmentType, setTreatmentType] = useState<"vaccination" | "treatment">("vaccination")
  const [treatmentDesc, setTreatmentDesc] = useState("")
  const [productName, setProductName] = useState("")
  const [dosage, setDosage] = useState("")

  // Condition form
  const [conditionValue, setConditionValue] = useState("")

  // Session log
  const [processedLog, setProcessedLog] = useState<ProcessedEntry[]>([])

  // Load animal history when scanned
  useEffect(() => {
    if (!scannedAnimal) {
      setWeightHistory([])
      setHealthHistory([])
      return
    }

    const loadHistory = async () => {
      try {
        const weights = await database.get<WeightRecord>("weight_records")
          .query(
            Q.where("animal_id", scannedAnimal.id),
            Q.where("is_deleted", false),
            Q.sortBy("record_date", Q.desc),
          )
          .fetch()
        setWeightHistory(weights)

        const health = await database.get<HealthRecord>("health_records")
          .query(
            Q.where("animal_id", scannedAnimal.id),
            Q.where("is_deleted", false),
            Q.sortBy("record_date", Q.desc),
            Q.take(5),
          )
          .fetch()
        setHealthHistory(health)
      } catch {
        // Silently fail — history is supplementary
      }
    }
    loadHistory()
  }, [scannedAnimal])

  const lookupAnimal = useCallback(async (rfid: string) => {
    if (!currentOrg || !rfid.trim()) return

    setIsSearching(true)
    try {
      const results = await database.get<Animal>("animals")
        .query(
          Q.where("organization_id", currentOrg.id),
          Q.where("rfid_tag", rfid.trim()),
          Q.where("is_deleted", false),
        )
        .fetch()

      if (results.length > 0) {
        setScannedAnimal(results[0])
      } else {
        // Try visual tag fallback
        const byVisual = await database.get<Animal>("animals")
          .query(
            Q.where("organization_id", currentOrg.id),
            Q.where("visual_tag", rfid.trim()),
            Q.where("is_deleted", false),
          )
          .fetch()

        if (byVisual.length > 0) {
          setScannedAnimal(byVisual[0])
        } else {
          Alert.alert("Not Found", `No animal found with tag "${rfid.trim()}". Add it first in the Herd tab.`)
        }
      }
    } catch {
      Alert.alert("Error", "Failed to look up animal")
    }
    setIsSearching(false)
  }, [currentOrg])

  const handleScanSubmit = useCallback(() => {
    lookupAnimal(rfidInput)
  }, [rfidInput, lookupAnimal])

  const resetForNextAnimal = useCallback(() => {
    setScannedAnimal(null)
    setWeightValue("")
    setConditionScore("")
    setTreatmentDesc("")
    setProductName("")
    setDosage("")
    setConditionValue("")
    setRfidInput("")
    setTimeout(() => rfidInputRef.current?.focus(), 100)
  }, [])

  const handleSaveWeight = useCallback(async () => {
    if (!scannedAnimal) return

    const kg = parseFloat(weightValue)
    if (isNaN(kg) || kg <= 0) {
      Alert.alert("Invalid", "Enter a valid weight in kg")
      return
    }

    const cs = conditionScore ? parseInt(conditionScore, 10) : undefined
    if (cs !== undefined && (isNaN(cs) || cs < 1 || cs > 9)) {
      Alert.alert("Invalid", "Condition score must be 1-9")
      return
    }

    try {
      await createWeightRecord({
        animalId: scannedAnimal.id,
        recordDate: new Date(),
        weightKg: kg,
        conditionScore: cs,
      })

      setProcessedLog((prev) => [{
        id: `${Date.now()}`,
        animalName: scannedAnimal.displayName,
        action: "weight",
        value: `${kg} kg${cs ? ` (CS: ${cs})` : ""}`,
        timestamp: new Date(),
      }, ...prev])

      resetForNextAnimal()
    } catch {
      Alert.alert("Error", "Failed to save weight record")
    }
  }, [scannedAnimal, weightValue, conditionScore, createWeightRecord, resetForNextAnimal])

  const handleSaveTreatment = useCallback(async () => {
    if (!scannedAnimal) return

    if (!treatmentDesc.trim() && !productName.trim()) {
      Alert.alert("Required", "Enter a description or product name")
      return
    }

    const desc = treatmentDesc.trim() || productName.trim()
    const fullDesc = [desc, dosage.trim() ? `Dosage: ${dosage.trim()}` : ""].filter(Boolean).join(" — ")

    try {
      await createHealthRecord({
        animalId: scannedAnimal.id,
        recordDate: new Date(),
        recordType: treatmentType,
        description: fullDesc,
        productName: productName.trim() || undefined,
        dosage: dosage.trim() || undefined,
      })

      setProcessedLog((prev) => [{
        id: `${Date.now()}`,
        animalName: scannedAnimal.displayName,
        action: "treatment",
        value: `${treatmentType}: ${desc}`,
        timestamp: new Date(),
      }, ...prev])

      resetForNextAnimal()
    } catch {
      Alert.alert("Error", "Failed to save health record")
    }
  }, [scannedAnimal, treatmentType, treatmentDesc, productName, dosage, createHealthRecord, resetForNextAnimal])

  const handleSaveCondition = useCallback(async () => {
    if (!scannedAnimal) return

    const score = parseInt(conditionValue, 10)
    if (isNaN(score) || score < 1 || score > 9) {
      Alert.alert("Invalid", "Condition score must be 1-9")
      return
    }

    try {
      await createHealthRecord({
        animalId: scannedAnimal.id,
        recordDate: new Date(),
        recordType: "condition_score",
        description: `Condition score: ${score}/9`,
      })

      setProcessedLog((prev) => [{
        id: `${Date.now()}`,
        animalName: scannedAnimal.displayName,
        action: "condition",
        value: `${score}/9`,
        timestamp: new Date(),
      }, ...prev])

      resetForNextAnimal()
    } catch {
      Alert.alert("Error", "Failed to save condition score")
    }
  }, [scannedAnimal, conditionValue, createHealthRecord, resetForNextAnimal])

  const handleClearAnimal = useCallback(() => {
    resetForNextAnimal()
  }, [resetForNextAnimal])

  const activeMode = sessionMode

  // ─── No session mode selected — show mode picker ───
  if (!sessionMode) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
        <Text preset="heading" text="Chute Mode" style={themed($heading)} />
        <Text text="Select what you're recording today" style={themed($subtitle)} />

        <View style={themed($modePickerArea)}>
          <Pressable
            onPress={() => setSessionMode("weight")}
            style={[themed($modeCard), { borderColor: "#4A8C3F" }]}
          >
            <Text preset="subheading" text="Weigh" style={{ color: "#4A8C3F" }} />
            <Text size="xs" text="Scan, see weight history, record new weight" style={themed($dimText)} />
          </Pressable>
          <Pressable
            onPress={() => setSessionMode("treatment")}
            style={[themed($modeCard), { borderColor: "#3B82F6" }]}
          >
            <Text preset="subheading" text="Vaccinate / Treat" style={{ color: "#3B82F6" }} />
            <Text size="xs" text="Scan, administer vaccine or treatment" style={themed($dimText)} />
          </Pressable>
          <Pressable
            onPress={() => setSessionMode("condition")}
            style={[themed($modeCard), { borderColor: "#F59E0B" }]}
          >
            <Text preset="subheading" text="Condition Score" style={{ color: "#F59E0B" }} />
            <Text size="xs" text="Scan, score body condition 1-9" style={themed($dimText)} />
          </Pressable>
        </View>

        {/* Previous session log */}
        {processedLog.length > 0 && (
          <View style={themed($sessionInfo)}>
            <Text preset="formLabel" text={`Previous session: ${processedLog.length} processed`} style={themed($sessionLabel)} />
          </View>
        )}
      </Screen>
    )
  }

  const modeColor = activeMode === "weight" ? "#4A8C3F" : activeMode === "treatment" ? "#3B82F6" : "#F59E0B"
  const modeLabel = activeMode === "weight" ? "Weigh Session" : activeMode === "treatment" ? "Vaccine / Treatment Session" : "Condition Score Session"

  return (
    <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      {/* Session header */}
      <View style={themed($sessionHeader)}>
        <View style={{ flex: 1 }}>
          <Text preset="bold" text={modeLabel} style={{ color: modeColor }} size="lg" />
          <Text text={`${processedLog.length} processed`} size="xs" style={themed($dimText)} />
        </View>
        <Button text="End Session" preset="default" onPress={() => { setSessionMode(null); resetForNextAnimal() }} />
      </View>

      {!scannedAnimal ? (
        /* ─── SCAN PHASE ─── */
        <View style={themed($scanArea)}>
          <View style={[themed($scanBox), { borderColor: modeColor }]}>
            <RfidTagIcon size={48} color={modeColor} />
            <Text preset="subheading" text="SCAN RFID" style={[themed($scanText), { color: modeColor }]} />
            <TextField
              ref={rfidInputRef}
              value={rfidInput}
              onChangeText={setRfidInput}
              placeholder="Enter RFID or visual tag"
              containerStyle={themed($scanInput)}
              autoCapitalize="characters"
              autoFocus
              onSubmitEditing={handleScanSubmit}
            />
            <Button
              text={isSearching ? "Searching..." : "Look Up"}
              preset="reversed"
              style={themed($lookupButton)}
              onPress={handleScanSubmit}
            />
          </View>
        </View>
      ) : (
        /* ─── ANIMAL FOUND — SHOW DETAILS + ACTION FORM ─── */
        <ScrollView style={themed($scrollContent)} showsVerticalScrollIndicator={false}>
          {/* Animal info card */}
          <View style={themed($animalCard)}>
            <View style={themed($animalCardTop)}>
              <View style={{ flex: 1 }}>
                <Text preset="bold" text={scannedAnimal.displayName} size="xl" />
                <Text text={`${scannedAnimal.breed} | ${scannedAnimal.sexLabel}`} size="sm" style={themed($dimText)} />
              </View>
              <View style={[$statusBadge, { backgroundColor: modeColor + "22" }]}>
                <Text text={scannedAnimal.status} size="xxs" style={{ color: modeColor }} />
              </View>
            </View>
            <View style={themed($animalMeta)}>
              <View style={themed($metaItem)}>
                <Text text="RFID" size="xxs" style={themed($dimText)} />
                <Text text={scannedAnimal.rfidTag || "—"} size="xs" preset="bold" />
              </View>
              <View style={themed($metaItem)}>
                <Text text="Visual Tag" size="xxs" style={themed($dimText)} />
                <Text text={scannedAnimal.visualTag || "—"} size="xs" preset="bold" />
              </View>
              <View style={themed($metaItem)}>
                <Text text="DOB" size="xxs" style={themed($dimText)} />
                <Text text={scannedAnimal.dateOfBirth ? format(scannedAnimal.dateOfBirth, "dd MMM yyyy") : "—"} size="xs" preset="bold" />
              </View>
              {weightHistory.length > 0 && (
                <View style={themed($metaItem)}>
                  <Text text="Last Weight" size="xxs" style={themed($dimText)} />
                  <Text text={`${weightHistory[0].weightKg} kg`} size="xs" preset="bold" />
                </View>
              )}
            </View>
          </View>

          {/* ─── WEIGHT MODE ─── */}
          {activeMode === "weight" && (
            <View style={themed($actionSection)}>
              {/* Weight graph */}
              {weightHistory.length >= 2 && (
                <WeightChart records={weightHistory} />
              )}
              {weightHistory.length === 1 && (
                <View style={themed($singleWeightInfo)}>
                  <Text text="Previous weight:" size="sm" style={themed($dimText)} />
                  <Text preset="bold" text={`${weightHistory[0].weightKg} kg`} size="lg" />
                  <Text text={format(weightHistory[0].recordDate, "dd MMM yyyy")} size="xs" style={themed($dimText)} />
                </View>
              )}

              {/* Weight entry */}
              <View style={themed($formCard)}>
                <Text preset="formLabel" text="New Weight (kg)" />
                <TextField
                  ref={weightInputRef}
                  value={weightValue}
                  onChangeText={setWeightValue}
                  placeholder="e.g. 450"
                  keyboardType="numeric"
                  autoFocus
                  onSubmitEditing={handleSaveWeight}
                />
                <TextField
                  label="Condition Score (1-9)"
                  value={conditionScore}
                  onChangeText={setConditionScore}
                  placeholder="Optional, e.g. 6"
                  keyboardType="numeric"
                />
                <View style={themed($formButtons)}>
                  <Button text="Skip" preset="default" onPress={handleClearAnimal} />
                  <Button text="Save & Next" preset="reversed" onPress={handleSaveWeight} style={themed($saveNextButton)} />
                </View>
              </View>
            </View>
          )}

          {/* ─── TREATMENT / VACCINE MODE ─── */}
          {activeMode === "treatment" && (
            <View style={themed($actionSection)}>
              {/* Recent health records */}
              {healthHistory.length > 0 && (
                <View style={themed($historyCard)}>
                  <Text preset="bold" text="Recent Records" size="sm" style={{ marginBottom: 6 }} />
                  {healthHistory.slice(0, 3).map((r) => (
                    <View key={r.id} style={themed($historyRow)}>
                      <View style={themed($historyDot)} />
                      <View style={{ flex: 1 }}>
                        <Text text={r.description} size="xs" numberOfLines={1} />
                        <Text text={`${r.recordType} — ${format(r.recordDate, "dd MMM yyyy")}`} size="xxs" style={themed($dimText)} />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Treatment form */}
              <View style={themed($formCard)}>
                <View style={themed($typeToggle)}>
                  <Pressable
                    onPress={() => {
                      if (!hasFeature("vaccines")) {
                        Alert.alert("Pro Feature", "Vaccine protocols require HerdTrackr Pro.", [
                          { text: "Cancel" },
                          { text: "Upgrade", onPress: () => navigation?.navigate("Upgrade") },
                        ])
                        return
                      }
                      setTreatmentType("vaccination")
                    }}
                    style={[themed($typeBtn), treatmentType === "vaccination" && { backgroundColor: "#3B82F6" }]}
                  >
                    <Text
                      text={hasFeature("vaccines") ? "Vaccination" : "Vaccination (PRO)"}
                      size="xs"
                      style={treatmentType === "vaccination" ? { color: "#FFF" } : themed($dimText)}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => setTreatmentType("treatment")}
                    style={[themed($typeBtn), treatmentType === "treatment" && { backgroundColor: "#3B82F6" }]}
                  >
                    <Text text="Treatment" size="xs" style={treatmentType === "treatment" ? { color: "#FFF" } : themed($dimText)} />
                  </Pressable>
                </View>
                <TextField
                  label="Product Name"
                  value={productName}
                  onChangeText={setProductName}
                  placeholder="e.g. Covexin 10, Ivermectin"
                  autoFocus
                />
                <TextField
                  label="Dosage"
                  value={dosage}
                  onChangeText={setDosage}
                  placeholder="e.g. 2ml SC"
                />
                <TextField
                  label="Description"
                  value={treatmentDesc}
                  onChangeText={setTreatmentDesc}
                  placeholder="Additional details..."
                />
                <View style={themed($formButtons)}>
                  <Button text="Skip" preset="default" onPress={handleClearAnimal} />
                  <Button text="Save & Next" preset="reversed" onPress={handleSaveTreatment} style={themed($saveNextButton)} />
                </View>
              </View>
            </View>
          )}

          {/* ─── CONDITION SCORE MODE ─── */}
          {activeMode === "condition" && (
            <View style={themed($actionSection)}>
              <View style={themed($formCard)}>
                <Text preset="formLabel" text="Condition Score (1-9)" />
                <View style={themed($scoreGrid)}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setConditionValue(`${s}`)}
                      style={[
                        themed($scoreBtn),
                        conditionValue === `${s}` && { backgroundColor: "#F59E0B", borderColor: "#F59E0B" },
                      ]}
                    >
                      <Text
                        preset="bold"
                        text={`${s}`}
                        size="lg"
                        style={conditionValue === `${s}` ? { color: "#FFF" } : {}}
                      />
                      <Text
                        text={s <= 3 ? "Thin" : s <= 6 ? "Moderate" : "Fat"}
                        size="xxs"
                        style={conditionValue === `${s}` ? { color: "#FFF" } : themed($dimText)}
                      />
                    </Pressable>
                  ))}
                </View>
                <View style={themed($formButtons)}>
                  <Button text="Skip" preset="default" onPress={handleClearAnimal} />
                  <Button text="Save & Next" preset="reversed" onPress={handleSaveCondition} style={themed($saveNextButton)} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Session log */}
      {processedLog.length > 0 && !scannedAnimal && (
        <View style={themed($sessionInfo)}>
          <Text preset="formLabel" text={`Session: ${processedLog.length} processed`} style={themed($sessionLabel)} />
          <FlatList
            data={processedLog}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={themed($logEntry)}>
                <Text size="sm" text={item.animalName} preset="bold" />
                <Text size="xs" text={item.value} style={themed($dimText)} />
              </View>
            )}
            style={themed($logList)}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </Screen>
  )
}

// ─── Styles ───

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  marginBottom: spacing.xs,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.lg,
})

const $modePickerArea: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  gap: spacing.md,
})

const $modeCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  borderWidth: 2,
  gap: spacing.xxs,
})

const $sessionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.sm,
  marginBottom: spacing.xs,
})

const $scanArea: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  marginBottom: spacing.md,
})

const $scanBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.xl,
  alignItems: "center",
  borderWidth: 2,
  borderStyle: "dashed",
})

const $scanText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  letterSpacing: 2,
})

const $scanInput: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
})

const $lookupButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  width: "100%",
})

const $scrollContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $animalCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 14,
  padding: spacing.md,
  marginBottom: spacing.sm,
})

const $animalCardTop: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: spacing.sm,
})

const $statusBadge: ViewStyle = {
  borderRadius: 6,
  paddingHorizontal: 8,
  paddingVertical: 2,
}

const $animalMeta: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
})

const $metaItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  borderRadius: 8,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  minWidth: 80,
})

const $actionSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
  paddingBottom: spacing.xl,
})

const $singleWeightInfo: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 14,
  padding: spacing.md,
  alignItems: "center",
  gap: spacing.xxs,
})

// Form styles
const $formCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 14,
  padding: spacing.md,
  gap: spacing.sm,
})

const $formButtons: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  gap: spacing.sm,
  marginTop: spacing.xs,
})

const $saveNextButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

// Treatment type toggle
const $typeToggle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.xs,
})

const $typeBtn: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral200,
  borderRadius: 8,
  paddingVertical: spacing.xs,
  alignItems: "center",
})

// Health history
const $historyCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 14,
  padding: spacing.md,
})

const $historyRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  paddingVertical: spacing.xxs,
})

const $historyDot: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: colors.tint,
})

// Condition score grid
const $scoreGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})

const $scoreBtn: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: "30%",
  backgroundColor: colors.palette.neutral200,
  borderRadius: 12,
  paddingVertical: spacing.sm,
  alignItems: "center",
  borderWidth: 2,
  borderColor: colors.palette.neutral300,
})

// Session log
const $sessionInfo: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderTopWidth: 1,
  borderTopColor: colors.separator,
  paddingTop: spacing.sm,
  maxHeight: 180,
})

const $sessionLabel: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $logList: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $logEntry: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.xxs,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})
