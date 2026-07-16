import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function GoatIcon(props: IconProps) {
  return <Icon {...props}><Path d="M8 7C5 5 5 2 7 2c2 1 2.5 2.5 2.5 4M16 7c3-2 3-5 1-5-2 1-2.5 2.5-2.5 4M7 7c1.2-1.4 2.8-2 5-2s3.8.6 5 2v7c0 2.8-2.2 5-5 5s-5-2.2-5-5V7Z"/><Circle cx="9.5" cy="11" r=".65" fill="currentColor" stroke="none"/><Circle cx="14.5" cy="11" r=".65" fill="currentColor" stroke="none"/><Path d="M10 14h4m-3 3 1 2 1-2"/></Icon>
}
