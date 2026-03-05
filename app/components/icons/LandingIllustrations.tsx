/**
 * Landing page illustration components — clean, modern SVG artwork
 */
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop, Line, Ellipse } from "react-native-svg"

type IllustrationProps = {
  width?: number
  height?: number
  primaryColor?: string
  accentColor?: string
}

/**
 * Phone mockup showing the app — used in hero section
 */
export function PhoneMockup({
  width = 180,
  height = 340,
  primaryColor = "#4A8C3F",
  accentColor = "#F5AD1C",
}: IllustrationProps) {
  const scale = width / 180
  return (
    <Svg width={width} height={height} viewBox="0 0 180 340">
      <Defs>
        <LinearGradient id="phoneGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1E1A16" />
          <Stop offset="1" stopColor="#3D3832" />
        </LinearGradient>
        <LinearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F5F3F0" />
          <Stop offset="1" stopColor="#E2EDDF" />
        </LinearGradient>
      </Defs>
      {/* Phone body */}
      <Rect x="10" y="10" width="160" height="320" rx="24" fill="url(#phoneGrad)" />
      {/* Screen */}
      <Rect x="18" y="36" width="144" height="274" rx="4" fill="url(#screenGrad)" />
      {/* Status bar notch */}
      <Rect x="60" y="14" width="60" height="16" rx="8" fill="#000" opacity={0.3} />
      {/* App content - mini dashboard */}
      <G>
        {/* Top bar */}
        <Rect x="26" y="44" width="128" height="24" rx="4" fill={primaryColor} />
        <Circle cx="38" cy="56" r="6" fill="white" opacity={0.3} />
        {/* Stat cards row */}
        <Rect x="26" y="76" width="38" height="32" rx="6" fill="white" />
        <Rect x="70" y="76" width="38" height="32" rx="6" fill="white" />
        <Rect x="114" y="76" width="38" height="32" rx="6" fill="white" />
        {/* Stat values */}
        <Rect x="32" y="84" width="20" height="6" rx="2" fill={primaryColor} opacity={0.7} />
        <Rect x="32" y="94" width="26" height="4" rx="1" fill="#B5AFA6" />
        <Rect x="76" y="84" width="20" height="6" rx="2" fill={accentColor} opacity={0.7} />
        <Rect x="76" y="94" width="26" height="4" rx="1" fill="#B5AFA6" />
        <Rect x="120" y="84" width="20" height="6" rx="2" fill={primaryColor} opacity={0.5} />
        <Rect x="120" y="94" width="26" height="4" rx="1" fill="#B5AFA6" />
        {/* Chart area */}
        <Rect x="26" y="118" width="128" height="80" rx="8" fill="white" />
        <Path
          d="M36 180 L56 165 L76 170 L96 150 L116 145 L136 138"
          stroke={primaryColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M36 180 L56 165 L76 170 L96 150 L116 145 L136 138 L136 188 L36 188Z"
          fill={primaryColor}
          opacity={0.08}
        />
        {/* List items */}
        <Rect x="26" y="208" width="128" height="28" rx="6" fill="white" />
        <Circle cx="40" cy="222" r="8" fill={primaryColor} opacity={0.15} />
        <Rect x="54" y="217" width="50" height="4" rx="1.5" fill="#3D3832" />
        <Rect x="54" y="225" width="70" height="3" rx="1" fill="#B5AFA6" />

        <Rect x="26" y="242" width="128" height="28" rx="6" fill="white" />
        <Circle cx="40" cy="256" r="8" fill={accentColor} opacity={0.15} />
        <Rect x="54" y="251" width="40" height="4" rx="1.5" fill="#3D3832" />
        <Rect x="54" y="259" width="60" height="3" rx="1" fill="#B5AFA6" />

        <Rect x="26" y="276" width="128" height="28" rx="6" fill="white" />
        <Circle cx="40" cy="290" r="8" fill={primaryColor} opacity={0.15} />
        <Rect x="54" y="285" width="55" height="4" rx="1.5" fill="#3D3832" />
        <Rect x="54" y="293" width="48" height="3" rx="1" fill="#B5AFA6" />
      </G>
      {/* Home indicator */}
      <Rect x="65" y="316" width="50" height="4" rx="2" fill="white" opacity={0.3} />
    </Svg>
  )
}

/**
 * Handheld RFID scanner device illustration
 */
export function ScannerDevice({
  width = 160,
  height = 200,
  primaryColor = "#4A8C3F",
  accentColor = "#F5AD1C",
}: IllustrationProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 200">
      <Defs>
        <LinearGradient id="scannerGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3D3832" />
          <Stop offset="1" stopColor="#1E1A16" />
        </LinearGradient>
      </Defs>
      {/* Scanner body */}
      <Rect x="30" y="50" width="100" height="140" rx="12" fill="url(#scannerGrad)" />
      {/* Antenna section */}
      <Rect x="50" y="10" width="60" height="50" rx="8" fill="#5C564F" />
      <Rect x="55" y="15" width="50" height="40" rx="6" fill="#3D3832" />
      {/* Signal waves */}
      <Path d="M80 5 Q65 -5 65 15" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" fill="none" opacity={0.6} />
      <Path d="M80 5 Q58 -10 55 20" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity={0.35} />
      <Path d="M80 5 Q95 -5 95 15" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" fill="none" opacity={0.6} />
      <Path d="M80 5 Q102 -10 105 20" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity={0.35} />
      {/* Small screen */}
      <Rect x="42" y="62" width="76" height="44" rx="4" fill="#0D2818" />
      <Rect x="46" y="66" width="68" height="36" rx="2" fill="#1B4332" />
      {/* Screen content */}
      <Rect x="52" y="72" width="36" height="4" rx="1" fill={primaryColor} opacity={0.8} />
      <Rect x="52" y="80" width="50" height="3" rx="1" fill={primaryColor} opacity={0.4} />
      <Rect x="52" y="87" width="28" height="3" rx="1" fill={accentColor} opacity={0.6} />
      <Circle cx="100" cy="80" r="8" stroke={primaryColor} strokeWidth="1.5" fill="none" opacity={0.5} />
      <Path d="M97 80 L99 82 L103 78" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      {/* Keypad area */}
      <Rect x="42" y="116" width="76" height="4" rx="2" fill="#5C564F" opacity={0.5} />
      {/* Buttons */}
      <Circle cx="55" cy="134" r="6" fill="#5C564F" />
      <Circle cx="80" cy="134" r="8" fill={primaryColor} />
      <Circle cx="105" cy="134" r="6" fill="#5C564F" />
      <Rect x="46" y="152" width="28" height="8" rx="3" fill="#5C564F" />
      <Rect x="86" y="152" width="28" height="8" rx="3" fill="#5C564F" />
      {/* Trigger */}
      <Rect x="44" y="170" width="72" height="12" rx="4" fill={accentColor} opacity={0.9} />
      <Rect x="56" y="173" width="48" height="6" rx="2" fill={accentColor} />
    </Svg>
  )
}

