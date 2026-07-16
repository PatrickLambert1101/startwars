import type { PropsWithChildren } from "react"
import Svg from "react-native-svg"

import type { IconProps } from "./types"

export function Icon({
  size = 24,
  color = "#13212B",
  strokeWidth = 2,
  children,
}: PropsWithChildren<IconProps>) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      color={color}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  )
}
