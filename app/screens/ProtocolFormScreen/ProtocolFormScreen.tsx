import React, { useState, useEffect } from "react"
import { View, ViewStyle, TextStyle, ScrollView, Pressable } from "react-native"
import { Screen, Text, TextField, Button, Icon } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { AppStackScreenProps } from "@/navigators"
import { useProtocol, useProtocolActions, ProtocolFormData } from "@/hooks/useProtocols"
import { ProtocolType } from "@/db/models"

interface ProtocolFormScreenProps extends AppStackScreenProps<"ProtocolForm"> {}

const PROTOCOL_TYPES: { value: ProtocolType; label: string }[] = [
  { value: "vaccination", label: "Vaccination" },
  { value: "treatment", label: "Treatment" },
  { value: "deworming", label: "Deworming" },
  { value: "other", label: "Other" },
]

const SPECIES_OPTIONS: { value: string; label: string }[] = [
  { value: "cattle", label: "Cattle" },
  { value: "buffalo", label: "Buffalo" },
  { value: "horse", label: "Horse" },
  { value: "sheep", label: "Sheep" },
  { value: "goat", label: "Goat" },
  { value: "game", label: "Game" },
  { value: "pig", label: "Pig" },
  { value: "all", label: "All Species" },
]

const ADMINISTRATION_METHODS = [
  "Subcutaneous",
  "Intramuscular",
  "Oral",
  "Pour-on",
  "Intranasal",
  "Intravenous",
]

