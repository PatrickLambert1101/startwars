import { FC, useCallback, useEffect, useState } from "react"
import { Alert, Pressable, View, ViewStyle, TextStyle, ActivityIndicator, Modal, FlatList } from "react-native"

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
const SEX_DISPLAY: Record<AnimalSex, string> = { male: "Bull", female: "Cow", castrated: "Steer/Ox", unknown: "Unknown" }
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
    // Require at least one tag (RFID or Visual)
    if (!rfidTag.trim() && !visualTag.trim()) {
      Alert.alert("Required", "Please enter either an RFID Tag or Visual Tag (at least one is required)")
      return
    }
    if (!breed.trim()) {
      Alert.alert("Required", "Breed is required")
      return
    }
    if (!currentOrg) {
      Alert.alert("Error", "No organization selected")
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
      Alert.alert("Error", "Failed to save animal. Please try again.")
    }
    setIsSubmitting(false)
  }, [rfidTag, visualTag, name, breed, sex, dateOfBirth, status, registrationNumber, notes, photos, currentOrg, isEditing, animalId, createAnimal, updateAnimal, navigation])

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
        <Button text="Cancel" preset="default" onPress={() => navigation.goBack()} />
        <Text preset="heading" text={isEditing ? "Edit Animal" : "Add Animal"} />
        <View style={{ width: 60 }} />
      </View>

      <View style={themed($form)}>
        <View style={themed($helperNote)}>
          <Text text="* At least one tag (RFID or Visual) is required" size="xs" style={themed($helperText)} />
        </View>

        {/* RFID Tag Field with Scanner */}
        <View>
          <Text preset="formLabel" text="RFID Tag" style={themed($pickerLabel)} />
          {hasRfidHardware ? (
            <View>
              {isScanning ? (
                <View style={themed($scanningBox)}>
                  <ActivityIndicator size="small" color={colors.tint} />
                  <Text text="Pull trigger to scan..." size="sm" style={{ color: colors.tint }} />
                </View>
              ) : (
                <TextField
                  value={rfidTag}
                  onChangeText={setRfidTag}
                  placeholder="Pull trigger to scan RFID tag"
                  autoCapitalize="characters"
                  containerStyle={{ marginTop: 0 }}
                />
              )}
            </View>
          ) : (
            <TextField
              value={rfidTag}
              onChangeText={setRfidTag}
              placeholder="Enter RFID tag number"
              autoCapitalize="characters"
              containerStyle={{ marginTop: 0 }}
            />
          )}
        </View>

        <View>
          <Text preset="formLabel" text="Visual Tag (ear tag/brand)" style={themed($pickerLabel)} />
          <View style={themed($tagInputRow)}>
            <TextField
              value={visualTag}
              onChangeText={setVisualTag}
              placeholder="Ear tag or brand number"
              containerStyle={themed($tagInput)}
            />
            <ScanTagButton
              compact
              onTagScanned={setVisualTag}
            />
          </View>
        </View>

        <TextField
          label="Name (optional)"
          value={name}
          onChangeText={setName}
          placeholder="Animal name"
        />

        <PhotoPicker
          photos={photos}
          onPhotosChange={setPhotos}
          maxPhotos={5}
          label="Photos (for identification)"
        />

        {/* Breed Picker */}
        <View>
          <Text preset="formLabel" text="Breed *" style={themed($pickerLabel)} />
          <Pressable onPress={() => setShowBreedPicker(true)} style={themed($pickerButton)}>
            <Text text={breed || "Select breed"} style={!breed && themed($placeholderText)} />
          </Pressable>
        </View>

        {/* Sex Picker */}
        <View style={themed($row)}>
          <View style={themed($halfField)}>
            <Text preset="formLabel" text="Sex *" style={themed($pickerLabel)} />
            <Pressable onPress={() => setShowSexPicker(true)} style={themed($pickerButton)}>
              <Text text={SEX_DISPLAY[sex]} />
            </Pressable>
          </View>
          <View style={themed($halfField)}>
            <DateField
              label="Date of Birth"
              value={dateOfBirth}
              onChange={setDateOfBirth}
              placeholder="DD/MM/YYYY"
            />
          </View>
        </View>

        {/* Lineage Section */}
        <View style={themed($lineageSection)}>
          <Text text="Lineage (optional)" preset="formLabel" />

          <View>
            <Text text="Sire (Father)" size="xs" style={themed($lineageLabel)} />
            <Pressable onPress={() => setShowSirePicker(true)} style={themed($pickerButton)}>
              <Text
                text={selectedSire ? selectedSire.displayName : "+ Add sire"}
                style={!selectedSire && themed($placeholderText)}
              />
            </Pressable>
          </View>

          <View>
            <Text text="Dame (Mother)" size="xs" style={themed($lineageLabel)} />
            <Pressable onPress={() => setShowDamePicker(true)} style={themed($pickerButton)}>
              <Text
                text={selectedDame ? selectedDame.displayName : "+ Add dame"}
                style={!selectedDame && themed($placeholderText)}
              />
            </Pressable>
          </View>
        </View>

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

      {/* Breed Picker Modal */}
      <Modal visible={showBreedPicker} transparent animationType="slide">
        <View style={themed($modalOverlay)}>
          <View style={themed($modalContent)}>
            <Text preset="heading" text="Select Breed" size="md" />
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
            <Button text="Cancel" onPress={() => setShowBreedPicker(false)} />
          </View>
        </View>
      </Modal>

      {/* Sex Picker Modal */}
      <Modal visible={showSexPicker} transparent animationType="slide">
        <View style={themed($modalOverlay)}>
          <View style={themed($modalContent)}>
            <Text preset="heading" text="Select Sex" size="md" />
            {SEX_OPTIONS.map((s) => (
              <Pressable
                key={s}
                style={themed($modalItem)}
                onPress={() => {
                  setSex(s)
                  setShowSexPicker(false)
                }}
              >
                <Text text={SEX_DISPLAY[s]} />
              </Pressable>
            ))}
            <Button text="Cancel" onPress={() => setShowSexPicker(false)} />
          </View>
        </View>
      </Modal>

      {/* Sire Picker Modal */}
      <Modal visible={showSirePicker} transparent animationType="slide">
        <View style={themed($modalOverlay)}>
          <View style={themed($modalContent)}>
            <Text preset="heading" text="Select Sire" size="md" />
            <TextField
              value={parentSearch}
              onChangeText={setParentSearch}
              placeholder="Search by name or tag..."
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
                  <Text text={`RFID: ${item.rfidTag}`} size="xs" style={themed($dimText)} />
                </Pressable>
              )}
              ListEmptyComponent={<Text text="No bulls found" style={themed($emptyText)} />}
            />
            <Button text="Cancel" onPress={() => { setShowSirePicker(false); setParentSearch("") }} />
          </View>
        </View>
      </Modal>

      {/* Dame Picker Modal */}
      <Modal visible={showDamePicker} transparent animationType="slide">
        <View style={themed($modalOverlay)}>
          <View style={themed($modalContent)}>
            <Text preset="heading" text="Select Dame" size="md" />
            <TextField
              value={parentSearch}
              onChangeText={setParentSearch}
              placeholder="Search by name or tag..."
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
                  <Text text={`RFID: ${item.rfidTag}`} size="xs" style={themed($dimText)} />
                </Pressable>
              )}
              ListEmptyComponent={<Text text="No cows found" style={themed($emptyText)} />}
            />
            <Button text="Cancel" onPress={() => { setShowDamePicker(false); setParentSearch("") }} />
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
