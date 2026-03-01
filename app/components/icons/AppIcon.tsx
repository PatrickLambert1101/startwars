/**
 * App icon for splash screens and in-app branding.
 * A simplified version of the logo optimized for small sizes.
 */
import Svg, { Path, Circle, G, Rect, Defs, LinearGradient, Stop } from "react-native-svg"

type AppIconProps = {
  size?: number
}

export function AppIcon({ size = 200 }: AppIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4A8C3F" />
          <Stop offset="1" stopColor="#2D5A27" />
        </LinearGradient>
      </Defs>

      {/* Background */}
      <Rect x="0" y="0" width="200" height="200" rx="40" fill="url(#bgGrad)" />

      {/* Cow face — centered, white */}
      <G transform="translate(50, 30)">
        {/* Horns */}
        <Path
          d="M15 50 Q6 35 12 15 Q18 22 24 38"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          opacity={0.9}
        />
        <Path
          d="M85 50 Q94 35 88 15 Q82 22 76 38"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          opacity={0.9}
        />

        {/* Ears */}
        <Path d="M18 52 Q8 46 14 36 Q24 42 24 52" fill="white" opacity={0.9} />
        <Path d="M82 52 Q92 46 86 36 Q76 42 76 52" fill="white" opacity={0.9} />

        {/* Head */}
        <Path
          d="M24 52 Q24 42 36 38 Q44 36 50 36 Q56 36 64 38 Q76 42 76 52 Q76 68 72 82 Q68 96 62 106 Q56 114 50 118 Q44 114 38 106 Q32 96 28 82 Q24 68 24 52Z"
          fill="white"
        />

        {/* Eyes */}
        <Circle cx="38" cy="60" r="5" fill="#2D5A27" />
        <Circle cx="62" cy="60" r="5" fill="#2D5A27" />
        <Circle cx="39" cy="59" r="2" fill="white" />
        <Circle cx="63" cy="59" r="2" fill="white" />

        {/* Muzzle */}
        <Path
          d="M38 82 Q38 76 44 74 Q50 73 56 74 Q62 76 62 82 Q62 92 56 98 Q50 102 44 98 Q38 92 38 82Z"
          fill="#C8E6C0"
          opacity={0.7}
        />

        {/* Nostrils */}
        <Circle cx="44" cy="86" r="3.5" fill="#2D5A27" opacity={0.5} />
        <Circle cx="56" cy="86" r="3.5" fill="#2D5A27" opacity={0.5} />
      </G>

      {/* GPS tracking dot */}
      <Circle cx="160" cy="40" r="14" fill="white" opacity={0.3} />
      <Circle cx="160" cy="40" r="8" fill="white" opacity={0.7} />
      <Circle cx="160" cy="40" r="4" fill="#4A8C3F" />
    </Svg>
  )
}
