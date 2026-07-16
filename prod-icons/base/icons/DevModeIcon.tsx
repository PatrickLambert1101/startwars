import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function DevModeIcon(props: IconProps) {
  return <Icon {...props}><Path d="M3 7h18v10H3V7Zm3 0 5 10m3-10 5 10M3 20h18"/></Icon>
}
