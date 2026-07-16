import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function RadioTowerIcon(props: IconProps) {
  return <Icon {...props}><Path d="m8 21 4-14 4 14M6 21h12M5 11a10 10 0 0 1 0-6m14 6a10 10 0 0 0 0-6M8 9a6 6 0 0 1 0-3m8 3a6 6 0 0 0 0-3"/><Circle cx="12" cy="5" r="1"/></Icon>
}
