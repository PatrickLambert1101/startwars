import { FC, useCallback, useState } from "react"
import { Alert, Pressable, View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text, TextField, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useBreedingRecordActions } from "@/hooks/useRecords"
import { BreedingMethod, BreedingOutcome } from "@/db/models/BreedingRecord"

const METHODS: BreedingMethod[] = ["natural", "ai", "embryo_transfer"]
const OUTCOMES: BreedingOutcome[] = ["pending", "live_calf", "stillborn", "aborted", "open"]

export const BreedingRecordFormScreen: FC<AppStackScreenProps<"BreedingRecordForm">> = ({ route, navigation }) => {
  const { themed } = useAppTheme()
  const { animalId } = route.params
  const { createBreedingRecord } = useBreedingRecordActions()

  const [method, setMethod] = useState<BreedingMethod>("natural")
  const [outcome, setOutcome] = useState<BreedingOutcome>("pending")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await createBreedingRecord({
        animalId,
        breedingDate: new Date(),
        method,
        outcome,
        notes: notes.trim() || undefined,
      })
      navigation.goBack()
    } catch {
      Alert.alert("Error", "Failed to save breeding record")
    }
    setIsSubmitting(false)
  }, [animalId, method, outcome, notes, createBreedingRecord, navigation])

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($headerRow)}>
        <Button text="Cancel" preset="default" onPress={() => navigation.goBack()} />
        <Text preset="heading" text="Breeding Record" />
        <View style={{ width: 60 }} />
      </View>

      <View style={themed($form)}>
        <Text preset="formLabel" text="Method" />
        <View style={themed($chipRow)}>
          {METHODS.map((m) => (
            <Pressable
              key={m}
              onPress={() => setMethod(m)}
              style={themed(method === m ? $chipActive : $chip)}
            >
              <Text
                text={m.replace("_", " ")}
                size="xs"
                style={themed(method === m ? $chipTextActive : $chipText)}
              />
            </Pressable>
          ))}
        </View>

        <Text preset="formLabel" text="Outcome" style={themed($outcomeLabel)} />
        <View style={themed($chipRow)}>
          {OUTCOMES.map((o) => (
            <Pressable
              key={o}
              onPress={() => setOutcome(o)}
              style={themed(outcome === o ? $chipActive : $chip)}
            >
              <Text
                text={o.replace("_", " ")}
                size="xs"
                style={themed(outcome === o ? $chipTextActive : $chipText)}
              />
            </Pressable>
          ))}
        </View>

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

const $chipRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})

const $chip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.sm,
})

const $chipActive: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  borderRadius: 16,
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.sm,
})

const $chipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $chipTextActive: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
})

const $outcomeLabel: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $saveButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})
