import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function TagPlusOutlineIcon(props: IconProps) {
  return <Icon {...props}><Path d="M4 13V6a2 2 0 0 1 2-2h7l5 5M4 13l7 7 3.5-3.5"/><Circle cx="8.5" cy="8.5" r="1"/><Path d="M18 14v6m-3-3h6"/></Icon>
}
