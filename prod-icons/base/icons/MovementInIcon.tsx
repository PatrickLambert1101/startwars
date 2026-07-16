import { Path, Rect } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function MovementInIcon(props: IconProps) {
  return <Icon {...props}><Rect x="4" y="13" width="16" height="7" rx="1"/><Path d="M12 4v10m-4-4 4 4 4-4"/></Icon>
}
