import { FC, useCallback, useEffect, useRef, useState } from "react"
import { Alert, FlatList, Pressable, ScrollView, TextInput, View, ViewStyle, TextStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"

import { Screen, Text, TextField, Button, ScanTagButton } from "@/components"
import { WeightChart } from "@/components/WeightChart"
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
import { useScheduledVaccinations } from "@/hooks/useVaccinationSchedules"
import { ScheduledVaccination } from "@/db/models"
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
  const { t } = useTranslation()
  const { themed, theme: { colors } } = useAppTheme()
  const { currentOrg } = useDatabase()
  const { hasFeature } = useSubscription()
  const { createWeightRecord } = useWeightRecordActions()
  const { createHealthRecord } = useHealthRecordActions()
  const { protocols } = useActiveProtocols()

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
  const [animalVaccinations, setAnimalVaccinations] = useState<ScheduledVaccination[]>([])

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
      setAnimalVaccinations([])
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

        // Load pending vaccinations for this animal
        const vaccinations = await database.get<ScheduledVaccination>("scheduled_vaccinations")
          .query(
            Q.where("animal_id", scannedAnimal.id),
            Q.where("is_deleted", false),
            Q.where("status", "pending"),
            Q.sortBy("due_date", Q.asc),
          )
          .fetch()
        setAnimalVaccinations(vaccinations)
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
          Alert.alert(t("common.notFound"), t("chuteScreen.scan.notFound", { tag: rfid.trim() }))
        }
      }
    } catch {
      Alert.alert(t("common.error"), t("common.failedToLoad"))
    }
    setIsSearching(false)
  }, [currentOrg, t])

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
      Alert.alert(t("common.invalid"), t("chuteScreen.weight.invalidWeight"))
      return
    }

    const cs = conditionScore ? parseInt(conditionScore, 10) : undefined
    if (cs !== undefined && (isNaN(cs) || cs < 1 || cs > 9)) {
      Alert.alert(t("common.invalid"), t("chuteScreen.weight.invalidConditionScore"))
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
      Alert.alert(t("common.error"), t("common.failedToSave"))
    }
  }, [scannedAnimal, weightValue, conditionScore, createWeightRecord, resetForNextAnimal, t])

  const handleSaveCondition = useCallback(async () => {
    if (!scannedAnimal) return

    const score = parseInt(conditionValue, 10)
    if (isNaN(score) || score < 1 || score > 9) {
      Alert.alert(t("common.invalid"), t("chuteScreen.weight.invalidConditionScore"))
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
      Alert.alert(t("common.error"), t("common.failedToSave"))
    }
  }, [scannedAnimal, conditionValue, createHealthRecord, resetForNextAnimal, t])

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
      Alert.alert(t("common.error"), t("common.failedToSave"))
    }
  }, [scannedAnimal, selectedProtocol, createHealthRecord, resetForNextAnimal, t])

  const activeMode = sessionMode

  // ─── No session mode selected — show mode picker ───
  if (!sessionMode) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
        <Text preset="heading" text={t("chuteScreen.title")} style={themed($heading)} />
        <Text text={t("chuteScreen.selectMode")} style={themed($subtitle)} />

        <View style={themed($modePickerArea)}>
          <Pressable
            onPress={() => setSessionMode("weight")}
            style={[themed($modeCard), { borderColor: "#4A8C3F" }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name="scale" size={20} color="#4A8C3F" />
              <Text preset="subheading" text={t("chuteScreen.modes.weight.title")} style={{ color: "#4A8C3F" }} />
            </View>
            <Text size="xs" text={t("chuteScreen.modes.weight.description")} style={themed($dimText)} />
          </Pressable>
          <Pressable
            onPress={() => setSessionMode("protocol")}
            style={[themed($modeCard), { borderColor: "#10B981" }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name="needle" size={20} color="#10B981" />
              <Text preset="subheading" text={t("chuteScreen.modes.protocol.title")} style={{ color: "#10B981" }} />
            </View>
            <Text size="xs" text={t("chuteScreen.modes.protocol.description")} style={themed($dimText)} />
          </Pressable>
          <Pressable
            onPress={() => setSessionMode("weight_and_treatment")}
            style={[themed($modeCard), { borderColor: "#8B5CF6" }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name="scale" size={18} color="#8B5CF6" />
              <MaterialCommunityIcons name="needle" size={18} color="#8B5CF6" />
              <Text preset="subheading" text={t("chuteScreen.modes.weightAndTreatment.title")} style={{ color: "#8B5CF6" }} />
            </View>
            <Text size="xs" text={t("chuteScreen.modes.weightAndTreatment.description")} style={themed($dimText)} />
          </Pressable>
        </View>

        {/* Previous session log */}
        {processedLog.length > 0 && (
          <View style={themed($sessionInfo)}>
            <Text preset="formLabel" text={t("chuteScreen.session.previousSession", { count: processedLog.length })} style={themed($sessionLabel)} />
          </View>
        )}
      </Screen>
    )
  }

  const modeColor = activeMode === "weight" ? "#4A8C3F" : activeMode === "weight_and_treatment" ? "#8B5CF6" : activeMode === "protocol" ? "#10B981" : "#F59E0B"
  const modeLabel = activeMode === "weight" ? t("chuteScreen.modes.weight.sessionTitle") : activeMode === "weight_and_treatment" ? t("chuteScreen.modes.weightAndTreatment.sessionTitle") : activeMode === "protocol" ? t("chuteScreen.modes.protocol.sessionTitle") : t("chuteScreen.modes.condition.sessionTitle")

  return (
    <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      {/* Session header */}
      <View style={themed($sessionHeader)}>
        <View style={{ flex: 1 }}>
          <Text preset="bold" text={modeLabel} style={{ color: modeColor }} size="lg" />
          <Text text={t("chuteScreen.session.processed", { count: processedLog.length })} size="xs" style={themed($dimText)} />
        </View>
        <Button text={t("chuteScreen.session.endSession")} preset="default" onPress={() => { setSessionMode(null); resetForNextAnimal() }} />
      </View>

      {!scannedAnimal ? (
        /* ─── SCAN PHASE ─── */
        <View style={themed($scanArea)}>
          <View style={[themed($scanBox), { borderColor: modeColor }]}>
            <Text preset="subheading" text={t("chuteScreen.scan.title")} style={[themed($scanText), { color: modeColor }]} />
            <TextField
              ref={rfidInputRef}
              value={rfidInput}
              onChangeText={setRfidInput}
              placeholder={t("chuteScreen.scan.placeholder")}
              containerStyle={themed($scanInput)}
              autoCapitalize="characters"
              autoFocus
              onSubmitEditing={handleScanSubmit}
            />
            <View style={themed($scanButtons)}>
              <ScanTagButton
                onTagScanned={(tagNumber) => {
                  setRfidInput(tagNumber)
                  lookupAnimal(tagNumber)
                }}
                style={themed($scanTagBtn)}
              />
              <Button
                text={isSearching ? t("chuteScreen.scan.searching") : t("chuteScreen.scan.lookUp")}
                preset="reversed"
                style={themed($lookupButton)}
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
                <Text text={t("chuteScreen.animalInfo.rfid")} size="xxs" style={themed($dimText)} />
                <Text text={scannedAnimal.rfidTag || "—"} size="xs" preset="bold" />
              </View>
              <View style={themed($metaItem)}>
                <Text text={t("chuteScreen.animalInfo.visualTag")} size="xxs" style={themed($dimText)} />
                <Text text={scannedAnimal.visualTag || "—"} size="xs" preset="bold" />
              </View>
              <View style={themed($metaItem)}>
                <Text text={t("chuteScreen.animalInfo.dob")} size="xxs" style={themed($dimText)} />
                <Text text={scannedAnimal.dateOfBirth ? format(scannedAnimal.dateOfBirth, "dd MMM yyyy") : "—"} size="xs" preset="bold" />
              </View>
              {weightHistory.length > 0 && (
                <View style={themed($metaItem)}>
                  <Text text={t("chuteScreen.animalInfo.lastWeight")} size="xxs" style={themed($dimText)} />
                  <Text text={t("chuteScreen.animalInfo.lastWeightValue", { weight: weightHistory[0].weightKg })} size="xs" preset="bold" />
                </View>
              )}
            </View>
          </View>

          {/* ─── VACCINATION ALERTS ─── */}
          {animalVaccinations.length > 0 && (
            <View style={themed($vaccinationAlerts)}>
              {animalVaccinations.map((vacc) => {
                const urgency = vacc.urgencyLevel
                const bgColor = urgency === "critical" || urgency === "overdue"
                  ? colors.errorBackground
                  : urgency === "soon"
                  ? colors.palette.accent100
                  : colors.palette.primary100
                const iconColor = urgency === "critical" || urgency === "overdue"
                  ? colors.error
                  : urgency === "soon"
                  ? colors.palette.accent500
                  : colors.tint

                return (
                  <View key={vacc.id} style={[themed($vaccinationAlert), { backgroundColor: bgColor }]}>
                    <MaterialCommunityIcons name="needle" size={20} color={iconColor} />
                    <View style={themed($vaccinationAlertContent)}>
                      <Text preset="bold" text={`Vaccination ${vacc.displayStatus}`} size="sm" />
                      <Text
                        text={`Dose ${vacc.doseNumber} due ${format(vacc.dueDate, "dd MMM yyyy")}`}
                        size="xs"
                        style={themed($dimText)}
                      />
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* ─── WEIGHT MODE ─── */}
          {activeMode === "weight" && (
            <View style={themed($actionSection)}>
              {/* Weight graph */}
              {weightHistory.length >= 2 && (
                <WeightChart records={weightHistory} />
              )}
              {weightHistory.length === 1 && (
                <View style={themed($singleWeightInfo)}>
                  <Text text={t("chuteScreen.weight.previousWeight")} size="sm" style={themed($dimText)} />
                  <Text preset="bold" text={t("chuteScreen.weight.weightValue", { weight: weightHistory[0].weightKg })} size="lg" />
                  <Text text={format(weightHistory[0].recordDate, "dd MMM yyyy")} size="xs" style={themed($dimText)} />
                </View>
              )}

              {/* Weight entry */}
              <View style={themed($formCard)}>
                <Text preset="formLabel" text={t("chuteScreen.weight.newWeightLabel")} />
                <TextField
                  ref={weightInputRef}
                  value={weightValue}
                  onChangeText={setWeightValue}
                  placeholder={t("chuteScreen.weight.weightPlaceholder")}
                  keyboardType="numeric"
                  autoFocus
                  onSubmitEditing={handleSaveWeight}
                />
                <TextField
                  label={t("chuteScreen.weight.conditionScoreLabel")}
                  value={conditionScore}
                  onChangeText={setConditionScore}
                  placeholder={t("chuteScreen.weight.conditionScorePlaceholder")}
                  keyboardType="numeric"
                />
                <View style={themed($formButtons)}>
                  <Button text={t("common.skip")} preset="default" onPress={handleClearAnimal} />
                  <Button text={t("chuteScreen.weight.saveAndNext")} preset="reversed" onPress={handleSaveWeight} style={themed($saveNextButton)} />
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
                <Text preset="bold" text={t("chuteScreen.weightAndTreatment.step1")} size="md" style={{ color: "#4A8C3F" }} />
                <TextField
                  label={t("chuteScreen.weightAndTreatment.weightLabel")}
                  value={weightValue}
                  onChangeText={setWeightValue}
                  placeholder={t("chuteScreen.weight.weightPlaceholder")}
                  keyboardType="numeric"
                  autoFocus
                />
                <TextField
                  label={t("chuteScreen.weightAndTreatment.conditionScoreLabel")}
                  value={conditionScore}
                  onChangeText={setConditionScore}
                  placeholder={t("chuteScreen.weight.conditionScorePlaceholder")}
                  keyboardType="numeric"
                />
              </View>

              {/* Treatment Protocol Selection */}
              <View style={themed($formCard)}>
                <Text preset="bold" text={t("chuteScreen.weightAndTreatment.step2")} size="md" style={{ color: "#8B5CF6" }} />
                {!selectedProtocol ? (
                  protocols.length === 0 ? (
                    <View style={{ paddingVertical: spacing.md, alignItems: "center" }}>
                      <Text text={t("chuteScreen.weightAndTreatment.noProtocols")} size="sm" style={themed($dimText)} />
                      <Button
                        text={t("chuteScreen.weightAndTreatment.manageProtocols")}
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
                              <Text preset="bold" text={t("chuteScreen.weightAndTreatment.calculatedDosage.title")} size="sm" style={{ color: "#856404", marginBottom: spacing.xs }} />
                              <Text text={t("chuteScreen.weightAndTreatment.calculatedDosage.atWeight", { weight: enteredWeight })} size="xs" style={{ color: "#856404" }} />
                              <Text preset="bold" text={t("chuteScreen.weightAndTreatment.calculatedDosage.give", { ml: calculatedMl.toFixed(1) })} size="lg" style={{ color: "#856404", marginTop: spacing.xxs }} />
                            </View>
                          )
                        }
                      }
                      return null
                    })()}

                    <Button
                      text={t("chuteScreen.weightAndTreatment.changeProtocol")}
                      preset="default"
                      onPress={() => setSelectedProtocol(null)}
                      style={{ marginTop: spacing.xs }}
                    />
                  </View>
                )}
              </View>

              <View style={themed($formButtons)}>
                <Button text={t("common.skip")} preset="default" onPress={handleClearAnimal} />
                <Button
                  text={t("chuteScreen.weightAndTreatment.saveBoth")}
                  preset="reversed"
                  disabled={!selectedProtocol || !weightValue}
                  onPress={async () => {
                    // Validate weight
                    const kg = parseFloat(weightValue)
                    if (isNaN(kg) || kg <= 0) {
                      Alert.alert(t("common.invalid"), t("chuteScreen.weight.invalidWeight"))
                      return
                    }

                    if (!selectedProtocol) {
                      Alert.alert(t("common.required"), t("chuteScreen.weightAndTreatment.required"))
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
                      Alert.alert(t("common.error"), t("common.failedToSave"))
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
                <Text preset="formLabel" text={t("chuteScreen.weight.conditionScoreLabel")} />
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
                        text={s <= 3 ? t("chuteScreen.condition.labels.thin") : s <= 6 ? t("chuteScreen.condition.labels.moderate") : t("chuteScreen.condition.labels.fat")}
                        size="xxs"
                        style={conditionValue === `${s}` ? { color: "#FFF" } : themed($dimText)}
                      />
                    </Pressable>
                  ))}
                </View>
                <View style={themed($formButtons)}>
                  <Button text={t("common.skip")} preset="default" onPress={handleClearAnimal} />
                  <Button text={t("chuteScreen.weight.saveAndNext")} preset="reversed" onPress={handleSaveCondition} style={themed($saveNextButton)} />
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
                  <Text preset="bold" text={t("chuteScreen.protocol.title")} size="md" style={{ color: "#10B981" }} />
                  {protocols.length === 0 ? (
                    <View style={{ paddingVertical: spacing.md, alignItems: "center" }}>
                      <Text text={t("chuteScreen.weightAndTreatment.noProtocols")} size="sm" style={themed($dimText)} />
                      <Button
                        text={t("chuteScreen.weightAndTreatment.manageProtocols")}
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
                  <Button text={t("common.cancel")} preset="default" onPress={handleClearAnimal} style={{ marginTop: spacing.sm }} />
                </View>
              ) : (
                /* Protocol selected - show calculated dosage */
                <View style={themed($formCard)}>
                  <View style={{ backgroundColor: "#10B98122", borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm }}>
                    <Text preset="bold" text={selectedProtocol.name} size="md" style={{ color: "#10B981" }} />
                    <View style={{ marginTop: spacing.xs, gap: spacing.xxs }}>
                      <Text text={t("chuteScreen.protocol.product", { name: selectedProtocol.productName })} size="xs" />
                      <Text text={t("chuteScreen.protocol.standardDosage", { dosage: selectedProtocol.dosage })} size="xs" />
                      {selectedProtocol.administrationMethod && (
                        <Text text={t("chuteScreen.protocol.method", { method: selectedProtocol.administrationMethod })} size="xs" />
                      )}
                      {selectedProtocol.withdrawalDays && (
                        <Text text={t("chuteScreen.protocol.withdrawal", { days: selectedProtocol.withdrawalDays })} size="xs" style={{ color: "#DC2626" }} />
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
                          <Text preset="bold" text={t("chuteScreen.protocol.autoCalculated.title")} size="sm" style={{ color: "#856404", marginBottom: spacing.xs }} />
                          <Text text={t("chuteScreen.protocol.autoCalculated.lastWeight", { weight: latestWeight })} size="xs" style={{ color: "#856404" }} />
                          <Text preset="bold" text={t("chuteScreen.protocol.autoCalculated.give", { ml: calculatedMl.toFixed(1) })} size="lg" style={{ color: "#856404", marginTop: spacing.xxs }} />
                          <Text text={t("chuteScreen.protocol.autoCalculated.based", { ml: mlPerDose, kg: kgPerDose })} size="xxs" style={{ color: "#856404", marginTop: spacing.xxs }} />
                        </View>
                      )
                    }

                    return (
                      <View style={{ backgroundColor: "#E3F2FD", borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm }}>
                        <Text text={t("chuteScreen.protocol.autoCalculated.lastWeight", { weight: latestWeight })} size="xs" style={{ color: "#1565C0" }} />
                        <Text text={t("chuteScreen.protocol.manualDosage")} size="xxs" style={{ color: "#1565C0", marginTop: spacing.xxs }} />
                      </View>
                    )
                  })()}

                  {weightHistory.length === 0 && (
                    <View style={{ backgroundColor: "#FFEBEE", borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm }}>
                      <Text preset="bold" text={t("chuteScreen.protocol.noWeight.title")} size="xs" style={{ color: "#C62828" }} />
                      <Text text={t("chuteScreen.protocol.noWeight.message")} size="xxs" style={{ color: "#C62828", marginTop: spacing.xxs }} />
                    </View>
                  )}

                  <View style={themed($formButtons)}>
                    <Button text={t("chuteScreen.protocol.changeProtocol")} preset="default" onPress={() => setSelectedProtocol(null)} />
                    <Button text={t("chuteScreen.protocol.applyAndNext")} preset="reversed" onPress={handleApplyProtocol} style={themed($saveNextButton)} />
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
          <Text preset="formLabel" text={t("chuteScreen.session.processed", { count: processedLog.length })} style={themed($sessionLabel)} />
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
  flex: 1,
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

const $vaccinationAlerts: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  gap: spacing.xs,
})

const $vaccinationAlert: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  borderRadius: 8,
  padding: spacing.sm,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  borderLeftWidth: 3,
  borderLeftColor: "rgba(0,0,0,0.1)",
})

const $vaccinationAlertContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})