/**
 * Offline sync / cloud icon with signal
 */
export function OfflineSyncIcon({
  width = 64,
  height = 64,
  primaryColor = "#4A8C3F",
}: IllustrationProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64">
      {/* Cloud shape */}
      <Path
        d="M48 36C52.4 36 56 32.4 56 28C56 23.6 52.4 20 48 20C47.6 20 47.2 20 46.8 20.1C45 14.5 39.6 10.5 33.5 10.5C25.8 10.5 19.5 16.5 19 24C14 24.5 10 28.6 10 33.5C10 38.7 14.3 43 19.5 43H48C52.4 43 52.4 36 48 36Z"
        fill={primaryColor}
        opacity={0.12}
        stroke={primaryColor}
        strokeWidth="1.5"
      />
      {/* Sync arrows */}
      <Path d="M26 48L32 54L38 48" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="32" y1="38" x2="32" y2="54" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      {/* Offline dot */}
      <Circle cx="48" cy="16" r="4" fill={primaryColor} />
      <Path d="M42 16L48 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  )
}

/**
 * Shield / security trust badge
 */
export function TrustShieldIcon({
  width = 64,
  height = 64,
  primaryColor = "#4A8C3F",
}: IllustrationProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64">
      <Path
        d="M32 6L8 18V30C8 44.4 18.4 57.7 32 62C45.6 57.7 56 44.4 56 30V18L32 6Z"
        fill={primaryColor}
        opacity={0.1}
        stroke={primaryColor}
        strokeWidth="1.5"
      />
      <Path
        d="M24 32L30 38L42 26"
        stroke={primaryColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

/**
 * Scenic ranch landscape hero background
 */
export function RanchLandscape({
  width = 400,
  height = 200,
  primaryColor = "#4A8C3F",
  accentColor = "#F5AD1C",
}: IllustrationProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 400 200">
      {/* Sky gradient via layered rects */}
      <Rect x="0" y="0" width="400" height="200" fill="#E2EDDF" opacity={0.3} />

      {/* Sun */}
      <Circle cx="320" cy="40" r="24" fill={accentColor} opacity={0.2} />
      <Circle cx="320" cy="40" r="16" fill={accentColor} opacity={0.15} />

      {/* Far hills */}
      <Path d="M0 130 Q50 100 100 115 Q150 95 200 110 Q250 90 300 105 Q350 95 400 115 V200 H0Z" fill={primaryColor} opacity={0.06} />
      {/* Mid hills */}
      <Path d="M0 150 Q80 120 140 140 Q200 115 260 135 Q320 120 400 145 V200 H0Z" fill={primaryColor} opacity={0.1} />
      {/* Near ground */}
      <Path d="M0 170 Q100 155 200 165 Q300 155 400 170 V200 H0Z" fill={primaryColor} opacity={0.15} />

      {/* Fence */}
      {[50, 100, 150, 200, 250, 300, 350].map((x, i) => (
        <G key={i}>
          <Line x1={x} y1={155 + Math.sin(x * 0.02) * 5} x2={x} y2={175 + Math.sin(x * 0.02) * 5} stroke={primaryColor} strokeWidth="1.5" opacity={0.2} />
        </G>
      ))}
      <Path d="M50 162 Q100 158 150 161 Q200 157 250 160 Q300 157 350 161" stroke={primaryColor} strokeWidth="0.8" opacity={0.15} fill="none" />
      <Path d="M50 168 Q100 164 150 167 Q200 163 250 166 Q300 163 350 167" stroke={primaryColor} strokeWidth="0.8" opacity={0.12} fill="none" />

      {/* Simplified cow silhouettes (far) */}
      <G opacity={0.08}>
        <Ellipse cx="130" cy="148" rx="12" ry="7" fill={primaryColor} />
        <Circle cx="122" cy="143" r="4" fill={primaryColor} />
        <Ellipse cx="280" cy="142" rx="10" ry="6" fill={primaryColor} />
        <Circle cx="273" cy="138" r="3.5" fill={primaryColor} />
      </G>
    </Svg>
  )
}

/**
 * Comparison arrow / "VS" divider
 */
export function VsBadge({
  width = 48,
  height = 48,
  primaryColor = "#4A8C3F",
}: IllustrationProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 48 48">
      <Circle cx="24" cy="24" r="20" fill={primaryColor} opacity={0.1} />
      <Circle cx="24" cy="24" r="16" fill={primaryColor} opacity={0.08} />
      {/* Plus sign to indicate "and" */}
      <Line x1="16" y1="24" x2="32" y2="24" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="24" y1="16" x2="24" y2="32" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  )
}

/**
 * Checkmark badge for feature lists
 */
export function CheckBadge({
  size = 24,
  color = "#4A8C3F",
  variant = "filled",
}: {
  size?: number
  color?: string
  variant?: "filled" | "outline"
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" fill={variant === "filled" ? color : "none"} stroke={color} strokeWidth={variant === "outline" ? 1.5 : 0} opacity={variant === "filled" ? 1 : 0.3} />
      <Path
        d="M7 12L10.5 15.5L17 9"
        stroke={variant === "filled" ? "white" : color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

/**
 * Lock icon for gated features
 */
export function LockBadge({
  size = 20,
  color = "#F5AD1C",
}: {
  size?: number
  color?: string
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Rect x="3" y="9" width="14" height="9" rx="2" fill={color} opacity={0.15} stroke={color} strokeWidth="1.2" />
      <Path d="M6 9V6C6 3.8 7.8 2 10 2C12.2 2 14 3.8 14 6V9" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <Circle cx="10" cy="13.5" r="1.5" fill={color} />
    </Svg>
  )
}
