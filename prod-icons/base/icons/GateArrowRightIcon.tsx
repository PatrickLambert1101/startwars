import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function GateArrowRightIcon(props: IconProps) {
  return <Icon {...props}><Path d="M4 20V4m4 16V4m8 16V4m4 16V4M4 8h4m-4 4h4m-4 4h4m8-8h4m-4 4h4m-4 4h4M9 12h7m-3-3 3 3-3 3"/></Icon>
}