export function ProtocolFormScreen({ navigation, route }: ProtocolFormScreenProps) {
  const protocolId = route.params?.protocolId
  const isEdit = !!protocolId
  const { protocol, isLoading } = useProtocol(protocolId || "")
  const { createProtocol, updateProtocol } = useProtocolActions()
  const { themed } = useAppTheme()

  const [formData, setFormData] = useState<ProtocolFormData>({
    name: "",
    description: "",
    protocolType: "vaccination",
    productName: "",
    dosage: "",
    administrationMethod: "",
    withdrawalDays: undefined,
    targetSpecies: "cattle",
    targetAgeMin: undefined,
    targetAgeMax: undefined,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ProtocolFormData, string>>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (protocol) {
      setFormData({
        name: protocol.name,
        description: protocol.description || "",
        protocolType: protocol.protocolType,
        productName: protocol.productName,
        dosage: protocol.dosage,
        administrationMethod: protocol.administrationMethod || "",
        withdrawalDays: protocol.withdrawalDays || undefined,
        targetSpecies: protocol.targetSpecies,
        targetAgeMin: protocol.targetAgeMin || undefined,
        targetAgeMax: protocol.targetAgeMax || undefined,
      })
    }
  }, [protocol])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProtocolFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }
    if (!formData.productName.trim()) {
      newErrors.productName = "Product name is required"
    }
    if (!formData.dosage.trim()) {
      newErrors.dosage = "Dosage is required"
    }
    if (formData.withdrawalDays !== undefined && formData.withdrawalDays < 0) {
      newErrors.withdrawalDays = "Withdrawal days must be positive"
    }
    if (formData.targetAgeMin !== undefined && formData.targetAgeMin < 0) {
      newErrors.targetAgeMin = "Minimum age must be positive"
    }
    if (formData.targetAgeMax !== undefined && formData.targetAgeMax < 0) {
      newErrors.targetAgeMax = "Maximum age must be positive"
    }
    if (
      formData.targetAgeMin !== undefined &&
      formData.targetAgeMax !== undefined &&
      formData.targetAgeMin > formData.targetAgeMax
    ) {
      newErrors.targetAgeMax = "Maximum age must be greater than minimum age"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      if (isEdit && protocolId) {
        await updateProtocol(protocolId, formData)
      } else {
        await createProtocol(formData)
      }
      navigation.goBack()
    } catch (error) {
      console.error("Failed to save protocol:", error)
      setErrors({ name: "Failed to save protocol. Please try again." })
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = <K extends keyof ProtocolFormData>(field: K, value: ProtocolFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <View style={themed($header)}>
        <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
          <Icon icon="back" size={24} />
        </Pressable>
        <Text preset="heading" text={isEdit ? "Edit Protocol" : "New Protocol"} style={themed($headerTitle)} />
      </View>

      <ScrollView style={themed($form)} showsVerticalScrollIndicator={false}>
        <TextField
          label="Protocol Name"
          value={formData.name}
          onChangeText={(text) => updateField("name", text)}
          placeholder="e.g., Spring Vaccination"
          helper={errors.name}
          status={errors.name ? "error" : undefined}
          containerStyle={themed($field)}
        />

        <TextField
          label="Description (Optional)"
          value={formData.description}
          onChangeText={(text) => updateField("description", text)}
          placeholder="Brief description of the protocol"
          multiline
          numberOfLines={3}
          containerStyle={themed($field)}
        />

        <View style={themed($field)}>
          <Text style={themed($label)}>Protocol Type</Text>
          <View style={themed($chipRow)}>
            {PROTOCOL_TYPES.map((type) => {
              const selected = formData.protocolType === type.value
              return (
                <Pressable
                  key={type.value}
                  style={[themed($chip), selected && themed($chipSelected)]}
                  onPress={() => updateField("protocolType", type.value)}
                >
                  <Text style={[themed($chipText), selected && themed($chipTextSelected)]}>
                    {type.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <TextField
          label="Product Name"
          value={formData.productName}
          onChangeText={(text) => updateField("productName", text)}
          placeholder="e.g., Covexin 10"
          helper={errors.productName}
          status={errors.productName ? "error" : undefined}
          containerStyle={themed($field)}
        />

        <TextField
          label="Dosage"
          value={formData.dosage}
          onChangeText={(text) => updateField("dosage", text)}
          placeholder="e.g., 2ml per animal"
          helper={errors.dosage}
          status={errors.dosage ? "error" : undefined}
          containerStyle={themed($field)}
        />

        <View style={themed($field)}>
          <Text style={themed($label)}>Administration Method (Optional)</Text>
          <View style={themed($chipRow)}>
            {ADMINISTRATION_METHODS.map((method) => {
              const selected = formData.administrationMethod === method
              return (
                <Pressable
                  key={method}
                  style={[themed($chip), selected && themed($chipSelected)]}
                  onPress={() => updateField("administrationMethod", selected ? "" : method)}
                >
                  <Text style={[themed($chipText), selected && themed($chipTextSelected)]}>
                    {method}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <TextField
          label="Withdrawal Period (Days, Optional)"
          value={formData.withdrawalDays?.toString() || ""}
          onChangeText={(text) => updateField("withdrawalDays", text ? parseInt(text) : undefined)}
          placeholder="0"
          keyboardType="numeric"
          helper={errors.withdrawalDays}
          status={errors.withdrawalDays ? "error" : undefined}
          containerStyle={themed($field)}
        />

        <View style={themed($field)}>
          <Text style={themed($label)}>Target Species</Text>
          <View style={themed($chipRow)}>
            {SPECIES_OPTIONS.map((species) => {
              const selected = formData.targetSpecies === species.value
              return (
                <Pressable
                  key={species.value}
                  style={[themed($chip), selected && themed($chipSelected)]}
                  onPress={() => updateField("targetSpecies", species.value)}
                >
                  <Text style={[themed($chipText), selected && themed($chipTextSelected)]}>
                    {species.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={themed($ageRangeRow)}>
          <TextField
            label="Min Age (Months, Optional)"
            value={formData.targetAgeMin?.toString() || ""}
            onChangeText={(text) => updateField("targetAgeMin", text ? parseInt(text) : undefined)}
            placeholder="0"
            keyboardType="numeric"
            helper={errors.targetAgeMin}
            status={errors.targetAgeMin ? "error" : undefined}
            containerStyle={themed($ageField)}
          />

          <TextField
            label="Max Age (Months, Optional)"
            value={formData.targetAgeMax?.toString() || ""}
            onChangeText={(text) => updateField("targetAgeMax", text ? parseInt(text) : undefined)}
            placeholder="∞"
            keyboardType="numeric"
            helper={errors.targetAgeMax}
            status={errors.targetAgeMax ? "error" : undefined}
            containerStyle={themed($ageField)}
          />
        </View>

        <View style={themed($buttonRow)}>
          <Button
            text="Cancel"
            preset="default"
            onPress={() => navigation.goBack()}
            style={themed($cancelButton)}
          />
          <Button
            text={isEdit ? "Update Protocol" : "Create Protocol"}
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

const $ageRangeRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.md,
  marginBottom: spacing.md,
})

const $ageField: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
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
