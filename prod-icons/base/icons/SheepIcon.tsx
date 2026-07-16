import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function SheepIcon(props: IconProps) {
  return <Icon {...props}><Path d="M7 10a3 3 0 0 1 1-5 3.5 3.5 0 0 1 6.5 0 3 3 0 0 1 2.5 5v4c0 3-2.2 5-5 5s-5-2-5-5v-4Z"/><Path d="m7 11-3-1v3l3 1m10-3 3-1v3l-3 1"/><Circle cx="9.5" cy="13" r=".65" fill="currentColor" stroke="none"/><Circle cx="14.5" cy="13" r=".65" fill="currentColor" stroke="none"/><Path d="M10 16h4"/></Icon>
}
