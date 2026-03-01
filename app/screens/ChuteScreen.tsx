import { FC, useCallback, useRef, useState } from "react"
import { Alert, FlatList, Pressable, TextInput, View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text, TextField, Button } from "@/components"
import { RfidTagIcon } from "@/components/icons"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { useDatabase } from "@/context/DatabaseContext"
import { useWeightRecordActions, useHealthRecordActions } from "@/hooks/useRecords"
import { Q } from "@nozbe/watermelondb"

type ChuteAction = "weight" | "treatment" | "condition"

type ProcessedEntry = {
  id: string
  animalName: string
  action: ChuteAction
  value: string
  timestamp: Date
}

export const ChuteScreen: FC = () => {
  const { themed, theme } = useAppTheme()
  const { currentOrg } = useDatabase()
  const { createWeightRecord } = useWeightRecordActions()
  const { createHealthRecord } = useHealthRecordActions()

  const rfidInputRef = useRef<TextInput>(null)
  const [rfidInput, setRfidInput] = useState("")
  const [scannedAnimal, setScannedAnimal] = useState<Animal | null>(null)
  const [selectedAction, setSelectedAction] = useState<ChuteAction | null>(null)
  const [actionValue, setActionValue] = useState("")
  const [processedLog, setProcessedLog] = useState<ProcessedEntry[]>([])
  const [isSearching, setIsSearching] = useState(false)

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

  const handleRecordAction = useCallback(async () => {
    if (!scannedAnimal || !selectedAction || !actionValue.trim()) return

    try {
      if (selectedAction === "weight") {
        const kg = parseFloat(actionValue)
        if (isNaN(kg) || kg <= 0) {
          Alert.alert("Invalid", "Enter a valid weight in kg")
          return
        }
        await createWeightRecord({
          animalId: scannedAnimal.id,
          recordDate: new Date(),
          weightKg: kg,
        })
      } else if (selectedAction === "treatment") {
        await createHealthRecord({
          animalId: scannedAnimal.id,
          recordDate: new Date(),
          recordType: "treatment",
          description: actionValue.trim(),
        })
      } else if (selectedAction === "condition") {
        const score = parseInt(actionValue, 10)
        if (isNaN(score) || score < 1 || score > 9) {
          Alert.alert("Invalid", "Condition score must be 1-9")
          return
        }
        await createHealthRecord({
          animalId: scannedAnimal.id,
          recordDate: new Date(),
          recordType: "condition_score",
          description: `Condition score: ${score}/9`,
        })
      }

      // Log it
      setProcessedLog((prev) => [
        {
          id: `${Date.now()}`,
          animalName: scannedAnimal.displayName,
          action: selectedAction,
          value: actionValue,
          timestamp: new Date(),
        },
        ...prev,
      ])

      // Reset for next animal
      setScannedAnimal(null)
      setSelectedAction(null)
      setActionValue("")
      setRfidInput("")
      rfidInputRef.current?.focus()
    } catch {
      Alert.alert("Error", "Failed to save record")
    }
  }, [scannedAnimal, selectedAction, actionValue, createWeightRecord, createHealthRecord])

  const handleClearAnimal = useCallback(() => {
    setScannedAnimal(null)
    setSelectedAction(null)
    setActionValue("")
    setRfidInput("")
    rfidInputRef.current?.focus()
  }, [])

  return (
    <Screen preset="fixed" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <Text preset="heading" text="Chute Mode" style={themed($heading)} />
      <Text text="Scan → Record → Next" style={themed($subtitle)} />

      {!scannedAnimal ? (
        /* Step 1: Scan / Enter RFID */
        <View style={themed($scanArea)}>
          <View style={themed($scanBox)}>
            <RfidTagIcon size={48} color={theme.colors.tint} />
            <Text preset="subheading" text="SCAN RFID" style={themed($scanText)} />
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
        /* Step 2: Animal found — choose action */
        <View style={themed($animalPanel)}>
          <View style={themed($animalHeader)}>
            <View>
              <Text preset="bold" text={scannedAnimal.displayName} size="lg" />
              <Text text={`${scannedAnimal.breed} | ${scannedAnimal.sex}`} size="sm" style={themed($dimText)} />
              <Text text={`RFID: ${scannedAnimal.rfidTag}`} size="xs" style={themed($dimText)} />
            </View>
            <Button text="Clear" preset="default" onPress={handleClearAnimal} />
          </View>

          {!selectedAction ? (
            /* Action selection */
            <View style={themed($quickActions)}>
              <Text preset="formLabel" text="What do you want to record?" style={themed($quickActionsLabel)} />
              <View style={themed($actionRow)}>
                <Pressable
                  onPress={() => setSelectedAction("weight")}
                  style={[themed($actionCard), { borderColor: "#4A8C3F" }]}
                >
                  <Text preset="bold" text="Weight" style={{ color: "#4A8C3F" }} />
                  <Text size="xxs" text="kg" style={themed($dimText)} />
                </Pressable>
                <Pressable
                  onPress={() => setSelectedAction("treatment")}
                  style={[themed($actionCard), { borderColor: "#3B82F6" }]}
                >
                  <Text preset="bold" text="Treatment" style={{ color: "#3B82F6" }} />
                  <Text size="xxs" text="Vacc / Med" style={themed($dimText)} />
                </Pressable>
                <Pressable
                  onPress={() => setSelectedAction("condition")}
                  style={[themed($actionCard), { borderColor: "#F59E0B" }]}
                >
                  <Text preset="bold" text="Condition" style={{ color: "#F59E0B" }} />
                  <Text size="xxs" text="1-9 score" style={themed($dimText)} />
                </Pressable>
              </View>
            </View>
          ) : (
            /* Value entry */
            <View style={themed($valueEntry)}>
              <Text preset="formLabel" text={
                selectedAction === "weight" ? "Enter weight (kg)" :
                selectedAction === "treatment" ? "Describe treatment" :
                "Condition score (1-9)"
              } />
              <TextField
                value={actionValue}
                onChangeText={setActionValue}
                placeholder={
                  selectedAction === "weight" ? "e.g. 450" :
                  selectedAction === "treatment" ? "e.g. 7-in-1 vaccine, 2ml" :
                  "e.g. 6"
                }
                keyboardType={selectedAction === "treatment" ? "default" : "numeric"}
                autoFocus
                onSubmitEditing={handleRecordAction}
              />
              <View style={themed($valueButtons)}>
                <Button text="Back" preset="default" onPress={() => { setSelectedAction(null); setActionValue("") }} />
                <Button text="Save & Next" preset="reversed" onPress={handleRecordAction} style={themed($saveNextButton)} />
              </View>
            </View>
          )}
        </View>
      )}

      {/* Session log */}
      <View style={themed($sessionInfo)}>
        <Text preset="formLabel" text={`Session: ${processedLog.length} processed`} style={themed($sessionLabel)} />
        <FlatList
          data={processedLog}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={themed($logEntry)}>
              <Text size="sm" text={item.animalName} preset="bold" />
              <Text size="xs" text={`${item.action}: ${item.value}`} style={themed($dimText)} />
            </View>
          )}
          style={themed($logList)}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Screen>
  )
}

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
  marginBottom: spacing.md,
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
  borderColor: colors.tint,
  borderStyle: "dashed",
})

const $scanText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
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

const $animalPanel: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  gap: spacing.md,
})

const $animalHeader: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
})

const $quickActions: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
})

const $quickActionsLabel: ThemedStyle<TextStyle> = () => ({})

const $actionRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $actionCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  alignItems: "center",
  borderWidth: 2,
})

const $valueEntry: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
})

const $valueButtons: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  gap: spacing.sm,
})

const $saveNextButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $sessionInfo: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderTopWidth: 1,
  borderTopColor: colors.separator,
  paddingTop: spacing.sm,
  maxHeight: 160,
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
