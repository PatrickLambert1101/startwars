import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function BirdIcon(props: IconProps) {
  return <Icon {...props}><Path d="M4 16c1-5 4-8 8-8 4.2 0 6.5 3.2 7 7l2 1-3 1c-1 2.5-4 4-7 4-3.2 0-5.8-1.8-7-5Z"/><Path d="m11 8 1-3 2 3m-5 8 2 2 2-2"/><Circle cx="15" cy="12" r=".6" fill="currentColor" stroke="none"/></Icon>
}
