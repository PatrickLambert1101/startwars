import { FC, useCallback, useEffect, useRef, useState } from "react"
import { Alert, FlatList, Pressable, TextInput, View, ViewStyle, TextStyle, Modal, ScrollView } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { Screen, Text, TextField, Button, ScanTagButton } from "@/components"
import { AgeDatePicker } from "@/components/AgeDatePicker"
import { PhotoPicker } from "@/components/PhotoPicker"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAnimalActions, AnimalFormData } from "@/hooks/useAnimals"
import { AnimalSex, AnimalStatus } from "@/db/models/Animal"
import { useRfidReader } from "@/hooks/useRfidReader"
import { useDatabase } from "@/context/DatabaseContext"
import { useAuth } from "@/context/AuthContext"
import { usePastures } from "@/hooks/usePastures"
import { Pasture } from "@/db/models"
import { uploadPhoto } from "@/services/photoStorage"
import type { PhotoWithMetadata } from "@/types/Photo"

const SEX_OPTIONS: AnimalSex[] = ["male", "female", "castrated", "unknown"]

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

type AddedAnimal = {
  tempId: string
  visualTag: string
  rfidTag: string
  timestamp: Date
}

type BulkAddPhase = "setup" | "entry"

export const BulkAnimalAddScreen: FC<AppStackScreenProps<"BulkAnimalAdd">> = ({ route, navigation }) => {
  const { t } = useTranslation()
  const { themed, theme: { colors } } = useAppTheme()
  const { createAnimal } = useAnimalActions()
  const { currentOrg } = useDatabase()
  const { user } = useAuth()
  const { pastures } = usePastures()
  const { scannedTag, hasRfidHardware } = useRfidReader()

  const tagInputRef = useRef<TextInput>(null)

  // Phase control
  const [phase, setPhase] = useState<BulkAddPhase>("setup")

  // Setup phase - defaults
  const [breed, setBreed] = useState("")
  const [sex, setSex] = useState<AnimalSex>("female")
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null)
  const [selectedPastureId, setSelectedPastureId] = useState<string | null>(null)
  const [labelPrefix, setLabelPrefix] = useState("")
  const [notesTemplate, setNotesTemplate] = useState("")
  const [tagType, setTagType] = useState<"visual" | "rfid">("visual")

  // Entry phase
  const [currentTag, setCurrentTag] = useState("")
  const [currentRfidTag, setCurrentRfidTag] = useState("")
  const [currentWeight, setCurrentWeight] = useState("")
  const [currentPhotos, setCurrentPhotos] = useState<PhotoWithMetadata[]>([])
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [addedAnimals, setAddedAnimals] = useState<AddedAnimal[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modals
  const [showBreedPicker, setShowBreedPicker] = useState(false)
  const [showSexPicker, setShowSexPicker] = useState(false)
  const [showPasturePicker, setShowPasturePicker] = useState(false)
  const [showTagTypePicker, setShowTagTypePicker] = useState(false)

  // Pre-fill breed from organization defaults
  useEffect(() => {
    if (currentOrg && currentOrg.defaultBreeds && !breed) {
      const defaultBreed = currentOrg.defaultBreeds['cattle']
      if (defaultBreed) {
        setBreed(defaultBreed)
      }
    }
  }, [currentOrg, breed])

  // Handle scanned RFID tag in entry phase
  useEffect(() => {
    if (phase === "entry" && scannedTag && scannedTag.data) {
      setCurrentRfidTag(scannedTag.data)
    }
  }, [scannedTag, phase])

  // Auto-focus tag input when entering entry phase
  useEffect(() => {
    if (phase === "entry") {
      setTimeout(() => {
        tagInputRef.current?.focus()
      }, 300)
    }
  }, [phase])

  const selectedPasture = selectedPastureId ? pastures.find(p => p.id === selectedPastureId) : null

  const handleStartBulkEntry = useCallback(() => {
    if (!breed.trim()) {
      Alert.alert(
        t("bulkAnimalAddScreen.alerts.breedRequired.title"),
        t("bulkAnimalAddScreen.alerts.breedRequired.message")
      )
      return
    }

    setPhase("entry")
  }, [breed, t])

  const handlePhotoChange = useCallback((photos: PhotoWithMetadata[]) => {
    setCurrentPhotos(photos)
  }, [])

  const handleQuickAdd = useCallback(async () => {
    // Get tag based on selected tag type
    const enteredTag = currentTag.trim()
    const scannedRfid = currentRfidTag.trim()

    // Determine which tag to use based on tag type
    let visualTag = ""
    let rfidTag = ""

    const prefix = labelPrefix.trim()
    const tagValue = enteredTag || scannedRfid

    if (tagType === "visual") {
      visualTag = prefix ? `${prefix}${tagValue}` : tagValue
    } else {
      rfidTag = prefix ? `${prefix}${tagValue}` : tagValue
    }

    if (!visualTag && !rfidTag) {
      Alert.alert(
        t("bulkAnimalAddScreen.alerts.tagRequired.title"),
        t("bulkAnimalAddScreen.alerts.tagRequired.message")
      )
      return
    }

    if (!currentOrg) {
      Alert.alert(
        t("common.error"),
        t("bulkAnimalAddScreen.alerts.noOrganization.message")
      )
      return
    }

    setIsSubmitting(true)
    try {
      const data: AnimalFormData = {
        rfidTag: rfidTag || "",
        visualTag: visualTag || "",
        breed: breed.trim(),
        sex,
        dateOfBirth: dateOfBirth || undefined,
        status: "active" as AnimalStatus,
        notes: notesTemplate.trim() || undefined,
      }

      await createAnimal(data)

      // TODO: Handle photos, weight, and pasture assignment after animal creation
      // For now, just add the animal with basic data for speed

      // Add to log
      const newEntry: AddedAnimal = {
        tempId: Date.now().toString(),
        visualTag: visualTag || rfidTag,
        rfidTag: rfidTag || "",
        timestamp: new Date(),
      }
      setAddedAnimals(prev => [newEntry, ...prev])

      // Clear inputs for next entry
      setCurrentTag("")
      setCurrentRfidTag("")
      setCurrentWeight("")
      setCurrentPhotos([])

      // Refocus input
      tagInputRef.current?.focus()
    } catch (e) {
      console.error("Failed to add animal:", e)
      Alert.alert(
        t("common.error"),
        t("bulkAnimalAddScreen.alerts.addError.message")
      )
    }
    setIsSubmitting(false)
  }, [currentTag, currentRfidTag, tagType, breed, sex, dateOfBirth, notesTemplate, currentOrg, createAnimal, t])

  const handleFinish = useCallback(() => {
    if (addedAnimals.length === 0) {
      navigation.goBack()
      return
    }

    Alert.alert(
      t("bulkAnimalAddScreen.alerts.finish.title"),
      t("bulkAnimalAddScreen.alerts.finish.message", { count: addedAnimals.length }),
      [
        {
          text: t("bulkAnimalAddScreen.alerts.finish.cancel"),
          style: "cancel"
        },
        {
          text: t("bulkAnimalAddScreen.alerts.finish.confirm"),
          onPress: () => navigation.goBack()
        }
      ]
    )
  }, [addedAnimals.length, navigation, t])

  // Setup Phase UI
  if (phase === "setup") {
    return (
      <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
        <View style={themed($headerRow)}>
          <Button text={t("common.cancel")} preset="default" onPress={() => navigation.goBack()} />
          <Text preset="heading" text={t("bulkAnimalAddScreen.title.setup")} />
          <View style={{ width: 60 }} />
        </View>

        {currentOrg && (
          <View style={themed($farmBadge)}>
            <Text text={t("animalFormScreen.farmLabel")} size="xs" style={themed($farmLabel)} />
            <Text text={currentOrg.name} preset="bold" size="sm" />
          </View>
        )}

        <View style={themed($infoBox)}>
          <MaterialCommunityIcons name="information-outline" size={20} color={colors.tint} />
          <Text
            text={t("bulkAnimalAddScreen.setup.helpText")}
            size="sm"
            style={themed($infoText)}
          />
        </View>

        <View style={themed($form)}>
          <Text
            text={t("bulkAnimalAddScreen.setup.sectionTitle")}
            preset="subheading"
          />

          {/* Breed Picker */}
          <View>
            <Text preset="formLabel" text={t("animalFormScreen.fields.breed.label") + " *"} style={themed($pickerLabel)} />
            <Pressable onPress={() => setShowBreedPicker(true)} style={themed($pickerButton)}>
              <Text text={breed || t("animalFormScreen.fields.breed.placeholder")} style={!breed && themed($placeholderText)} />
            </Pressable>
          </View>

          {/* Sex Picker */}
          <View>
            <Text preset="formLabel" text={t("animalFormScreen.fields.sex.label")} style={themed($pickerLabel)} />
            <Pressable onPress={() => setShowSexPicker(true)} style={themed($pickerButton)}>
              <Text text={t(`animalFormScreen.fields.sex.options.${sex}`)} />
            </Pressable>
          </View>

          {/* Date of Birth */}
          <AgeDatePicker
            label={t("animalFormScreen.fields.dateOfBirth.label")}
            value={dateOfBirth}
            onChange={setDateOfBirth}
            placeholder={t("animalFormScreen.fields.dateOfBirth.placeholder")}
          />

          {/* Tag Type Picker - Only show if RFID hardware available */}
          {hasRfidHardware && (
            <View>
              <Text preset="formLabel" text={t("bulkAnimalAddScreen.setup.tagTypeLabel")} style={themed($pickerLabel)} />
              <Pressable onPress={() => setShowTagTypePicker(true)} style={themed($pickerButton)}>
                <Text text={t(`bulkAnimalAddScreen.setup.tagType.${tagType}`)} />
              </Pressable>
            </View>
          )}

          {/* Label/Tag Prefix */}
          <TextField
            label={t("bulkAnimalAddScreen.setup.labelPrefixLabel")}
            value={labelPrefix}
            onChangeText={setLabelPrefix}
            placeholder={t("bulkAnimalAddScreen.setup.labelPrefixPlaceholder")}
            helper={t("bulkAnimalAddScreen.setup.labelPrefixHelper")}
          />

          {/* Pasture/Group Picker */}
          {pastures.length > 0 && (
            <View>
              <Text preset="formLabel" text={t("bulkAnimalAddScreen.setup.pastureLabel")} style={themed($pickerLabel)} />
              <Pressable onPress={() => setShowPasturePicker(true)} style={themed($pickerButton)}>
                <Text
                  text={selectedPasture ? selectedPasture.name : t("bulkAnimalAddScreen.setup.pasturePlaceholder")}
                  style={!selectedPasture && themed($placeholderText)}
                />
              </Pressable>
            </View>
          )}

          {/* Notes Template */}
          <TextField
            label={t("bulkAnimalAddScreen.setup.notesLabel")}
            value={notesTemplate}
            onChangeText={setNotesTemplate}
            placeholder={t("bulkAnimalAddScreen.setup.notesPlaceholder")}
            multiline
          />

          <Button
            text={t("bulkAnimalAddScreen.setup.startButton")}
            preset="reversed"
            style={themed($startButton)}
            onPress={handleStartBulkEntry}
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
              <Button text={t("common.cancel")} onPress={() => setShowBreedPicker(false)} />
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
              <Button text={t("common.cancel")} onPress={() => setShowSexPicker(false)} />
            </View>
          </View>
        </Modal>

        {/* Tag Type Picker Modal */}
        <Modal visible={showTagTypePicker} transparent animationType="slide">
          <View style={themed($modalOverlay)}>
            <View style={themed($modalContent)}>
              <Text preset="heading" text={t("bulkAnimalAddScreen.setup.tagTypeModalTitle")} size="md" />
              <Pressable
                style={themed($modalItem)}
                onPress={() => {
                  setTagType("visual")
                  setShowTagTypePicker(false)
                }}
              >
                <Text text={t("bulkAnimalAddScreen.setup.tagType.visual")} preset={tagType === "visual" ? "bold" : "default"} />
                <Text text={t("bulkAnimalAddScreen.setup.tagTypeDescription.visual")} size="xs" style={themed($dimText)} />
              </Pressable>
              <Pressable
                style={themed($modalItem)}
                onPress={() => {
                  setTagType("rfid")
                  setShowTagTypePicker(false)
                }}
              >
                <Text text={t("bulkAnimalAddScreen.setup.tagType.rfid")} preset={tagType === "rfid" ? "bold" : "default"} />
                <Text text={t("bulkAnimalAddScreen.setup.tagTypeDescription.rfid")} size="xs" style={themed($dimText)} />
              </Pressable>
              <Button text={t("common.cancel")} onPress={() => setShowTagTypePicker(false)} />
            </View>
          </View>
        </Modal>

        {/* Pasture Picker Modal */}
        <Modal visible={showPasturePicker} transparent animationType="slide">
          <View style={themed($modalOverlay)}>
            <View style={themed($modalContent)}>
              <Text preset="heading" text={t("bulkAnimalAddScreen.setup.pastureModalTitle")} size="md" />
              <FlatList
                data={pastures}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={themed($modalItem)}
                    onPress={() => {
                      setSelectedPastureId(item.id)
                      setShowPasturePicker(false)
                    }}
                  >
                    <Text text={item.name} preset="bold" />
                    <Text text={item.code} size="xs" style={themed($dimText)} />
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text text={t("bulkAnimalAddScreen.setup.noPastures")} style={themed($emptyText)} />
                }
              />
              <Button
                text={t("common.cancel")}
                onPress={() => setShowPasturePicker(false)}
              />
            </View>
          </View>
        </Modal>
      </Screen>
    )
  }

  // Entry Phase UI
  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($headerRow)}>
        <Button
          text={t("common.back")}
          preset="default"
          onPress={() => setPhase("setup")}
        />
        <Text preset="heading" text={t("bulkAnimalAddScreen.title.entry")} />
        <Button
          text={t("common.done")}
          preset="default"
          onPress={handleFinish}
        />
      </View>

      {/* Summary Badge */}
      <View style={themed($summaryBadge)}>
        <View style={themed($summaryRow)}>
          <Text text={breed} preset="bold" />
          <Text text=" • " style={themed($dimText)} />
          <Text text={t(`animalFormScreen.fields.sex.options.${sex}`)} />
          {dateOfBirth && (
            <>
              <Text text=" • " style={themed($dimText)} />
              <Text text={dateOfBirth.toLocaleDateString()} size="sm" />
            </>
          )}
        </View>
        {selectedPasture && (
          <View style={themed($summaryRow)}>
            <MaterialCommunityIcons name="map-marker" size={14} color={colors.textDim} />
            <Text text={selectedPasture.name} size="sm" style={themed($dimText)} />
          </View>
        )}
      </View>

      {/* Count Badge */}
      <View style={themed($countBadge)}>
        <MaterialCommunityIcons name="check-circle" size={24} color={colors.palette.primary500} />
        <Text
          text={t("bulkAnimalAddScreen.entry.countLabel", { count: addedAnimals.length })}
          preset="bold"
          size="lg"
        />
      </View>

      <View style={themed($entryForm)}>
        {/* Tag Input */}
        <View style={themed($tagInputSection)}>
          <Text preset="formLabel" text={t("bulkAnimalAddScreen.entry.tagLabel")} />

          {hasRfidHardware && currentRfidTag && (
            <View style={themed($rfidTagDisplay)}>
              <MaterialCommunityIcons name="nfc" size={16} color={colors.tint} />
              <Text text={currentRfidTag} size="sm" style={{ color: colors.tint }} />
            </View>
          )}

          <View style={themed($tagInputRow)}>
            <TextField
              ref={tagInputRef}
              value={currentTag}
              onChangeText={setCurrentTag}
              placeholder={t("bulkAnimalAddScreen.entry.tagPlaceholder")}
              containerStyle={themed($tagInput)}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleQuickAdd}
            />
            <ScanTagButton
              compact
              onTagScanned={setCurrentTag}
            />
          </View>
        </View>

        {/* Optional Weight */}
        <TextField
          label={t("bulkAnimalAddScreen.entry.weightLabel")}
          value={currentWeight}
          onChangeText={setCurrentWeight}
          placeholder={t("bulkAnimalAddScreen.entry.weightPlaceholder")}
          keyboardType="numeric"
        />

        {/* Optional Photo */}
        <View style={themed($photoSection)}>
          <PhotoPicker
            photos={currentPhotos}
            onPhotosChange={handlePhotoChange}
            maxPhotos={3}
            label={t("bulkAnimalAddScreen.entry.photoLabel")}
          />
        </View>

        <Button
          text={isSubmitting ? t("bulkAnimalAddScreen.entry.adding") : t("bulkAnimalAddScreen.entry.addButton")}
          preset="reversed"
          style={themed($addButton)}
          onPress={handleQuickAdd}
          disabled={isSubmitting}
        />

        {/* Recent Adds */}
        {addedAnimals.length > 0 && (
          <View style={themed($recentSection)}>
            <Text text={t("bulkAnimalAddScreen.entry.recentTitle")} preset="formLabel" />
            {addedAnimals.slice(0, 5).map((animal) => (
              <View key={animal.tempId} style={themed($recentItem)}>
                <MaterialCommunityIcons name="check" size={16} color={colors.palette.primary500} />
                <Text text={animal.visualTag} preset="bold" />
                <Text text={animal.timestamp.toLocaleTimeString()} size="xs" style={themed($dimText)} />
              </View>
            ))}
          </View>
        )}
      </View>
    </Screen>
  )
}

// Styles
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

const $farmLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $infoBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderLeftWidth: 3,
  borderLeftColor: colors.palette.primary500,
  borderRadius: 6,
  padding: spacing.md,
  marginBottom: spacing.lg,
  flexDirection: "row",
  gap: spacing.sm,
  alignItems: "flex-start",
})

const $infoText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  flex: 1,
  lineHeight: 20,
})

const $form: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
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

const $placeholderText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $startButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})

const $summaryBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.md,
  marginBottom: spacing.md,
  gap: spacing.xs,
})

const $summaryRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
})

const $countBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderRadius: 12,
  padding: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  marginBottom: spacing.lg,
  justifyContent: "center",
})

const $entryForm: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

const $tagInputSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $rfidTagDisplay: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint + "10",
  borderRadius: 6,
  padding: spacing.xs,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  marginBottom: spacing.xs,
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

const $photoSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $addButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

const $recentSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xl,
  gap: spacing.xs,
})

const $recentItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderRadius: 6,
  padding: spacing.sm,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $dimText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
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

const $emptyText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  textAlign: "center",
  paddingVertical: spacing.lg,
})
