import { Path, Rect } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function ClipboardCheckOutlineIcon(props: IconProps) {
  return <Icon {...props}><Rect x="5" y="4" width="14" height="17" rx="2"/><Path d="M9 4V3h6v1m-6 9 2 2 4-4"/></Icon>
}
