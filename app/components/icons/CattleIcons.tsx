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
 * Herd — Simplified cow/cattle icon
 */
export function CowHeadIcon({ size = 24, color = "#333" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Body */}
      <Path
        d="M4 10C4 8 5 6 7 5C8 3 10 2 12 2C14 2 16 3 17 5C19 6 20 8 20 10V14C20 16 19 18 17 19C16 20 14 21 12 21C10 21 8 20 7 19C5 18 4 16 4 14V10Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Left horn */}
      <Path
        d="M8 5L6 2"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Right horn */}
      <Path
        d="M16 5L18 2"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Eyes */}
      <Circle cx="9" cy="10" r="1.2" fill={color} />
      <Circle cx="15" cy="10" r="1.2" fill={color} />
      {/* Nose */}
      <Path
        d="M10 15H14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Nostrils */}
      <Circle cx="10.5" cy="16" r="0.7" fill={color} />
      <Circle cx="13.5" cy="16" r="0.7" fill={color} />
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
 * RFID Tag icon - Modern RFID card/reader design
 */
export function RfidTagIcon({ size = 24, color = "#333" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Card body */}
      <Rect
        x="2"
        y="6"
        width="20"
        height="12"
        rx="2"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* RFID chip */}
      <Rect
        x="5"
        y="9"
        width="5"
        height="6"
        rx="0.5"
        fill={color}
        opacity="0.3"
      />
      {/* Chip contact lines */}
      <Line x1="6" y1="10.5" x2="9" y2="10.5" stroke={color} strokeWidth="0.8" />
      <Line x1="6" y1="12" x2="9" y2="12" stroke={color} strokeWidth="0.8" />
      <Line x1="6" y1="13.5" x2="9" y2="13.5" stroke={color} strokeWidth="0.8" />
      {/* Radio waves */}
      <Path
        d="M13 10C14 10.5 14.5 11 14.5 12C14.5 13 14 13.5 13 14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M15 8.5C16.5 9.5 17.5 10.5 17.5 12C17.5 13.5 16.5 14.5 15 15.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M17 7C19 8.5 20 10 20 12C20 14 19 15.5 17 17"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  )
}

/**
 * Pasture/field landscape icon - simplified for navigation
 */
export function PastureIcon({ size = 24, color = "#333" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Ground/hills */}
      <Path
        d="M2 18L6 14L10 16L14 12L18 14L22 10V22H2V18Z"
        fill={color}
        opacity={0.15}
      />
      <Path
        d="M2 18L6 14L10 16L14 12L18 14L22 10"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Fence posts */}
      <Line x1="5" y1="14" x2="5" y2="20" stroke={color} strokeWidth="1.5" />
      <Line x1="12" y1="12" x2="12" y2="20" stroke={color} strokeWidth="1.5" />
      <Line x1="19" y1="10" x2="19" y2="20" stroke={color} strokeWidth="1.5" />
      {/* Fence wire */}
      <Path d="M5 16L12 14L19 12" stroke={color} strokeWidth="1" />
      {/* Sun/sky element */}
      <Circle cx="19" cy="5" r="2" stroke={color} strokeWidth="1.3" fill="none" />
    </Svg>
  )
}
