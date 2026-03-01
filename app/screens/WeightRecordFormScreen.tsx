import { FC, useCallback, useState } from "react"
import { Alert, View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text, TextField, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useWeightRecordActions } from "@/hooks/useRecords"

export const WeightRecordFormScreen: FC<AppStackScreenProps<"WeightRecordForm">> = ({ route, navigation }) => {
  const { themed } = useAppTheme()
  const { animalId } = route.params
  const { createWeightRecord } = useWeightRecordActions()

  const [weight, setWeight] = useState("")
  const [conditionScore, setConditionScore] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = useCallback(async () => {
    const kg = parseFloat(weight)
    if (isNaN(kg) || kg <= 0) {
      Alert.alert("Required", "Enter a valid weight in kg")
      return
    }

    const cs = conditionScore ? parseInt(conditionScore, 10) : undefined
    if (cs !== undefined && (isNaN(cs) || cs < 1 || cs > 9)) {
      Alert.alert("Invalid", "Condition score must be 1-9")
      return
    }

    setIsSubmitting(true)
    try {
      await createWeightRecord({
        animalId,
        recordDate: new Date(),
        weightKg: kg,
        conditionScore: cs,
        notes: notes.trim() || undefined,
      })
      navigation.goBack()
    } catch {
      Alert.alert("Error", "Failed to save weight record")
    }
    setIsSubmitting(false)
  }, [animalId, weight, conditionScore, notes, createWeightRecord, navigation])

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($headerRow)}>
        <Button text="Cancel" preset="default" onPress={() => navigation.goBack()} />
        <Text preset="heading" text="Weight Record" />
        <View style={{ width: 60 }} />
      </View>

      <View style={themed($form)}>
        <TextField
          label="Weight (kg) *"
          value={weight}
          onChangeText={setWeight}
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

const $saveButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})
