import { FC, useCallback, useEffect, useState } from "react"
import { Alert, Pressable, View, ViewStyle, TextStyle } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import { AnimalPicker, Screen, Text, TextField, Button, DateField } from "@/components"
import { PhotoPicker } from "@/components/PhotoPicker"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useBreedingRecordActions } from "@/hooks/useRecords"
import { BreedingMethod, BreedingOutcome } from "@/db/models/BreedingRecord"
import { useAnimal, useAnimals } from "@/hooks/useAnimals"
import { useDatabase } from "@/context/DatabaseContext"
import { useAuth } from "@/context/AuthContext"
import { uploadPhoto } from "@/services/photoStorage"
import { enqueuePhotoUploads } from "@/services/photoUploadQueue"
import type { PhotoWithMetadata } from "@/types/Photo"
import { serializePhotos } from "@/types/Photo"
import { useTranslation } from "react-i18next"
import { expectedCalvingFromBreedingDate } from "@/utils/breedingDashboard"

const METHODS: BreedingMethod[] = ["natural", "ai", "embryo_transfer"]
const OUTCOMES: BreedingOutcome[] = ["pending", "live_calf", "stillborn", "aborted", "open"]

export const BreedingRecordFormScreen: FC<AppStackScreenProps<"BreedingRecordForm">> = ({ route, navigation }) => {
  const { themed, theme } = useAppTheme()
  const { t } = useTranslation()
  const { animalId } = route.params
  const { animal } = useAnimal(animalId)
  const { animals } = useAnimals()
  const { createBreedingRecord } = useBreedingRecordActions()
  const { currentOrg } = useDatabase()
  const { user } = useAuth()

  const [method, setMethod] = useState<BreedingMethod>("natural")
  const [outcome, setOutcome] = useState<BreedingOutcome>("pending")
  const [breedingDate, setBreedingDate] = useState<Date | null>(new Date())
  const [expectedCalvingDate, setExpectedCalvingDate] = useState<Date | null>(
    expectedCalvingFromBreedingDate(new Date()),
  )
  const [expectedDateEdited, setExpectedDateEdited] = useState(false)
  const [bullId, setBullId] = useState<string | null>(null)
  const [showBullPicker, setShowBullPicker] = useState(false)
  const [notes, setNotes] = useState("")
  const [photos, setPhotos] = useState<PhotoWithMetadata[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const selectedBull = bullId ? animals.find((candidate) => candidate.id === bullId) : null

  useEffect(() => {
    if (!breedingDate || expectedDateEdited) return
    setExpectedCalvingDate(
      expectedCalvingFromBreedingDate(breedingDate, animal?.species ?? "cattle"),
    )
  }, [animal?.species, breedingDate, expectedDateEdited])

  const handleSave = useCallback(async () => {
    if (!currentOrg) {
      Alert.alert(
        t("breedingRecordFormScreen.alerts.noOrganization.title"),
        t("breedingRecordFormScreen.alerts.noOrganization.message"),
      )
      return
    }
    if (!breedingDate) {
      Alert.alert("Breeding date required", "Enter the date the animal was bred.")
      return
    }

    setIsSubmitting(true)
    try {
      const record = await createBreedingRecord({
        animalId,
        bullId: bullId ?? undefined,
        breedingDate,
        method,
        expectedCalvingDate: expectedCalvingDate ?? undefined,
        outcome,
        notes: notes.trim() || undefined,
      })

      if (photos.length > 0) {
        uploadPhotosInBackground(record.id, photos)
      }

      navigation.goBack()
    } catch (error) {
      console.error("Failed to save breeding record:", error)
      Alert.alert(
        t("breedingRecordFormScreen.alerts.saveError.title"),
        t("breedingRecordFormScreen.alerts.saveError.message"),
      )
    }
    setIsSubmitting(false)
  }, [animalId, bullId, breedingDate, expectedCalvingDate, method, outcome, notes, photos, currentOrg, createBreedingRecord, navigation, t])

  const uploadPhotosInBackground = async (recordId: string, photosToUpload: PhotoWithMetadata[]) => {
    try {
      const failedUploads: PhotoWithMetadata[] = []
      const uploadedPhotos = await Promise.all(
        photosToUpload.map(async (photo) => {
          if (!photo.localUri) return null
          try {
            const result = await uploadPhoto({
              localUri: photo.localUri,
              organizationId: currentOrg!.id,
              category: "breeding",
              recordId,
              userId: user?.id,
            })
            return result.photo
          } catch (error) {
            console.error("Failed to upload photo, queuing for later:", error)
            failedUploads.push(photo)
            return null
          }
        }),
      )

      if (failedUploads.length > 0) {
        await enqueuePhotoUploads(
          failedUploads.map((photo) => ({
            table: "breeding_records",
            recordId,
            category: "breeding",
            organizationId: currentOrg!.id,
            localUri: photo.localUri!,
            userId: user?.id,
            caption: photo.caption,
          })),
        )
      }

      const successfulPhotos = uploadedPhotos.filter((p) => p !== null)

      if (successfulPhotos.length > 0) {
        const database = await import("@/db")
        await database.database.write(async () => {
          const breedingRecord = await database.database.get("breeding_records").find(recordId)
          await breedingRecord.update((r: any) => {
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
        <Button text={t("breedingRecordFormScreen.cancelButton")} preset="default" onPress={() => navigation.goBack()} />
        <Text preset="heading" text={t("breedingRecordFormScreen.title")} />
        <View style={{ width: 60 }} />
      </View>

      <View style={themed($form)}>
        <View style={themed($animalCard)}>
          <View style={themed($animalIcon)}>
            <Text text={animal?.displayName?.slice(0, 1).toUpperCase() || "?"} preset="bold" />
          </View>
          <View style={themed($animalDetails)}>
            <Text text={animal?.displayName || "Loading animal…"} preset="bold" />
            <Text
              text={animal ? `${animal.breed} • ${animal.sexLabel}` : ""}
              size="xs"
              style={themed($dimText)}
            />
          </View>
        </View>

        <DateField
          label="Breeding date"
          value={breedingDate}
          onChange={setBreedingDate}
          placeholder="DD/MM/YYYY"
        />

        <DateField
          label="Expected calving date"
          value={expectedCalvingDate}
          onChange={(date) => {
            setExpectedDateEdited(true)
            setExpectedCalvingDate(date)
          }}
          placeholder="DD/MM/YYYY"
        />
        <Text
          text="Calculated from the species average. Adjust it if you have a more accurate date."
          size="xxs"
          style={themed($dateHint)}
        />

        <View>
          <Text preset="formLabel" text="Bull or sire (optional)" style={themed($fieldLabel)} />
          <Pressable onPress={() => setShowBullPicker(true)} style={themed($pickerButton)}>
            <View>
              <Text
                text={selectedBull?.displayName || "Link a bull from the herd"}
                style={!selectedBull && themed($dimText)}
              />
              {selectedBull && (
                <Text text={selectedBull.breed} size="xs" style={themed($dimText)} />
              )}
            </View>
            <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.textDim} />
          </Pressable>
        </View>

        <Text preset="formLabel" text={t("breedingRecordFormScreen.methodLabel")} />
        <View style={themed($chipRow)}>
          {METHODS.map((m) => (
            <Pressable
              key={m}
              onPress={() => setMethod(m)}
              style={themed(method === m ? $chipActive : $chip)}
            >
              <Text
                text={t(`breedingRecordFormScreen.methods.${m}` as const)}
                size="xs"
                style={themed(method === m ? $chipTextActive : $chipText)}
              />
            </Pressable>
          ))}
        </View>

        <Text preset="formLabel" text={t("breedingRecordFormScreen.outcomeLabel")} style={themed($outcomeLabel)} />
        <View style={themed($chipRow)}>
          {OUTCOMES.map((o) => (
            <Pressable
              key={o}
              onPress={() => setOutcome(o)}
              style={themed(outcome === o ? $chipActive : $chip)}
            >
              <Text
                text={t(`breedingRecordFormScreen.outcomes.${o}` as const)}
                size="xs"
                style={themed(outcome === o ? $chipTextActive : $chipText)}
              />
            </Pressable>
          ))}
        </View>

        <TextField
          label={t("breedingRecordFormScreen.fields.notes.label")}
          value={notes}
          onChangeText={setNotes}
          placeholder={t("breedingRecordFormScreen.fields.notes.placeholder")}
          multiline
        />

        <PhotoPicker
          photos={photos}
          onPhotosChange={setPhotos}
          maxPhotos={3}
          label={t("breedingRecordFormScreen.fields.photos.label")}
        />

        <Button
          text={isSubmitting ? t("breedingRecordFormScreen.buttons.saving") : t("breedingRecordFormScreen.buttons.save")}
          preset="reversed"
          style={themed($saveButton)}
          onPress={handleSave}
        />
      </View>

      <AnimalPicker
        visible={showBullPicker}
        onClose={() => setShowBullPicker(false)}
        onSelect={(bull) => setBullId(bull?.id ?? null)}
        currentAnimalId={animalId}
        filterSex="male"
        title="Select breeding bull"
        allowClear={true}
      />
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

const $animalCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.md,
  marginBottom: spacing.sm,
  borderRadius: 12,
  backgroundColor: colors.palette.primary100,
})

const $animalIcon: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 42,
  height: 42,
  borderRadius: 21,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.background,
})

const $animalDetails: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $dateHint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: -spacing.xs,
  marginBottom: spacing.xs,
})

const $fieldLabel: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $pickerButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  minHeight: 52,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  backgroundColor: colors.background,
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
