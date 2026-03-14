import { FC, useCallback, useEffect, useState } from "react"
import { Alert, Pressable, View, ViewStyle, TextStyle, ActivityIndicator, Modal, FlatList } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { Screen, Text, TextField, Button, ScanTagButton } from "@/components"
import { DateField } from "@/components/DateField"
import { PhotoPicker } from "@/components/PhotoPicker"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAnimal, useAnimalActions, AnimalFormData } from "@/hooks/useAnimals"
import { useAnimals } from "@/hooks/useAnimals"
import { AnimalSex, AnimalStatus, Animal } from "@/db/models/Animal"
import { useRfidReader } from "@/hooks/useRfidReader"
import { Platform } from "react-native"
import { useDatabase } from "@/context/DatabaseContext"
import { useAuth } from "@/context/AuthContext"
import { uploadPhoto } from "@/services/photoStorage"
import type { PhotoWithMetadata } from "@/types/Photo"
import { serializePhotos } from "@/types/Photo"

const SEX_OPTIONS: AnimalSex[] = ["male", "female", "castrated", "unknown"]
const STATUS_OPTIONS: AnimalStatus[] = ["active", "sold", "deceased", "transferred"]

const COMMON_BREEDS = [
  "Angus",
  "Hereford",
  "Brahman",
  "Bonsmara",
  "Nguni",
  "Simmental",
  "Charolais",
  "Limousin",
  "Afrikaner",
  "Drakensberger",
  "Other"
]

