import { FC, useCallback, useState, useMemo } from "react"
import { Alert, Pressable, View, ViewStyle, TextStyle, ScrollView } from "react-native"

import { Screen, Text, TextField, Button, Icon } from "@/components"
import { PhotoPicker } from "@/components/PhotoPicker"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useHealthRecordActions } from "@/hooks/useRecords"
import { HealthRecordType } from "@/db/models/HealthRecord"
import { useSubscription } from "@/context/SubscriptionContext"
import { useDatabase } from "@/context/DatabaseContext"
import { useAuth } from "@/context/AuthContext"
import { uploadPhoto } from "@/services/photoStorage"
import type { PhotoWithMetadata } from "@/types/Photo"
import { serializePhotos } from "@/types/Photo"
import { useProtocols } from "@/hooks/useProtocols"

const RECORD_TYPES: HealthRecordType[] = ["vaccination", "treatment", "vet_visit", "condition_score", "other"]

export const HealthRecordFormScreen: FC<AppStackScreenProps<"HealthRecordForm">> = ({ route, navigation }) => {
  const { themed } = useAppTheme()
  const { animalId } = route.params
  const { createHealthRecord } = useHealthRecordActions()
  const { hasFeature } = useSubscription()
  const { currentOrg } = useDatabase()
  const { user } = useAuth()
  const { protocols } = useProtocols()

  const [recordType, setRecordType] = useState<HealthRecordType>("treatment")
  const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(null)
  const [showProtocolPicker, setShowProtocolPicker] = useState(false)
  const [description, setDescription] = useState("")
  const [productName, setProductName] = useState("")
  const [dosage, setDosage] = useState("")
  const [administeredBy, setAdministeredBy] = useState("")
  const [notes, setNotes] = useState("")
  const [photos, setPhotos] = useState<PhotoWithMetadata[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter protocols based on record type
  const relevantProtocols = useMemo(() => {
    return protocols.filter(p => {
      if (!p.isActive) return false
      if (recordType === "vaccination") return p.protocolType === "vaccination"
      if (recordType === "treatment") return p.protocolType === "treatment" || p.protocolType === "deworming"
      return false
    })
  }, [protocols, recordType])

  const selectedProtocol = useMemo(() => {
    if (!selectedProtocolId) return null
    return protocols.find(p => p.id === selectedProtocolId) || null
  }, [selectedProtocolId, protocols])

  // Auto-fill from protocol when selected
  const handleSelectProtocol = useCallback((protocolId: string) => {
    const protocol = protocols.find(p => p.id === protocolId)
    if (!protocol) return

    setSelectedProtocolId(protocolId)
    setDescription(protocol.name)
    setProductName(protocol.productName)
    setDosage(protocol.dosage)
    if (protocol.description) {
      setNotes(protocol.description)
    }
    setShowProtocolPicker(false)
  }, [protocols])

  const handleClearProtocol = useCallback(() => {
    setSelectedProtocolId(null)
    setDescription("")
    setProductName("")
    setDosage("")
    setNotes("")
  }, [])

  const handleSave = useCallback(async () => {
    if (!description.trim()) {
      Alert.alert("Required", "Description is required")
      return
    }

    if (!currentOrg) {
      Alert.alert("Error", "No organization selected")
      return
    }

    setIsSubmitting(true)
    try {
      const record = await createHealthRecord({
        animalId,
        recordDate: new Date(),
        recordType,
        description: description.trim(),
        productName: productName.trim() || undefined,
        dosage: dosage.trim() || undefined,
        administeredBy: administeredBy.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      if (photos.length > 0) {
        uploadPhotosInBackground(record.id, photos)
      }

      navigation.goBack()
    } catch (error) {
      console.error("Failed to save health record:", error)
      Alert.alert("Error", "Failed to save health record")
    }
    setIsSubmitting(false)
  }, [animalId, recordType, description, productName, dosage, administeredBy, notes, photos, currentOrg, createHealthRecord, navigation])

  const uploadPhotosInBackground = async (recordId: string, photosToUpload: PhotoWithMetadata[]) => {
    try {
      const uploadedPhotos = await Promise.all(
        photosToUpload.map(async (photo) => {
          if (!photo.localUri) return null
          try {
            const result = await uploadPhoto({
              localUri: photo.localUri,
              organizationId: currentOrg!.id,
              category: "health",
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
        const database = await import("@/db")
        await database.database.write(async () => {
          const healthRecord = await database.database.get("health_records").find(recordId)
          await healthRecord.update((r: any) => {
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
        <Button text="Cancel" preset="default" onPress={() => navigation.goBack()} />
        <Text preset="heading" text="Health Record" />
        <View style={{ width: 60 }} />
      </View>

      <View style={themed($form)}>
        <Text preset="formLabel" text="Type" />
        <View style={themed($typeRow)}>
          {RECORD_TYPES.map((t) => {
            const locked = t === "vaccination" && !hasFeature("vaccines")
            return (
              <Pressable
                key={t}
                onPress={() => {
                  if (locked) {
                    navigation.navigate("Upgrade" as any)
                    return
                  }
                  setRecordType(t)
                  setSelectedProtocolId(null) // Reset protocol when type changes
                }}
                style={themed(recordType === t ? $typeChipActive : locked ? $typeChipLocked : $typeChip)}
              >
                <Text
                  text={locked ? `${t.replace("_", " ")} (PRO)` : t.replace("_", " ")}
                  size="xs"
                  style={themed(recordType === t ? $typeChipTextActive : $typeChipText)}
                />
              </Pressable>
            )
          })}
        </View>

        {/* Protocol Picker */}
        {relevantProtocols.length > 0 && (
          <View style={themed($protocolSection)}>
            {selectedProtocol ? (
              <View style={themed($selectedProtocol)}>
                <View style={themed($selectedProtocolInfo)}>
                  <Icon icon="check" size={20} color="#4A8C3F" />
                  <View style={themed($selectedProtocolText)}>
                    <Text style={themed($selectedProtocolName)}>{selectedProtocol.name}</Text>
                    <Text style={themed($selectedProtocolDetail)}>{selectedProtocol.productName} • {selectedProtocol.dosage}</Text>
                  </View>
                </View>
                <Pressable onPress={handleClearProtocol} style={themed($clearButton)}>
                  <Icon icon="x" size={20} color="#999" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={themed($selectProtocolButton)}
                onPress={() => setShowProtocolPicker(!showProtocolPicker)}
              >
                <Icon icon="medical" size={20} color="#666" />
                <Text style={themed($selectProtocolText)}>
                  Select from {relevantProtocols.length} saved protocol{relevantProtocols.length !== 1 ? 's' : ''}
                </Text>
                <Icon icon="caretRight" size={16} color="#999" />
              </Pressable>
            )}

            {/* Protocol List */}
            {showProtocolPicker && !selectedProtocol && (
              <ScrollView style={themed($protocolList)} nestedScrollEnabled>
                {relevantProtocols.map((protocol) => (
                  <Pressable
                    key={protocol.id}
                    style={themed($protocolItem)}
                    onPress={() => handleSelectProtocol(protocol.id)}
                  >
                    <View style={themed($protocolItemContent)}>
                      <Text style={themed($protocolItemName)}>{protocol.name}</Text>
                      <Text style={themed($protocolItemDetail)}>{protocol.productName} • {protocol.dosage}</Text>
                    </View>
                    <Icon icon="caretRight" size={16} color="#999" />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {relevantProtocols.length === 0 && (recordType === "vaccination" || recordType === "treatment") && (
          <Pressable
            style={themed($noProtocolsButton)}
            onPress={() => navigation.navigate("TreatmentProtocols")}
          >
            <Text style={themed($noProtocolsText)}>
              No protocols found. Create one in Settings → Treatment Protocols
            </Text>
          </Pressable>
        )}

        <TextField
          label="Description *"
          value={description}
          onChangeText={setDescription}
          placeholder="What was done?"
          multiline
        />
        <TextField
          label="Product Name"
          value={productName}
          onChangeText={setProductName}
          placeholder="e.g. Covexin 10"
        />
        <TextField
          label="Dosage"
          value={dosage}
          onChangeText={setDosage}
          placeholder="e.g. 2ml SC"
        />
        <TextField
          label="Administered By"
          value={administeredBy}
          onChangeText={setAdministeredBy}
          placeholder="Name"
        />
        <TextField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional notes..."
          multiline
        />

        <PhotoPicker
          photos={photos}
          onPhotosChange={setPhotos}
          maxPhotos={3}
          label="Photos (Optional)"
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

const $typeRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
  marginBottom: spacing.xs,
})

const $typeChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.sm,
})

const $typeChipActive: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  borderRadius: 16,
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.sm,
})

const $typeChipLocked: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.sm,
  borderWidth: 1,
  borderColor: colors.palette.accent500,
  borderStyle: "dashed",
})

const $typeChipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
})

const $typeChipTextActive: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
})

const $saveButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})

const $protocolSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $selectedProtocol: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "#E2EDDF",
  borderRadius: 12,
  padding: spacing.md,
  borderWidth: 2,
  borderColor: "#4A8C3F",
})

const $selectedProtocolInfo: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  flex: 1,
})

const $selectedProtocolText: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $selectedProtocolName: ThemedStyle<TextStyle> = () => ({
  fontSize: 16,
  fontWeight: "600",
  color: "#36712D",
  marginBottom: 2,
})

const $selectedProtocolDetail: ThemedStyle<TextStyle> = () => ({
  fontSize: 13,
  color: "#5A8C51",
})

const $clearButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xxs,
})

const $selectProtocolButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.md,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
})

const $selectProtocolText: ThemedStyle<TextStyle> = ({ colors }) => ({
  flex: 1,
  fontSize: 15,
  color: colors.text,
  fontWeight: "500",
})

const $protocolList: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  maxHeight: 240,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  marginTop: spacing.xs,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
})

const $protocolItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral200,
})

const $protocolItemContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $protocolItemName: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 15,
  fontWeight: "600",
  color: colors.text,
  marginBottom: 2,
})

const $protocolItemDetail: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 13,
  color: colors.textDim,
})

const $noProtocolsButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.accent100,
  borderRadius: 12,
  padding: spacing.md,
  borderWidth: 1,
  borderColor: colors.palette.accent300,
  marginBottom: spacing.sm,
})

const $noProtocolsText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.palette.accent600,
  textAlign: "center",
  lineHeight: 20,
})
