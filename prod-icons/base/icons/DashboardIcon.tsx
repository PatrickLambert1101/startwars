import { Rect } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function DashboardIcon(props: IconProps) {
  return <Icon {...props}><Rect x="4" y="4" width="6" height="6" rx="1"/><Rect x="14" y="4" width="6" height="6" rx="1"/><Rect x="4" y="14" width="6" height="6" rx="1"/><Rect x="14" y="14" width="6" height="6" rx="1"/></Icon>
}
