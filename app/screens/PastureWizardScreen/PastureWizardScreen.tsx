import React, { useState } from "react"
import { View, ViewStyle, TextStyle, Pressable } from "react-native"
import { Screen, Text, TextField, Button, Icon } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { AppStackScreenProps } from "@/navigators"
import { usePastureActions, PastureFormData } from "@/hooks/usePastures"

interface PastureWizardScreenProps extends AppStackScreenProps<"PastureWizard"> {}

type WizardStep = 1 | 2 | 3

const ROTATION_PRESETS = [
  { label: "3 days", value: 3 },
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
]

const REST_PRESETS = [
  { label: "14 days", value: 14 },
  { label: "21 days", value: 21 },
  { label: "28 days", value: 28 },
]

const FORAGE_TYPES = ["Mixed Grass", "Kikuyu", "Lucerne", "Eragrostis", "Clover", "Veld Grass"]
const WATER_SOURCES = ["Dam", "Trough", "River", "Borehole", "None"]

export function PastureWizardScreen({ navigation }: PastureWizardScreenProps) {
  const { themed, theme: { colors } } = useAppTheme()
  const { createPasture } = usePastureActions()

  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [formData, setFormData] = useState<PastureFormData>({
    name: "",
    code: "",
    maxCapacity: undefined,
    targetGrazingDays: 7,
    targetRestDays: 28,
    forageType: "",
    waterSource: "",
    sizeHectares: undefined,
  })
  const [isSaving, setIsSaving] = useState(false)

  const updateField = <K extends keyof PastureFormData>(field: K, value: PastureFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Auto-generate code from name (min 2-3 chars)
    if (field === "name" && typeof value === "string") {
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

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as WizardStep)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep)
    }
  }

  const handleSkipSetup = () => {
    navigation.replace("PastureForm", {})
  }

  const handleFinish = async () => {
    if (!formData.name.trim()) {
      return
    }

    setIsSaving(true)
    try {
      await createPasture(formData)
      navigation.goBack()
    } catch (error) {
      console.error("Failed to create pasture:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const canProceedStep1 = formData.name.trim().length > 0

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={themed($container)}>
      <View style={themed($header)}>
        <Pressable onPress={() => navigation.goBack()} style={themed($backButton)}>
          <Icon icon="back" size={24} />
        </Pressable>
        <View style={themed($headerContent)}>
          <Text preset="heading" text="Create Your First Pasture" style={themed($headerTitle)} />
          <View style={themed($stepsIndicator)}>
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                style={[
                  themed($stepDot),
                  step === currentStep && themed($stepDotActive),
                  step < currentStep && themed($stepDotComplete),
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Step 1: Basics */}
      {currentStep === 1 && (
        <View style={themed($stepContainer)}>
          <Text style={themed($stepTitle)}>What's the name of your pasture?</Text>
          <Text style={themed($stepDescription)}>
            Give it a descriptive name so you can easily identify it
          </Text>

          <TextField
            value={formData.name}
            onChangeText={(text) => updateField("name", text)}
            placeholder="e.g., North Paddock, Lower 40, Home Field"
            containerStyle={themed($field)}
            autoFocus
            LabelTextProps={{ style: themed($inputLabel) }}
          />

          <View style={themed($codePreview)}>
            <Text style={themed($codeLabel)}>Short code:</Text>
            <Text style={themed($codeValue)}>{formData.code || "___"}</Text>
            <Text style={themed($codeHint)}>✓ Auto-generated</Text>
          </View>

          <View style={themed($buttonRow)}>
            <Button
              text="Skip Setup"
              preset="default"
              onPress={handleSkipSetup}
              style={themed($skipButton)}
            />
            <Button
              text="Next →"
              preset="filled"
              onPress={handleNext}
              disabled={!canProceedStep1}
              style={themed($nextButton)}
            />
          </View>
        </View>
      )}

      {/* Step 2: Capacity & Rotation */}
      {currentStep === 2 && (
        <View style={themed($stepContainer)}>
          <Text style={themed($stepTitle)}>Set capacity & rotation</Text>
          <Text style={themed($stepDescription)}>
            These help you manage grazing and avoid overuse
          </Text>

          <View style={themed($field)}>
            <Text style={themed($fieldLabel)}>Max animals in this pasture?</Text>
            <TextField
              value={formData.maxCapacity?.toString() || ""}
              onChangeText={(text) => updateField("maxCapacity", text ? parseInt(text) : undefined)}
              placeholder="e.g., 50"
              keyboardType="number-pad"
              LabelTextProps={{ style: themed($inputLabel) }}
            />
          </View>

          <View style={themed($field)}>
            <Text style={themed($fieldLabel)}>Rotate every...</Text>
            <View style={themed($presetRow)}>
              {ROTATION_PRESETS.map((preset) => {
                const selected = formData.targetGrazingDays === preset.value
                return (
                  <Pressable
                    key={preset.value}
                    onPress={() => updateField("targetGrazingDays", preset.value)}
                    style={[themed($presetChip), selected && themed($presetChipSelected)]}
                  >
                    <Text style={[themed($presetChipText), selected && themed($presetChipTextSelected)]}>
                      {preset.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            <Text style={themed($fieldHint)}>Animals graze before moving to next pasture</Text>
          </View>

          <View style={themed($field)}>
            <Text style={themed($fieldLabel)}>Rest for...</Text>
            <View style={themed($presetRow)}>
              {REST_PRESETS.map((preset) => {
                const selected = formData.targetRestDays === preset.value
                return (
                  <Pressable
                    key={preset.value}
                    onPress={() => updateField("targetRestDays", preset.value)}
                    style={[themed($presetChip), selected && themed($presetChipSelected)]}
                  >
                    <Text style={[themed($presetChipText), selected && themed($presetChipTextSelected)]}>
                      {preset.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            <Text style={themed($fieldHint)}>Pasture recovers before animals return</Text>
          </View>

          <View style={themed($buttonRow)}>
            <Button
              text="← Back"
              preset="default"
              onPress={handleBack}
              style={themed($backButtonStyle)}
            />
            <Button
              text="Next →"
              preset="filled"
              onPress={handleNext}
              style={themed($nextButton)}
            />
          </View>
        </View>
      )}

      {/* Step 3: Details (Optional) */}
      {currentStep === 3 && (
        <View style={themed($stepContainer)}>
          <Text style={themed($stepTitle)}>Pasture details</Text>
          <Text style={themed($stepDescription)}>
            Optional - you can skip this and add details later
          </Text>

          <View style={themed($field)}>
            <Text style={themed($fieldLabel)}>Forage Type (Optional)</Text>
            <View style={themed($chipRow)}>
              {FORAGE_TYPES.slice(0, 4).map((type) => {
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
            <Text style={themed($fieldLabel)}>Water Source (Optional)</Text>
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
            <Text style={themed($fieldLabel)}>Size (Hectares, Optional)</Text>
            <TextField
              value={formData.sizeHectares?.toString() || ""}
              onChangeText={(text) => updateField("sizeHectares", text ? parseFloat(text) : undefined)}
              placeholder="e.g., 40"
              keyboardType="decimal-pad"
              LabelTextProps={{ style: themed($inputLabel) }}
            />
          </View>

          <View style={themed($field)}>
            <Text style={themed($fieldLabel)}>Supplements (Optional)</Text>
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

          <View style={themed($buttonRow)}>
            <Button
              text="← Back"
              preset="default"
              onPress={handleBack}
              style={themed($backButtonStyle)}
            />
            <Button
              text="Create Pasture →"
              preset="filled"
              onPress={handleFinish}
              disabled={isSaving}
              style={themed($nextButton)}
            />
          </View>
        </View>
      )}
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginTop: spacing.md,
  marginBottom: spacing.lg,
})

const $backButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
  marginLeft: -spacing.xs,
  marginRight: spacing.sm,
})

const $headerContent: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $headerTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $stepsIndicator: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,
})

const $stepDot: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.palette.neutral300,
})

const $stepDotActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary500,
  width: 24,
})

const $stepDotComplete: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.success500,
})

const $stepContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $stepTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 24,
  fontWeight: "700",
  color: colors.text,
  marginBottom: spacing.xs,
})

const $stepDescription: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.palette.neutral600,
  marginBottom: spacing.lg,
  lineHeight: 20,
})

const $field: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $fieldLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
  marginBottom: spacing.sm,
})

