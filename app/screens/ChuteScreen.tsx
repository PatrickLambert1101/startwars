import { FC, useCallback, useEffect, useRef, useState } from "react"
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  TextInput,
  View,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Q } from "@nozbe/watermelondb"
import { useFocusEffect, useIsFocused } from "@react-navigation/native"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"
import Toast from "react-native-toast-message"

import { Screen, Text, TextField, Button, ScanTagButton, AppHeader } from "@/components"
import { BentoChuteModes } from "@/components/BentoWorkflowCards"
import { ConditionScoreInput } from "@/components/ConditionScoreInput"
import { MeasurementInput } from "@/components/MeasurementInput"
import { WeightChart } from "@/components/WeightChart"
import { useDatabase } from "@/context/DatabaseContext"
import { useSubscription } from "@/context/SubscriptionContext"
import { database } from "@/db"
import { ScheduledVaccination } from "@/db/models"
import { ProtocolType, TreatmentProtocol } from "@/db/models"
import { Animal } from "@/db/models/Animal"
import { HealthRecord, HealthRecordType } from "@/db/models/HealthRecord"
import { WeightRecord } from "@/db/models/WeightRecord"
import { useActiveProtocols } from "@/hooks/useProtocols"
import {
  useWeightRecordActions,
  useHealthRecordActions,
  useCombinedRecordActions,
} from "@/hooks/useRecords"
import { useRfidReader } from "@/hooks/useRfidReader"
import { useSaveGuard } from "@/hooks/useSaveGuard"
import { useScheduledVaccinations } from "@/hooks/useVaccinationSchedules"
import { bentoColors, bentoRadii } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"
import { spacing } from "@/theme/spacing"
import type { ThemedStyle } from "@/theme/types"

type SessionMode = "weight" | "condition" | "weight_and_treatment" | "protocol"
type ProtocolFilter = "all" | ProtocolType

type ProcessedEntry = {
  id: string
  animalName: string
  action: SessionMode
  value: string
  timestamp: Date
}

/**
 * A protocol's type maps 1:1 onto a health-record type except "deworming",
 * which health records don't have — it's stored as a "treatment" (matching the
 * manual health-record form). Writing the raw "deworming" produces an
 * out-of-enum recordType that no report bucket or filter counts.
 */
function protocolRecordType(protocol: TreatmentProtocol): HealthRecordType {
  return protocol.protocolType === "deworming" ? "treatment" : protocol.protocolType
}

