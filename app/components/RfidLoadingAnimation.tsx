import { useEffect } from "react"
import { StyleSheet, View, type ViewStyle } from "react-native"
import { useAssets } from "expo-asset"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"
import Svg, { Path, SvgUri } from "react-native-svg"

interface RfidLoadingAnimationProps {
  size?: number
  style?: ViewStyle
}

const green = "#70952E"

/**
 * Renders the approved HerdTrackr logo SVG exactly as supplied. The artwork is
 * intentionally not redrawn here. A single clean hex rotates quietly behind it.
 */
export function RfidLoadingAnimation({ size = 132, style }: RfidLoadingAnimationProps) {
  const [assets] = useAssets([require("@/assets/branding/herdtrackr-logo-animated.svg")])
  const hexRotation = useSharedValue(0)

  useEffect(() => {
    hexRotation.value = withRepeat(
      withTiming(360, { duration: 22000, easing: Easing.linear }),
      -1,
      false,
    )
  }, [hexRotation])

  const hexRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${hexRotation.value}deg` }],
  }))

  const asset = assets?.[0]
  const uri = asset?.localUri ?? asset?.uri

  return (
    <View
      style={[styles.container, { borderRadius: size * 0.16, height: size, width: size }, style]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.hexLayer,
          {
            height: size * 0.72,
            left: size * 0.14,
            top: size * 0.11,
            width: size * 0.72,
          },
          hexRotationStyle,
        ]}
      >
        <Svg height={size * 0.72} viewBox="0 0 120 120" width={size * 0.72}>
          <Path
            d="M60 10.5Q60.9 10.5 61.7 11L101.3 33.9Q103 34.9 103 36.8V83.2Q103 85.1 101.3 86.1L61.7 109Q60 110 58.3 109L18.7 86.1Q17 85.1 17 83.2V36.8Q17 34.9 18.7 33.9L58.3 11Q59.1 10.5 60 10.5Z"
            fill="none"
            stroke={green}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={4.35}
          />
        </Svg>
      </Animated.View>
      {uri ? <SvgUri height={size} uri={uri} width={size} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  hexLayer: {
    height: "100%",
    position: "absolute",
    width: "100%",
  },
})
