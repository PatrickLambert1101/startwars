import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function GrassIcon(props: IconProps) {
  return <Icon {...props}><Path d="M4 20h16M8 20c0-5-2-7-4-9m7 9c0-7 2-10 4-13m1 13c0-5 2-7 4-9"/></Icon>
}
