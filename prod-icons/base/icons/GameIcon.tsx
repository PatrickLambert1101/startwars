import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function GameIcon(props: IconProps) {
  return <Icon {...props}><Path d="M9 7 6 2m1 3-2-1m3 3-2 1M15 7l3-5m-1 3 2-1m-3 3 2 1M8 7c1.1-1.2 2.4-1.8 4-1.8S14.9 5.8 16 7v7c0 2.8-1.8 5-4 5s-4-2.2-4-5V7Z"/><Circle cx="10" cy="11" r=".65" fill="currentColor" stroke="none"/><Circle cx="14" cy="11" r=".65" fill="currentColor" stroke="none"/><Path d="M10 15h4"/></Icon>
}
