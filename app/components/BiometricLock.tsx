import { useCallback, useEffect, useRef, useState } from "react"
import { AppState, Image, ImageStyle, View, ViewStyle } from "react-native"
import * as LocalAuthentication from "expo-local-authentication"
import { useTranslation } from "react-i18next"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { loadString } from "@/utils/storage"

import { Button } from "./Button"
import { Text } from "./Text"

export const BIOMETRIC_LOCK_KEY = "biometric_lock_enabled"

export const isBiometricLockEnabled = () => loadString(BIOMETRIC_LOCK_KEY) === "true"

/**
 * Full-screen overlay that locks the app behind Face ID / Touch ID / device
 * biometrics. Locks on cold start and whenever the app returns from the
 * background, if the user enabled the lock in Settings.
 *
 * This is a UI gate, not cryptographic protection — the Supabase session and
 * local database are untouched underneath.
 */
export function BiometricLock() {
  const { themed } = useAppTheme()
  const { t } = useTranslation()
  const [locked, setLocked] = useState(isBiometricLockEnabled)
  // Face ID's system prompt sends the app to "inactive", so we only re-lock
  // on "background" — otherwise the prompt itself would re-trigger the lock.
  const prompting = useRef(false)

  const authenticate = useCallback(async () => {
    if (prompting.current) return
    prompting.current = true
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("biometricLock.prompt"),
      })
      if (result.success) setLocked(false)
    } catch (error) {
      console.warn("[BiometricLock] authenticate failed:", error)
    } finally {
      prompting.current = false
    }
  }, [t])

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background" && isBiometricLockEnabled()) {
        setLocked(true)
      }
    })
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    if (locked) authenticate()
  }, [locked, authenticate])

  if (!locked) return null

  return (
    <View style={themed($container)}>
      <Image
        source={require("../../assets/images/herdtrackr-logo-text.png")}
        style={themed($logo)}
        resizeMode="contain"
      />
      <Text text={t("biometricLock.title")} style={themed($message)} size="md" />
      <Button
        text={t("biometricLock.unlockButton")}
        preset="filled"
        onPress={authenticate}
        style={themed($unlockButton)}
      />
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.background,
  zIndex: 1000,
})

const $logo: ThemedStyle<ImageStyle> = () => ({
  width: 240,
  height: 240,
})

const $message: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginTop: -spacing.xl,
  color: colors.textDim,
  textAlign: "center",
})

const $unlockButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xl,
  minWidth: 200,
})
