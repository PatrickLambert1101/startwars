import { Path, Rect } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function CalendarIcon(props: IconProps) {
  return <Icon {...props}><Rect x="3" y="5" width="18" height="16" rx="2"/><Path d="M7 3v4m10-4v4M3 10h18"/></Icon>
}
