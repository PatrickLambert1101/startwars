import React, { useState, useEffect } from "react"
import { View, ViewStyle, TextStyle, Image, ImageStyle, Pressable } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { Screen, Text, TextField, Button, LoadingScreen } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useAuth } from "@/context/AuthContext"
import { saveString } from "@/utils/storage"

const DEV_SKIP_AUTH = process.env.EXPO_PUBLIC_DEV_SKIP_AUTH === "true"

const LANGUAGES = [
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "af", flag: "🇿🇦", name: "Afrikaans" },
  { code: "zu", flag: "🇿🇦", name: "isiZulu" },
  { code: "xh", flag: "🇿🇦", name: "isiXhosa" },
]

export function AuthScreen() {
  const { themed } = useAppTheme()
  const { authEmail, setAuthEmail, signInWithOTP, verifyOTP, validationError } = useAuth()
  const { i18n } = useTranslation()
  const [isSending, setIsSending] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState("")
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  const currentLanguage = LANGUAGES.find((lang) => lang.code === i18n.language?.split("-")[0]) || LANGUAGES[0]

  const handleChangeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
    saveString("app_language", languageCode)
    setShowLanguageMenu(false)
  }

  const handleSendCode = async () => {
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSending(true)
    setError("")

    const result = await signInWithOTP(authEmail)

    if (result.error) {
      setError(result.error)
      setIsSending(false)
    } else {
      setCodeSent(true)
      setIsSending(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!DEV_SKIP_AUTH && code.length !== 7) {
      setError("Code must be 7 digits")
      return
    }

    setIsVerifying(true)
    setError("")

    const result = await verifyOTP(authEmail, code)

    if (result.error) {
      setError(result.error)
      setIsVerifying(false)
    }
    // If successful, user will be signed in and LoadingScreen will show via AppNavigator
  }

  // Auto-verify in dev mode
  useEffect(() => {
    if (DEV_SKIP_AUTH && codeSent && !isVerifying) {
      console.log("[AuthScreen] DEV MODE: Auto-verifying")
      handleVerifyCode()
    }
  }, [codeSent, DEV_SKIP_AUTH])

  // Show animated loading screen while verifying
  if (isVerifying) {
    return <LoadingScreen message="Signing in..." />
  }

  if (codeSent) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={themed($container)}>
        <View style={themed($content)}>
          <View style={themed($logoContainer)}>
            <Image
              source={require("../../../assets/images/splash-logo-all.png")}
              style={themed($logoImage)}
              resizeMode="contain"
            />
            <Text preset="heading" style={themed($title)}>
              {DEV_SKIP_AUTH ? "Dev Mode: Auto-Signing In..." : "Enter Code"}
            </Text>
            <Text style={themed($subtitle)}>
              {DEV_SKIP_AUTH
                ? "Authentication bypassed for development"
                : "Check your email for the 7-digit code"
              }
            </Text>
          </View>

          <View style={themed($form)}>
            <Text style={themed($formTitle)}>Sent to {authEmail}</Text>

            <TextField
              label="7-Digit Code"
              value={code}
              onChangeText={(text) => {
                setCode(text.replace(/[^0-9]/g, ""))
                setError("")
              }}
              placeholder="0000000"
              keyboardType="number-pad"
              maxLength={7}
              helper={error}
              status={error ? "error" : undefined}
              containerStyle={themed($field)}
              onSubmitEditing={handleVerifyCode}
              autoFocus
            />

            <Button
              text={isVerifying ? "Verifying..." : "Verify Code"}
              preset="filled"
              onPress={handleVerifyCode}
              disabled={isVerifying || code.length !== 7}
              style={themed($button)}
            />

            <Button
              text="← Back"
              preset="default"
              onPress={() => {
                setCodeSent(false)
                setCode("")
                setError("")
              }}
              style={themed($backLink)}
            />

            <Text style={themed($helpText)}>
              Didn't receive the code?{" "}
              <Text
                style={themed($linkText)}
                onPress={handleSendCode}
              >
                Resend
              </Text>
            </Text>
          </View>
        </View>
      </Screen>
    )
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={themed($container)}>
      {/* Language Selector - Top Left */}
      <View style={themed($languageSelectorContainer)}>
        <Pressable
          style={themed($languageTrigger)}
          onPress={() => setShowLanguageMenu(!showLanguageMenu)}
        >
          <Text style={themed($languageFlag)}>{currentLanguage.flag}</Text>
          <Text style={themed($languageDropdownIcon)}>▼</Text>
        </Pressable>

        {showLanguageMenu && (
          <View style={themed($languageMenu)}>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                style={[
                  themed($languageMenuItem),
                  lang.code === currentLanguage.code && themed($languageMenuItemActive),
                ]}
                onPress={() => handleChangeLanguage(lang.code)}
              >
                <Text style={themed($languageFlag)}>{lang.flag}</Text>
                <Text
                  style={[
                    themed($languageMenuItemText),
                    lang.code === currentLanguage.code && themed($languageMenuItemTextActive),
                  ]}
                >
                  {lang.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={themed($content)}>
        <View style={themed($logoContainer)}>
          <Image
            source={require("../../../assets/images/splash-logo-all.png")}
            style={themed($logoImage)}
            resizeMode="contain"
          />
          <Text preset="heading" style={themed($title)}>HerdTrackr</Text>
          <Text style={themed($subtitle)}>
            Manage your livestock with ease
          </Text>
        </View>

        <View style={themed($form)}>
          {DEV_SKIP_AUTH && (
            <View style={themed($devBanner)}>
              <Text style={themed($devBannerText)}>🚧 DEV MODE - Auth Bypassed</Text>
            </View>
          )}
          <Text style={themed($formTitle)}>Sign in with your email</Text>
          <Text style={themed($formSubtitle)}>
            {DEV_SKIP_AUTH
              ? "Enter any email - you'll be auto-signed in (no OTP needed)"
              : "We'll send you a 7-digit code - no password needed!"
            }
          </Text>

          <TextField
            label="Email Address"
            value={authEmail}
            onChangeText={(text) => {
              setAuthEmail(text)
              setError("")
            }}
            placeholder="farmer@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            helper={error || validationError}
            status={error || validationError ? "error" : undefined}
            containerStyle={themed($field)}
            onSubmitEditing={handleSendCode}
          />

          <Button
            text={isSending ? "Sending..." : "Send Code"}
            preset="filled"
            onPress={handleSendCode}
            disabled={isSending || !!validationError}
            style={themed($button)}
          />

          <View style={themed($benefitsContainer)}>
            <Text style={themed($benefitsTitle)}>What you can do:</Text>
            <View style={themed($benefitRow)}>
              <MaterialCommunityIcons name="cellphone" size={20} color="#4A8C3F" />
              <Text style={themed($benefitText)}>Track animals, health & breeding</Text>
            </View>
            <View style={themed($benefitRow)}>
              <MaterialCommunityIcons name="grass" size={20} color="#4A8C3F" />
              <Text style={themed($benefitText)}>Manage pastures & rotations</Text>
            </View>
            <View style={themed($benefitRow)}>
              <MaterialCommunityIcons name="account-multiple" size={20} color="#4A8C3F" />
              <Text style={themed($benefitText)}>Invite your farm workers</Text>
            </View>
            <View style={themed($benefitRow)}>
              <MaterialCommunityIcons name="cloud-sync" size={20} color="#4A8C3F" />
              <Text style={themed($benefitText)}>Sync across all devices</Text>
            </View>
          </View>
        </View>

        <Text style={themed($footerText)}>
          By continuing, you agree to our Terms of Service
        </Text>
      </View>
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  paddingVertical: spacing.xl,
})

const $logoContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginBottom: spacing.xxl,
})

