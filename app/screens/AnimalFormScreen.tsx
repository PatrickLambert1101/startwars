import { FC } from "react"
import { View, ViewStyle } from "react-native"

import { Screen, Text, TextField, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"

export const AnimalFormScreen: FC<AppStackScreenProps<"AnimalForm">> = ({ route }) => {
  const { themed } = useAppTheme()
  const isEditing = route.params?.mode === "edit"

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <Text preset="heading" text={isEditing ? "Edit Animal" : "Add Animal"} style={themed($heading)} />

      <View style={themed($form)}>
        <TextField label="RFID Tag" placeholder="Scan or enter RFID tag number" />
        <TextField label="Visual Tag" placeholder="Ear tag or brand number" />
        <TextField label="Name (optional)" placeholder="Animal name" />
        <TextField label="Breed" placeholder="e.g. Angus, Hereford, Brahman" />

        <View style={themed($row)}>
          <View style={themed($halfField)}>
            <TextField label="Sex" placeholder="Select..." />
          </View>
          <View style={themed($halfField)}>
            <TextField label="Status" placeholder="Active" />
          </View>
        </View>

        <TextField label="Date of Birth" placeholder="DD/MM/YYYY" />
        <TextField label="Registration Number" placeholder="Optional" />
        <TextField label="Notes" placeholder="Any additional notes..." multiline />

        <Button text={isEditing ? "Save Changes" : "Add Animal"} preset="reversed" style={themed($saveButton)} />
      </View>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxl,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
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

const $saveButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})
