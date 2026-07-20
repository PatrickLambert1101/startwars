import { useEffect, useRef } from "react"
import { type ViewStyle } from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

import { RfidLoadingAnimation } from "./RfidLoadingAnimation"
import { Text } from "./Text"

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
    if (!onComplete) return

    const elapsedTime = Date.now() - startTimeRef.current
    const remainingTime = Math.max(0, MINIMUM_DISPLAY_TIME - elapsedTime)

    // Wait for minimum display time, then fade out.
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: FADE_OUT_DURATION }, (finished) => {
        if (finished) {
          runOnJS(onComplete)()
        }
      })
    }, remainingTime)

    return () => clearTimeout(timer)
  }, [onComplete, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[themed($container), animatedStyle]}>
      <RfidLoadingAnimation size={200} />
      {message && <Text text={message} style={themed($message)} size="md" />}
    </Animated.View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.neutral100,
})

const $message: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.xl,
  color: colors.textDim,
  textAlign: "center",
})
