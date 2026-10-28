import { useSaveGuard } from "@/hooks/useSaveGuard"
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges"
import { getVaccinationHistory, type VaccinationHistory } from "@/utils/vaccinationHistory"
import { VaccinationHistoryInput } from "@/components/VaccinationHistoryInput"
import Toast from "react-native-toast-message"
import { FC, useCallback, useEffect, useRef, useState } from "react"
import { Alert, Pressable, View, ViewStyle, TextStyle, ActivityIndicator, Modal, FlatList, Platform } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

import { Screen, Text, TextField, Button, ScanTagButton } from "@/components"
import { AgeDatePicker } from "@/components/AgeDatePicker"
import { PhotoPicker } from "@/components/PhotoPicker"
import { mergeTagsWithDraft, TagInput } from "@/components/TagInput"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAnimal, useAnimalActions, AnimalFormData, DuplicateTagError, AnimalLimitError } from "@/hooks/useAnimals"
import { useAnimals } from "@/hooks/useAnimals"
import { AnimalSex, AnimalStatus, Animal, BREEDS_BY_SPECIES } from "@/db/models/Animal"
import { useRfidReader } from "@/hooks/useRfidReader"
import { useDatabase } from "@/context/DatabaseContext"
import { useAuth } from "@/context/AuthContext"
import { uploadPhoto } from "@/services/photoStorage"
import { enqueuePhotoUploads } from "@/services/photoUploadQueue"
import type { PhotoWithMetadata } from "@/types/Photo"
import { serializePhotos } from "@/types/Photo"

const SEX_OPTIONS: AnimalSex[] = ["male", "female", "castrated", "unknown"]
const STATUS_OPTIONS: AnimalStatus[] = ["active", "sold", "deceased", "transferred"]
type ParentSource = "herd" | "external"
type BreedPickerTarget = "animal" | "sire" | "dam"

export const MALE_PURPOSE_TAGS = [
  "Herd Breeding Bull",
  "Breeding Bull For Sale",
  "Beef Steer",
] as const

const COMMON_BREEDS = BREEDS_BY_SPECIES.cattle

