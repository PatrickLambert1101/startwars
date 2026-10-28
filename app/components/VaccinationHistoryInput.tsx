import { Pressable, StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"

import { useAppTheme } from "@/theme/context"
import type { VaccinationHistory } from "@/utils/vaccinationHistory"

import { Text } from "./Text"

const choices = [
  ["unknown", "historyUnknown"],
  ["current", "historyCurrent"],
  ["needs_review", "historyReview"],
] as const
export function VaccinationHistoryInput({
  value,
  onChange,
  disabled = false,
  legacy = false,
}: {
  value: VaccinationHistory
  onChange: (value: VaccinationHistory) => void
  disabled?: boolean
  legacy?: boolean
}) {
  const { t } = useTranslation()
  const {
    theme: { colors },
  } = useAppTheme()
  const selectedKey = choices.find(([history]) => history === value)![1]
  return (
    <View style={styles.field}>
      <Text text={t("uxFixes.historyLabel")} preset="formLabel" />
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t("uxFixes.historyLabel")}
        style={styles.choices}
      >
        {choices.map(([history, key]) => (
          <Pressable
            key={history}
            accessibilityRole="radio"
            accessibilityLabel={t(`uxFixes.${key}`)}
            accessibilityState={{ checked: history === value, disabled }}
            disabled={disabled}
            onPress={() => onChange(history)}
            style={[
              styles.choice,
              {
                borderColor: colors.border,
                backgroundColor: history === value ? colors.palette.primary600 : colors.background,
              },
            ]}
          >
            <Text
              text={t(`uxFixes.${key}`)}
              size="sm"
              style={history === value ? { color: colors.palette.neutral100 } : undefined}
            />
          </Pressable>
        ))}
      </View>
      <Text
        text={t(legacy ? "uxFixes.historyLegacyHelp" : `uxFixes.${selectedKey}Help`)}
        size="xs"
      />
    </View>
  )
}
const styles = StyleSheet.create({
  choice: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 48,
    padding: 12,
  },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  field: { gap: 8, marginVertical: 12 },
})
