import { FC, useCallback, useState } from "react"
import { Alert, View, ViewStyle, TextStyle } from "react-native"

import { Screen, Text, TextField, Button } from "@/components"
import { PhotoPicker } from "@/components/PhotoPicker"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useWeightRecordActions } from "@/hooks/useRecords"
import { useDatabase } from "@/context/DatabaseContext"
import { useAuth } from "@/context/AuthContext"
import { uploadPhoto } from "@/services/photoStorage"
import type { PhotoWithMetadata } from "@/types/Photo"
import { serializePhotos } from "@/types/Photo"
import { useTranslation } from "@/i18n"

export const WeightRecordFormScreen: FC<AppStackScreenProps<"WeightRecordForm">> = ({ route, navigation }) => {
  const { themed } = useAppTheme()
  const { t } = useTranslation()
  const { animalId } = route.params
  const { createWeightRecord } = useWeightRecordActions()
  const { currentOrg } = useDatabase()
  const { user } = useAuth()

  const [weight, setWeight] = useState("")
  const [conditionScore, setConditionScore] = useState("")
  const [notes, setNotes] = useState("")
  const [photos, setPhotos] = useState<PhotoWithMetadata[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = useCallback(async () => {
    const kg = parseFloat(weight)
    if (isNaN(kg) || kg <= 0) {
      Alert.alert(
        t("weightRecordFormScreen.alerts.invalidWeight.title"),
        t("weightRecordFormScreen.alerts.invalidWeight.message"),
      )
      return
    }

    const cs = conditionScore ? parseInt(conditionScore, 10) : undefined
    if (cs !== undefined && (isNaN(cs) || cs < 1 || cs > 9)) {
      Alert.alert(
        t("weightRecordFormScreen.alerts.invalidConditionScore.title"),
        t("weightRecordFormScreen.alerts.invalidConditionScore.message"),
      )
      return
    }

    if (!currentOrg) {
      Alert.alert(
        t("weightRecordFormScreen.alerts.noOrganization.title"),
        t("weightRecordFormScreen.alerts.noOrganization.message"),
      )
      return
    }

    setIsSubmitting(true)
    try {
      // Create record first to get the record ID
      const record = await createWeightRecord({
        animalId,
        recordDate: new Date(),
        weightKg: kg,
        conditionScore: cs,
        notes: notes.trim() || undefined,
      })

      // Upload photos if any (background upload)
      if (photos.length > 0) {
        uploadPhotosInBackground(record.id, photos)
      }

      navigation.goBack()
    } catch (error) {
      console.error("Failed to save weight record:", error)
      Alert.alert(
        t("weightRecordFormScreen.alerts.saveError.title"),
        t("weightRecordFormScreen.alerts.saveError.message"),
      )
    }
    setIsSubmitting(false)
  }, [animalId, weight, conditionScore, notes, photos, currentOrg, createWeightRecord, navigation, t])

  const uploadPhotosInBackground = async (recordId: string, photosToUpload: PhotoWithMetadata[]) => {
    try {
      const uploadedPhotos = await Promise.all(
        photosToUpload.map(async (photo) => {
          if (!photo.localUri) return null
          try {
            const result = await uploadPhoto({
              localUri: photo.localUri,
              organizationId: currentOrg!.id,
              category: "weight",
              recordId,
              userId: user?.id,
            })
            return result.photo
          } catch (error) {
            console.error("Failed to upload photo:", error)
            return null
          }
        }),
      )

      const successfulPhotos = uploadedPhotos.filter((p) => p !== null)

      if (successfulPhotos.length > 0) {
        // Update the record with uploaded photo URLs
        const database = await import("@/db")
        await database.database.write(async () => {
          const weightRecord = await database.database.get("weight_records").find(recordId)
          await weightRecord.update((r: any) => {
            r.photos = serializePhotos(successfulPhotos as any[])
          })
        })
      }
    } catch (error) {
      console.error("Failed to upload photos in background:", error)
    }
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($headerRow)}>
        <Button text={t("weightRecordFormScreen.cancelButton")} preset="default" onPress={() => navigation.goBack()} />
        <Text preset="heading" text={t("weightRecordFormScreen.title")} />
        <View style={{ width: 60 }} />
      </View>

      <View style={themed($form)}>
        <TextField
          label={t("weightRecordFormScreen.fields.weight.label")}
          value={weight}
          onChangeText={setWeight}
          placeholder={t("weightRecordFormScreen.fields.weight.placeholder")}
          keyboardType="numeric"
          autoFocus
        />
        <TextField
          label={t("weightRecordFormScreen.fields.conditionScore.label")}
          value={conditionScore}
          onChangeText={setConditionScore}
          placeholder={t("weightRecordFormScreen.fields.conditionScore.placeholder")}
          keyboardType="numeric"
        />
        <TextField
          label={t("weightRecordFormScreen.fields.notes.label")}
          value={notes}
          onChangeText={setNotes}
          placeholder={t("weightRecordFormScreen.fields.notes.placeholder")}
          multiline
        />

        <PhotoPicker
          photos={photos}
          onPhotosChange={setPhotos}
          maxPhotos={3}
          label={t("weightRecordFormScreen.fields.photos.label")}
        />

        <Button
          text={isSubmitting ? t("weightRecordFormScreen.buttons.saving") : t("weightRecordFormScreen.buttons.save")}
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