export const AnimalFormScreen: FC<AppStackScreenProps<"AnimalForm">> = ({ route, navigation }) => {
  const { t } = useTranslation()
  const { themed, theme: { colors } } = useAppTheme()
  const isEditing = route.params?.mode === "edit"
  const animalId = route.params?.animalId
  const linkAsParentOf = route.params?.linkAsParentOf
  const parentRole = route.params?.parentRole
  const isCreatingParent = !isEditing && Boolean(linkAsParentOf && parentRole)
  const { animal } = useAnimal(animalId ?? "")
  const { createAnimal, updateAnimal } = useAnimalActions()
  const { animals } = useAnimals()
  const { isScanning, scannedTag, startScanning, stopScanning, initialize, isInitialized, hasRfidHardware } = useRfidReader()
  const { currentOrg } = useDatabase()
  const { user } = useAuth()

  const [rfidTag, setRfidTag] = useState(isEditing ? "" : route.params?.initialRfidTag ?? "")
  const [visualTag, setVisualTag] = useState(
    isEditing ? "" : route.params?.initialVisualTag ?? "",
  )
  const [name, setName] = useState("")
  const [breed, setBreed] = useState("")
  const [sex, setSex] = useState<AnimalSex>("female")
  const [status, setStatus] = useState<AnimalStatus>("active")
  const [vaccinationHistory, setVaccinationHistory] = useState<VaccinationHistory>("unknown")
  const [historyReviewed, setHistoryReviewed] = useState(false)
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null)
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [herdTag, setHerdTag] = useState("")
  const [notes, setNotes] = useState("")
  const [sireId, setSireId] = useState<string | null>(null)
  const [dameId, setDameId] = useState<string | null>(null)
  const [sireSource, setSireSource] = useState<ParentSource>("herd")
  const [damSource, setDamSource] = useState<ParentSource>("herd")
  const [externalSireReference, setExternalSireReference] = useState("")
  const [externalSireBreed, setExternalSireBreed] = useState("")
  const [externalDamReference, setExternalDamReference] = useState("")
  const [externalDamBreed, setExternalDamBreed] = useState("")
  const [sourceName, setSourceName] = useState("")
  const [photos, setPhotos] = useState<PhotoWithMetadata[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagDraft, setTagDraft] = useState("")
  const { isSaving: isSubmitting, runSave } = useSaveGuard()
  const hydratedAnimal = useRef<string | null>(null)
  const [breedPickerTarget, setBreedPickerTarget] = useState<BreedPickerTarget | null>(null)
  const [customBreed, setCustomBreed] = useState("")
  const [showSexPicker, setShowSexPicker] = useState(false)
  const [showSirePicker, setShowSirePicker] = useState(false)
  const [showDamePicker, setShowDamePicker] = useState(false)
  const [parentSearch, setParentSearch] = useState("")
  const [showRfidHelp, setShowRfidHelp] = useState(false)
  const [showVisualTagHelp, setShowVisualTagHelp] = useState(false)

  // Initialize RFID scanner
  useEffect(() => {
    console.log("[AnimalForm] RFID initialization check:", { hasRfidHardware, isInitialized })
    if (hasRfidHardware && !isInitialized) {
      console.log("[AnimalForm] Initializing RFID scanner...")
      initialize()
    }
  }, [hasRfidHardware, isInitialized, initialize])

  // Handle scanned RFID tag
  useEffect(() => {
    if (scannedTag && scannedTag.epc) {
      setRfidTag(scannedTag.epc)
    }
  }, [scannedTag])

  // Pre-fill form when editing
  useEffect(() => {
    if (animal && isEditing && hydratedAnimal.current !== animal.id) {
      hydratedAnimal.current = animal.id
      setRfidTag(animal.rfidTag)
      setVisualTag(animal.visualTag)
      setName(animal.name || "")
      setBreed(animal.breed)
      setSex(animal.sex)
      setStatus(animal.status)
      setVaccinationHistory(getVaccinationHistory(animal))
      setDateOfBirth(animal.dateOfBirth || null)
      setRegistrationNumber(animal.registrationNumber || "")
      setHerdTag(animal.herdTag || "")
      setSireId(animal.sireId || null)
      setDameId(animal.damId || null)
      setExternalSireReference(animal.externalSireReference || "")
      setExternalSireBreed(animal.externalSireBreed || "")
      setExternalDamReference(animal.externalDamReference || "")
      setExternalDamBreed(animal.externalDamBreed || "")
      setSourceName(animal.sourceName || "")
      setSireSource(
        animal.externalSireReference || animal.externalSireBreed ? "external" : "herd",
      )
      setDamSource(
        animal.externalDamReference || animal.externalDamBreed ? "external" : "herd",
      )
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
      // Load existing tags if editing
      if (animal.tags) {
        try {
          const parsed = JSON.parse(animal.tags)
          if (Array.isArray(parsed)) {
            console.log("[AnimalForm] Loading tags:", parsed)
            setTags(parsed)
          }
        } catch (e) {
          console.error("Failed to parse animal tags:", e)
        }
      } else {
        console.log("[AnimalForm] No tags to load")
        setTags([])
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

  // Creating directly from a Sire/Dam card should begin with the correct sex,
  // while still allowing the farmer to change it before saving if necessary.
  useEffect(() => {
    if (!isEditing && parentRole) {
      setSex(parentRole === "sire" ? "male" : "female")
    }
  }, [isEditing, parentRole])

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
  const breedOptions = [
    ...new Set(
      [
        ...COMMON_BREEDS,
        ...animals.flatMap((existingAnimal) => [
          existingAnimal.breed,
          existingAnimal.externalSireBreed || "",
          existingAnimal.externalDamBreed || "",
        ]),
        breed,
        externalSireBreed,
        externalDamBreed,
      ]
        .map((option) => option.trim())
        .filter(Boolean),
    ),
  ]
  const breedPickerTitle =
    breedPickerTarget === "sire"
      ? "Choose sire breed"
      : breedPickerTarget === "dam"
        ? "Choose dam breed"
        : t("animalFormScreen.modals.breed.title")
  const relevantPurposeTags =
    sex === "male"
      ? MALE_PURPOSE_TAGS.slice(0, 2)
      : sex === "castrated"
        ? MALE_PURPOSE_TAGS.slice(2)
        : []

  const handleSexChange = (nextSex: AnimalSex) => {
    const allowedPurposeTags =
      nextSex === "male"
        ? new Set<string>(MALE_PURPOSE_TAGS.slice(0, 2))
        : nextSex === "castrated"
          ? new Set<string>(MALE_PURPOSE_TAGS.slice(2))
          : new Set<string>()
    setTags((current) =>
      current.filter(
        (tag) =>
          !MALE_PURPOSE_TAGS.includes(tag as (typeof MALE_PURPOSE_TAGS)[number]) ||
          allowedPurposeTags.has(tag),
      ),
    )
    setSex(nextSex)
  }

  const togglePurposeTag = (purposeTag: string) => {
    setTags((current) => {
      const withoutPurpose = current.filter(
        (tag) => !MALE_PURPOSE_TAGS.includes(tag as (typeof MALE_PURPOSE_TAGS)[number]),
      )
      return current.includes(purposeTag) ? withoutPurpose : [...withoutPurpose, purposeTag]
    })
  }

  const openBreedPicker = (target: BreedPickerTarget) => {
    setCustomBreed("")
    setBreedPickerTarget(target)
  }

  const selectBreed = (nextBreed: string) => {
    const normalizedBreed = nextBreed.trim()
    if (!normalizedBreed || !breedPickerTarget) return

    if (breedPickerTarget === "sire") {
      setExternalSireBreed(normalizedBreed)
    } else if (breedPickerTarget === "dam") {
      setExternalDamBreed(normalizedBreed)
    } else {
      setBreed(normalizedBreed)
    }

    setCustomBreed("")
    setBreedPickerTarget(null)
  }

  const fingerprint = animalFormFingerprint({ rfidTag, visualTag, name, breed, sex, status, vaccinationHistory, historyReviewed, dateOfBirth, registrationNumber, herdTag, notes, sireId, dameId, sireSource, damSource, externalSireReference, externalSireBreed, externalDamReference, externalDamBreed, sourceName, photos, tags, tagDraft })
  const initialFingerprint = useRef<string | null>(null)
  if (initialFingerprint.current === null && currentOrg && (!isEditing || animal)) {
    initialFingerprint.current = animalFormFingerprint({
      rfidTag: animal?.rfidTag ?? route.params?.initialRfidTag ?? "",
      visualTag: animal?.visualTag ?? route.params?.initialVisualTag ?? "",
      name: animal?.name ?? "",
      breed: animal?.breed ?? currentOrg?.defaultBreeds?.cattle ?? "",
      sex: animal?.sex ?? (parentRole === "sire" ? "male" : "female"),
      status: animal?.status ?? "active",
      vaccinationHistory: animal ? getVaccinationHistory(animal) : "unknown",
      historyReviewed: false,
      dateOfBirth: animal?.dateOfBirth ?? null,
      registrationNumber: animal?.registrationNumber ?? "",
      herdTag: animal?.herdTag ?? "",
      notes: animal?.notes ?? "",
      sireId: animal?.sireId ?? null,
      dameId: animal?.damId ?? null,
      sireSource: animal?.externalSireReference || animal?.externalSireBreed ? "external" : "herd",
      damSource: animal?.externalDamReference || animal?.externalDamBreed ? "external" : "herd",
      externalSireReference: animal?.externalSireReference ?? "",
      externalSireBreed: animal?.externalSireBreed ?? "",
      externalDamReference: animal?.externalDamReference ?? "",
      externalDamBreed: animal?.externalDamBreed ?? "",
      sourceName: animal?.sourceName ?? "",
      photos: parseFormArray(animal?.photos),
      tags: parseFormArray(animal?.tags),
      tagDraft: "",
    })
  }
  const markSaved = useUnsavedChanges(initialFingerprint.current !== null && fingerprint !== initialFingerprint.current, isSubmitting)

  const handleSave = useCallback(async () => {
    await runSave(async () => {
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

      // Duplicate tag (visual + RFID) is enforced in the data layer via
      // createAnimal/updateAnimal, which throws DuplicateTagError — caught below.

      try {
        const tagsToSave = mergeTagsWithDraft(tags, tagDraft)
        const tagsJson = tagsToSave.length > 0 ? JSON.stringify(tagsToSave) : null
        console.log("[AnimalForm] Saving tags:", tagsToSave, "as JSON:", tagsJson)

        const data: AnimalFormData = {
          rfidTag: rfidTag.trim(),
          visualTag: visualTag.trim(),
          name: name.trim() || undefined,
          breed: breed.trim(),
          sex,
          dateOfBirth: dateOfBirth || undefined,
          sireId: sireSource === "herd" ? sireId : null,
          damId: damSource === "herd" ? dameId : null,
          externalSireReference:
            sireSource === "external" ? externalSireReference.trim() || null : null,
          externalSireBreed:
            sireSource === "external" ? externalSireBreed.trim() || null : null,
          externalDamReference:
            damSource === "external" ? externalDamReference.trim() || null : null,
          externalDamBreed:
            damSource === "external" ? externalDamBreed.trim() || null : null,
          sourceName: sourceName.trim() || null,
          status,
          vaccinationHistory: !isEditing || historyReviewed ? vaccinationHistory : (animal?.vaccinationHistory as VaccinationHistory | null) ?? undefined,
          registrationNumber: registrationNumber.trim() || undefined,
          herdTag: herdTag.trim() || undefined,
          notes: notes.trim() || undefined,
          tags: tagsJson,
        }

        let savedAnimalId: string
        if (isEditing && animalId) {
          console.log("[AnimalForm] Updating animal with data:", data)
          await updateAnimal(animalId, data)
          savedAnimalId = animalId
        } else {
          const newAnimal = await createAnimal(data)
          savedAnimalId = newAnimal.id

          if (linkAsParentOf && parentRole) {
            await updateAnimal(
              linkAsParentOf,
              parentRole === "sire"
                ? {
                    sireId: newAnimal.id,
                    externalSireReference: null,
                    externalSireBreed: null,
                  }
                : {
                    damId: newAnimal.id,
                    externalDamReference: null,
                    externalDamBreed: null,
                  },
            )
          }
        }

        // Upload new photos in background
        const newPhotos = photos.filter(p => p.uploadStatus === "pending")
        if (newPhotos.length > 0) {
          uploadPhotosInBackground(savedAnimalId, newPhotos)
        }

        markSaved()
        Toast.show({ type: "success", text1: t("uxFixes.savedLocally"), text2: visualTag || rfidTag })
        navigation.goBack()
      } catch (e) {
        if (e instanceof DuplicateTagError) {
          // Reset here too: setIsSubmitting(false) below is bypassed by the return.
          Alert.alert(
            t("animalFormScreen.alerts.validation.duplicateTag.title"),
            t(`animalFormScreen.alerts.validation.duplicateTag.${e.tagKind}Message`, {
              tag: e.tagValue,
              name: e.existingName,
            }),
          )
          return
        }
        if (e instanceof AnimalLimitError) {
          Alert.alert(
            t("animalFormScreen.alerts.animalLimit.title"),
            t("animalFormScreen.alerts.animalLimit.message", { limit: e.limit }),
            [
              { text: t("common.cancel"), style: "cancel" },
              {
                text: t("animalFormScreen.alerts.animalLimit.upgrade"),
                onPress: () => navigation.navigate("Paywall"),
              },
            ],
          )
          return
        }
        console.error("Failed to save animal:", e)
        Alert.alert(
          t("animalFormScreen.alerts.saveError.title"),
          t("animalFormScreen.alerts.saveError.message")
        )
      }
    })
  }, [runSave, markSaved, animal, rfidTag, visualTag, name, breed, sex, dateOfBirth, sireId, dameId, sireSource, damSource, externalSireReference, externalSireBreed, externalDamReference, externalDamBreed, sourceName, status, vaccinationHistory, historyReviewed, registrationNumber, herdTag, notes, photos, tags, tagDraft, currentOrg, isEditing, animalId, linkAsParentOf, parentRole, createAnimal, updateAnimal, navigation, t, hasRfidHardware, animals])

  const uploadPhotosInBackground = async (savedAnimalId: string, photosToUpload: PhotoWithMetadata[]) => {
    try {
      const failedUploads: PhotoWithMetadata[] = []
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
            // Likely offline — queue for retry on the next successful sync
            // instead of dropping the photo.
            console.error("Failed to upload photo, queuing for later:", error)
            failedUploads.push(photo)
            return null
          }
        }),
      )

      if (failedUploads.length > 0) {
        await enqueuePhotoUploads(
          failedUploads.map((photo) => ({
            table: "animals",
            recordId: savedAnimalId,
            category: "animals",
            organizationId: currentOrg!.id,
            localUri: photo.localUri!,
            userId: user?.id,
            caption: photo.caption,
          })),
        )
      }

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
        <Button text={t("animalFormScreen.buttons.cancel")} preset="default" disabled={isSubmitting} onPress={() => navigation.goBack()} />
        <Text
          preset="heading"
          text={
            isEditing
              ? t("animalFormScreen.title.edit")
              : isCreatingParent
                ? `Add ${parentRole === "sire" ? "Sire" : "Dam"}`
                : t("animalFormScreen.title.add")
          }
        />
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
        {isCreatingParent && (
          <View style={themed($helperNote)}>
            <Text
              text={`This animal will be linked as the ${parentRole} when you save.`}
              size="xs"
              style={themed($helperText)}
            />
          </View>
        )}

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
              <Pressable onPress={() => setShowRfidHelp(!showRfidHelp)} style={themed($hint)}>
                <MaterialCommunityIcons name="information-outline" size={14} color={colors.textDim} />
              </Pressable>
            </View>
            {showRfidHelp && (
              <View style={themed($helpBox)}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color={colors.tint} style={{ marginRight: 6 }} />
                <Text text={t("animalFormScreen.fields.rfidTag.helpText")} size="xxs" style={themed($helpText)} />
              </View>
            )}
            {isScanning ? (
              <View style={themed($rfidScanningBox)}>
                <ActivityIndicator size="small" color={colors.tint} />
                <Text text="Scanning..." size="md" style={{ color: colors.tint, fontWeight: "600" }} />
              </View>
            ) : rfidTag ? (
              <View style={themed($rfidDisplayBox)}>
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.tint} />
                <Text text={rfidTag} size="md" style={{ color: colors.text, fontWeight: "600", flex: 1 }} />
                <Pressable onPress={() => setRfidTag("")} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.textDim} />
                </Pressable>
              </View>
            ) : (
              <View style={themed($rfidPromptBox)}>
                <MaterialCommunityIcons name="radio-tower" size={24} color={colors.textDim} />
                <Text text="Pull trigger to scan RFID tag" size="sm" style={{ color: colors.textDim }} />
              </View>
            )}
          </View>
        )}

        <View>
          <View style={themed($labelWithHint)}>
            <Text preset="formLabel" text={t("animalFormScreen.fields.visualTag.label")} style={themed($pickerLabel)} />
            <Pressable onPress={() => setShowVisualTagHelp(!showVisualTagHelp)} style={themed($hint)}>
              <MaterialCommunityIcons name="camera-outline" size={14} color={colors.textDim} />
            </Pressable>
          </View>
          {showVisualTagHelp && (
            <View style={themed($helpBox)}>
              <MaterialCommunityIcons name="camera-outline" size={14} color={colors.tint} style={{ marginRight: 6 }} />
              <Text text={t("animalFormScreen.fields.visualTag.helpText")} size="xxs" style={themed($helpText)} />
            </View>
          )}
          <View style={themed($tagInputRow)}>
            <TextField
          editable={!isSubmitting}
              value={visualTag}
              accessibilityLabel={t("animalFormScreen.fields.visualTag.label")}
              onChangeText={setVisualTag}
              placeholder={t("animalFormScreen.fields.visualTag.placeholder")}
              autoCorrect={false}
              containerStyle={themed($tagInput)}
            />
            <ScanTagButton
              compact
              onTagScanned={setVisualTag}
            />
          </View>
        </View>

        <TextField
          editable={!isSubmitting}
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
          <Pressable onPress={() => openBreedPicker("animal")} style={themed($pickerButton)}>
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
            <AgeDatePicker
              label={t("animalFormScreen.fields.dateOfBirth.label")}
              value={dateOfBirth}
              onChange={setDateOfBirth}
              placeholder={t("animalFormScreen.fields.dateOfBirth.placeholder")}
            />
          </View>
        </View>

        <VaccinationHistoryInput value={vaccinationHistory} legacy={isEditing && !historyReviewed && !animal?.vaccinationHistory} disabled={isSubmitting} onChange={(history) => {
          setVaccinationHistory(history)
          setHistoryReviewed(true)
        }} />

        {/* Lineage Section */}
        <View style={themed($lineageSection)}>
          <View style={themed($labelWithHint)}>
            <Text text={t("animalFormScreen.lineage.title")} preset="formLabel" />
            <View style={themed($hint)}>
              <MaterialCommunityIcons name="dna" size={14} color={colors.textDim} />
            </View>
          </View>
          <View style={themed($helpBox)}>
            <MaterialCommunityIcons name="dna" size={14} color={colors.tint} style={{ marginRight: 6 }} />
            <Text text={t("animalFormScreen.lineage.helpText")} size="xxs" style={themed($helpText)} />
          </View>

          <View>
            <Text text={t("animalFormScreen.lineage.sire.label")} size="xs" style={themed($lineageLabel)} />
            <View style={themed($sourceChoiceRow)}>
              {(["herd", "external"] as ParentSource[]).map((source) => (
                <Pressable
                  key={source}
                  style={[
                    themed($sourceChoice),
                    sireSource === source && themed($sourceChoiceSelected),
                  ]}
                  onPress={() => setSireSource(source)}
                >
                  <Text
                    text={source === "herd" ? "In herd" : "External"}
                    size="xs"
                    style={sireSource === source ? themed($sourceChoiceTextSelected) : undefined}
                  />
                </Pressable>
              ))}
            </View>
            {sireSource === "herd" ? (
              <>
                <Pressable onPress={() => setShowSirePicker(true)} style={themed($pickerButton)}>
                  <Text
                    text={selectedSire ? selectedSire.displayName : t("animalFormScreen.lineage.sire.placeholder")}
                    style={!selectedSire && themed($placeholderText)}
                  />
                </Pressable>
                {!selectedSire && maleAnimals.length === 0 && (
                  <View style={themed($inlineHint)}>
                    <MaterialCommunityIcons name="information-outline" size={12} color={colors.textDim} style={{ marginRight: 4 }} />
                    <Text text="No bulls are in this herd. Choose External to record an outside sire." size="xxs" style={themed($hintTextSmall)} />
                  </View>
                )}
              </>
            ) : (
              <View style={themed($externalParentFields)}>
                <TextField
          editable={!isSubmitting}
                  label="Sire ID or registration"
                  value={externalSireReference}
                  onChangeText={setExternalSireReference}
                  placeholder="e.g. BULL-12 or society number"
                  autoCorrect={false}
                />
                <View>
                  <Text preset="formLabel" text="Sire breed" style={themed($pickerLabel)} />
                  <Pressable
                    onPress={() => openBreedPicker("sire")}
                    style={themed($pickerButton)}
                    accessibilityRole="button"
                    accessibilityLabel="Choose sire breed"
                  >
                    <Text
                      text={externalSireBreed || "Choose or create a breed"}
                      style={!externalSireBreed && themed($placeholderText)}
                    />
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          <View>
            <Text text="Dam" size="xs" style={themed($lineageLabel)} />
            <View style={themed($sourceChoiceRow)}>
              {(["herd", "external"] as ParentSource[]).map((source) => (
                <Pressable
                  key={source}
                  style={[
                    themed($sourceChoice),
                    damSource === source && themed($sourceChoiceSelected),
                  ]}
                  onPress={() => setDamSource(source)}
                >
                  <Text
                    text={source === "herd" ? "In herd" : "External"}
                    size="xs"
                    style={damSource === source ? themed($sourceChoiceTextSelected) : undefined}
                  />
                </Pressable>
              ))}
            </View>
            {damSource === "herd" ? (
              <>
                <Pressable onPress={() => setShowDamePicker(true)} style={themed($pickerButton)}>
                  <Text
                    text={selectedDame ? selectedDame.displayName : t("animalFormScreen.lineage.dame.placeholder")}
                    style={!selectedDame && themed($placeholderText)}
                  />
                </Pressable>
                {!selectedDame && femaleAnimals.length === 0 && (
                  <View style={themed($inlineHint)}>
                    <MaterialCommunityIcons name="information-outline" size={12} color={colors.textDim} style={{ marginRight: 4 }} />
                    <Text text="No cows are in this herd. Choose External to record an outside dam." size="xxs" style={themed($hintTextSmall)} />
                  </View>
                )}
              </>
            ) : (
              <View style={themed($externalParentFields)}>
                <TextField
          editable={!isSubmitting}
                  label="Dam ID or registration"
                  value={externalDamReference}
                  onChangeText={setExternalDamReference}
                  placeholder="e.g. C102 or society number"
                  autoCorrect={false}
                />
                <View>
                  <Text preset="formLabel" text="Dam breed" style={themed($pickerLabel)} />
                  <Pressable
                    onPress={() => openBreedPicker("dam")}
                    style={themed($pickerButton)}
                    accessibilityRole="button"
                    accessibilityLabel="Choose dam breed"
                  >
                    <Text
                      text={externalDamBreed || "Choose or create a breed"}
                      style={!externalDamBreed && themed($placeholderText)}
                    />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>

        <TextField
          editable={!isSubmitting}
          label="Source farm or breeder (optional)"
          value={sourceName}
          onChangeText={setSourceName}
          placeholder="Farm, company or breeder bought from"
          autoCapitalize="words"
        />

        <TextField
          editable={!isSubmitting}
          label={t("animalFormScreen.fields.registrationNumber.label")}
          value={registrationNumber}
          onChangeText={setRegistrationNumber}
          placeholder={t("animalFormScreen.fields.registrationNumber.placeholder")}
          autoCorrect={false}
        />

        <TextField
          editable={!isSubmitting}
          label={t("animalFormScreen.fields.notes.label")}
          value={notes}
          onChangeText={setNotes}
          placeholder={t("animalFormScreen.fields.notes.placeholder")}
          multiline
        />

        <View>
          <Text text="Tags" size="sm" style={{ marginBottom: 8, fontWeight: "600", color: colors.text }} />
          <TagInput
            tags={tags}
            onTagsChange={setTags}
            onDraftChange={setTagDraft}
            placeholder="Add tags (e.g., Breeding Stock, For Sale...)"
          />
          {relevantPurposeTags.length > 0 && (
            <View style={themed($purposeSection)}>
              <Text text="Purpose (optional)" size="xs" style={themed($dimText)} />
              <View style={themed($purposeChipRow)}>
                {relevantPurposeTags.map((purposeTag) => {
                  const selected = tags.includes(purposeTag)
                  return (
                    <Pressable
                      key={purposeTag}
                      onPress={() => togglePurposeTag(purposeTag)}
                      style={[
                        themed($purposeChip),
                        selected && themed($purposeChipSelected),
                      ]}
                    >
                      <Text
                        text={purposeTag}
                        size="xs"
                        style={selected ? themed($purposeChipTextSelected) : undefined}
                      />
                    </Pressable>
                  )
                })}
              </View>
              <Text
                text="Choose one so breeding bulls kept for your herd stay distinct from bulls for sale."
                size="xxs"
                style={themed($hintTextSmall)}
              />
            </View>
          )}
        </View>

        <Button
          text={isSubmitting ? t("animalFormScreen.buttons.saving") : isEditing ? t("animalFormScreen.buttons.save") : t("animalFormScreen.buttons.add")}
          preset="reversed"
          style={themed($saveButton)}
          disabled={isSubmitting}
          onPress={handleSave}
        />
      </View>

      {/* Breed Picker Modal */}
      <Modal
        visible={breedPickerTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setBreedPickerTarget(null)}
      >
        <View style={themed($modalOverlay)}>
          <View style={themed($modalContent)}>
            <Text preset="heading" text={breedPickerTitle} size="md" />
            <View style={themed($customBreedBox)}>
              <TextField
          editable={!isSubmitting}
                label={
                  breedPickerTarget === "sire"
                    ? "Custom sire breed or cross"
                    : breedPickerTarget === "dam"
                      ? "Custom dam breed or cross"
                      : "Custom breed or cross"
                }
                value={customBreed}
                onChangeText={setCustomBreed}
                placeholder="e.g. Nguni × farm composite"
                autoCapitalize="words"
              />
              <Button
                text="Use custom breed"
                preset="reversed"
                disabled={!customBreed.trim()}
                onPress={() => selectBreed(customBreed)}
              />
            </View>
            <FlatList
              data={breedOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={themed($modalItem)}
                  onPress={() => selectBreed(item)}
                >
                  <Text text={item} />
                </Pressable>
              )}
            />
            <Button
              text={t("animalFormScreen.modals.breed.cancel")}
              onPress={() => setBreedPickerTarget(null)}
            />
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
                  handleSexChange(s)
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
          editable={!isSubmitting}
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
                    setExternalSireReference("")
                    setExternalSireBreed("")
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
          editable={!isSubmitting}
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
                    setExternalDamReference("")
                    setExternalDamBreed("")
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

const $vaccStatusRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.md,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
})

const $vaccStatusText: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $vaccStatusHelp: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xxs,
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

const $rfidScanningBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderWidth: 2,
  borderColor: colors.tint,
  borderRadius: 12,
  padding: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
  minHeight: 56,
})

