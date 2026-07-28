import { FC, useState } from "react"
import { Alert, Pressable, TextStyle, View, ViewStyle } from "react-native"

import { Button, DateField, Icon, Screen, Text, TextField } from "@/components"
import { PhotoPicker } from "@/components/PhotoPicker"
import { useAuth } from "@/context/AuthContext"
import { useDatabase } from "@/context/DatabaseContext"
import { database } from "@/db"
import {
  PASTURE_ACTIVITY_LABELS,
  PASTURE_ACTIVITY_TYPES,
  PastureActivity,
  PastureActivityType,
  TICK_LOAD_OPTIONS,
} from "@/db/models"
import { usePastureActivityActions } from "@/hooks/usePastureActivities"
import { usePasture } from "@/hooks/usePastures"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { uploadPhoto } from "@/services/photoStorage"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { serializePhotos } from "@/types/Photo"
import type { PhotoWithMetadata } from "@/types/Photo"

interface PastureActivityFormScreenProps extends AppStackScreenProps<"PastureActivityForm"> {}

export const PastureActivityFormScreen: FC<PastureActivityFormScreenProps> = ({
  navigation,
  route,
}) => {
  const { pastureId } = route.params
  const { pasture } = usePasture(pastureId)
  const { createActivity } = usePastureActivityActions()
  const { currentOrg } = useDatabase()
  const { user } = useAuth()
  const { themed } = useAppTheme()

  const [activityDate, setActivityDate] = useState<Date | null>(new Date())
  const [activityType, setActivityType] = useState<PastureActivityType>("burning")
  const [targetSpecies, setTargetSpecies] = useState("")
  const [areaHectares, setAreaHectares] = useState("")
  const [performedBy, setPerformedBy] = useState("")
  const [notes, setNotes] = useState("")
  const [photos, setPhotos] = useState<PhotoWithMetadata[]>([])
  const [tickLoadScore, setTickLoadScore] = useState(0)
  const [animalsInspected, setAnimalsInspected] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!activityDate) {
      Alert.alert("Date required", "Please enter the date of the pasture activity.")
      return
    }

    if (activityDate.getTime() > Date.now()) {
      Alert.alert("Invalid date", "Pasture activities cannot be dated in the future.")
      return
    }

    const parsedArea = areaHectares.trim() ? Number(areaHectares.replace(",", ".")) : undefined
    if (
      activityType !== "tick_observation" &&
      parsedArea !== undefined &&
      (!Number.isFinite(parsedArea) || parsedArea <= 0)
    ) {
      Alert.alert("Invalid area", "Area treated must be a positive number.")
      return
    }

    const parsedAnimalsInspected = animalsInspected.trim() ? Number(animalsInspected) : undefined
    if (
      activityType === "tick_observation" &&
      (parsedAnimalsInspected === undefined ||
        !Number.isInteger(parsedAnimalsInspected) ||
        parsedAnimalsInspected <= 0)
    ) {
      Alert.alert("Animals inspected required", "Enter the number of animals checked for ticks.")
      return
    }

    setIsSaving(true)
    try {
      const activity = await createActivity({
        pastureId,
        activityDate,
        activityType,
        targetSpecies: activityType === "tick_observation" ? undefined : targetSpecies,
        areaHectares: activityType === "tick_observation" ? undefined : parsedArea,
        performedBy,
        notes,
        tickLoadScore: activityType === "tick_observation" ? tickLoadScore : undefined,
        animalsInspected: activityType === "tick_observation" ? parsedAnimalsInspected : undefined,
      })
      if (photos.length > 0) {
        void uploadPhotosInBackground(activity.id, photos)
      }
      navigation.goBack()
    } catch (error) {
      console.error("[PastureActivity] Failed to save:", error)
      Alert.alert("Could not save activity", "Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const uploadPhotosInBackground = async (
    activityId: string,
    photosToUpload: PhotoWithMetadata[],
  ) => {
    if (!currentOrg) return

    try {
      const uploadedPhotos = await Promise.all(
        photosToUpload.map(async (photo) => {
          if (!photo.localUri) return null
          try {
            const result = await uploadPhoto({
              localUri: photo.localUri,
              organizationId: currentOrg.id,
              category: "pastures",
              recordId: activityId,
              userId: user?.id,
            })
            return result.photo
          } catch (error) {
            console.error("[PastureActivity] Failed to upload photo:", error)
            return null
          }
        }),
      )

      const successfulPhotos = uploadedPhotos.filter((photo) => photo !== null)
      if (successfulPhotos.length === 0) return

      await database.write(async () => {
        const activity = await database.get<PastureActivity>("pasture_activities").find(activityId)
        await activity.update((record) => {
          record.photos = serializePhotos(successfulPhotos)
        })
      })
    } catch (error) {
      console.error("[PastureActivity] Failed to attach photos:", error)
    }
  }

  return (
    <Screen preset="scroll" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <View style={themed($header)}>
        <Pressable
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={themed($backButton)}
        >
          <Icon icon="back" size={24} />
        </Pressable>
        <View style={themed($headerText)}>
          <Text preset="heading" text="Log pasture activity" />
          {!!pasture && <Text text={pasture.name} style={themed($subtitle)} />}
        </View>
      </View>

      <DateField
        label="Activity date"
        value={activityDate}
        onChange={setActivityDate}
        containerStyle={themed($field)}
      />

      <View style={themed($field)}>
        <Text preset="formLabel" text="Activity type" />
        <View style={themed($chipRow)}>
          {PASTURE_ACTIVITY_TYPES.map((type) => {
            const selected = activityType === type
            return (
              <Pressable
                key={type}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setActivityType(type)}
                style={[themed($chip), selected && themed($chipSelected)]}
              >
                <Text
                  text={PASTURE_ACTIVITY_LABELS[type]}
                  style={[themed($chipText), selected && themed($chipTextSelected)]}
                />
              </Pressable>
            )
          })}
        </View>
      </View>

      {activityType === "tick_observation" ? (
        <>
          <View style={themed($field)}>
            <Text preset="formLabel" text="Tick-load score" />
            <Text
              text="Use the same 0–5 score each time so changes can be compared."
              style={themed($fieldHint)}
            />
            <View style={themed($scoreGrid)}>
              {TICK_LOAD_OPTIONS.map((option) => {
                const selected = tickLoadScore === option.score
                return (
                  <Pressable
                    key={option.score}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setTickLoadScore(option.score)}
                    style={[themed($scoreChip), selected && themed($chipSelected)]}
                  >
                    <Text
                      text={`${option.score}`}
                      style={[themed($scoreValue), selected && themed($chipTextSelected)]}
                    />
                    <Text
                      text={option.label}
                      style={[themed($scoreLabel), selected && themed($chipTextSelected)]}
                    />
                  </Pressable>
                )
              })}
            </View>
          </View>

          <TextField
            label="Number of animals inspected"
            value={animalsInspected}
            onChangeText={(text) => setAnimalsInspected(text.replace(/\D/g, ""))}
            placeholder="e.g. 12"
            keyboardType="number-pad"
            containerStyle={themed($field)}
          />
        </>
      ) : (
        <>
          <TextField
            label="Target invasive species (optional)"
            value={targetSpecies}
            onChangeText={setTargetSpecies}
            placeholder="e.g. Black wattle"
            containerStyle={themed($field)}
          />

          <TextField
            label="Area treated in hectares (optional)"
            value={areaHectares}
            onChangeText={setAreaHectares}
            placeholder="e.g. 3.5"
            keyboardType="decimal-pad"
            containerStyle={themed($field)}
          />
        </>
      )}

      <TextField
        label={
          activityType === "tick_observation" ? "Observed by (optional)" : "Performed by (optional)"
        }
        value={performedBy}
        onChangeText={setPerformedBy}
        placeholder={
          activityType === "tick_observation"
            ? "Person who inspected the animals"
            : "Person, team or contractor"
        }
        containerStyle={themed($field)}
      />

      <TextField
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder={
          activityType === "burning"
            ? "Reason for burn, conditions, burn result…"
            : activityType === "tick_observation"
              ? "Where ticks were found, severity, follow-up needed…"
              : "Work completed, equipment used, follow-up needed…"
        }
        multiline
        containerStyle={themed($field)}
      />

      <PhotoPicker
        photos={photos}
        onPhotosChange={setPhotos}
        maxPhotos={3}
        label="Photos (optional)"
      />

      <Button
        text={isSaving ? "Saving…" : "Save activity"}
        preset="reversed"
        disabled={isSaving}
        onPress={handleSave}
        style={themed($saveButton)}
      />
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xxxl,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  marginTop: spacing.md,
  marginBottom: spacing.xl,
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
})

const $headerText: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  marginTop: 2,
})

const $field: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $chipRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
  marginTop: spacing.xs,
})

const $chip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 18,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
})

const $chipSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
})

const $chipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 13,
})

const $chipTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
  fontWeight: "600",
})

const $fieldHint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  fontSize: 12,
  lineHeight: 17,
  marginTop: spacing.xxs,
})

const $scoreGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
  marginTop: spacing.sm,
})

const $scoreChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: "30%",
  minWidth: 88,
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 10,
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.sm,
})

const $scoreValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 18,
  fontWeight: "700",
})

const $scoreLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 11,
  marginTop: 2,
})

const $saveButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})
