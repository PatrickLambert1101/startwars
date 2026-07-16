import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function SuccessIcon(props: IconProps) {
  return <Icon {...props}><Path d="m12 2 .8 4.2L16 4l-1.2 4.1L19 9l-4.1 1.2L16 14l-3.2-2.1L12 16l-.8-4.1L8 14l1.2-3.8L5 9l4.1-1.2L8 4l3.2 2.2L12 2Zm-3 15 2 2 4-4"/></Icon>
}
