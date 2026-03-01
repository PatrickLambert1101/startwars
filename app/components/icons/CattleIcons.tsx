/**
 * Cattle-themed SVG icons for navigation and UI
 */
import Svg, { Path, Circle, G, Rect, Line } from "react-native-svg"

type IconProps = {
  size?: number
  color?: string
  focused?: boolean
}

/**
 * Dashboard / Home — Barn icon
 */
export function BarnIcon({ size = 24, color = "#333" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Barn roof */}
      <Path
        d="M12 2L2 9V22H22V9L12 2Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Barn roof peak */}
      <Path d="M2 9L12 2L22 9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Door */}
      <Path
        d="M9 22V15C9 13.9 9.9 13 11 13H13C14.1 13 15 13.9 15 15V22"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Hay loft window */}
      <Circle cx="12" cy="8" r="2" stroke={color} strokeWidth="1.5" />
    </Svg>
  )
}

/**
 * Herd — Cow head icon (side profile)
 */
export function CowHeadIcon({ size = 24, color = "#333" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Ear */}
      <Path
        d="M5 6L2 3L4 7"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Horn */}
      <Path
        d="M8 4L6 1"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Head shape */}
      <Path
        d="M5 7C4 8 3 10 3 12C3 14 4 16 5 17L7 19C8 20 10 21 12 21C14 21 16 20 17 19L19 17C20 16 21 14 21 12C21 10 20 8 19 7C17 5 14 4 12 4C9 4 7 5 5 7Z"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
      />
      {/* Eye */}
      <Circle cx="9" cy="10" r="1.5" fill={color} />
      {/* Nose area */}
      <Path
        d="M14 14C14 16 13 17 12 17C11 17 10 16 10 14C10 13 11 12 12 12C13 12 14 13 14 14Z"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      {/* Nostrils */}
      <Circle cx="11" cy="15" r="0.8" fill={color} />
      <Circle cx="13" cy="15" r="0.8" fill={color} />
    </Svg>
  )
}

/**
 * Chute — Cattle chute / squeeze chute icon
 */
export function ChuteIcon({ size = 24, color = "#333" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Left rail */}
      <Path d="M3 4V20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M7 4V20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Right rail */}
      <Path d="M17 4V20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M21 4V20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Cross bars */}
      <Line x1="3" y1="7" x2="7" y2="7" stroke={color} strokeWidth="1.5" />
      <Line x1="3" y1="13" x2="7" y2="13" stroke={color} strokeWidth="1.5" />
      <Line x1="17" y1="7" x2="21" y2="7" stroke={color} strokeWidth="1.5" />
      <Line x1="17" y1="13" x2="21" y2="13" stroke={color} strokeWidth="1.5" />
      {/* Cow in chute (simplified) */}
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.5" fill="none" />
      <Path d="M10 8L9 6" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M14 8L15 6" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {/* Arrow indicating flow */}
      <Path d="M10 17L12 20L14 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

/**
 * Reports — Clipboard with chart
 */
export function ReportsIcon({ size = 24, color = "#333" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Clipboard */}
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      {/* Clipboard clip */}
      <Path d="M9 1H15V4H9V1Z" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Bar chart */}
      <Rect x="7" y="14" width="2.5" height="4" rx="0.5" fill={color} />
      <Rect x="10.75" y="11" width="2.5" height="7" rx="0.5" fill={color} />
      <Rect x="14.5" y="8" width="2.5" height="10" rx="0.5" fill={color} />
      {/* Trend line */}
      <Path d="M7 12L10.75 9.5L14.5 7" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 1" />
    </Svg>
  )
}

/**
 * Settings — Gear with cow ear tag shape
 */
export function SettingsIcon({ size = 24, color = "#333" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Gear body */}
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.8" />
      {/* Gear teeth */}
      <Path
        d="M12 1.5V4M12 20V22.5M22.5 12H20M4 12H1.5M19.8 4.2L17.7 6.3M6.3 17.7L4.2 19.8M19.8 19.8L17.7 17.7M6.3 6.3L4.2 4.2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <Circle cx="12" cy="12" r="1.5" fill={color} />
    </Svg>
  )
}

