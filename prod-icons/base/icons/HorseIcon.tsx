import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function HorseIcon(props: IconProps) {
  return <Icon {...props}><Path d="m8 7-1-3 3 1m6 2 1-3-3 1M9 6c1-1.2 1.9-1.8 3-1.8S14 4.8 15 6l1 7c.4 3.3-1.4 6-4 6s-4.4-2.7-4-6l1-7Z"/><Path d="M12 5.5v4"/><Circle cx="10" cy="11" r=".7" fill="currentColor" stroke="none"/><Circle cx="14" cy="11" r=".7" fill="currentColor" stroke="none"/><Path d="M10 15h4m-3 2h2"/></Icon>
}
