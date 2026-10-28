import { useState } from "react"
import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useAppTheme } from "@/theme/context"

import { Button } from "./Button"
import { Text } from "./Text"

interface MeasurementInputProps {
  label: string
  value: string
  onChangeText: (value: string) => void
  unit?: string
  integer?: boolean
  counter?: boolean
  disabled?: boolean
}

/** An app-owned keypad: opening and cancelling never changes the saved form value. */
export function MeasurementInput({
  label,
  value,
  onChangeText,
  unit,
  integer = false,
  counter = false,
  disabled = false,
}: MeasurementInputProps) {
  const {
    theme: { colors },
  } = useAppTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [replaceOnDigit, setReplaceOnDigit] = useState(false)
  const key = (digit: string) => {
    const base = replaceOnDigit ? "" : draft
    const next = digit === "." && base === "" ? "0." : base + digit
    if ((integer ? /^\d{0,8}$/ : /^\d{0,8}(\.\d{0,2})?$/).test(next)) {
      setDraft(next.replace(/^0+(?=\d)/, ""))
      setReplaceOnDigit(false)
    }
  }
  const adjust = (amount: number) => {
    setDraft(String(Math.min(99999999, Math.max(0, Number(draft || 0) + amount))))
    setReplaceOnDigit(false)
  }
  const action = (
    text: string,
    onPress: () => void,
    accessibilityLabel = text,
    inactive = false,
  ) => (
    <Pressable
      key={accessibilityLabel}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={inactive}
      accessibilityState={{ disabled: inactive }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        {
          borderColor: colors.border,
          backgroundColor: colors.background,
          opacity: inactive ? 0.4 : pressed ? 0.65 : 1,
        },
      ]}
    >
      <Text text={text} size="xl" preset="bold" />
    </Pressable>
  )
  return (
    <View style={styles.field}>
      <Text text={label} preset="formLabel" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || t("measurementInput.notRecorded")}${unit ? ` ${unit}` : ""}`}
        disabled={disabled}
        accessibilityState={{ disabled }}
        onPress={() => {
          Keyboard.dismiss()
          setDraft(value)
          setReplaceOnDigit(true)
          setOpen(true)
        }}
        style={[styles.display, { borderColor: colors.border, backgroundColor: colors.background }]}
      >
        <Text text={value || "—"} size="xl" preset="bold" />
        <Text text={unit || t("measurementInput.tapToEnter")} size="sm" />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.cancel")}
            style={[styles.backdrop, { backgroundColor: colors.palette.overlay50 }]}
            onPress={() => setOpen(false)}
          />
          <View
            accessibilityViewIsModal
            style={[
              styles.panel,
              { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
              <Text text={label} preset="subheading" />
              <View style={styles.display}>
                <Text
                  text={draft || "—"}
                  size="xxl"
                  preset="bold"
                  accessibilityLiveRegion="polite"
                />
                {unit ? <Text text={unit} size="lg" /> : null}
              </View>
              {counter && (
                <View style={styles.row}>
                  {action(
                    "−1",
                    () => adjust(-1),
                    t("measurementInput.subtractOne"),
                    !draft || Number(draft) === 0,
                  )}
                  {action("+1", () => adjust(1), t("measurementInput.addOne"))}
                  {action("+5", () => adjust(5), t("measurementInput.addFive"))}
                </View>
              )}
              {["123", "456", "789"].map((row) => (
                <View key={row} style={styles.row}>
                  {row.split("").map((digit) => action(digit, () => key(digit)))}
                </View>
              ))}
              <View style={styles.row}>
                {integer ? <View style={styles.flex} /> : action(".", () => key("."))}
                {action("0", () => key("0"), integer ? t("measurementInput.recordZero") : "0")}
                {action(
                  "⌫",
                  () => {
                    setDraft(draft.slice(0, -1))
                    setReplaceOnDigit(false)
                  },
                  t("measurementInput.backspace"),
                )}
              </View>
              <View style={styles.row}>
                <Button
                  text={t("measurementInput.clear")}
                  onPress={() => {
                    setDraft("")
                    setReplaceOnDigit(false)
                  }}
                  style={styles.flex}
                />
                <Button
                  text={t("common.cancel")}
                  onPress={() => setOpen(false)}
                  style={styles.flex}
                />
                <Button
                  text={t("common.done")}
                  preset="reversed"
                  style={styles.flex}
                  onPress={() => {
                    onChangeText(draft === "" ? "" : String(Number(draft)))
                    setOpen(false)
                  }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  content: { alignSelf: "center", gap: 10, maxWidth: 560, paddingHorizontal: 16, width: "100%" },
  display: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 64,
    padding: 16,
  },
  field: { gap: 8, marginVertical: 8 },
  flex: { flex: 1, minWidth: 0, paddingHorizontal: 4 },
  key: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 56,
  },
  modal: { flex: 1, justifyContent: "flex-end" },
  panel: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "95%", paddingTop: 20 },
  row: { flexDirection: "row", gap: 8 },
})
