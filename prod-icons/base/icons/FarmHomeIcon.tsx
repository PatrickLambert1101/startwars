import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function FarmHomeIcon(props: IconProps) {
  return <Icon {...props}><Path d="m3 11 9-7 9 7v10H3V11Zm5 10v-6h8v6M9 8h6"/></Icon>
}
