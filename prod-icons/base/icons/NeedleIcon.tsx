import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function NeedleIcon(props: IconProps) {
  return <Icon {...props}><Path d="m4 20 7.5-7.5m1.5-1.5L20 4m-9 5 4 4m-7.5-1.5-2-2 3-3 2 2m3 3 2 2-3 3-2-2M4 20l-1 1"/><Path d="m15 9 2-2"/></Icon>
}