export const AnimalFormScreen: FC<AppStackScreenProps<"AnimalForm">> = ({ route, navigation }) => {
  const { t } = useTranslation()
  const { themed, theme: { colors } } = useAppTheme()
  const isEditing = route.params?.mode === "edit"
  const animalId = route.params?.animalId
  const { animal } = useAnimal(animalId ?? "")
  const { createAnimal, updateAnimal } = useAnimalActions()
  const { animals } = useAnimals()
  const { isScanning, scannedTag, startScanning, stopScanning, initialize, isInitialized, hasRfidHardware } = useRfidReader()
  const { currentOrg } = useDatabase()
  const { user } = useAuth()

  const [rfidTag, setRfidTag] = useState("")
  const [visualTag, setVisualTag] = useState("")
  const [name, setName] = useState("")
  const [breed, setBreed] = useState("")
  const [sex, setSex] = useState<AnimalSex>("female")
  const [status, setStatus] = useState<AnimalStatus>("active")
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null)
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [herdTag, setHerdTag] = useState("")
  const [notes, setNotes] = useState("")
  const [sireId, setSireId] = useState<string | null>(null)
  const [dameId, setDameId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<PhotoWithMetadata[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBreedPicker, setShowBreedPicker] = useState(false)
  const [showSexPicker, setShowSexPicker] = useState(false)
  const [showSirePicker, setShowSirePicker] = useState(false)
  const [showDamePicker, setShowDamePicker] = useState(false)
  const [parentSearch, setParentSearch] = useState("")

  // Initialize RFID scanner
  useEffect(() => {
    if (hasRfidHardware && !isInitialized) {
      initialize()
    }
  }, [hasRfidHardware, isInitialized, initialize])

  // Handle scanned RFID tag
  useEffect(() => {
    if (scannedTag && scannedTag.data) {
      setRfidTag(scannedTag.data)
    }
  }, [scannedTag])

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
      setHerdTag(animal.herdTag || "")
      setNotes(animal.notes || "")
      // Load existing photos if editing
      if (animal.photos) {
        try {
          const parsed = JSON.parse(animal.photos)
          if (Array.isArray(parsed)) {
            setPhotos(parsed.map(p => ({ ...p, uploadStatus: "uploaded" as const })))
          }
        } catch (e) {
          console.error("Failed to parse animal photos:", e)
        }
      }
    }
  }, [animal, isEditing])

  // Pre-fill breed from organization defaults when creating new animal
  useEffect(() => {
    if (!isEditing && currentOrg && currentOrg.defaultBreeds) {
      const defaultBreed = currentOrg.defaultBreeds['cattle']
      if (defaultBreed && !breed) {
        setBreed(defaultBreed)
      }
    }
  }, [isEditing, currentOrg, breed])

  const maleAnimals = animals.filter(a => a.sex === "male")
  const femaleAnimals = animals.filter(a => a.sex === "female")
  const filteredSires = parentSearch
    ? maleAnimals.filter(a =>
        a.displayName.toLowerCase().includes(parentSearch.toLowerCase()) ||
        a.rfidTag.toLowerCase().includes(parentSearch.toLowerCase())
      )
    : maleAnimals
  const filteredDames = parentSearch
    ? femaleAnimals.filter(a =>
        a.displayName.toLowerCase().includes(parentSearch.toLowerCase()) ||
        a.rfidTag.toLowerCase().includes(parentSearch.toLowerCase())
      )
    : femaleAnimals

  const selectedSire = sireId ? animals.find(a => a.id === sireId) : null
  const selectedDame = dameId ? animals.find(a => a.id === dameId) : null

  const handleSave = useCallback(async () => {
    // Require at least one tag
    // If device has RFID hardware: require RFID or Visual tag
    // If no RFID hardware: only require Visual tag
    if (hasRfidHardware) {
      if (!rfidTag.trim() && !visualTag.trim()) {
        Alert.alert(
          t("animalFormScreen.alerts.validation.tagRequired.title"),
          t("animalFormScreen.alerts.validation.tagRequired.message")
        )
        return
      }
    } else {
      if (!visualTag.trim()) {
        Alert.alert(
          t("animalFormScreen.alerts.validation.tagRequired.title"),
          "Please enter a visual tag number."
        )
        return
      }
    }
    if (!breed.trim()) {
      Alert.alert(
        t("animalFormScreen.alerts.validation.breedRequired.title"),
        t("animalFormScreen.alerts.validation.breedRequired.message")
      )
      return
    }
    if (!currentOrg) {
      Alert.alert(
        t("animalFormScreen.alerts.validation.noOrganization.title"),
        t("animalFormScreen.alerts.validation.noOrganization.message")
      )
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
        herdTag: herdTag.trim() || undefined,
        notes: notes.trim() || undefined,
      }

      let savedAnimalId: string
      if (isEditing && animalId) {
        await updateAnimal(animalId, data)
        savedAnimalId = animalId
      } else {
        const newAnimal = await createAnimal(data)
        savedAnimalId = newAnimal.id
      }

      // Upload new photos in background
      const newPhotos = photos.filter(p => p.uploadStatus === "pending")
      if (newPhotos.length > 0) {
        uploadPhotosInBackground(savedAnimalId, newPhotos)
      }

      navigation.goBack()
    } catch (e) {
      console.error("Failed to save animal:", e)
      Alert.alert(
        t("animalFormScreen.alerts.saveError.title"),
        t("animalFormScreen.alerts.saveError.message")
      )
    }
    setIsSubmitting(false)
  }, [rfidTag, visualTag, name, breed, sex, dateOfBirth, status, registrationNumber, herdTag, notes, photos, currentOrg, isEditing, animalId, createAnimal, updateAnimal, navigation, t, hasRfidHardware])

  const uploadPhotosInBackground = async (savedAnimalId: string, photosToUpload: PhotoWithMetadata[]) => {
    try {
      const uploadedPhotos = await Promise.all(
        photosToUpload.map(async (photo) => {
          if (!photo.localUri) return null
          try {
            const result = await uploadPhoto({
              localUri: photo.localUri,
              organizationId: currentOrg!.id,
              category: "animals",
              recordId: savedAnimalId,
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

      // Merge with existing photos
      const existingPhotos = photos.filter(p => p.uploadStatus === "uploaded")
      const allPhotos = [...existingPhotos, ...successfulPhotos]

      if (allPhotos.length > 0) {
        const database = await import("@/db")
        await database.database.write(async () => {
          const animalRecord = await database.database.get("animals").find(savedAnimalId)
          await animalRecord.update((r: any) => {
            r.photos = serializePhotos(allPhotos as any[])
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
        <Button text={t("animalFormScreen.buttons.cancel")} preset="default" onPress={() => navigation.goBack()} />
        <Text preset="heading" text={isEditing ? t("animalFormScreen.title.edit") : t("animalFormScreen.title.add")} />
        <View style={{ width: 60 }} />
      </View>

      {/* Current Farm Display */}
      {currentOrg && (
        <View style={themed($farmBadge)}>
          <Text text={t("animalFormScreen.farmLabel")} size="xs" style={themed($farmLabel)} />
          <Text text={currentOrg.name} preset="bold" size="sm" />
        </View>
      )}

      <View style={themed($form)}>
        {/* Only show helper note about tags if RFID hardware is present */}
        {hasRfidHardware && (
          <View style={themed($helperNote)}>
            <Text text={t("animalFormScreen.helperNote")} size="xs" style={themed($helperText)} />
          </View>
        )}

        {/* RFID Tag Field with Scanner - only show if device has RFID hardware */}
        {hasRfidHardware && (
          <View>
            <View style={themed($labelWithHint)}>
              <Text preset="formLabel" text={t("animalFormScreen.fields.rfidTag.label")} style={themed($pickerLabel)} />
              <View style={themed($hint)}>
                <MaterialCommunityIcons name="information-outline" size={14} color={colors.textDim} />
              </View>
            </View>
            <View style={themed($helpBox)}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color={colors.palette.primary700 || colors.tint} style={{ marginRight: 6 }} />
              <Text text={t("animalFormScreen.fields.rfidTag.helpText")} size="xxs" style={themed($helpText)} />
            </View>
            {isScanning ? (
              <View style={themed($scanningBox)}>
                <ActivityIndicator size="small" color={colors.tint} />
                <Text text={t("animalFormScreen.fields.rfidTag.scanning")} size="sm" style={{ color: colors.tint }} />
              </View>
            ) : (
              <TextField
                value={rfidTag}
                onChangeText={setRfidTag}
                placeholder={t("animalFormScreen.fields.rfidTag.scanPlaceholder")}
                autoCapitalize="characters"
                containerStyle={{ marginTop: 0 }}
              />
            )}
          </View>
        )}

        <View>
          <View style={themed($labelWithHint)}>
            <Text preset="formLabel" text={t("animalFormScreen.fields.visualTag.label")} style={themed($pickerLabel)} />
            <View style={themed($hint)}>
              <MaterialCommunityIcons name="camera-outline" size={14} color={colors.textDim} />
            </View>
          </View>
          <View style={themed($helpBox)}>
            <MaterialCommunityIcons name="camera-outline" size={14} color={colors.palette.primary700 || colors.tint} style={{ marginRight: 6 }} />
            <Text text={t("animalFormScreen.fields.visualTag.helpText")} size="xxs" style={themed($helpText)} />
          </View>
          <View style={themed($tagInputRow)}>
            <TextField
              value={visualTag}
              onChangeText={setVisualTag}
              placeholder={t("animalFormScreen.fields.visualTag.placeholder")}
              containerStyle={themed($tagInput)}
            />
            <ScanTagButton
              compact
              onTagScanned={setVisualTag}
            />
          </View>
        </View>

        <TextField
          label={t("animalFormScreen.fields.name.label")}
          value={name}
          onChangeText={setName}
          placeholder={t("animalFormScreen.fields.name.placeholder")}
        />

        <PhotoPicker
          photos={photos}
          onPhotosChange={setPhotos}
          maxPhotos={5}
          label={t("animalFormScreen.fields.photos.label")}
        />

        {/* Breed Picker */}
        <View>
          <Text preset="formLabel" text={t("animalFormScreen.fields.breed.label")} style={themed($pickerLabel)} />
          <Pressable onPress={() => setShowBreedPicker(true)} style={themed($pickerButton)}>
            <Text text={breed || t("animalFormScreen.fields.breed.placeholder")} style={!breed && themed($placeholderText)} />
          </Pressable>
        </View>

        {/* Sex Picker */}
        <View style={themed($row)}>
          <View style={themed($halfField)}>
            <Text preset="formLabel" text={t("animalFormScreen.fields.sex.label")} style={themed($pickerLabel)} />
            <Pressable onPress={() => setShowSexPicker(true)} style={themed($pickerButton)}>
              <Text text={t(`animalFormScreen.fields.sex.options.${sex}`)} />
            </Pressable>
          </View>
          <View style={themed($halfField)}>
            <DateField
              label={t("animalFormScreen.fields.dateOfBirth.label")}
              value={dateOfBirth}
              onChange={setDateOfBirth}
              placeholder={t("animalFormScreen.fields.dateOfBirth.placeholder")}
            />
          </View>
        </View>

        {/* Lineage Section */}
        <View style={themed($lineageSection)}>
          <View style={themed($labelWithHint)}>
            <Text text={t("animalFormScreen.lineage.title")} preset="formLabel" />
            <View style={themed($hint)}>
              <MaterialCommunityIcons name="dna" size={14} color={colors.textDim} />
            </View>
          </View>
          <View style={themed($helpBox)}>
            <MaterialCommunityIcons name="dna" size={14} color={colors.palette.primary700 || colors.tint} style={{ marginRight: 6 }} />
            <Text text={t("animalFormScreen.lineage.helpText")} size="xxs" style={themed($helpText)} />
          </View>

          <View>
            <Text text={t("animalFormScreen.lineage.sire.label")} size="xs" style={themed($lineageLabel)} />
            <Pressable onPress={() => setShowSirePicker(true)} style={themed($pickerButton)}>
              <Text
                text={selectedSire ? selectedSire.displayName : t("animalFormScreen.lineage.sire.placeholder")}
                style={!selectedSire && themed($placeholderText)}
              />
            </Pressable>
            {!selectedSire && maleAnimals.length === 0 && (
              <View style={themed($inlineHint)}>
                <MaterialCommunityIcons name="information-outline" size={12} color={colors.textDim} style={{ marginRight: 4 }} />
                <Text text={t("animalFormScreen.lineage.sire.noMales")} size="xxs" style={themed($hintTextSmall)} />
              </View>
            )}
          </View>

          <View>
            <Text text={t("animalFormScreen.lineage.dame.label")} size="xs" style={themed($lineageLabel)} />
            <Pressable onPress={() => setShowDamePicker(true)} style={themed($pickerButton)}>
              <Text
                text={selectedDame ? selectedDame.displayName : t("animalFormScreen.lineage.dame.placeholder")}
                style={!selectedDame && themed($placeholderText)}
              />
            </Pressable>
            {!selectedDame && femaleAnimals.length === 0 && (
              <View style={themed($inlineHint)}>
                <MaterialCommunityIcons name="information-outline" size={12} color={colors.textDim} style={{ marginRight: 4 }} />
                <Text text={t("animalFormScreen.lineage.dame.noFemales")} size="xxs" style={themed($hintTextSmall)} />
              </View>
            )}
          </View>
        </View>

        <TextField
          label={t("animalFormScreen.fields.registrationNumber.label")}
          value={registrationNumber}
          onChangeText={setRegistrationNumber}
          placeholder={t("animalFormScreen.fields.registrationNumber.placeholder")}
        />

        <TextField
          label={t("animalFormScreen.fields.herdTag.label")}
          value={herdTag}
          onChangeText={setHerdTag}
          placeholder={t("animalFormScreen.fields.herdTag.placeholder")}
          autoCapitalize="characters"
        />

        <TextField
          label={t("animalFormScreen.fields.notes.label")}
          value={notes}
          onChangeText={setNotes}
          placeholder={t("animalFormScreen.fields.notes.placeholder")}
          multiline
        />

        <Button
          text={isSubmitting ? t("animalFormScreen.buttons.saving") : isEditing ? t("animalFormScreen.buttons.save") : t("animalFormScreen.buttons.add")}
          preset="reversed"
          style={themed($saveButton)}
          onPress={handleSave}
        />
      </View>

      {/* Breed Picker Modal */}
      <Modal visible={showBreedPicker} transparent animationType="slide">
        <View style={themed($modalOverlay)}>
          <View style={themed($modalContent)}>
            <Text preset="heading" text={t("animalFormScreen.modals.breed.title")} size="md" />
            <FlatList
              data={COMMON_BREEDS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={themed($modalItem)}
                  onPress={() => {
                    setBreed(item)
                    setShowBreedPicker(false)
                  }}
                >
                  <Text text={item} />
                </Pressable>
              )}
            />
            <Button text={t("animalFormScreen.modals.breed.cancel")} onPress={() => setShowBreedPicker(false)} />
          </View>
        </View>
      </Modal>

      {/* Sex Picker Modal */}
      <Modal visible={showSexPicker} transparent animationType="slide">
        <View style={themed($modalOverlay)}>
          <View style={themed($modalContent)}>
            <Text preset="heading" text={t("animalFormScreen.modals.sex.title")} size="md" />
            {SEX_OPTIONS.map((s) => (
              <Pressable
                key={s}
                style={themed($modalItem)}
                onPress={() => {
                  setSex(s)
                  setShowSexPicker(false)
                }}
              >
                <Text text={t(`animalFormScreen.fields.sex.options.${s}`)} />
              </Pressable>
            ))}
            <Button text={t("animalFormScreen.modals.sex.cancel")} onPress={() => setShowSexPicker(false)} />
          </View>
        </View>
      </Modal>

      {/* Sire Picker Modal */}
      <Modal visible={showSirePicker} transparent animationType="slide">
        <View style={themed($modalOverlay)}>
          <View style={themed($modalContent)}>
            <Text preset="heading" text={t("animalFormScreen.modals.sire.title")} size="md" />
            <TextField
              value={parentSearch}
              onChangeText={setParentSearch}
              placeholder={t("animalFormScreen.modals.sire.searchPlaceholder")}
              containerStyle={themed($searchField)}
            />
            <FlatList
              data={filteredSires}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={themed($modalItem)}
                  onPress={() => {
                    setSireId(item.id)
                    setShowSirePicker(false)
                    setParentSearch("")
                  }}
                >
                  <Text text={item.displayName} preset="bold" />
                  <Text text={t("animalFormScreen.modals.sire.rfidLabel", { tag: item.rfidTag })} size="xs" style={themed($dimText)} />
                </Pressable>
              )}
              ListEmptyComponent={<Text text={t("animalFormScreen.modals.sire.empty")} style={themed($emptyText)} />}
            />
            <Button text={t("animalFormScreen.modals.sire.cancel")} onPress={() => { setShowSirePicker(false); setParentSearch("") }} />
          </View>
        </View>
      </Modal>

      {/* Dame Picker Modal */}
      <Modal visible={showDamePicker} transparent animationType="slide">
        <View style={themed($modalOverlay)}>
          <View style={themed($modalContent)}>
            <Text preset="heading" text={t("animalFormScreen.modals.dame.title")} size="md" />
            <TextField
              value={parentSearch}
              onChangeText={setParentSearch}
              placeholder={t("animalFormScreen.modals.dame.searchPlaceholder")}
              containerStyle={themed($searchField)}
            />
            <FlatList
              data={filteredDames}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={themed($modalItem)}
                  onPress={() => {
                    setDameId(item.id)
                    setShowDamePicker(false)
                    setParentSearch("")
                  }}
                >
                  <Text text={item.displayName} preset="bold" />
                  <Text text={t("animalFormScreen.modals.dame.rfidLabel", { tag: item.rfidTag })} size="xs" style={themed($dimText)} />
                </Pressable>
              )}
              ListEmptyComponent={<Text text={t("animalFormScreen.modals.dame.empty")} style={themed($emptyText)} />}
            />
            <Button text={t("animalFormScreen.modals.dame.cancel")} onPress={() => { setShowDamePicker(false); setParentSearch("") }} />
          </View>
        </View>
      </Modal>
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

const $scanningBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint + "10",
  borderWidth: 1,
  borderColor: colors.tint,
  borderRadius: 8,
  padding: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $placeholderText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $lineageSection: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  gap: spacing.sm,
})

const $lineageLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.xxs,
})

const $modalOverlay: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "flex-end",
})

const $modalContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: spacing.lg,
  maxHeight: "80%",
  gap: spacing.sm,
})

