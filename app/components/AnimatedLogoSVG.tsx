import React, { useEffect } from "react"
import { View, StyleSheet } from "react-native"
import Svg, { Path, G } from "react-native-svg"
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from "react-native-reanimated"

const AnimatedG = Animated.createAnimatedComponent(G)

interface AnimatedLogoSVGProps {
  size?: number
}

export function AnimatedLogoSVG({ size = 200 }: AnimatedLogoSVGProps) {
  const outerRingRotation = useSharedValue(0)
  const innerRingRotation = useSharedValue(0)

  useEffect(() => {
    // Outer ring: continuous full rotation (slow)
    outerRingRotation.value = withRepeat(
      withTiming(360, {
        duration: 8000, // 8 seconds per rotation
        easing: Easing.linear,
      }),
      -1, // infinite
      false,
    )

    // Inner ring: 3/4 rotation then back (270 degrees forward, then back)
    innerRingRotation.value = withRepeat(
      withSequence(
        withTiming(270, {
          duration: 3000, // 3 seconds to rotate 3/4
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: 3000, // 3 seconds to return
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1, // infinite
      false,
    )
  }, [])

  const outerRingAnimatedProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${outerRingRotation.value}deg` }],
  }))

  const innerRingAnimatedProps = useAnimatedProps(() => ({
    transform: [{ rotate: `${innerRingRotation.value}deg` }],
  }))

  const viewBox = "0 0 200 200"
  const center = 100
  const logoColor = "#0EA5E9"

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={viewBox}>
        {/* Inner ring - dashed circle (3/4 rotation, goes behind cow) */}
        <AnimatedG origin={`${center}, ${center}`} animatedProps={innerRingAnimatedProps}>
          {/* Inner ring dashes - smaller radius */}
          <Path
            d="M 100 40 A 60 60 0 0 1 142 58"
            fill="none"
            stroke={logoColor}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <Path
            d="M 152 75 A 60 60 0 0 1 160 100"
            fill="none"
            stroke={logoColor}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <Path
            d="M 160 115 A 60 60 0 0 1 142 142"
            fill="none"
            stroke={logoColor}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <Path
            d="M 128 152 A 60 60 0 0 1 100 160"
            fill="none"
            stroke={logoColor}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <Path
            d="M 85 160 A 60 60 0 0 1 58 142"
            fill="none"
            stroke={logoColor}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <Path
            d="M 48 128 A 60 60 0 0 1 40 100"
            fill="none"
            stroke={logoColor}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <Path
            d="M 40 85 A 60 60 0 0 1 58 58"
            fill="none"
            stroke={logoColor}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <Path
            d="M 72 48 A 60 60 0 0 1 90 42"
            fill="none"
            stroke={logoColor}
            strokeWidth="12"
            strokeLinecap="round"
          />
        </AnimatedG>

        {/* Cow head silhouette (static, on top) */}
        <G>
          {/* Cow head profile - facing right */}
          <Path
            d="M 100 60 Q 115 55 125 60 Q 135 65 138 75 Q 140 85 135 95 Q 130 100 125 102 L 120 105 Q 115 108 110 105 L 105 100 Q 95 98 90 90 Q 85 80 88 70 Q 92 60 100 60 Z"
            fill={logoColor}
          />
          {/* Ear */}
          <Path
            d="M 108 58 Q 110 50 115 48 Q 118 47 120 50 Q 122 55 120 60 L 112 62 Z"
            fill={logoColor}
          />
          {/* Horn */}
          <Path
            d="M 118 56 Q 120 48 124 44 Q 126 42 128 44 Q 130 48 128 52 L 122 58"
            fill={logoColor}
          />
          {/* Snout/nose area - white */}
          <Path
            d="M 128 92 Q 130 95 128 98 Q 125 100 122 98 Q 120 95 122 92 Q 125 90 128 92 Z"
            fill="#FFFFFF"
          />
          {/* Neck extending down */}
          <Path
            d="M 105 100 Q 100 110 98 120 L 102 120 Q 104 110 108 102 Z"
            fill={logoColor}
          />
        </G>

        {/* Outer ring - dashed circle (rotates continuously) */}
        <AnimatedG origin={`${center}, ${center}`} animatedProps={outerRingAnimatedProps}>
          {/* Outer ring top arc */}
          <Path
            d="M 50 30 A 80 80 0 0 1 100 20"
            fill="none"
            stroke={logoColor}
            strokeWidth="14"
            strokeLinecap="round"
          />
          <Path
            d="M 115 20 A 80 80 0 0 1 150 30"
            fill="none"
            stroke={logoColor}
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Outer ring right arc */}
          <Path
            d="M 160 45 A 80 80 0 0 1 170 75"
            fill="none"
            stroke={logoColor}
            strokeWidth="14"
            strokeLinecap="round"
          />
          <Path
            d="M 172 90 A 80 80 0 0 1 172 110"
            fill="none"
            stroke={logoColor}
            strokeWidth="14"
            strokeLinecap="round"
          />
          <Path
            d="M 170 125 A 80 80 0 0 1 160 155"
            fill="none"
            stroke={logoColor}
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Outer ring bottom arc */}
          <Path
            d="M 150 170 A 80 80 0 0 1 115 180"
            fill="none"
            stroke={logoColor}
            strokeWidth="14"
            strokeLinecap="round"
          />
          <Path
            d="M 100 180 A 80 80 0 0 1 50 170"
            fill="none"
            stroke={logoColor}
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Outer ring left arc */}
          <Path
            d="M 40 155 A 80 80 0 0 1 30 125"
            fill="none"
            stroke={logoColor}
            strokeWidth="14"
            strokeLinecap="round"
          />
          <Path
            d="M 28 110 A 80 80 0 0 1 28 90"
            fill="none"
            stroke={logoColor}
            strokeWidth="14"
            strokeLinecap="round"
          />
          <Path
            d="M 30 75 A 80 80 0 0 1 40 45"
            fill="none"
            stroke={logoColor}
            strokeWidth="14"
            strokeLinecap="round"
          />
        </AnimatedG>
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
})
