import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function SheepSideIcon(props: IconProps) {
  return <Icon {...props}><Path d="M3 16v-4a4 4 0 0 1 4-4 4 4 0 0 1 6-1 4 4 0 0 1 5 4c2 0 3 1.5 3 3s-1 3-3 3h-2v3h-3v-3H8v3H5v-3H3Z"/><Path d="M18 11v4"/><Circle cx="18" cy="13" r=".6" fill="currentColor" stroke="none"/></Icon>
}
