import React, { useEffect, useRef } from "react"
import { View, StyleSheet, ViewStyle, Image } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from "react-native-reanimated"
import { Text } from "./Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface LoadingScreenProps {
  message?: string
  onComplete?: () => void
}

const MINIMUM_DISPLAY_TIME = 2000 // 2 seconds
const FADE_OUT_DURATION = 400 // 400ms fade out

export function LoadingScreen({ message, onComplete }: LoadingScreenProps) {
  const { themed } = useAppTheme()
  const opacity = useSharedValue(1)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    // Start the fade out process when onComplete is provided
    if (onComplete) {
      const elapsedTime = Date.now() - startTimeRef.current
      const remainingTime = Math.max(0, MINIMUM_DISPLAY_TIME - elapsedTime)

      // Wait for minimum display time, then fade out
      const timer = setTimeout(() => {
        opacity.value = withTiming(
          0,
          { duration: FADE_OUT_DURATION },
          (finished) => {
            if (finished) {
              runOnJS(onComplete)()
            }
          }
        )
      }, remainingTime)

      return () => clearTimeout(timer)
    }
  }, [onComplete])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[themed($container), animatedStyle]}>
      <Image
        source={require("../../assets/images/splash-logo-all.png")}
        style={themed($logo)}
        resizeMode="contain"
      />
      {message && (
        <Text text={message} style={themed($message)} size="md" />
      )}
    </Animated.View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.background,
})

const $logo: ThemedStyle<ViewStyle> = () => ({
  width: 280,
  height: 280,
})

const $message: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.xl,
  color: colors.textDim,
  textAlign: "center",
})
