import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function BuffaloIcon(props: IconProps) {
  return <Icon {...props}><Path d="M8 7C5.5 3.5 2.5 4.5 3 8c.3 2 1.5 3 3.5 3M16 7c2.5-3.5 5.5-2.5 5 1-.3 2-1.5 3-3.5 3M7 8c1.4-2.6 3-3.5 5-3.5S15.6 5.4 17 8v6c0 3-2.2 5-5 5s-5-2-5-5V8Z"/><Circle cx="9" cy="11" r=".7" fill="currentColor" stroke="none"/><Circle cx="15" cy="11" r=".7" fill="currentColor" stroke="none"/><Path d="M9 15h6M10 17h4"/></Icon>
}
