import { ComponentType, FC, useMemo, useRef, useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { ActivityIndicator, TextInput, TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField, type TextFieldAccessoryProps } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import { HerdTrackrLogo, CattleSilhouette } from "@/components/icons"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import type { ThemedStyle } from "@/theme/types"
import { useAppTheme } from "@/theme/context"

interface LoginScreenProps extends AppStackScreenProps<"Login"> {}

export const LoginScreen: FC<LoginScreenProps> = () => {
  const authPasswordInput = useRef<TextInput>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isPasswordHidden, setIsPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")
  const { signIn, signUp } = useAuth()

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const emailError = (() => {
    if (!isSubmitted) return ""
    if (!email || email.length === 0) return "can't be blank"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "must be a valid email address"
    return ""
  })()

  const passwordError = isSubmitted && password.length < 6 ? "Password must be at least 6 characters" : ""

  async function handleSubmit() {
    setIsSubmitted(true)
    setServerError("")

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) return

    setIsSubmitting(true)
    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password)

    setIsSubmitting(false)

    if (error) {
      setServerError(error)
    }
  }

  const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <PressableIcon
            icon={isPasswordHidden ? "view" : "hidden"}
            color={colors.palette.neutral800}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsPasswordHidden(!isPasswordHidden)}
          />
        )
      },
    [isPasswordHidden, colors.palette.neutral800],
  )

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={themed($logoContainer)}>
        <HerdTrackrLogo size={100} color={colors.tint} accentColor={colors.tint} />
      </View>
      <Text text="HerdTrackr" preset="heading" style={themed($appName)} />
      <Text
        text={isSignUp ? "Create your account" : "Sign in to your account"}
        preset="subheading"
        style={themed($subtitle)}
      />
      <Text
        text="Cattle management, offline-first."
        preset="default"
        style={themed($tagline)}
      />

      {serverError ? (
        <Text text={serverError} size="sm" style={themed($serverError)} />
      ) : null}

      <TextField
        value={email}
        onChangeText={setEmail}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        label="Email"
        placeholder="Enter your email address"
        helper={emailError}
        status={emailError ? "error" : undefined}
        onSubmitEditing={() => authPasswordInput.current?.focus()}
      />

      <TextField
        ref={authPasswordInput}
        value={password}
        onChangeText={setPassword}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="password"
        autoCorrect={false}
        secureTextEntry={isPasswordHidden}
        label="Password"
        placeholder={isSignUp ? "Create a password (min 6 chars)" : "Enter your password"}
        helper={passwordError}
        status={passwordError ? "error" : undefined}
        onSubmitEditing={handleSubmit}
        RightAccessory={PasswordRightAccessory}
      />

      <Button
        testID="login-button"
        text={isSubmitting ? "..." : isSignUp ? "Create Account" : "Sign In"}
        style={themed($submitButton)}
        preset="reversed"
        onPress={handleSubmit}
      />

      {isSubmitting && <ActivityIndicator style={themed($loader)} color={colors.tint} />}

      <View style={themed($toggleRow)}>
        <Text
          text={isSignUp ? "Already have an account?" : "Don't have an account?"}
          preset="default"
          size="sm"
        />
        <Button
          text={isSignUp ? "Sign In" : "Sign Up"}
          preset="default"
          style={themed($toggleButton)}
          textStyle={themed($toggleButtonText)}
          onPress={() => {
            setIsSignUp(!isSignUp)
            setIsSubmitted(false)
            setServerError("")
          }}
        />
      </View>

      <View style={themed($silhouetteContainer)}>
        <CattleSilhouette size={280} color={colors.tint} />
      </View>
    </Screen>
  )
}

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $logoContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginBottom: spacing.md,
})

const $appName: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginBottom: spacing.xs,
  textAlign: "center",
})

const $subtitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $tagline: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginBottom: spacing.xl,
})

const $serverError: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.error,
  marginBottom: spacing.md,
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $submitButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $loader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

const $toggleRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  marginTop: spacing.xl,
  gap: spacing.xs,
})

const $toggleButton: ThemedStyle<ViewStyle> = () => ({
  minHeight: 32,
  paddingVertical: 4,
  paddingHorizontal: 8,
})

const $toggleButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $silhouetteContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginTop: spacing.xl,
  opacity: 0.6,
})
