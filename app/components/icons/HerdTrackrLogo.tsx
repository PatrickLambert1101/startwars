/**
 * HerdTrackr Logo — Cattle silhouette with tracking ring
 */
import Svg, { Path, Circle, G } from "react-native-svg"

type LogoProps = {
  size?: number
  color?: string
  accentColor?: string
}

export function HerdTrackrLogo({ size = 120, color = "#2D5A27", accentColor = "#4A8C3F" }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* Outer tracking ring */}
      <Circle cx="60" cy="60" r="56" stroke={accentColor} strokeWidth="3" fill="none" strokeDasharray="8 4" />
      <Circle cx="60" cy="60" r="48" stroke={color} strokeWidth="2" fill={color + "10"} />

      {/* Cow head silhouette — front-facing */}
      <G transform="translate(30, 22)">
        {/* Horns */}
        <Path
          d="M8 28 Q2 18 6 8 Q10 12 14 20"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M52 28 Q58 18 54 8 Q50 12 46 20"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Ears */}
        <Path
          d="M10 30 Q4 26 8 20 Q14 24 14 30"
          fill={color}
        />
        <Path
          d="M50 30 Q56 26 52 20 Q46 24 46 30"
          fill={color}
        />

        {/* Head shape */}
        <Path
          d="M14 30 Q14 24 20 22 Q26 20 30 20 Q34 20 40 22 Q46 24 46 30 Q46 40 44 48 Q42 56 38 62 Q34 68 30 70 Q26 68 22 62 Q18 56 16 48 Q14 40 14 30Z"
          fill={color}
        />

        {/* Eyes */}
        <Circle cx="22" cy="34" r="3" fill="white" />
        <Circle cx="38" cy="34" r="3" fill="white" />
        <Circle cx="22" cy="34.5" r="1.5" fill="#1a1a1a" />
        <Circle cx="38" cy="34.5" r="1.5" fill="#1a1a1a" />

        {/* Nose/muzzle */}
        <Path
          d="M22 48 Q22 44 26 42 Q30 41 34 42 Q38 44 38 48 Q38 54 34 58 Q30 60 26 58 Q22 54 22 48Z"
          fill={accentColor}
          opacity={0.8}
        />

        {/* Nostrils */}
        <Circle cx="26" cy="50" r="2" fill={color} opacity={0.6} />
        <Circle cx="34" cy="50" r="2" fill={color} opacity={0.6} />
      </G>

      {/* GPS/tracking dot */}
      <Circle cx="96" cy="24" r="8" fill={accentColor} />
      <Circle cx="96" cy="24" r="4" fill="white" />
      <Circle cx="96" cy="24" r="2" fill={accentColor} />
    </Svg>
  )
}
