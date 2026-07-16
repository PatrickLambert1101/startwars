import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function RfidTagIcon(props: IconProps) {
  return <Icon {...props}><Path d="M4 13V6a2 2 0 0 1 2-2h7l7 7-7 7-7-7a2 2 0 0 1-2-2Z"/><Circle cx="8.5" cy="8.5" r="1"/><Path d="M14 8c1.7 1.7 1.7 4.3 0 6m2-8c2.8 2.8 2.8 7.2 0 10"/></Icon>
}
