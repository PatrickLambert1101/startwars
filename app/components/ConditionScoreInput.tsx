import { Keyboard, Pressable, StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"

import { useAppTheme } from "@/theme/context"

import { Button } from "./Button"
import { Text } from "./Text"

export function ConditionScoreInput({
  label,
  value,
  onChangeText,
  disabled = false,
}: {
  label: string
  value: string
  disabled?: boolean
  onChangeText: (value: string) => void
}) {
  const {
    theme: { colors },
  } = useAppTheme()
  const { t } = useTranslation()
  return (
    <View style={styles.container}>
      <Text text={label} preset="formLabel" />
      {[0, 3, 6].map((offset) => (
        <View key={offset} style={styles.row}>
          {[1, 2, 3].map((n) => {
            const score = n + offset
            const selected = value === String(score)
            const description = t(
              `chuteScreen.condition.labels.${score <= 3 ? "thin" : score <= 6 ? "moderate" : "fat"}`,
            )
            return (
              <Pressable
                key={score}
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${score}, ${description}`}
                accessibilityState={{ selected, disabled }}
                disabled={disabled}
                onPress={() => {
                  Keyboard.dismiss()
                  onChangeText(String(score))
                }}
                style={({ pressed }) => [
                  styles.score,
                  {
                    borderColor: selected ? colors.tint : colors.border,
                    backgroundColor: selected ? colors.palette.primary600 : colors.background,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  text={String(score)}
                  size="xl"
                  preset="bold"
                  style={selected ? { color: colors.palette.neutral100 } : undefined}
                />
                <Text
                  text={description}
                  size="xxs"
                  style={selected ? { color: colors.palette.neutral100 } : undefined}
                />
              </Pressable>
            )
          })}
        </View>
      ))}
      {value !== "" && (
        <Button
          disabled={disabled}
          text={t("measurementInput.clear")}
          onPress={() => onChangeText("")}
        />
      )}
    </View>
  )
}
const styles = StyleSheet.create({
  container: { gap: 8, marginVertical: 8 },
  row: { flexDirection: "row", gap: 8 },
  score: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 64,
    padding: 8,
  },
})
