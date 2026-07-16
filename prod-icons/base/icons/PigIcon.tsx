import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function PigIcon(props: IconProps) {
  return <Icon {...props}><Path d="m8 7-3-2v5l2 1m9-4 3-2v5l-2 1M7 8c1.2-2 2.8-3 5-3s3.8 1 5 3v6c0 3-2.2 5-5 5s-5-2-5-5V8Z"/><Path d="M8.5 14c0-1.5 1.6-2.5 3.5-2.5s3.5 1 3.5 2.5S13.9 16.5 12 16.5 8.5 15.5 8.5 14Z"/><Circle cx="10.5" cy="14" r=".65" fill="currentColor" stroke="none"/><Circle cx="13.5" cy="14" r=".65" fill="currentColor" stroke="none"/></Icon>
}