/**
 * Cattle silhouette — used as decorative illustration
 */
export function CattleSilhouette({ size = 200, color = "#2D5A27" }: IconProps) {
  return (
    <Svg width={size} height={size * 0.55} viewBox="0 0 200 110" fill="none">
      {/* Cow body silhouette */}
      <Path
        d="M30 70 Q20 65 18 55 Q16 45 22 40 L18 28 Q16 24 20 24 L26 30 Q30 25 35 22 Q40 20 50 20 Q60 20 70 22 Q80 25 85 30 L90 28 Q95 25 100 28 L105 32 Q110 30 120 30 Q140 30 155 35 Q165 38 170 45 Q175 52 175 60 Q175 65 172 70 L175 90 Q176 95 172 95 L168 90 Q168 80 168 75 Q160 78 155 80 L155 95 Q156 100 152 100 L148 95 Q148 85 148 78 Q130 82 110 82 Q100 82 90 80 L90 95 Q91 100 87 100 L83 95 Q83 85 83 78 Q70 82 55 80 L55 95 Q56 100 52 100 L48 95 Q48 85 48 78 Q40 75 35 72 L35 88 Q36 93 32 93 L28 88 Q28 80 30 70Z"
        fill={color}
        opacity={0.15}
      />
      {/* Horns */}
      <Path
        d="M32 22 Q28 14 30 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.15}
      />
      <Path
        d="M45 20 Q42 12 44 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.15}
      />
      {/* Tail */}
      <Path
        d="M175 60 Q180 55 182 48 Q183 44 180 42"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.15}
      />
    </Svg>
  )
}

/**
 * RFID Tag icon
 */
export function RfidTagIcon({ size = 24, color = "#333" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Tag shape */}
      <Path
        d="M4 8C4 6.9 4.9 6 6 6H18C19.1 6 20 6.9 20 8V16C20 17.1 19.1 18 18 18H6C4.9 18 4 17.1 4 16V8Z"
        stroke={color}
        strokeWidth="1.8"
      />
      {/* Ear tag hole */}
      <Circle cx="7" cy="12" r="2" stroke={color} strokeWidth="1.5" />
      {/* Signal waves */}
      <Path d="M14 9.5C15.2 10.2 16 11 16 12C16 13 15.2 13.8 14 14.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M16.5 8C18.2 9.2 19.5 10.5 19.5 12C19.5 13.5 18.2 14.8 16.5 16" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  )
}

/**
 * Pasture/field landscape icon
 */
export function PastureIcon({ size = 80, color = "#4A8C3F" }: IconProps) {
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 80 48" fill="none">
      {/* Hills */}
      <Path d="M0 35 Q20 20 40 30 Q60 20 80 35 V48 H0Z" fill={color} opacity={0.1} />
      <Path d="M0 40 Q30 28 50 36 Q65 28 80 38 V48 H0Z" fill={color} opacity={0.15} />
      {/* Fence posts */}
      <Line x1="10" y1="32" x2="10" y2="42" stroke={color} strokeWidth="1.5" opacity={0.3} />
      <Line x1="25" y1="30" x2="25" y2="40" stroke={color} strokeWidth="1.5" opacity={0.3} />
      <Line x1="40" y1="31" x2="40" y2="41" stroke={color} strokeWidth="1.5" opacity={0.3} />
      <Line x1="55" y1="29" x2="55" y2="39" stroke={color} strokeWidth="1.5" opacity={0.3} />
      <Line x1="70" y1="31" x2="70" y2="41" stroke={color} strokeWidth="1.5" opacity={0.3} />
      {/* Fence wire */}
      <Path d="M10 35 L25 33 L40 34 L55 32 L70 34" stroke={color} strokeWidth="0.8" opacity={0.25} />
      <Path d="M10 38 L25 36 L40 37 L55 35 L70 37" stroke={color} strokeWidth="0.8" opacity={0.25} />
    </Svg>
  )
}
