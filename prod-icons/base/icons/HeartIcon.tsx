import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function HeartIcon(props: IconProps) {
  return <Icon {...props}><Path d="M20.8 8.2c0 5.5-8.8 11.3-8.8 11.3S3.2 13.7 3.2 8.2a4.5 4.5 0 0 1 8-2.8l.8.9.8-.9a4.5 4.5 0 0 1 8 2.8Z"/></Icon>
}
