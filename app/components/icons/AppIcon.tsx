/**
 * App icon for splash screens and in-app branding.
 *
 * Simplified bold bull silhouette on a deep green gradient.
 * Optimized for small sizes — fewer details, stronger shapes.
 */
import Svg, { Path, Circle, G, Rect, Defs, LinearGradient, Stop } from "react-native-svg"

type AppIconProps = {
  size?: number
}

export function AppIcon({ size = 200 }: AppIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id="appBg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#40916C" />
          <Stop offset="1" stopColor="#1B4332" />
        </LinearGradient>
      </Defs>

      {/* Background — rounded square with gradient */}
      <Rect x="0" y="0" width="200" height="200" rx="44" fill="url(#appBg)" />

      {/* Bull silhouette — white, side profile */}
      <G transform="translate(20, 24)">
        {/* Horn */}
        <Path
          d="M86 48 Q92 30 104 18 Q110 14 112 20 Q106 34 94 48"
          fill="white"
        />

        {/* Ear */}
        <Path
          d="M88 52 Q96 44 100 48 Q98 56 88 58Z"
          fill="white"
        />

        {/* Head + neck */}
        <Path
          d="M48 82
             Q44 68 54 56
             Q64 46 80 48
             Q90 50 92 60
             Q92 68 86 76
             L80 84
             Q72 92 64 94
             Q56 96 48 92
             Q42 88 48 82Z"
          fill="white"
        />

        {/* Body — one bold mass */}
        <Path
          d="M48 80
             Q38 76 28 80
             Q16 86 12 100
             Q8 112 14 122
             Q22 132 34 132
             L110 132
             Q126 132 132 120
             Q136 108 130 94
             Q124 82 108 78
             Q92 74 80 78
             L64 82
             Q56 84 48 80Z"
          fill="white"
        />

        {/* Eye */}
        <Circle cx="78" cy="58" r="4" fill="#1B4332" />
        <Circle cx="79" cy="57" r="1.5" fill="white" />

        {/* Nostril */}
        <Circle cx="54" cy="84" r="3" fill="white" opacity={0.5} />

        {/* Front legs */}
        <Path
          d="M38 126 L34 152 Q34 156 38 156 L44 156 Q48 156 48 152 L44 126"
          fill="white"
        />
        <Path
          d="M58 128 L54 152 Q54 156 58 156 L64 156 Q68 156 68 152 L64 128"
          fill="white"
        />

        {/* Hind legs */}
        <Path
          d="M98 128 L94 152 Q94 156 98 156 L104 156 Q108 156 108 152 L104 128"
          fill="white"
        />
        <Path
          d="M116 126 L112 152 Q112 156 116 156 L122 156 Q126 156 126 152 L122 126"
          fill="white"
        />

        {/* Tail */}
        <Path
          d="M130 96 Q140 84 142 70 Q143 64 140 68 Q136 78 128 90"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </G>

      {/* Tracking signal arcs */}
      <Path
        d="M152 30 Q164 36 172 48"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        opacity={0.9}
      />
      <Path
        d="M158 20 Q174 28 184 44"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
      <Circle cx="148" cy="32" r="5" fill="white" opacity={0.9} />
    </Svg>
  )
}
