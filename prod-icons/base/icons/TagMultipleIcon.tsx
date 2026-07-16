import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function TagMultipleIcon(props: IconProps) {
  return <Icon {...props}><Path d="m11 4 8 8-6 6-8-8V5a1 1 0 0 1 1-1h5Z"/><Path d="m15 4 4 4v5"/><Circle cx="8.5" cy="7.5" r="1"/></Icon>
}
