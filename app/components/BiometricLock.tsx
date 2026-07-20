import { useCallback, useEffect, useRef, useState } from "react"
import { AppState, Image, ImageStyle, View, ViewStyle } from "react-native"
import * as LocalAuthentication from "expo-local-authentication"
import { useTranslation } from "react-i18next"

import { supabase } from "@/services/supabase"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { loadString, saveString } from "@/utils/storage"

import { Button } from "./Button"
import { Text } from "./Text"

export const BIOMETRIC_LOCK_KEY = "biometric_lock_enabled"

export const isBiometricLockEnabled = () => loadString(BIOMETRIC_LOCK_KEY) === "true"

// When the current Supabase access token expires (epoch seconds). Persisted so
// a cold start can tell whether the login lapsed while the app was closed.
const SESSION_EXPIRY_KEY = "biometric_session_expiry"

// After a successful unlock, don't re-prompt for this long even if the token
// couldn't refresh (e.g. offline on the farm).
const UNLOCK_GRACE_SECONDS = 60 * 60

const isLoginExpired = () => {
  const expiry = Number(loadString(SESSION_EXPIRY_KEY))
  if (!expiry) return false // never logged in / no known session — nothing to guard
  return Date.now() / 1000 >= expiry
}

/**
 * Full-screen overlay that locks the app behind Face ID / Touch ID / device
 * biometrics. The lock only engages when the login has expired — i.e. the
 * Supabase access token lapsed while the app was closed or backgrounded —
 * not on every launch or foreground.
 *
 * This is a UI gate, not cryptographic protection — the Supabase session and
 * local database are untouched underneath.
 */
export function BiometricLock() {
  const { themed } = useAppTheme()
  const { t } = useTranslation()
  const [locked, setLocked] = useState(() => isBiometricLockEnabled() && isLoginExpired())
  // Face ID's system prompt sends the app to "inactive", so we only re-check
  // on background → active transitions — otherwise the prompt itself would
  // re-trigger the lock.
  const prompting = useRef(false)
  const appState = useRef(AppState.currentState)

  const authenticate = useCallback(async () => {
    if (prompting.current) return
    prompting.current = true
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("biometricLock.prompt"),
      })
      if (result.success) {
        // Grace period so an offline session (token can't refresh) doesn't
        // re-prompt on every foreground.
        saveString(SESSION_EXPIRY_KEY, String(Math.floor(Date.now() / 1000) + UNLOCK_GRACE_SECONDS))
        setLocked(false)
      }
    } catch (error) {
      console.warn("[BiometricLock] authenticate failed:", error)
    } finally {
      prompting.current = false
    }
  }, [t])

  // Track the session's token expiry so expiry checks work across cold starts.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.expires_at) {
        saveString(SESSION_EXPIRY_KEY, String(session.expires_at))
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      const cameFromBackground = appState.current === "background"
      appState.current = state
      if (state === "active" && cameFromBackground && isBiometricLockEnabled() && isLoginExpired()) {
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
