import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function PigSideIcon(props: IconProps) {
  return <Icon {...props}><Path d="M4 17V11c0-3 3-5 7-5h4l2-2 1 3c2 1 3 2.7 3 5v3h-2v4h-3v-3H9v3H6v-3H4Z"/><Circle cx="18" cy="10" r=".6" fill="currentColor" stroke="none"/><Path d="M4 11c-2-1-2-4 0-4"/></Icon>
}
