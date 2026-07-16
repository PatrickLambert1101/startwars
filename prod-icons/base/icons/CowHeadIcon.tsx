import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function CowHeadIcon(props: IconProps) {
  return <Icon {...props}><Path d="M7 6 3.5 4.5v5L6 11m11-5 3.5-1.5v5L18 11M7 6c1.2-1.3 2.9-2 5-2s3.8.7 5 2v8c0 3-2.2 5-5 5s-5-2-5-5V6Z"/><Circle cx="9" cy="11" r=".75" fill="currentColor" stroke="none"/><Circle cx="15" cy="11" r=".75" fill="currentColor" stroke="none"/><Path d="M9 15c.9.7 1.8 1 3 1s2.1-.3 3-1M10 14h4"/></Icon>
}
