import { FC, useCallback, useState } from "react"
import { Pressable, View, ViewStyle, TextStyle, Modal } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { format, subMonths, subYears } from "date-fns"

import { Text } from "./Text"
import { Button } from "./Button"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface AgeDatePickerProps {
  label: string
  value: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  containerStyle?: ViewStyle
}

/**
 * User-friendly date picker with age shortcuts
 * Shows options like "3 months ago", "6 months ago", "1 year ago"
 * Plus manual date entry
 */
export const AgeDatePicker: FC<AgeDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = "Select age or date",
  containerStyle,
}) => {
  const { themed, theme } = useAppTheme()
  const [showPicker, setShowPicker] = useState(false)
  const [manualMonth, setManualMonth] = useState("")
  const [manualYear, setManualYear] = useState("")

  const AGE_SHORTCUTS = [
    { label: "1 month", months: 1 },
    { label: "2 months", months: 2 },
    { label: "3 months", months: 3 },
    { label: "4 months", months: 4 },
    { label: "5 months", months: 5 },
    { label: "6 months", months: 6 },
    { label: "9 months", months: 9 },
    { label: "1 year", months: 12 },
    { label: "1.5 years", months: 18 },
    { label: "2 years", months: 24 },
    { label: "3 years", months: 36 },
    { label: "4 years", months: 48 },
    { label: "5 years", months: 60 },
  ]

  const handleAgeSelect = useCallback((months: number) => {
    const birthDate = subMonths(new Date(), months)
    onChange(birthDate)
    setShowPicker(false)
  }, [onChange])

  const handleManualDate = useCallback(() => {
    const month = parseInt(manualMonth, 10)
    const year = parseInt(manualYear, 10)

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return
    }

    // Set to 15th of the month (middle of month as default)
    const birthDate = new Date(year, month - 1, 15)
    onChange(birthDate)
    setShowPicker(false)
    setManualMonth("")
    setManualYear("")
  }, [manualMonth, manualYear, onChange])

  const displayValue = value ? format(value, "dd MMM yyyy") : ""
  const ageInMonths = value ? Math.floor((Date.now() - value.getTime()) / (1000 * 60 * 60 * 24 * 30.44)) : null

  return (
    <View style={containerStyle}>
      <Text preset="formLabel" text={label} style={themed($label)} />

      <Pressable
        onPress={() => setShowPicker(true)}
        style={themed($picker)}
      >
        <View style={themed($pickerContent)}>
          <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.textDim} />
          {value ? (
            <View style={themed($selectedValue)}>
              <Text text={displayValue} size="md" />
              {ageInMonths !== null && (
                <Text
                  text={ageInMonths < 12 ? `${ageInMonths} months old` : `${Math.floor(ageInMonths / 12)} years old`}
                  size="xs"
                  style={themed($ageText)}
                />
              )}
            </View>
          ) : (
            <Text text={placeholder} style={themed($placeholderText)} />
          )}
        </View>
        <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.textDim} />
      </Pressable>

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable style={themed($modalOverlay)} onPress={() => setShowPicker(false)}>
          <View style={themed($modalContent)} onStartShouldSetResponder={() => true}>
            <Text preset="subheading" text="Select Animal's Age" style={themed($modalTitle)} />

            <Text text="Quick age selection:" size="sm" style={themed($sectionLabel)} />
            <View style={themed($ageGrid)}>
              {AGE_SHORTCUTS.map((shortcut) => (
                <Pressable
                  key={shortcut.label}
                  onPress={() => handleAgeSelect(shortcut.months)}
                  style={themed($ageButton)}
                >
                  <Text text={shortcut.label} size="sm" style={themed($ageButtonText)} />
                </Pressable>
              ))}
            </View>

            <View style={themed($divider)} />

            <Text text="Or enter exact date (MM/YYYY):" size="sm" style={themed($sectionLabel)} />
            <View style={themed($manualRow)}>
              <View style={themed($manualInput)}>
                <Text text="Month" size="xs" style={themed($manualLabel)} />
                <Pressable style={themed($manualField)}>
                  <Text text={manualMonth || "MM"} />
                </Pressable>
              </View>
              <Text text="/" size="lg" style={themed($slash)} />
              <View style={themed($manualInput)}>
                <Text text="Year" size="xs" style={themed($manualLabel)} />
                <Pressable style={themed($manualField)}>
                  <Text text={manualYear || "YYYY"} />
                </Pressable>
              </View>
            </View>

            <Text text="Simplified: Just select age above for quick entry" size="xs" style={themed($hint)} />

            <View style={themed($modalButtons)}>
              {value && (
                <Button
                  text="Clear"
                  preset="default"
                  onPress={() => {
                    onChange(null)
                    setShowPicker(false)
                  }}
                  style={themed($clearButton)}
                />
              )}
              <Button
                text="Close"
                preset="filled"
                onPress={() => setShowPicker(false)}
                style={themed($closeButton)}
              />
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const $label: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $picker: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  padding: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})

const $pickerContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  flex: 1,
})

const $selectedValue: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $ageText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  marginTop: 2,
})

const $placeholderText: ThemedStyle<TextStyle> = ({ colors }) => ({
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
})

const $modalTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $sectionLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.sm,
  marginTop: spacing.sm,
})

const $ageGrid: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.xs,
})

const $ageButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  borderRadius: 20,
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.md,
  borderWidth: 1.5,
  borderColor: colors.palette.primary300,
})

const $ageButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
  fontWeight: "600",
})

const $divider: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  height: 1,
  backgroundColor: colors.separator,
  marginVertical: spacing.md,
})

const $manualRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $manualInput: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $manualLabel: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.xxs,
})

const $manualField: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 8,
  padding: spacing.sm,
  alignItems: "center",
})

const $slash: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $hint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.sm,
  fontStyle: "italic",
})

const $modalButtons: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
  marginTop: spacing.lg,
})

const $clearButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $closeButton: ThemedStyle<ViewStyle> = () => ({
  flex: 2,
})