const $fieldHint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 12,
  color: colors.palette.neutral600,
  marginTop: spacing.xs,
})

const $inputLabel: ThemedStyle<TextStyle> = () => ({
  display: "none",
})

const $codePreview: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.palette.neutral100,
  padding: spacing.md,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
  gap: spacing.sm,
})

const $codeLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.palette.neutral600,
})

const $codeValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 20,
  fontWeight: "700",
  color: colors.palette.primary500,
  flex: 1,
})

const $codeHint: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.palette.success600,
})

const $presetRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $presetChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.sm,
  borderRadius: 8,
  borderWidth: 2,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.palette.neutral100,
  alignItems: "center",
})

const $presetChipSelected: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary100,
})

const $presetChipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.palette.neutral600,
})

const $presetChipTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
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

const $buttonRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.md,
  marginTop: "auto",
  marginBottom: spacing.xxxl,
})

const $skipButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $backButtonStyle: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $nextButton: ThemedStyle<ViewStyle> = () => ({
  flex: 2,
})

const $checkboxRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.md,
})

const $checkbox: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  flex: 1,
})

const $checkboxBox: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 24,
  height: 24,
  borderRadius: 6,
  borderWidth: 2,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.palette.neutral100,
  justifyContent: "center",
  alignItems: "center",
})

const $checkboxBoxChecked: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary500,
  backgroundColor: colors.palette.primary500,
})

const $checkboxCheck: ThemedStyle<TextStyle> = () => ({
  color: "#FFF",
  fontSize: 16,
  fontWeight: "700",
})

const $checkboxLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.text,
  fontWeight: "500",
})
