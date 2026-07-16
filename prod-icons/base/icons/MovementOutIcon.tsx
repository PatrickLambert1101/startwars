import { Path, Rect } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function MovementOutIcon(props: IconProps) {
  return <Icon {...props}><Rect x="4" y="4" width="16" height="7" rx="1"/><Path d="M12 20V10m-4 4 4-4 4 4"/></Icon>
}