const $logoImage: ThemedStyle<ImageStyle> = () => ({
  width: 120,
  height: 120,
  marginBottom: 16,
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginBottom: spacing.xs,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  color: colors.palette.neutral600,
  textAlign: "center",
})

const $form: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
})

const $formTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 18,
  fontWeight: "600",
  color: colors.text,
  marginBottom: spacing.xxs,
})

const $formSubtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.palette.neutral600,
  marginBottom: spacing.md,
})

const $field: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $button: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $benefitsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $benefitsTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  fontWeight: "600",
  color: colors.palette.neutral700,
  marginBottom: spacing.sm,
})

const $benefitRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.xs,
})

const $benefitIcon: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 18,
  marginRight: spacing.sm,
  width: 24,
})

const $benefitText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.palette.neutral600,
  flex: 1,
})

const $footerText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 12,
  color: colors.palette.neutral500,
  textAlign: "center",
  marginTop: spacing.lg,
})

const $messageBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.xl,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
  alignItems: "center",
  marginBottom: spacing.lg,
})

const $successIcon: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 48,
  marginBottom: spacing.md,
})

const $messageTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 20,
  fontWeight: "700",
  color: colors.text,
  marginBottom: spacing.sm,
  textAlign: "center",
})

const $messageText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  color: colors.palette.neutral600,
  textAlign: "center",
  marginBottom: spacing.md,
  lineHeight: 24,
})

const $emailText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontWeight: "600",
  color: colors.palette.primary500,
})

const $messageSubtext: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.palette.neutral500,
  textAlign: "center",
  lineHeight: 20,
})

const $resendButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $helpText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 13,
  color: colors.palette.neutral500,
  textAlign: "center",
})

const $backLink: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})

const $linkText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary500,
  fontWeight: "600",
})

const $devBanner: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.angry100,
  borderRadius: 8,
  padding: spacing.sm,
  marginBottom: spacing.md,
  borderWidth: 1,
  borderColor: colors.palette.angry300,
})

const $devBannerText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 13,
  fontWeight: "700",
  color: colors.palette.angry700,
  textAlign: "center",
})

const $languageSelectorContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  top: spacing.md,
  left: spacing.md,
  zIndex: 1000,
})

const $languageTrigger: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xxs,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.background,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
})

const $languageFlag: ThemedStyle<TextStyle> = () => ({
  fontSize: 20,
})

const $languageDropdownIcon: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 10,
  color: colors.textDim,
  marginLeft: 4,
})

const $languageMenu: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  top: 44,
  left: 0,
  backgroundColor: colors.background,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 5,
  minWidth: 160,
  overflow: "hidden",
})

const $languageMenuItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
})

const $languageMenuItemActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary100,
})

const $languageMenuItemText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  fontWeight: "500",
  color: colors.text,
})

const $languageMenuItemTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary600,
  fontWeight: "600",
})
