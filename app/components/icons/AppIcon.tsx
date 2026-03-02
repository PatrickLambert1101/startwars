/**
 * App icon — simplified bull head on green rounded square.
 * Same geometric approach as HerdTrackrLogo, scaled for small sizes.
 */
import Svg, { Ellipse, Circle, Path, G, Rect, Defs, LinearGradient, Stop } from "react-native-svg"

type AppIconProps = {
  size?: number
}

export function AppIcon({ size = 200 }: AppIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id="appBg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#52B788" />
          <Stop offset="1" stopColor="#1B4332" />
        </LinearGradient>
      </Defs>

      {/* Background */}
      <Rect x="0" y="0" width="200" height="200" rx="44" fill="url(#appBg)" />

      <G transform="translate(100, 105)">
        {/* Left horn */}
        <Path
          d="M-28,-22 Q-48,-52 -36,-78"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        {/* Right horn */}
        <Path
          d="M28,-22 Q48,-52 36,-78"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Left ear */}
        <Ellipse cx="-42" cy="-16" rx="13" ry="8" fill="white" transform="rotate(-30 -42 -16)" />
        {/* Right ear */}
        <Ellipse cx="42" cy="-16" rx="13" ry="8" fill="white" transform="rotate(30 42 -16)" />

        {/* Head */}
        <Ellipse cx="0" cy="0" rx="36" ry="46" fill="white" />

        {/* Muzzle */}
        <Ellipse cx="0" cy="28" rx="26" ry="20" fill="#B7E4C7" />

        {/* Eyes */}
        <Circle cx="-14" cy="-10" r="6" fill="#1B4332" />
        <Circle cx="14" cy="-10" r="6" fill="#1B4332" />
        <Circle cx="-12.5" cy="-11.5" r="2" fill="white" />
        <Circle cx="15.5" cy="-11.5" r="2" fill="white" />

        {/* Nostrils */}
        <Ellipse cx="-8" cy="32" rx="5" ry="4" fill="#1B4332" opacity={0.3} />
        <Ellipse cx="8" cy="32" rx="5" ry="4" fill="#1B4332" opacity={0.3} />
      </G>

      {/* Tracking signal */}
      <Circle cx="166" cy="28" r="6" fill="white" />
      <Path
        d="M176,18 A16,16 0 0,1 176,38"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M184,10 A26,26 0 0,1 184,46"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
    </Svg>
  )
}