export const ChuteScreen: FC<any> = ({ navigation, route }: any) => {
  const { t } = useTranslation()
  const {
    themed,
    theme: { colors, isDark },
  } = useAppTheme()
  const c = bentoColors(isDark)
  const { currentOrg } = useDatabase()
  const isFocused = useIsFocused()

  // Check if we're in single animal mode (from vaccination)
  const singleModeRequestId = route?.params?.requestId
  const isSingleMode = route?.params?.mode === "single" && Boolean(singleModeRequestId)
  const preSelectedAnimalId = route?.params?.animalId
  const preSelectedProtocolId = route?.params?.protocolId
  const vaccinationId = route?.params?.vaccinationId
  const hasRouteSelection = Boolean(
    route?.params?.mode ||
    preSelectedAnimalId ||
    preSelectedProtocolId ||
    vaccinationId ||
    singleModeRequestId,
  )
  const { hasFeature } = useSubscription()
  const { createWeightRecord } = useWeightRecordActions()
  const { createWeightAndTreatment } = useCombinedRecordActions()
  const { isSaving, runSave } = useSaveGuard()
  const [lastSaved, setLastSaved] = useState("")
  const confirmSaved = useCallback(
    (animal: string, value: string) => {
      const receipt = t("uxFixes.savedAnimal", { animal, value })
      setLastSaved(receipt)
      Toast.show({ type: "success", text1: t("uxFixes.savedLocally"), text2: receipt })
    },
    [t],
  )
  const { createHealthRecord } = useHealthRecordActions()
  const { protocols } = useActiveProtocols()

  const rfidInputRef = useRef<TextInput>(null)
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // RFID scanner integration
  const {
    hasRfidHardware,
    isInitialized,
    isScanning,
    scannedTag,
    initialize,
    stopScanning,
    clearScannedTag,
  } = useRfidReader()

  // Session mode — pre-select the action for batch processing
  const [sessionMode, setSessionMode] = useState<SessionMode | null>(null)

  // Protocol mode state
  const [selectedProtocol, setSelectedProtocol] = useState<TreatmentProtocol | null>(null)
  const [protocolFilter, setProtocolFilter] = useState<ProtocolFilter>("all")

  // Scan state
  const [rfidInput, setRfidInput] = useState("")
  const [sessionAnimal, setScannedAnimal] = useState<Animal | null>(null)
  // Never let a retained draft target an animal from the previously selected farm.
  const scannedAnimal = sessionAnimal?.organizationId === currentOrg?.id ? sessionAnimal : null
  const [isSearching, setIsSearching] = useState(false)

  // Debug RFID state (kept below the state it reads — referencing it above the
  // useState declarations is a use-before-declaration and, under strict TDZ,
  // throws at render).
  useEffect(() => {
    console.log("[Chute] RFID state:", {
      hasRfidHardware,
      isInitialized,
      isScanning,
      scannedTag: scannedTag?.epc,
      sessionMode,
      scannedAnimal: scannedAnimal?.displayName,
    })
  }, [hasRfidHardware, isInitialized, isScanning, scannedTag, sessionMode, scannedAnimal])

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

  const sessionOrgIdRef = useRef(currentOrg?.id)
  useEffect(() => {
    if (sessionOrgIdRef.current === currentOrg?.id) return
    sessionOrgIdRef.current = currentOrg?.id
    setSessionMode(null)
    setSelectedProtocol(null)
    setProtocolFilter("all")
    setScannedAnimal(null)
    setRfidInput("")
    setWeightValue("")
    setConditionScore("")
    setConditionValue("")
    setTreatmentDesc("")
    setProductName("")
    setDosage("")
    setProcessedLog([])
    setLastSaved("")
    clearScannedTag()
  }, [currentOrg?.id, clearScannedTag])

  // Keep batch drafts when visiting another tab. Route-driven entries reset on exit.
  useFocusEffect(
    useCallback(() => {
      // Discard any RFID event this mounted tab received while it was hidden.
      clearScannedTag()
      if (hasRouteSelection && !isSingleMode) {
        navigation.setParams({
          mode: undefined,
          animalId: undefined,
          protocolId: undefined,
          vaccinationId: undefined,
          requestId: undefined,
        })
      }

      // Cleanup function runs when screen loses focus
      return () => {
        if (!hasRouteSelection) {
          clearScannedTag()
          return
        }
        console.log("[Chute] Cleaning up route-driven state on blur")
        setSessionMode(null)
        setSelectedProtocol(null)
        setProtocolFilter("all")
        setScannedAnimal(null)
        setRfidInput("")
        setWeightValue("")
        setConditionScore("")
        setConditionValue("")
        setTreatmentDesc("")
        setProductName("")
        setDosage("")
        setProcessedLog([])
        clearScannedTag()

        if (hasRouteSelection) {
          navigation.setParams({
            mode: undefined,
            animalId: undefined,
            protocolId: undefined,
            vaccinationId: undefined,
            requestId: undefined,
          })
        }
      }
    }, [clearScannedTag, hasRouteSelection, isSingleMode, navigation]),
  )

  // Initialize RFID if available
  useEffect(() => {
    if (hasRfidHardware && !isInitialized) {
      initialize()
    }
  }, [hasRfidHardware, isInitialized, initialize])

  // Scanning timeout - stop scanning after 10 seconds if no animal found
  useEffect(() => {
    if (isScanning && sessionMode && !scannedAnimal) {
      console.log("[Chute] Starting 10-second scan timeout")
      scanTimeoutRef.current = setTimeout(() => {
        console.log("[Chute] Scan timeout reached, stopping scan")
        stopScanning()
      }, 10000)
    } else {
      // Clear timeout if scanning stopped or animal found
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current)
        scanTimeoutRef.current = null
      }
    }

    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current)
        scanTimeoutRef.current = null
      }
    }
  }, [isScanning, sessionMode, scannedAnimal, stopScanning])

  // Auto-select animal and protocol in single mode
  useEffect(() => {
    if (isSingleMode && preSelectedAnimalId && preSelectedProtocolId) {
      // Load the animal
      const loadAnimal = async () => {
        try {
          const animal = await database.get<Animal>("animals").find(preSelectedAnimalId)
          setScannedAnimal(animal)
          setRfidInput(animal.rfidTag || animal.visualTag || "")
        } catch (error) {
          console.error("[Chute] Failed to load animal:", error)
        }
      }

      // Load the protocol
      const loadProtocol = async () => {
        try {
          const protocol = await database
            .get<TreatmentProtocol>("treatment_protocols")
            .find(preSelectedProtocolId)
          setSelectedProtocol(protocol)
          setSessionMode("protocol")
        } catch (error) {
          console.error("[Chute] Failed to load protocol:", error)
        }
      }

      loadAnimal()
      loadProtocol()
    }
  }, [isSingleMode, preSelectedAnimalId, preSelectedProtocolId, singleModeRequestId])

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
        const weights = await database
          .get<WeightRecord>("weight_records")
          .query(
            Q.where("animal_id", scannedAnimal.id),
            Q.where("is_deleted", false),
            Q.sortBy("record_date", Q.desc),
          )
          .fetch()
        setWeightHistory(weights)

        const health = await database
          .get<HealthRecord>("health_records")
          .query(
            Q.where("animal_id", scannedAnimal.id),
            Q.where("is_deleted", false),
            Q.sortBy("record_date", Q.desc),
            Q.take(5),
          )
          .fetch()
        setHealthHistory(health)

        // Load pending vaccinations for this animal
        const vaccinations = await database
          .get<ScheduledVaccination>("scheduled_vaccinations")
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

  const lookupAnimal = useCallback(
    async (rfid: string) => {
      if (!currentOrg || !rfid.trim()) return

      setIsSearching(true)
      try {
        const results = await database
          .get<Animal>("animals")
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
          const byVisual = await database
            .get<Animal>("animals")
            .query(
              Q.where("organization_id", currentOrg.id),
              Q.where("visual_tag", rfid.trim()),
              Q.where("is_deleted", false),
            )
            .fetch()

          if (byVisual.length > 0) {
            setScannedAnimal(byVisual[0])
          } else {
            // Show red toast for not found
            Toast.show({
              type: "error",
              text1: t("chuteScreen.scan.notFound", { tag: rfid.trim() }),
              position: "top",
              visibilityTime: 3000,
            })
            setRfidInput("") // Clear input
          }
        }
      } catch {
        Alert.alert(t("common.error"), t("common.failedToLoad"))
      }
      setIsSearching(false)
    },
    [currentOrg, t],
  )

  // Auto-lookup when RFID tag is scanned (access-scanner pattern: direct trigger
  // on tag change). Placed after lookupAnimal so it isn't referenced before its
  // declaration.
  useEffect(() => {
    if (!scannedTag) return

    // Only consume an RFID scan while Chute is visible and actively waiting
    // for an animal. Hidden-tab and mode-picker scans must never be queued.
    if (!isFocused || !sessionMode || scannedAnimal) {
      clearScannedTag()
      return
    }

    console.log("[Chute] RFID tag scanned:", scannedTag.epc)
    setRfidInput(scannedTag.epc)
    lookupAnimal(scannedTag.epc)
  }, [clearScannedTag, isFocused, lookupAnimal, scannedAnimal, scannedTag, sessionMode])

  const handleScanSubmit = useCallback(() => {
    lookupAnimal(rfidInput)
  }, [rfidInput, lookupAnimal])

  const resetForNextAnimal = useCallback(() => {
    console.log("[Chute] Resetting for next animal")
    setScannedAnimal(null)
    setWeightValue("")
    setConditionScore("")
    setTreatmentDesc("")
    setProductName("")
    setDosage("")
    setConditionValue("")
    setRfidInput("")
    clearScannedTag() // Clear RFID hook state to prevent re-lookup
    // Don't reset selected protocol — keep it for batch processing
    setTimeout(() => rfidInputRef.current?.focus(), 100)
  }, [clearScannedTag])

  const handleSaveWeight = useCallback(async () => {
    await runSave(async () => {
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

        setProcessedLog((prev) => [
          {
            id: `${Date.now()}`,
            animalName: scannedAnimal.displayName,
            action: "weight",
            value: `${kg} kg${cs ? ` (CS: ${cs})` : ""}`,
            timestamp: new Date(),
          },
          ...prev,
        ])

        confirmSaved(scannedAnimal.displayName, `${kg} kg`)
        resetForNextAnimal()
      } catch {
        Alert.alert(t("common.error"), t("common.failedToSave"))
      }
    })
  }, [
    runSave,
    confirmSaved,
    scannedAnimal,
    weightValue,
    conditionScore,
    createWeightRecord,
    resetForNextAnimal,
    t,
  ])

  const handleSaveCondition = useCallback(async () => {
    await runSave(async () => {
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

        setProcessedLog((prev) => [
          {
            id: `${Date.now()}`,
            animalName: scannedAnimal.displayName,
            action: "condition",
            value: `${score}/9`,
            timestamp: new Date(),
          },
          ...prev,
        ])

        confirmSaved(scannedAnimal.displayName, `${score}/9`)
        resetForNextAnimal()
      } catch {
        Alert.alert(t("common.error"), t("common.failedToSave"))
      }
    })
  }, [
    runSave,
    confirmSaved,
    scannedAnimal,
    conditionValue,
    createHealthRecord,
    resetForNextAnimal,
    t,
  ])

  const handleClearAnimal = useCallback(() => {
    resetForNextAnimal()
  }, [resetForNextAnimal])

  const protocolFilterOptions: { value: ProtocolFilter; label: string; count: number }[] = [
    {
      value: "all",
      label: t("treatmentProtocolsScreen.filters.all"),
      count: protocols.length,
    },
    {
      value: "vaccination",
      label: t("treatmentProtocolsScreen.filters.vaccination"),
      count: protocols.filter((protocol) => protocol.protocolType === "vaccination").length,
    },
    {
      value: "treatment",
      label: t("treatmentProtocolsScreen.filters.treatment"),
      count: protocols.filter((protocol) => protocol.protocolType === "treatment").length,
    },
    {
      value: "deworming",
      label: t("treatmentProtocolsScreen.filters.deworming"),
      count: protocols.filter((protocol) => protocol.protocolType === "deworming").length,
    },
    {
      value: "other",
      label: t("treatmentProtocolsScreen.filters.other"),
      count: protocols.filter((protocol) => protocol.protocolType === "other").length,
    },
  ]
  const visibleProtocolFilters = protocolFilterOptions.filter(
    (option) => option.value === "all" || option.count > 0,
  )
  const filteredProtocols =
    protocolFilter === "all"
      ? protocols
      : protocols.filter((protocol) => protocol.protocolType === protocolFilter)

  const renderProtocolFilters = () => (
    <View style={themed($protocolFilterRow)}>
      {visibleProtocolFilters.map((option) => {
        const selected = protocolFilter === option.value
        return (
          <Pressable
            key={option.value}
            onPress={() => setProtocolFilter(option.value)}
            style={[themed($protocolFilterPill), selected && themed($protocolFilterPillSelected)]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text
              text={`${option.label} ${option.count}`}
              size="xs"
              style={[themed($protocolFilterText), selected && themed($protocolFilterTextSelected)]}
            />
          </Pressable>
        )
      })}
    </View>
  )

  const handleApplyProtocol = useCallback(async () => {
    await runSave(async () => {
      if (!scannedAnimal || !selectedProtocol) return

      try {
        await createHealthRecord({
          animalId: scannedAnimal.id,
          recordDate: new Date(),
          recordType: protocolRecordType(selectedProtocol),
          description: selectedProtocol.name,
          productName: selectedProtocol.productName,
          dosage: selectedProtocol.dosage,
          protocolId: selectedProtocol.id,
          vaccinationId: vaccinationId,
        })

        // If there's a vaccination ID, mark it as administered
        if (vaccinationId) {
          try {
            const vaccination = await database
              .get<ScheduledVaccination>("scheduled_vaccinations")
              .find(vaccinationId)
            await database.write(async () => {
              await vaccination.update((v: any) => {
                v.status = "administered"
                v.administeredDate = new Date()
              })
            })
          } catch (error) {
            console.error("[Chute] Failed to update vaccination status:", error)
          }
        }

        setProcessedLog((prev) => [
          {
            id: `${Date.now()}`,
            animalName: scannedAnimal.displayName,
            action: "protocol" as any,
            value: selectedProtocol.name,
            timestamp: new Date(),
          },
          ...prev,
        ])

        confirmSaved(scannedAnimal.displayName, selectedProtocol.name)
        // In single mode, navigate back to animal detail
        if (isSingleMode && preSelectedAnimalId) {
          // Clear params before navigating back
          navigation.setParams({
            mode: undefined,
            animalId: undefined,
            protocolId: undefined,
            vaccinationId: undefined,
            requestId: undefined,
          })
          navigation.navigate("AnimalDetail", { animalId: preSelectedAnimalId })
        } else {
          resetForNextAnimal()
        }
      } catch {
        Alert.alert(t("common.error"), t("common.failedToSave"))
      }
    })
  }, [
    runSave,
    confirmSaved,
    scannedAnimal,
    selectedProtocol,
    vaccinationId,
    isSingleMode,
    preSelectedAnimalId,
    createHealthRecord,
    resetForNextAnimal,
    navigation,
    t,
  ])

  const activeMode = sessionMode

  // ─── No session mode selected — show mode picker ───
  if (!sessionMode) {
    return (
      <Screen
        preset="scroll"
        contentContainerStyle={[themed($container), { flex: undefined, flexGrow: 1 }]}
        safeAreaEdges={["top"]}
      >
        <AppHeader title={t("chuteScreen.title")} showSettings={true} />
        <BentoChuteModes onSelect={setSessionMode} />

        {/* Previous session log */}
        {processedLog.length > 0 && (
          <View style={themed($sessionInfo)}>
            <Text
              preset="formLabel"
              text={t("chuteScreen.session.previousSession", { count: processedLog.length })}
              style={themed($sessionLabel)}
            />
          </View>
        )}
      </Screen>
    )
  }

  const modeColor = c.ink
  const modeLabel =
    activeMode === "weight"
      ? t("chuteScreen.modes.weight.sessionTitle")
      : activeMode === "weight_and_treatment"
        ? t("chuteScreen.modes.weightAndTreatment.sessionTitle")
        : activeMode === "protocol"
          ? t("chuteScreen.modes.protocol.sessionTitle")
          : t("chuteScreen.modes.condition.sessionTitle")

  return (
    <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      {/* Session header */}
      <View style={themed($sessionHeader)}>
        <View style={{ flex: 1 }}>
          <Text preset="bold" text={modeLabel} style={{ color: c.onForest }} size="lg" />
          <Text
            text={t("chuteScreen.session.processed", { count: processedLog.length })}
            size="xs"
            style={{ color: c.lime }}
          />
        </View>
        <Button
          text={isSingleMode ? t("common.cancel") : t("chuteScreen.session.endSession")}
          disabled={isSaving}
          preset="default"
          onPress={() => {
            if (isSingleMode && preSelectedAnimalId) {
              // Clear params and navigate back
              navigation.setParams({
                mode: undefined,
                animalId: undefined,
                protocolId: undefined,
                vaccinationId: undefined,
                requestId: undefined,
              })
              navigation.navigate("AnimalDetail", { animalId: preSelectedAnimalId })
            } else {
              console.log("[Chute] Ending session - clearing all state")
              setSessionMode(null)
              resetForNextAnimal()
              clearScannedTag() // Clear RFID hook state when ending session
            }
          }}
        />
      </View>

      {lastSaved ? (
        <View accessibilityLiveRegion="polite">
          <Text text={lastSaved} size="sm" />
        </View>
      ) : null}
      {!scannedAnimal ? (
        /* ─── SCAN PHASE ─── */
        <View style={themed($scanArea)}>
          <View style={[themed($scanBox), { borderColor: modeColor }]}>
            <Text
              preset="subheading"
              text={t("chuteScreen.scan.title")}
              style={[themed($scanText), { color: modeColor }]}
            />

            {/* RFID Scanning Box */}
            {hasRfidHardware && isInitialized && (
              <View style={{ marginBottom: spacing.md }}>
                {isScanning ? (
                  <View style={themed($rfidScanningBox)}>
                    <ActivityIndicator size="small" color={modeColor} />
                    <Text
                      text={t("chuteScreen.scan.scanning")}
                      size="md"
                      style={{ color: modeColor, fontWeight: "600" }}
                    />
                  </View>
                ) : (
                  <View style={themed($rfidPromptBox)}>
                    <MaterialCommunityIcons
                      name="radio-tower"
                      size={24}
                      color={themed($dimText).color}
                    />
                    <Text
                      text={t("chuteScreen.scan.pullTrigger")}
                      size="sm"
                      style={themed($dimText)}
                    />
                  </View>
                )}
              </View>
            )}

            <Text
              text={t("chuteScreen.scan.orManualEntry")}
              size="xs"
              style={[themed($dimText), { marginBottom: spacing.xs }]}
            />
            <TextField
              ref={rfidInputRef}
              value={rfidInput}
              onChangeText={setRfidInput}
              placeholder={t("chuteScreen.scan.placeholder")}
              containerStyle={themed($scanInput)}
              autoCapitalize="characters"
              autoFocus={!hasRfidHardware}
              onSubmitEditing={({ nativeEvent }) => lookupAnimal(nativeEvent.text)}
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
                <Text
                  text={`${scannedAnimal.breed} | ${scannedAnimal.sexLabel}`}
                  size="sm"
                  style={themed($dimText)}
                />
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
                <Text
                  text={t("chuteScreen.animalInfo.visualTag")}
                  size="xxs"
                  style={themed($dimText)}
                />
                <Text text={scannedAnimal.visualTag || "—"} size="xs" preset="bold" />
              </View>
              <View style={themed($metaItem)}>
                <Text text={t("chuteScreen.animalInfo.dob")} size="xxs" style={themed($dimText)} />
                <Text
                  text={
                    scannedAnimal.dateOfBirth
                      ? format(scannedAnimal.dateOfBirth, "dd MMM yyyy")
                      : "—"
                  }
                  size="xs"
                  preset="bold"
                />
              </View>
              {weightHistory.length > 0 && (
                <View style={themed($metaItem)}>
                  <Text
                    text={t("chuteScreen.animalInfo.lastWeight")}
                    size="xxs"
                    style={themed($dimText)}
                  />
                  <Text
                    text={t("chuteScreen.animalInfo.lastWeightValue", {
                      weight: weightHistory[0].weightKg,
                    })}
                    size="xs"
                    preset="bold"
                  />
                </View>
              )}
            </View>
          </View>

          {/* ─── VACCINATION ALERTS ─── */}
          {animalVaccinations.length > 0 && (
            <View style={themed($vaccinationAlerts)}>
              {animalVaccinations.map((vacc) => {
                const urgency = vacc.urgencyLevel
                const bgColor =
                  urgency === "critical" || urgency === "overdue"
                    ? colors.errorBackground
                    : urgency === "soon"
                      ? colors.palette.accent100
                      : colors.palette.primary100
                const iconColor =
                  urgency === "critical" || urgency === "overdue"
                    ? colors.error
                    : urgency === "soon"
                      ? colors.palette.accent500
                      : colors.tint

                return (
                  <View
                    key={vacc.id}
                    style={[themed($vaccinationAlert), { backgroundColor: bgColor }]}
                  >
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
              {weightHistory.length >= 2 && <WeightChart records={weightHistory} />}
              {weightHistory.length === 1 && (
                <View style={themed($singleWeightInfo)}>
                  <Text
                    text={t("chuteScreen.weight.previousWeight")}
                    size="sm"
                    style={themed($dimText)}
                  />
                  <Text
                    preset="bold"
                    text={t("chuteScreen.weight.weightValue", {
                      weight: weightHistory[0].weightKg,
                    })}
                    size="lg"
                  />
                  <Text
                    text={format(weightHistory[0].recordDate, "dd MMM yyyy")}
                    size="xs"
                    style={themed($dimText)}
                  />
                </View>
              )}

              {/* Weight entry */}
              <View style={themed($formCard)}>
                <MeasurementInput
                  label={t("chuteScreen.weight.newWeightLabel")}
                  unit="kg"
                  disabled={isSaving}
                  context={scannedAnimal.displayName}
                  helper={
                    weightHistory[0]
                      ? t("uxFixes.previousMeasurement", {
                          value: weightHistory[0].weightKg,
                          date: format(weightHistory[0].recordDate, "dd MMM yyyy"),
                        })
                      : undefined
                  }
                  value={weightValue}
                  onChangeText={setWeightValue}
                />
                <ConditionScoreInput
                  disabled={isSaving}
                  label={t("chuteScreen.weight.conditionScoreLabel")}
                  value={conditionScore}
                  onChangeText={setConditionScore}
                />
                <View style={themed($formButtons)}>
                  <Button
                    text={t("common.skip")}
                    preset="default"
                    disabled={isSaving}
                    onPress={handleClearAnimal}
                  />
                  <Button
                    text={t("chuteScreen.weight.saveAndNext")}
                    preset="reversed"
                    disabled={isSaving}
                    onPress={handleSaveWeight}
                    style={themed($saveNextButton)}
                  />
                </View>
              </View>
            </View>
          )}

          {/* ─── WEIGHT + TREATMENT COMBINED MODE ─── */}
          {activeMode === "weight_and_treatment" && (
            <View style={themed($actionSection)}>
              {/* Weight section */}
              {weightHistory.length >= 2 && <WeightChart records={weightHistory} />}
              <View style={themed($formCard)}>
                <Text
                  preset="bold"
                  text={t("chuteScreen.weightAndTreatment.step1")}
                  size="md"
                  style={{ color: "#739134" }}
                />
                <MeasurementInput
                  unit="kg"
                  disabled={isSaving}
                  context={scannedAnimal.displayName}
                  helper={
                    weightHistory[0]
                      ? t("uxFixes.previousMeasurement", {
                          value: weightHistory[0].weightKg,
                          date: format(weightHistory[0].recordDate, "dd MMM yyyy"),
                        })
                      : undefined
                  }
                  label={t("chuteScreen.weightAndTreatment.weightLabel")}
                  value={weightValue}
                  onChangeText={setWeightValue}
                />
                <ConditionScoreInput
                  disabled={isSaving}
                  label={t("chuteScreen.weightAndTreatment.conditionScoreLabel")}
                  value={conditionScore}
                  onChangeText={setConditionScore}
                />
              </View>

              {/* Treatment Protocol Selection */}
              <View style={themed($formCard)}>
                <Text
                  preset="bold"
                  text={t("chuteScreen.weightAndTreatment.step2")}
                  size="md"
                  style={{ color: "#8B5CF6" }}
                />
                {!selectedProtocol ? (
                  protocols.length === 0 ? (
                    <View style={{ paddingVertical: spacing.md, alignItems: "center" }}>
                      <Text
                        text={t("chuteScreen.weightAndTreatment.noProtocols")}
                        size="sm"
                        style={themed($dimText)}
                      />
                      <Button
                        text={t("chuteScreen.weightAndTreatment.manageProtocols")}
                        preset="default"
                        onPress={() => navigation.navigate("TreatmentProtocols")}
                        style={{ marginTop: spacing.sm }}
                      />
                    </View>
                  ) : (
                    <View style={{ gap: spacing.xs }}>
                      {renderProtocolFilters()}
                      {filteredProtocols.map((protocol) => (
                        <Pressable
                          key={protocol.id}
                          onPress={() => setSelectedProtocol(protocol)}
                          style={themed($protocolOption)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text preset="bold" text={protocol.name} size="sm" />
                            <Text
                              text={`${protocol.productName} - ${protocol.dosage}`}
                              size="xs"
                              style={themed($dimText)}
                            />
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )
                ) : (
                  <View>
                    <View
                      style={{
                        backgroundColor: "#8B5CF622",
                        borderRadius: 8,
                        padding: spacing.md,
                        marginBottom: spacing.sm,
                      }}
                    >
                      <Text
                        preset="bold"
                        text={selectedProtocol.name}
                        size="sm"
                        style={{ color: "#8B5CF6" }}
                      />
                      <Text
                        text={`${selectedProtocol.productName} - ${selectedProtocol.dosage}`}
                        size="xs"
                        style={themed($dimText)}
                      />
                    </View>

                    {/* Show calculated dosage if weight entered */}
                    {weightValue &&
                      (() => {
                        const enteredWeight = parseFloat(weightValue)
                        if (!isNaN(enteredWeight) && enteredWeight > 0) {
                          const dosageMatch = selectedProtocol.dosage.match(
                            /(\d+(?:\.\d+)?)\s*ml\s*\/\s*(\d+(?:\.\d+)?)\s*kg/i,
                          )
                          if (dosageMatch) {
                            const mlPerDose = parseFloat(dosageMatch[1])
                            const kgPerDose = parseFloat(dosageMatch[2])
                            const calculatedMl = (enteredWeight / kgPerDose) * mlPerDose

                            return (
                              <View
                                style={{
                                  backgroundColor: "#FFF3CD",
                                  borderRadius: 8,
                                  padding: spacing.md,
                                  marginBottom: spacing.sm,
                                  borderWidth: 2,
                                  borderColor: "#FFEB3B",
                                }}
                              >
                                <Text
                                  preset="bold"
                                  text={t("chuteScreen.weightAndTreatment.calculatedDosage.title")}
                                  size="sm"
                                  style={{ color: "#856404", marginBottom: spacing.xs }}
                                />
                                <Text
                                  text={t(
                                    "chuteScreen.weightAndTreatment.calculatedDosage.atWeight",
                                    { weight: enteredWeight },
                                  )}
                                  size="xs"
                                  style={{ color: "#856404" }}
                                />
                                <Text
                                  preset="bold"
                                  text={t("chuteScreen.weightAndTreatment.calculatedDosage.give", {
                                    ml: calculatedMl.toFixed(1),
                                  })}
                                  size="lg"
                                  style={{ color: "#856404", marginTop: spacing.xxs }}
                                />
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
                <Button
                  text={t("common.skip")}
                  preset="default"
                  disabled={isSaving}
                  onPress={handleClearAnimal}
                />
                <Button
                  text={t("chuteScreen.weightAndTreatment.saveBoth")}
                  preset="reversed"
                  disabled={isSaving || !selectedProtocol || !weightValue}
                  onPress={async () => {
                    await runSave(async () => {
                      // Validate weight
                      const kg = parseFloat(weightValue)
                      if (isNaN(kg) || kg <= 0) {
                        Alert.alert(t("common.invalid"), t("chuteScreen.weight.invalidWeight"))
                        return
                      }

                      if (!selectedProtocol) {
                        Alert.alert(
                          t("common.required"),
                          t("chuteScreen.weightAndTreatment.required"),
                        )
                        return
                      }

                      const cs = conditionScore ? parseInt(conditionScore, 10) : undefined

                      try {
                        await createWeightAndTreatment({
                          animalId: scannedAnimal.id,
                          recordDate: new Date(),
                          weightKg: kg,
                          conditionScore: cs,
                          recordType: protocolRecordType(selectedProtocol),
                          description: selectedProtocol.name,
                          productName: selectedProtocol.productName,
                          dosage: selectedProtocol.dosage,
                          protocolId: selectedProtocol.id,
                        })
                        confirmSaved(
                          scannedAnimal.displayName,
                          `${kg} kg · ${selectedProtocol.name}`,
                        )

                        setProcessedLog((prev) => [
                          {
                            id: `${Date.now()}`,
                            animalName: scannedAnimal.displayName,
                            action: "weight_and_treatment" as any,
                            value: `${kg}kg + ${selectedProtocol.name}`,
                            timestamp: new Date(),
                          },
                          ...prev,
                        ])

                        resetForNextAnimal()
                      } catch {
                        Alert.alert(t("common.error"), t("common.failedToSave"))
                      }
                    })
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
                <ConditionScoreInput
                  disabled={isSaving}
                  label={t("chuteScreen.weight.conditionScoreLabel")}
                  value={conditionValue}
                  onChangeText={setConditionValue}
                />
                <View style={themed($formButtons)}>
                  <Button
                    text={t("common.skip")}
                    preset="default"
                    disabled={isSaving}
                    onPress={handleClearAnimal}
                  />
                  <Button
                    text={t("chuteScreen.weight.saveAndNext")}
                    preset="reversed"
                    disabled={isSaving}
                    onPress={handleSaveCondition}
                    style={themed($saveNextButton)}
                  />
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
                  <Text
                    preset="bold"
                    text={t("chuteScreen.protocol.title")}
                    size="md"
                    style={{ color: "#10B981" }}
                  />
                  {protocols.length === 0 ? (
                    <View style={{ paddingVertical: spacing.md, alignItems: "center" }}>
                      <Text
                        text={t("chuteScreen.weightAndTreatment.noProtocols")}
                        size="sm"
                        style={themed($dimText)}
                      />
                      <Button
                        text={t("chuteScreen.weightAndTreatment.manageProtocols")}
                        preset="default"
                        onPress={() => navigation.navigate("TreatmentProtocols")}
                        style={{ marginTop: spacing.sm }}
                      />
                    </View>
                  ) : (
                    <View style={{ gap: spacing.xs }}>
                      {renderProtocolFilters()}
                      {filteredProtocols.map((protocol) => (
                        <Pressable
                          key={protocol.id}
                          onPress={() => setSelectedProtocol(protocol)}
                          style={[
                            themed($protocolOption),
                            selectedProtocol?.id === protocol.id && {
                              borderColor: "#10B981",
                              backgroundColor: "#10B98122",
                            },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text preset="bold" text={protocol.name} size="sm" />
                            <Text
                              text={`${protocol.productName} - ${protocol.dosage}`}
                              size="xs"
                              style={themed($dimText)}
                            />
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  <Button
                    text={t("common.cancel")}
                    preset="default"
                    disabled={isSaving}
                    onPress={handleClearAnimal}
                    style={{ marginTop: spacing.sm }}
                  />
                </View>
              ) : (
                /* Protocol selected - show calculated dosage */
                <View style={themed($formCard)}>
                  <View
                    style={{
                      backgroundColor: "#10B98122",
                      borderRadius: 8,
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                    }}
                  >
                    <Text
                      preset="bold"
                      text={selectedProtocol.name}
                      size="md"
                      style={{ color: "#10B981" }}
                    />
                    <View style={{ marginTop: spacing.xs }}>
                      <Text
                        text={t("chuteScreen.protocol.product", {
                          name: selectedProtocol.productName,
                        })}
                        size="xs"
                        style={{ marginBottom: spacing.xxs }}
                      />
                      <Text
                        text={t("chuteScreen.protocol.standardDosage", {
                          dosage: selectedProtocol.dosage,
                        })}
                        size="xs"
                        style={{ marginBottom: spacing.xxs }}
                      />
                      {selectedProtocol.administrationMethod && (
                        <Text
                          text={t("chuteScreen.protocol.method", {
                            method: selectedProtocol.administrationMethod,
                          })}
                          size="xs"
                          style={{ marginBottom: spacing.xxs }}
                        />
                      )}
                      {selectedProtocol.withdrawalDays && (
                        <Text
                          text={t("chuteScreen.protocol.withdrawal", {
                            days: selectedProtocol.withdrawalDays,
                          })}
                          size="xs"
                          style={{ color: "#DC2626" }}
                        />
                      )}
                    </View>
                  </View>

                  {/* Calculated Dosage Section */}
                  {weightHistory.length > 0 &&
                    (() => {
                      const latestWeight = weightHistory[0].weightKg
                      const dosageMatch = selectedProtocol.dosage.match(
                        /(\d+(?:\.\d+)?)\s*ml\s*\/\s*(\d+(?:\.\d+)?)\s*kg/i,
                      )

                      if (dosageMatch) {
                        const mlPerDose = parseFloat(dosageMatch[1])
                        const kgPerDose = parseFloat(dosageMatch[2])
                        const calculatedMl = (latestWeight / kgPerDose) * mlPerDose

                        return (
                          <View
                            style={{
                              backgroundColor: "#FFF3CD",
                              borderRadius: 8,
                              padding: spacing.md,
                              marginBottom: spacing.sm,
                              borderWidth: 2,
                              borderColor: "#FFEB3B",
                            }}
                          >
                            <Text
                              preset="bold"
                              text={t("chuteScreen.protocol.autoCalculated.title")}
                              size="sm"
                              style={{ color: "#856404", marginBottom: spacing.xs }}
                            />
                            <Text
                              text={t("chuteScreen.protocol.autoCalculated.lastWeight", {
                                weight: latestWeight,
                              })}
                              size="xs"
                              style={{ color: "#856404" }}
                            />
                            <Text
                              preset="bold"
                              text={t("chuteScreen.protocol.autoCalculated.give", {
                                ml: calculatedMl.toFixed(1),
                              })}
                              size="lg"
                              style={{ color: "#856404", marginTop: spacing.xxs }}
                            />
                            <Text
                              text={t("chuteScreen.protocol.autoCalculated.based", {
                                ml: mlPerDose,
                                kg: kgPerDose,
                              })}
                              size="xxs"
                              style={{ color: "#856404", marginTop: spacing.xxs }}
                            />
                          </View>
                        )
                      }

                      return (
                        <View
                          style={{
                            backgroundColor: "#E3F2FD",
                            borderRadius: 8,
                            padding: spacing.md,
                            marginBottom: spacing.sm,
                          }}
                        >
                          <Text
                            text={t("chuteScreen.protocol.autoCalculated.lastWeight", {
                              weight: latestWeight,
                            })}
                            size="xs"
                            style={{ color: "#1565C0" }}
                          />
                          <Text
                            text={t("chuteScreen.protocol.manualDosage")}
                            size="xxs"
                            style={{ color: "#1565C0", marginTop: spacing.xxs }}
                          />
                        </View>
                      )
                    })()}

                  {weightHistory.length === 0 && (
                    <View
                      style={{
                        backgroundColor: "#FFEBEE",
                        borderRadius: 8,
                        padding: spacing.md,
                        marginBottom: spacing.sm,
                      }}
                    >
                      <Text
                        preset="bold"
                        text={t("chuteScreen.protocol.noWeight.title")}
                        size="xs"
                        style={{ color: "#C62828" }}
                      />
                      <Text
                        text={t("chuteScreen.protocol.noWeight.message")}
                        size="xxs"
                        style={{ color: "#C62828", marginTop: spacing.xxs }}
                      />
                    </View>
                  )}

                  <View style={themed($formButtons)}>
                    <Button
                      text={t("chuteScreen.protocol.changeProtocol")}
                      preset="default"
                      onPress={() => setSelectedProtocol(null)}
                    />
                    <Button
                      text={
                        isSingleMode
                          ? t("chuteScreen.protocol.apply")
                          : t("chuteScreen.protocol.applyAndNext")
                      }
                      preset="reversed"
                      disabled={isSaving}
                      onPress={handleApplyProtocol}
                      style={themed($saveNextButton)}
                    />
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
          <Text
            preset="formLabel"
            text={t("chuteScreen.session.processed", { count: processedLog.length })}
            style={themed($sessionLabel)}
          />
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
  paddingHorizontal: spacing.md,
})

const $sessionHeader: ThemedStyle<ViewStyle> = ({ spacing, isDark }) => ({
  backgroundColor: bentoColors(isDark).forest,
  borderRadius: bentoRadii.card,
  gap: spacing.sm,
  paddingHorizontal: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: spacing.sm,
  marginBottom: spacing.xs,
})

const $scanArea: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "flex-start",
  paddingTop: spacing.md,
  marginBottom: spacing.md,
})

const $scanBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: bentoRadii.card,
  padding: spacing.xl,
  alignItems: "center",
  borderWidth: 0,
})

const $scanText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  letterSpacing: 0,
})

const $rfidScanningBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderWidth: 2,
  borderColor: colors.tint,
  borderRadius: 12,
  padding: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
  minHeight: 56,
})

const $rfidPromptBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderWidth: 2,
  borderColor: colors.border,
  borderStyle: "dashed",
  borderRadius: 12,
  padding: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
  minHeight: 56,
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
  borderRadius: bentoRadii.card,
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
  borderRadius: bentoRadii.card,
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
  borderRadius: bentoRadii.card,
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

const $protocolFilterRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
  marginBottom: spacing.xs,
})

const $protocolFilterPill: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderColor: colors.border,
  borderRadius: 18,
  borderWidth: 1,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
})

const $protocolFilterPillSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
  borderColor: colors.tint,
})

const $protocolFilterText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontWeight: "600",
})

const $protocolFilterTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
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
