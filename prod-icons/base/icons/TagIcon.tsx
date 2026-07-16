import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function TagIcon(props: IconProps) {
  return <Icon {...props}><Path d="M4 13V6a2 2 0 0 1 2-2h7l7 7-7 7-7-7a2 2 0 0 1-2-2Z"/><Circle cx="8.5" cy="8.5" r="1"/></Icon>
}