const $rfidDisplayBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderWidth: 2,
  borderColor: colors.tint,
  borderRadius: 12,
  padding: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  minHeight: 56,
})

const $rfidPromptBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderWidth: 2,
  borderColor: colors.border,
  borderStyle: "dashed",
  borderRadius: 12,
  padding: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.sm,
  minHeight: 56,
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

const $sourceChoiceRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
  marginBottom: spacing.xs,
})

const $sourceChoice: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  paddingVertical: spacing.xs,
  backgroundColor: colors.background,
})

const $sourceChoiceSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.tint,
  backgroundColor: colors.palette.primary100,
})

const $sourceChoiceTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "700",
})

const $externalParentFields: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.xs,
})

const $purposeSection: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.sm,
  padding: spacing.sm,
  gap: spacing.xs,
  borderRadius: 10,
  backgroundColor: colors.palette.neutral100,
})

const $purposeChipRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})

const $purposeChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 16,
  backgroundColor: colors.background,
})

const $purposeChipSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.tint,
  backgroundColor: colors.palette.primary100,
})

const $purposeChipTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "700",
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

const $customBreedBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  gap: spacing.sm,
  padding: spacing.sm,
  borderRadius: 12,
  backgroundColor: colors.palette.neutral100,
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
  backgroundColor: colors.palette.primary100,
  borderLeftWidth: 3,
  borderLeftColor: colors.palette.primary500,
  borderRadius: 6,
  padding: spacing.xs,
  marginBottom: spacing.xs,
  flexDirection: "row",
  alignItems: "flex-start",
})

const $helpText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
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

function parseFormArray(value?: string | null): any[] {
  try { const parsed = JSON.parse(value || "[]"); return Array.isArray(parsed) ? parsed : [] } catch { return [] }
}
function animalFormFingerprint(values: Record<string, any>): string {
  return JSON.stringify({ ...values, dateOfBirth: values.dateOfBirth?.getTime() ?? null,
    photos: values.photos.map((photo: any) => ({ id: photo.id ?? null, uri: photo.uri ?? null, localUri: photo.localUri ?? null, caption: photo.caption ?? "" })),
  })
}
