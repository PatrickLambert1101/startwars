import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function RulerSquareIcon(props: IconProps) {
  return <Icon {...props}><Path d="M4 4v16h16L4 4Zm4 8h2m1 3h2m1 2h2"/></Icon>
}