const $modalItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  padding: spacing.md,
  borderRadius: 8,
  marginBottom: spacing.xs,
})

const $searchField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $emptyText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  textAlign: "center",
  paddingVertical: spacing.lg,
})

const $tagInputRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  alignItems: "flex-end",
})

const $tagInput: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  marginTop: 0,
})

const $helperNote: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.sm,
  marginBottom: spacing.xs,
})

const $helperText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontStyle: "italic",
})

const $farmBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderRadius: 8,
  padding: spacing.sm,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  marginBottom: spacing.md,
  alignSelf: "flex-start",
})

const $labelWithHint: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  marginBottom: spacing.xs,
})

const $hint: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral200,
  borderRadius: 10,
  width: 20,
  height: 20,
  justifyContent: "center",
  alignItems: "center",
})

const $helpBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary50 || colors.palette.primary100,
  borderLeftWidth: 3,
  borderLeftColor: colors.palette.primary500,
  borderRadius: 6,
  padding: spacing.xs,
  marginBottom: spacing.xs,
  flexDirection: "row",
  alignItems: "flex-start",
})

const $helpText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary700 || colors.tint,
  lineHeight: 16,
  flex: 1,
})

const $inlineHint: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 6,
  padding: spacing.xs,
  marginTop: spacing.xs,
  flexDirection: "row",
  alignItems: "center",
})

const $hintTextSmall: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  lineHeight: 14,
  fontStyle: "italic",
})

const $farmLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})
