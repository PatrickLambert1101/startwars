import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function PoultryIcon(props: IconProps) {
  return <Icon {...props}><Path d="M9 7c-1-2 0-4 1.5-4 .4 1 .7 1.7 1.5 2.2.8-.5 1.1-1.2 1.5-2.2C15 3 16 5 15 7c1.2 1.2 2 3 2 5.5 0 3.6-2.2 6-5 6s-5-2.4-5-6C7 10 7.8 8.2 9 7Z"/><Circle cx="10" cy="11" r=".65" fill="currentColor" stroke="none"/><Path d="m13 12 3 1.5-3 1.5v-3ZM10 16l2 2 2-2"/></Icon>
}
