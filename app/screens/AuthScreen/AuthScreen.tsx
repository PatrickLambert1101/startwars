import React, { useState } from "react"
import { View, ViewStyle, TextStyle, Image, ImageStyle } from "react-native"
import { Screen, Text, TextField, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { useAuth } from "@/context/AuthContext"

export function AuthScreen() {
  const { themed } = useAppTheme()
  const { authEmail, setAuthEmail, signInWithOTP, verifyOTP, validationError } = useAuth()
  const [isSending, setIsSending] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState("")

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
    if (code.length !== 6) {
      setError("Code must be 6 digits")
      return
    }

    setIsVerifying(true)
    setError("")

    const result = await verifyOTP(authEmail, code)

    if (result.error) {
      setError(result.error)
      setIsVerifying(false)
    }
    // If successful, user will be signed in and navigation will handle it
  }

  if (codeSent) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={themed($container)}>
        <View style={themed($content)}>
          <View style={themed($logoContainer)}>
            <Text style={themed($logo)}>🔒</Text>
            <Text preset="heading" style={themed($title)}>Enter Code</Text>
            <Text style={themed($subtitle)}>
              Check your email for the 6-digit code
            </Text>
          </View>

          <View style={themed($form)}>
            <Text style={themed($formTitle)}>Sent to {authEmail}</Text>

            <TextField
              label="6-Digit Code"
              value={code}
              onChangeText={(text) => {
                setCode(text.replace(/[^0-9]/g, ""))
                setError("")
              }}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
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
              disabled={isVerifying || code.length !== 6}
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
      <View style={themed($content)}>
        <View style={themed($logoContainer)}>
          <Text style={themed($logo)}>🐄</Text>
          <Text preset="heading" style={themed($title)}>Welcome to HerdTrackr</Text>
          <Text style={themed($subtitle)}>
            Manage your livestock with ease
          </Text>
        </View>

        <View style={themed($form)}>
          <Text style={themed($formTitle)}>Sign in with your email</Text>
          <Text style={themed($formSubtitle)}>
            We'll send you a 6-digit code - no password needed!
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
              <Text style={themed($benefitIcon)}>📱</Text>
              <Text style={themed($benefitText)}>Track animals, health & breeding</Text>
            </View>
            <View style={themed($benefitRow)}>
              <Text style={themed($benefitIcon)}>🌾</Text>
              <Text style={themed($benefitText)}>Manage pastures & rotations</Text>
            </View>
            <View style={themed($benefitRow)}>
              <Text style={themed($benefitIcon)}>👥</Text>
              <Text style={themed($benefitText)}>Invite your farm workers</Text>
            </View>
            <View style={themed($benefitRow)}>
              <Text style={themed($benefitIcon)}>☁️</Text>
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

const $logo: ThemedStyle<TextStyle> = () => ({
  fontSize: 72,
  marginBottom: 8,
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
