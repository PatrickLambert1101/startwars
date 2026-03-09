import React, { useState, useEffect } from "react"
import { View, ViewStyle, TextStyle, ScrollView, Pressable } from "react-native"
import { Screen, Text, TextField, Button, Icon } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { AppStackScreenProps } from "@/navigators"
import { usePasture, usePastureActions, PastureFormData } from "@/hooks/usePastures"

interface PastureFormScreenProps extends AppStackScreenProps<"PastureForm"> {}

const FORAGE_TYPES = ["Mixed Grass", "Kikuyu", "Lucerne", "Eragrostis", "Clover", "Veld Grass"]
const WATER_SOURCES = ["Dam", "Trough", "River", "Borehole", "None"]
const FENCE_TYPES = ["Electric", "Barbed Wire", "Game Fence", "Post & Rail", "None"]

export function PastureFormScreen({ navigation, route }: PastureFormScreenProps) {
  const pastureId = route.params?.pastureId
  const isEdit = !!pastureId
  const { pasture, isLoading } = usePasture(pastureId || "")
  const { createPasture, updatePasture } = usePastureActions()
  const { themed } = useAppTheme()

  const [formData, setFormData] = useState<PastureFormData>({
    name: "",
    code: "",
    sizeHectares: undefined,
    locationNotes: "",
    forageType: "",
    waterSource: "",
    fenceType: "",
    hasSaltBlocks: false,
    hasMineralFeeders: false,
    maxCapacity: undefined,
    targetGrazingDays: 7,
    targetRestDays: 28,
    notes: "",
  })

  const [errors, setErrors] = useState<Partial<Record<keyof PastureFormData, string>>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (pasture) {
      setFormData({
        name: pasture.name,
        code: pasture.code,
        sizeHectares: pasture.sizeHectares || undefined,
        locationNotes: pasture.locationNotes || "",
        forageType: pasture.forageType || "",
        waterSource: pasture.waterSource || "",
        fenceType: pasture.fenceType || "",
        hasSaltBlocks: pasture.hasSaltBlocks || false,
        hasMineralFeeders: pasture.hasMineralFeeders || false,
        maxCapacity: pasture.maxCapacity || undefined,
        targetGrazingDays: pasture.targetGrazingDays || 7,
        targetRestDays: pasture.targetRestDays || 28,
        notes: pasture.notes || "",
      })
    }
  }, [pasture])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PastureFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }
    if (!formData.code.trim()) {
      newErrors.code = "Code is required"
    } else if (formData.code.trim().length < 2) {
      newErrors.code = "Code must be at least 2 characters"
    }
    if (formData.sizeHectares !== undefined && formData.sizeHectares <= 0) {
      newErrors.sizeHectares = "Size must be positive"
    }
    if (formData.maxCapacity !== undefined && formData.maxCapacity <= 0) {
      newErrors.maxCapacity = "Capacity must be positive"
    }
    if (formData.targetGrazingDays !== undefined && formData.targetGrazingDays <= 0) {
      newErrors.targetGrazingDays = "Grazing days must be positive"
    }
    if (formData.targetRestDays !== undefined && formData.targetRestDays <= 0) {
      newErrors.targetRestDays = "Rest days must be positive"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      if (isEdit && pastureId) {
        await updatePasture(pastureId, formData)
      } else {
        await createPasture(formData)
      }
      navigation.goBack()
    } catch (error) {
      console.error("Failed to save pasture:", error)
      setErrors({ name: "Failed to save pasture. Please try again." })
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = <K extends keyof PastureFormData>(field: K, value: PastureFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }

    // Auto-generate code from name if creating new pasture (min 2-3 chars)
    if (field === "name" && !isEdit && typeof value === "string") {
      const words = value.trim().split(" ").filter(w => w.length > 0)
      let autoCode = ""

      if (words.length === 1) {
        // Single word: take first 3 letters
        autoCode = words[0].slice(0, 3).toUpperCase()
      } else if (words.length === 2) {
        // Two words: take first 2 letters of each
        autoCode = (words[0].slice(0, 2) + words[1].slice(0, 2)).toUpperCase()
      } else {
        // Multiple words: first letter of each word (max 4)
        autoCode = words.slice(0, 4).map(w => w.charAt(0).toUpperCase()).join("")
      }

      if (autoCode.length >= 2) {
        setFormData((prev) => ({ ...prev, code: autoCode }))
      }
    }
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <View style={themed($header)}>
        <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
          <Icon icon="back" size={24} />
        </Pressable>
        <Text preset="heading" text={isEdit ? "Edit Pasture" : "New Pasture"} style={themed($headerTitle)} />
      </View>

      <ScrollView style={themed($form)} showsVerticalScrollIndicator={false}>
        <TextField
          label="Pasture Name"
          value={formData.name}
          onChangeText={(text) => updateField("name", text)}
          placeholder="e.g., North Paddock"
          helper={errors.name}
          status={errors.name ? "error" : undefined}
          containerStyle={themed($field)}
        />

        <TextField
          label="Short Code"
          value={formData.code}
          onChangeText={(text) => updateField("code", text.toUpperCase())}
          placeholder="e.g., NP"
          helper={errors.code || "Used for quick identification"}
          status={errors.code ? "error" : undefined}
          containerStyle={themed($field)}
        />

        <TextField
          label="Size (Hectares, Optional)"
          value={formData.sizeHectares?.toString() || ""}
          onChangeText={(text) => updateField("sizeHectares", text ? parseFloat(text) : undefined)}
          placeholder="0"
          keyboardType="decimal-pad"
          helper={errors.sizeHectares}
          status={errors.sizeHectares ? "error" : undefined}
          containerStyle={themed($field)}
        />

        <TextField
          label="Location Notes (Optional)"
          value={formData.locationNotes}
          onChangeText={(text) => updateField("locationNotes", text)}
          placeholder="Describe the location"
          multiline
          numberOfLines={2}
          containerStyle={themed($field)}
        />

        <View style={themed($field)}>
          <Text style={themed($label)}>Forage Type (Optional)</Text>
          <View style={themed($chipRow)}>
            {FORAGE_TYPES.map((type) => {
              const selected = formData.forageType === type
              return (
                <Pressable
                  key={type}
                  style={[themed($chip), selected && themed($chipSelected)]}
                  onPress={() => updateField("forageType", selected ? "" : type)}
                >
                  <Text style={[themed($chipText), selected && themed($chipTextSelected)]}>
                    {type}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={themed($field)}>
          <Text style={themed($label)}>Water Source (Optional)</Text>
          <View style={themed($chipRow)}>
            {WATER_SOURCES.map((source) => {
              const selected = formData.waterSource === source
              return (
                <Pressable
                  key={source}
                  style={[themed($chip), selected && themed($chipSelected)]}
                  onPress={() => updateField("waterSource", selected ? "" : source)}
                >
                  <Text style={[themed($chipText), selected && themed($chipTextSelected)]}>
                    {source}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={themed($field)}>
          <Text style={themed($label)}>Fence Type (Optional)</Text>
          <View style={themed($chipRow)}>
            {FENCE_TYPES.map((type) => {
              const selected = formData.fenceType === type
              return (
                <Pressable
                  key={type}
                  style={[themed($chip), selected && themed($chipSelected)]}
                  onPress={() => updateField("fenceType", selected ? "" : type)}
                >
                  <Text style={[themed($chipText), selected && themed($chipTextSelected)]}>
                    {type}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={themed($field)}>
          <Text style={themed($label)}>Supplements (Optional)</Text>
          <View style={themed($checkboxRow)}>
            <Pressable
              onPress={() => updateField("hasSaltBlocks", !formData.hasSaltBlocks)}
              style={themed($checkbox)}
            >
              <View style={[themed($checkboxBox), formData.hasSaltBlocks && themed($checkboxBoxChecked)]}>
                {formData.hasSaltBlocks && <Text style={themed($checkboxCheck)}>✓</Text>}
              </View>
              <Text style={themed($checkboxLabel)}>Salt Blocks</Text>
            </Pressable>
            <Pressable
              onPress={() => updateField("hasMineralFeeders", !formData.hasMineralFeeders)}
              style={themed($checkbox)}
            >
              <View style={[themed($checkboxBox), formData.hasMineralFeeders && themed($checkboxBoxChecked)]}>
                {formData.hasMineralFeeders && <Text style={themed($checkboxCheck)}>✓</Text>}
              </View>
              <Text style={themed($checkboxLabel)}>Mineral Feeders</Text>
            </Pressable>
          </View>
        </View>

        <TextField
          label="Max Capacity (Animals, Optional)"
          value={formData.maxCapacity?.toString() || ""}
          onChangeText={(text) => updateField("maxCapacity", text ? parseInt(text) : undefined)}
          placeholder="0"
          keyboardType="number-pad"
          helper={errors.maxCapacity || "Maximum number of animals"}
          status={errors.maxCapacity ? "error" : undefined}
          containerStyle={themed($field)}
        />

        <TextField
          label="Target Grazing Days"
          value={formData.targetGrazingDays?.toString() || ""}
          onChangeText={(text) => updateField("targetGrazingDays", text ? parseInt(text) : undefined)}
          placeholder="7"
          keyboardType="number-pad"
          helper={errors.targetGrazingDays || "Days before rotation needed"}
          status={errors.targetGrazingDays ? "error" : undefined}
          containerStyle={themed($field)}
        />

        <TextField
          label="Target Rest Days"
          value={formData.targetRestDays?.toString() || ""}
          onChangeText={(text) => updateField("targetRestDays", text ? parseInt(text) : undefined)}
          placeholder="28"
          keyboardType="number-pad"
          helper={errors.targetRestDays || "Days to rest before re-use"}
          status={errors.targetRestDays ? "error" : undefined}
          containerStyle={themed($field)}
        />

        <TextField
          label="Notes (Optional)"
          value={formData.notes}
          onChangeText={(text) => updateField("notes", text)}
          placeholder="Additional notes"
          multiline
          numberOfLines={3}
          containerStyle={themed($field)}
        />

        <View style={themed($buttonRow)}>
          <Button
            text="Cancel"
            preset="default"
            onPress={() => navigation.goBack()}
            style={themed($cancelButton)}
          />
          <Button
            text={isEdit ? "Update Pasture" : "Create Pasture"}
            preset="filled"
            onPress={handleSave}
            disabled={isSaving}
            style={themed($saveButton)}
          />
        </View>
      </ScrollView>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: spacing.md,
  marginBottom: spacing.sm,
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
  marginLeft: -spacing.xs,
})

const $headerTitle: ThemedStyle<TextStyle> = () => ({
  flex: 1,
  marginLeft: 0,
})

const $form: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $field: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $label: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  fontWeight: "600",
  color: colors.text,
  marginBottom: spacing.xs,
})

const $chipRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})

const $chip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: 20,
  borderWidth: 1.5,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.palette.neutral100,
})

const $chipSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
})

const $chipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "500",
  color: colors.palette.neutral600,
})

const $chipTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
  fontWeight: "600",
})

const $checkboxRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.lg,
})

const $checkbox: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
})

const $checkboxBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 24,
  height: 24,
  borderRadius: 6,
  borderWidth: 2,
  borderColor: colors.palette.neutral400,
  backgroundColor: colors.palette.neutral100,
  marginRight: spacing.xs,
  alignItems: "center",
  justifyContent: "center",
})

const $checkboxBoxChecked: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary500,
})

const $checkboxCheck: ThemedStyle<TextStyle> = () => ({
  color: "white",
  fontSize: 16,
  fontWeight: "bold",
})

const $checkboxLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 15,
  color: colors.text,
  fontWeight: "500",
})

const $buttonRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.md,
  marginTop: spacing.lg,
  marginBottom: spacing.xxxl,
})

const $cancelButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $saveButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})
