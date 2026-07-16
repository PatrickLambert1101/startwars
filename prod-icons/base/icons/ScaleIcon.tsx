import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function ScaleIcon(props: IconProps) {
  return <Icon {...props}><Path d="M12 4v15m-5 2h10M5 8h14M6 8l-3 6h6L6 8Zm12 0-3 6h6l-3-6Z"/></Icon>
}
