import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function ElephantIcon(props: IconProps) {
  return <Icon {...props}><Path d="M4 17V9c0-3 2.5-5 6-5h3c4 0 7 2.7 7 6v4c0 3-2 5-4 5v-5h-2v6h-3v-6H8v5H6v-2H4Z"/><Path d="M13 8c2.5 0 4 1.5 4 3.5S15.5 15 13 15"/><Circle cx="15" cy="8" r=".6" fill="currentColor" stroke="none"/></Icon>
}
