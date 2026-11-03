import { useState } from "react"
import { View, ViewStyle } from "react-native"
import { useTranslation } from "react-i18next"

import { Button, Text, TextField } from "@/components"
import { useAuth } from "@/context/AuthContext"
import { bentoRadii } from "@/theme/bento"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { getContactPhone, normalizeContactPhone } from "@/utils/contactPhone"

export function ContactPhoneForm({ onSkip }: { onSkip?: () => void }) {
  const { user, updateContactPhone } = useAuth()
  const { t } = useTranslation()
  const { themed } = useAppTheme()
  const [phone, setPhone] = useState(() => getContactPhone(user))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<"invalid" | "saveFailed" | null>(null)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    if (saving) return
    const normalized = normalizeContactPhone(phone)
    if (!normalized) {
      setError("invalid")
      return
    }
    setSaving(true)
    setError(null)
    setSaved(false)
    const result = await updateContactPhone(normalized)
    setSaving(false)
    if (result.error) {
      setError(result.error === "invalid" ? "invalid" : "saveFailed")
    } else {
      setPhone(normalized)
      setSaved(true)
    }
  }

  return (
    <View style={themed($card)}>
      <Text preset="subheading" text={t(onSkip ? "contactPhone.title" : "contactPhone.label")} />
      <Text text={t("contactPhone.description")} />
      <TextField
        label={t("contactPhone.label")}
        placeholder="+27 82 123 4567"
        value={phone}
        onChangeText={(value) => {
          setPhone(value)
          setError(null)
          setSaved(false)
        }}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        editable={!saving}
        maxLength={30}
        helper={error ? t(`contactPhone.${error}`) : t("contactPhone.hint")}
        status={error ? "error" : undefined}
        onSubmitEditing={save}
      />
      {saved && <Text accessibilityLiveRegion="polite" text={t("contactPhone.saved")} />}
      <Button
        text={t(
          saving ? "contactPhone.saving" : onSkip ? "contactPhone.continue" : "contactPhone.save",
        )}
        preset="filled"
        disabled={saving || !phone.trim()}
        onPress={save}
      />
      {onSkip && <Button text={t("contactPhone.skip")} disabled={saving} onPress={onSkip} />}
    </View>
  )
}

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  padding: spacing.lg,
  borderRadius: bentoRadii.card,
  gap: spacing.md,
})
