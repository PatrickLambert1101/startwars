/**
 * HerdTrackr Logo — Minimal geometric bull head with tracking signal
 *
 * Uses only basic SVG primitives (ellipse, circle, arc) so it actually
 * renders cleanly instead of looking like a Lovecraft creature.
 */
import Svg, { Ellipse, Circle, Path, G } from "react-native-svg"

type LogoProps = {
  size?: number
  color?: string
  accentColor?: string
}

export function HerdTrackrLogo({
  size = 120,
  color = "#1B4332",
  accentColor = "#52B788",
}: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* ── Outer ring ── */}
      <Circle cx="60" cy="60" r="57" stroke={color} strokeWidth="2.5" fill="none" />

      <G transform="translate(60, 58)">
        {/* ── Left horn (arc) ── */}
        <Path
          d="M-18,-14 Q-30,-32 -22,-48"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        {/* ── Right horn (arc) ── */}
        <Path
          d="M18,-14 Q30,-32 22,-48"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* ── Left ear ── */}
        <Ellipse cx="-26" cy="-10" rx="8" ry="5" fill={color} transform="rotate(-30 -26 -10)" />
        {/* ── Right ear ── */}
        <Ellipse cx="26" cy="-10" rx="8" ry="5" fill={color} transform="rotate(30 26 -10)" />

        {/* ── Head (main oval) ── */}
        <Ellipse cx="0" cy="0" rx="22" ry="28" fill={color} />

        {/* ── Muzzle (lighter oval) ── */}
        <Ellipse cx="0" cy="18" rx="16" ry="12" fill={accentColor} />

        {/* ── Eyes ── */}
        <Circle cx="-9" cy="-6" r="3.5" fill="white" />
        <Circle cx="9" cy="-6" r="3.5" fill="white" />
        <Circle cx="-9" cy="-5.5" r="1.5" fill="#111" />
        <Circle cx="9" cy="-5.5" r="1.5" fill="#111" />

        {/* ── Nostrils ── */}
        <Ellipse cx="-5" cy="20" rx="3" ry="2.5" fill={color} opacity={0.5} />
        <Ellipse cx="5" cy="20" rx="3" ry="2.5" fill={color} opacity={0.5} />
      </G>

      {/* ── Tracking signal (top-right) ── */}
      <Circle cx="98" cy="18" r="4" fill={accentColor} />
      <Path
        d="M104,12 A12,12 0 0,1 104,24"
        stroke={accentColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M109,6 A20,20 0 0,1 109,30"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
    </Svg>
  )
}
