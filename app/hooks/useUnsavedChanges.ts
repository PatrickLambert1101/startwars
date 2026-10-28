import { useRef } from "react"
import { Alert } from "react-native"
import { useNavigation, usePreventRemove } from "@react-navigation/native"
import { useTranslation } from "react-i18next"

export function useUnsavedChanges(hasChanges: boolean, isSaving: boolean) {
  const navigation = useNavigation()
  const { t } = useTranslation()
  const saved = useRef(false)
  usePreventRemove(hasChanges || isSaving, ({ data }) => {
    if (saved.current) {
      navigation.dispatch(data.action)
      return
    }
    if (isSaving) return
    Alert.alert(t("uxFixes.discardTitle"), t("uxFixes.discardMessage"), [
      { text: t("uxFixes.keepEditing"), style: "cancel" },
      {
        text: t("uxFixes.discard"),
        style: "destructive",
        onPress: () => navigation.dispatch(data.action),
      },
    ])
  })
  return () => {
    saved.current = true
  }
}
