import { FC, useCallback, useState } from "react"
import { Alert, Pressable, View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text, TextField, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useHealthRecordActions } from "@/hooks/useRecords"
import { HealthRecordType } from "@/db/models/HealthRecord"
import { useSubscription } from "@/context/SubscriptionContext"

const RECORD_TYPES: HealthRecordType[] = ["vaccination", "treatment", "vet_visit", "condition_score", "other"]

export const HealthRecordFormScreen: FC<AppStackScreenProps<"HealthRecordForm">> = ({ route, navigation }) => {
  const { themed } = useAppTheme()
  const { animalId } = route.params
  const { createHealthRecord } = useHealthRecordActions()
  const { hasFeature } = useSubscription()

  const [recordType, setRecordType] = useState<HealthRecordType>("treatment")
  const [description, setDescription] = useState("")
  const [productName, setProductName] = useState("")
  const [dosage, setDosage] = useState("")
  const [administeredBy, setAdministeredBy] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = useCallback(async () => {
    if (!description.trim()) {
      Alert.alert("Required", "Description is required")
      return
    }

    setIsSubmitting(true)
    try {
      await createHealthRecord({
        animalId,
        recordDate: new Date(),
        recordType,
        description: description.trim(),
        productName: productName.trim() || undefined,
        dosage: dosage.trim() || undefined,
        administeredBy: administeredBy.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      navigation.goBack()
    } catch {
      Alert.alert("Error", "Failed to save health record")
    }
    setIsSubmitting(false)
  }, [animalId, recordType, description, productName, dosage, administeredBy, notes, createHealthRecord, navigation])

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($headerRow)}>
        <Button text="Cancel" preset="default" onPress={() => navigation.goBack()} />
        <Text preset="heading" text="Health Record" />
        <View style={{ width: 60 }} />
      </View>

      <View style={themed($form)}>
        <Text preset="formLabel" text="Type" />
        <View style={themed($typeRow)}>
          {RECORD_TYPES.map((t) => {
            const locked = t === "vaccination" && !hasFeature("vaccines")
            return (
              <Pressable
                key={t}
                onPress={() => {
                  if (locked) {
                    navigation.navigate("Upgrade" as any)
                    return
                  }
                  setRecordType(t)
                }}
                style={themed(recordType === t ? $typeChipActive : locked ? $typeChipLocked : $typeChip)}
              >
                <Text
                  text={locked ? `${t.replace("_", " ")} (PRO)` : t.replace("_", " ")}
                  size="xs"
                  style={themed(recordType === t ? $typeChipTextActive : $typeChipText)}
                />
              </Pressable>
            )
          })}
        </View>

        <TextField
          label="Description *"
          value={description}
          onChangeText={setDescription}
          placeholder="What was done?"
          multiline
        />
        <TextField
          label="Product Name"
          value={productName}
          onChangeText={setProductName}
          placeholder="e.g. Covexin 10"
        />
        <TextField
          label="Dosage"
          value={dosage}
          onChangeText={setDosage}
          placeholder="e.g. 2ml SC"
        />
        <TextField
          label="Administered By"
          value={administeredBy}
          onChangeText={setAdministeredBy}
          placeholder="Name"
        />
        <TextField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional notes..."
          multiline
        />

        <Button
          text={isSubmitting ? "Saving..." : "Save Record"}
          preset="reversed"
          style={themed($saveButton)}
          onPress={handleSave}
        />
      </View>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxl,
})

const $headerRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: spacing.md,
  marginBottom: spacing.lg,
})

const $form: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
})

const $typeRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
  marginBottom: spacing.xs,
})

const $typeChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.sm,
})

const $typeChipActive: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  borderRadius: 16,
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.sm,
})

const $typeChipLocked: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.sm,
  borderWidth: 1,
  borderColor: colors.palette.accent500,
  borderStyle: "dashed",
})

const $typeChipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $typeChipTextActive: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
})

const $saveButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})
