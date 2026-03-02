/**
 * HerdTrackr Logo — Modern bold bull silhouette with tracking arc
 *
 * Design goals:
 *  - Strong, confident profile (side-facing bull — power and motion)
 *  - Clean geometric lines — modern agri-tech feel
 *  - Tracking arc suggests GPS/connectivity without clutter
 *  - Earthy green palette that resonates with SA pastoral landscape
 */
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from "react-native-svg"

type LogoProps = {
  size?: number
  color?: string
  accentColor?: string
}

export function HerdTrackrLogo({
  size = 120,
  color = "#1B4332",
  accentColor = "#40916C",
}: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={accentColor} />
          <Stop offset="1" stopColor={color} />
        </LinearGradient>
      </Defs>

      {/* Outer circle — clean border */}
      <Circle
        cx="60"
        cy="60"
        r="56"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
      />

      {/* Bull silhouette — powerful side profile facing right */}
      <G transform="translate(14, 18)">
        {/* Horn — single bold swept-back horn (side view) */}
        <Path
          d="M52 30 Q56 18 64 10 Q68 8 70 12 Q66 20 58 30"
          fill={color}
        />

        {/* Ear */}
        <Path
          d="M54 32 Q60 26 62 30 Q60 36 54 36Z"
          fill={color}
        />

        {/* Head + neck + massive shoulder (one bold shape) */}
        <Path
          d="M30 50
             Q28 42 34 34
             Q40 28 50 30
             Q56 32 56 38
             Q56 44 52 48
             L48 52
             Q44 56 40 58
             Q36 60 30 58
             Q26 54 30 50Z"
          fill="url(#logoGrad)"
        />

        {/* Body — broad muscular torso */}
        <Path
          d="M30 50
             Q24 48 18 50
             Q10 54 8 62
             Q6 70 10 76
             Q14 82 22 82
             L68 82
             Q78 82 82 74
             Q84 66 80 58
             Q76 50 66 48
             Q56 46 48 48
             L40 50
             Q36 52 30 50Z"
          fill={color}
        />

        {/* Eye — bold white dot */}
        <Circle cx="48" cy="36" r="2.5" fill="white" />
        <Circle cx="48" cy="36" r="1" fill={color} />

        {/* Nostril */}
        <Circle cx="34" cy="52" r="1.8" fill={color} opacity={0.5} />

        {/* Front legs — strong, planted */}
        <Path
          d="M24 78 L22 94 Q22 96 24 96 L28 96 Q30 96 30 94 L28 78"
          fill={color}
        />
        <Path
          d="M36 80 L34 94 Q34 96 36 96 L40 96 Q42 96 42 94 L40 80"
          fill={color}
        />

        {/* Hind legs */}
        <Path
          d="M60 80 L58 94 Q58 96 60 96 L64 96 Q66 96 66 94 L64 80"
          fill={color}
        />
        <Path
          d="M72 78 L70 94 Q70 96 72 96 L76 96 Q78 96 78 94 L76 78"
          fill={color}
        />

        {/* Tail — confident upward flick */}
        <Path
          d="M80 60 Q86 52 88 44 Q89 40 87 42 Q84 48 78 56"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </G>

      {/* Tracking signal arcs — top-right, modern GPS feel */}
      <Path
        d="M88 20 Q96 24 100 32"
        stroke={accentColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M92 14 Q102 20 108 30"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
      <Circle cx="86" cy="22" r="3" fill={accentColor} />
    </Svg>
  )
}
