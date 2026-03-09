import { FC, useCallback, useEffect, useRef, useState } from "react"
import { Alert, FlatList, Pressable, ScrollView, TextInput, View, ViewStyle, TextStyle } from "react-native"
import { format } from "date-fns"

import { Screen, Text, TextField, Button, ScanTagButton } from "@/components"
import { WeightChart } from "@/components/WeightChart"
import { RfidTagIcon } from "@/components/icons"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { spacing } from "@/theme/spacing"
import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { WeightRecord } from "@/db/models/WeightRecord"
import { HealthRecord } from "@/db/models/HealthRecord"
import { useDatabase } from "@/context/DatabaseContext"
import { useSubscription } from "@/context/SubscriptionContext"
import { useWeightRecordActions, useHealthRecordActions } from "@/hooks/useRecords"
import { useActiveProtocols } from "@/hooks/useProtocols"
import { useRfidReader } from "@/hooks/useRfidReader"
import { TreatmentProtocol } from "@/db/models"
import { Q } from "@nozbe/watermelondb"

type SessionMode = "weight" | "condition" | "weight_and_treatment" | "protocol"

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
  const { protocols } = useActiveProtocols()
  const { hasRfidHardware } = useRfidReader()

  const rfidInputRef = useRef<TextInput>(null)
  const weightInputRef = useRef<TextInput>(null)

  // Session mode — pre-select the action for batch processing
  const [sessionMode, setSessionMode] = useState<SessionMode | null>(null)

  // Protocol mode state
  const [selectedProtocol, setSelectedProtocol] = useState<TreatmentProtocol | null>(null)

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

  // Treatment form (for combined weight+treatment mode)
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
    // Don't reset selected protocol — keep it for batch processing
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

  const handleApplyProtocol = useCallback(async () => {
    if (!scannedAnimal || !selectedProtocol) return

    try {
      await createHealthRecord({
        animalId: scannedAnimal.id,
        recordDate: new Date(),
        recordType: selectedProtocol.protocolType,
        description: selectedProtocol.name,
        productName: selectedProtocol.productName,
        dosage: selectedProtocol.dosage,
        protocolId: selectedProtocol.id,
      })

      setProcessedLog((prev) => [{
        id: `${Date.now()}`,
        animalName: scannedAnimal.displayName,
        action: "protocol" as any,
        value: selectedProtocol.name,
        timestamp: new Date(),
      }, ...prev])

      resetForNextAnimal()
    } catch {
      Alert.alert("Error", "Failed to apply protocol")
    }
  }, [scannedAnimal, selectedProtocol, createHealthRecord, resetForNextAnimal])

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
            <Text preset="subheading" text="⚖️ Weigh" style={{ color: "#4A8C3F" }} />
            <Text size="xs" text="Record weight and optional condition score" style={themed($dimText)} />
          </Pressable>
          <Pressable
            onPress={() => setSessionMode("protocol")}
            style={[themed($modeCard), { borderColor: "#10B981" }]}
          >
            <Text preset="subheading" text="💉 Vaccinate / Treat" style={{ color: "#10B981" }} />
            <Text size="xs" text="Apply vaccination or treatment protocols with auto-calculated dosages" style={themed($dimText)} />
          </Pressable>
          <Pressable
            onPress={() => setSessionMode("weight_and_treatment")}
            style={[themed($modeCard), { borderColor: "#8B5CF6" }]}
          >
            <Text preset="subheading" text="⚖️💉 Weigh + Treat" style={{ color: "#8B5CF6" }} />
            <Text size="xs" text="Record weight and apply protocol in one go" style={themed($dimText)} />
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

  const modeColor = activeMode === "weight" ? "#4A8C3F" : activeMode === "weight_and_treatment" ? "#8B5CF6" : activeMode === "protocol" ? "#10B981" : "#F59E0B"
  const modeLabel = activeMode === "weight" ? "Weigh Session" : activeMode === "weight_and_treatment" ? "Weigh + Treat Session" : activeMode === "protocol" ? "Vaccinate / Treat Session" : "Condition Score Session"

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
            <Text preset="subheading" text={hasRfidHardware ? "SCAN TAG" : "ENTER TAG"} style={[themed($scanText), { color: modeColor }]} />
            <TextField
              ref={rfidInputRef}
              value={rfidInput}
              onChangeText={setRfidInput}
              placeholder={hasRfidHardware ? "Scan or enter tag" : "Enter visual tag or RFID"}
              containerStyle={themed($scanInput)}
              autoCapitalize="characters"
              autoFocus
              onSubmitEditing={handleScanSubmit}
            />
            <View style={themed($scanButtons)}>
              {hasRfidHardware && (
                <ScanTagButton
                  onTagScanned={(tagNumber) => {
                    setRfidInput(tagNumber)
                    lookupAnimal(tagNumber)
                  }}
                  style={themed($scanTagBtn)}
                />
              )}
              <Button
                text={isSearching ? "Searching..." : "Look Up"}
                preset="reversed"
                style={hasRfidHardware ? themed($lookupButton) : { flex: 1 }}
                onPress={handleScanSubmit}
              />
            </View>
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

          {/* ─── WEIGHT + TREATMENT COMBINED MODE ─── */}
          {activeMode === "weight_and_treatment" && (
            <View style={themed($actionSection)}>
              {/* Weight section */}
              {weightHistory.length >= 2 && (
                <WeightChart records={weightHistory} />
              )}
              <View style={themed($formCard)}>
                <Text preset="bold" text="1. Record Weight" size="md" style={{ color: "#4A8C3F" }} />
                <TextField
                  label="Weight (kg)"
                  value={weightValue}
                  onChangeText={setWeightValue}
                  placeholder="e.g. 450"
                  keyboardType="numeric"
                  autoFocus
                />
                <TextField
                  label="Condition Score (1-9)"
                  value={conditionScore}
                  onChangeText={setConditionScore}
                  placeholder="Optional, e.g. 6"
                  keyboardType="numeric"
                />
              </View>

              {/* Treatment Protocol Selection */}
              <View style={themed($formCard)}>
                <Text preset="bold" text="2. Select Treatment" size="md" style={{ color: "#8B5CF6" }} />
                {!selectedProtocol ? (
                  protocols.length === 0 ? (
                    <View style={{ paddingVertical: spacing.md, alignItems: "center" }}>
                      <Text text="No active protocols available" size="sm" style={themed($dimText)} />
                      <Button
                        text="Manage Protocols"
                        preset="default"
                        onPress={() => navigation.navigate("TreatmentProtocols")}
                        style={{ marginTop: spacing.sm }}
                      />
                    </View>
                  ) : (
                    <View style={{ gap: spacing.xs }}>
                      {protocols.map((protocol) => (
                        <Pressable
                          key={protocol.id}
                          onPress={() => setSelectedProtocol(protocol)}
                          style={themed($protocolOption)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text preset="bold" text={protocol.name} size="sm" />
                            <Text text={`${protocol.productName} - ${protocol.dosage}`} size="xs" style={themed($dimText)} />
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )
                ) : (
                  <View>
                    <View style={{ backgroundColor: "#8B5CF622", borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm }}>
                      <Text preset="bold" text={selectedProtocol.name} size="sm" style={{ color: "#8B5CF6" }} />
                      <Text text={`${selectedProtocol.productName} - ${selectedProtocol.dosage}`} size="xs" style={themed($dimText)} />
                    </View>

                    {/* Show calculated dosage if weight entered */}
                    {weightValue && (() => {
                      const enteredWeight = parseFloat(weightValue)
                      if (!isNaN(enteredWeight) && enteredWeight > 0) {
                        const dosageMatch = selectedProtocol.dosage.match(/(\d+(?:\.\d+)?)\s*ml\s*\/\s*(\d+(?:\.\d+)?)\s*kg/i)
                        if (dosageMatch) {
                          const mlPerDose = parseFloat(dosageMatch[1])
                          const kgPerDose = parseFloat(dosageMatch[2])
                          const calculatedMl = (enteredWeight / kgPerDose) * mlPerDose

                          return (
                            <View style={{ backgroundColor: "#FFF3CD", borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 2, borderColor: "#FFEB3B" }}>
                              <Text preset="bold" text="💡 Calculated Dosage" size="sm" style={{ color: "#856404", marginBottom: spacing.xs }} />
                              <Text text={`At ${enteredWeight} kg:`} size="xs" style={{ color: "#856404" }} />
                              <Text preset="bold" text={`Give: ${calculatedMl.toFixed(1)} ml`} size="lg" style={{ color: "#856404", marginTop: spacing.xxs }} />
                            </View>
                          )
                        }
                      }
                      return null
                    })()}

                    <Button
                      text="Change Protocol"
                      preset="default"
                      onPress={() => setSelectedProtocol(null)}
                      style={{ marginTop: spacing.xs }}
                    />
                  </View>
                )}
              </View>

              <View style={themed($formButtons)}>
                <Button text="Skip" preset="default" onPress={handleClearAnimal} />
                <Button
                  text="Save Both & Next"
                  preset="reversed"
                  disabled={!selectedProtocol || !weightValue}
                  onPress={async () => {
                    // Validate weight
                    const kg = parseFloat(weightValue)
                    if (isNaN(kg) || kg <= 0) {
                      Alert.alert("Invalid", "Enter a valid weight in kg")
                      return
                    }

                    if (!selectedProtocol) {
                      Alert.alert("Required", "Select a treatment protocol")
                      return
                    }

                    const cs = conditionScore ? parseInt(conditionScore, 10) : undefined

                    try {
                      // Save weight first
                      await createWeightRecord({
                        animalId: scannedAnimal.id,
                        recordDate: new Date(),
                        weightKg: kg,
                        conditionScore: cs,
                      })

                      // Save treatment with protocol
                      await createHealthRecord({
                        animalId: scannedAnimal.id,
                        recordDate: new Date(),
                        recordType: selectedProtocol.protocolType,
                        description: selectedProtocol.name,
                        productName: selectedProtocol.productName,
                        dosage: selectedProtocol.dosage,
                        protocolId: selectedProtocol.id,
                      })

                      setProcessedLog((prev) => [{
                        id: `${Date.now()}`,
                        animalName: scannedAnimal.displayName,
                        action: "weight_and_treatment" as any,
                        value: `${kg}kg + ${selectedProtocol.name}`,
                        timestamp: new Date(),
                      }, ...prev])

                      resetForNextAnimal()
                    } catch {
                      Alert.alert("Error", "Failed to save records")
                    }
                  }}
                  style={themed($saveNextButton)}
                />
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

          {/* ─── PROTOCOL MODE ─── */}
          {activeMode === "protocol" && (
            <View style={themed($actionSection)}>
              {!selectedProtocol ? (
                /* Protocol selection */
                <View style={themed($formCard)}>
                  <Text preset="bold" text="Select Vaccination / Treatment" size="md" style={{ color: "#10B981" }} />
                  {protocols.length === 0 ? (
                    <View style={{ paddingVertical: spacing.md, alignItems: "center" }}>
                      <Text text="No active protocols available" size="sm" style={themed($dimText)} />
                      <Button
                        text="Manage Protocols"
                        preset="default"
                        onPress={() => navigation.navigate("TreatmentProtocols")}
                        style={{ marginTop: spacing.sm }}
                      />
                    </View>
                  ) : (
                    <View style={{ gap: spacing.xs }}>
                      {protocols.map((protocol) => (
                        <Pressable
                          key={protocol.id}
                          onPress={() => setSelectedProtocol(protocol)}
                          style={[
                            themed($protocolOption),
                            selectedProtocol?.id === protocol.id && { borderColor: "#10B981", backgroundColor: "#10B98122" }
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text preset="bold" text={protocol.name} size="sm" />
                            <Text text={`${protocol.productName} - ${protocol.dosage}`} size="xs" style={themed($dimText)} />
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  <Button text="Cancel" preset="default" onPress={handleClearAnimal} style={{ marginTop: spacing.sm }} />
                </View>
              ) : (
                /* Protocol selected - show calculated dosage */
                <View style={themed($formCard)}>
                  <View style={{ backgroundColor: "#10B98122", borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm }}>
                    <Text preset="bold" text={selectedProtocol.name} size="md" style={{ color: "#10B981" }} />
                    <View style={{ marginTop: spacing.xs, gap: spacing.xxs }}>
                      <Text text={`Product: ${selectedProtocol.productName}`} size="xs" />
                      <Text text={`Standard Dosage: ${selectedProtocol.dosage}`} size="xs" />
                      {selectedProtocol.administrationMethod && (
                        <Text text={`Method: ${selectedProtocol.administrationMethod}`} size="xs" />
                      )}
                      {selectedProtocol.withdrawalDays && (
                        <Text text={`Withdrawal: ${selectedProtocol.withdrawalDays} days`} size="xs" style={{ color: "#DC2626" }} />
                      )}
                    </View>
                  </View>

                  {/* Calculated Dosage Section */}
                  {weightHistory.length > 0 && (() => {
                    const latestWeight = weightHistory[0].weightKg
                    const dosageMatch = selectedProtocol.dosage.match(/(\d+(?:\.\d+)?)\s*ml\s*\/\s*(\d+(?:\.\d+)?)\s*kg/i)

                    if (dosageMatch) {
                      const mlPerDose = parseFloat(dosageMatch[1])
                      const kgPerDose = parseFloat(dosageMatch[2])
                      const calculatedMl = (latestWeight / kgPerDose) * mlPerDose

                      return (
                        <View style={{ backgroundColor: "#FFF3CD", borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 2, borderColor: "#FFEB3B" }}>
                          <Text preset="bold" text="💡 Auto-Calculated Dosage" size="sm" style={{ color: "#856404", marginBottom: spacing.xs }} />
                          <Text text={`Last weight: ${latestWeight} kg`} size="xs" style={{ color: "#856404" }} />
                          <Text preset="bold" text={`Give: ${calculatedMl.toFixed(1)} ml`} size="lg" style={{ color: "#856404", marginTop: spacing.xxs }} />
                          <Text text={`Based on ${mlPerDose}ml per ${kgPerDose}kg`} size="xxs" style={{ color: "#856404", marginTop: spacing.xxs }} />
                        </View>
                      )
                    }

                    return (
                      <View style={{ backgroundColor: "#E3F2FD", borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm }}>
                        <Text text={`Last weight: ${latestWeight} kg`} size="xs" style={{ color: "#1565C0" }} />
                        <Text text="Manual dosage required - protocol doesn't specify rate per kg" size="xxs" style={{ color: "#1565C0", marginTop: spacing.xxs }} />
                      </View>
                    )
                  })()}

                  {weightHistory.length === 0 && (
                    <View style={{ backgroundColor: "#FFEBEE", borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm }}>
                      <Text preset="bold" text="⚠️ No Weight on Record" size="xs" style={{ color: "#C62828" }} />
                      <Text text="Weigh this animal first for accurate dosage calculation" size="xxs" style={{ color: "#C62828", marginTop: spacing.xxs }} />
                    </View>
                  )}

                  <View style={themed($formButtons)}>
                    <Button text="Change Protocol" preset="default" onPress={() => setSelectedProtocol(null)} />
                    <Button text="Apply & Next" preset="reversed" onPress={handleApplyProtocol} style={themed($saveNextButton)} />
                  </View>
                </View>
              )}
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

const $scanButtons: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  marginTop: spacing.sm,
  width: "100%",
})

const $scanTagBtn: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $lookupButton: ThemedStyle<ViewStyle> = () => ({
  flex: 2,
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

const $protocolOption: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.md,
  borderWidth: 2,
  borderColor: colors.palette.neutral300,
  flexDirection: "row",
  alignItems: "center",
})
