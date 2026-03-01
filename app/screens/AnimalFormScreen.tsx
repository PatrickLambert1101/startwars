import { FC, useCallback, useEffect, useState } from "react"
import { Alert, Pressable, View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text, TextField, Button } from "@/components"
import { DateField } from "@/components/DateField"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAnimal, useAnimalActions, AnimalFormData } from "@/hooks/useAnimals"
import { AnimalSex, AnimalStatus } from "@/db/models/Animal"

const SEX_OPTIONS: AnimalSex[] = ["bull", "cow", "steer", "heifer", "calf"]
const STATUS_OPTIONS: AnimalStatus[] = ["active", "sold", "deceased", "transferred"]

export const AnimalFormScreen: FC<AppStackScreenProps<"AnimalForm">> = ({ route, navigation }) => {
  const { themed } = useAppTheme()
  const isEditing = route.params?.mode === "edit"
  const animalId = route.params?.animalId
  const { animal } = useAnimal(animalId ?? "")
  const { createAnimal, updateAnimal } = useAnimalActions()

  const [rfidTag, setRfidTag] = useState("")
  const [visualTag, setVisualTag] = useState("")
  const [name, setName] = useState("")
  const [breed, setBreed] = useState("")
  const [sex, setSex] = useState<AnimalSex>("cow")
  const [status, setStatus] = useState<AnimalStatus>("active")
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null)
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-fill form when editing
  useEffect(() => {
    if (animal && isEditing) {
      setRfidTag(animal.rfidTag)
      setVisualTag(animal.visualTag)
      setName(animal.name || "")
      setBreed(animal.breed)
      setSex(animal.sex)
      setStatus(animal.status)
      setDateOfBirth(animal.dateOfBirth || null)
      setRegistrationNumber(animal.registrationNumber || "")
      setNotes(animal.notes || "")
    }
  }, [animal, isEditing])

  const handleSave = useCallback(async () => {
    if (!rfidTag.trim()) {
      Alert.alert("Required", "RFID Tag is required")
      return
    }
    if (!visualTag.trim()) {
      Alert.alert("Required", "Visual Tag is required")
      return
    }
    if (!breed.trim()) {
      Alert.alert("Required", "Breed is required")
      return
    }

    setIsSubmitting(true)
    try {
      const data: AnimalFormData = {
        rfidTag: rfidTag.trim(),
        visualTag: visualTag.trim(),
        name: name.trim() || undefined,
        breed: breed.trim(),
        sex,
        dateOfBirth: dateOfBirth || undefined,
        status,
        registrationNumber: registrationNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      }

      if (isEditing && animalId) {
        await updateAnimal(animalId, data)
      } else {
        await createAnimal(data)
      }
      navigation.goBack()
    } catch (e) {
      Alert.alert("Error", "Failed to save animal. Please try again.")
    }
    setIsSubmitting(false)
  }, [rfidTag, visualTag, name, breed, sex, dateOfBirth, status, registrationNumber, notes, isEditing, animalId, createAnimal, updateAnimal, navigation])

  const cycleSex = useCallback(() => {
    const idx = SEX_OPTIONS.indexOf(sex)
    setSex(SEX_OPTIONS[(idx + 1) % SEX_OPTIONS.length])
  }, [sex])

  const cycleStatus = useCallback(() => {
    const idx = STATUS_OPTIONS.indexOf(status)
    setStatus(STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length])
  }, [status])

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($headerRow)}>
        <Button text="Cancel" preset="default" onPress={() => navigation.goBack()} />
        <Text preset="heading" text={isEditing ? "Edit Animal" : "Add Animal"} />
        <View style={{ width: 60 }} />
      </View>

      <View style={themed($form)}>
        <TextField
          label="RFID Tag *"
          value={rfidTag}
          onChangeText={setRfidTag}
          placeholder="Scan or enter RFID tag number"
          autoCapitalize="characters"
        />
        <TextField
          label="Visual Tag *"
          value={visualTag}
          onChangeText={setVisualTag}
          placeholder="Ear tag or brand number"
        />
        <TextField
          label="Name (optional)"
          value={name}
          onChangeText={setName}
          placeholder="Animal name"
        />
        <TextField
          label="Breed *"
          value={breed}
          onChangeText={setBreed}
          placeholder="e.g. Angus, Hereford, Brahman"
        />

        <View style={themed($row)}>
          <View style={themed($halfField)}>
            <Text preset="formLabel" text="Sex *" style={themed($pickerLabel)} />
            <Pressable onPress={cycleSex} style={themed($pickerButton)}>
              <Text text={sex} />
            </Pressable>
          </View>
          <View style={themed($halfField)}>
            <Text preset="formLabel" text="Status" style={themed($pickerLabel)} />
            <Pressable onPress={cycleStatus} style={themed($pickerButton)}>
              <Text text={status} />
            </Pressable>
          </View>
        </View>

        <DateField
          label="Date of Birth"
          value={dateOfBirth}
          onChange={setDateOfBirth}
          placeholder="DD/MM/YYYY"
        />

        <TextField
          label="Registration Number"
          value={registrationNumber}
          onChangeText={setRegistrationNumber}
          placeholder="Optional"
        />
        <TextField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          multiline
        />

        <Button
          text={isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Add Animal"}
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

const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $halfField: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $pickerLabel: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $pickerButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  padding: spacing.sm,
  alignItems: "center",
})

const $saveButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})
