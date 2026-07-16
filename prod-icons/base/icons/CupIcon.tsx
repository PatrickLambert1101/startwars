import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function CupIcon(props: IconProps) {
  return <Icon {...props}><Path d="M5 6h11v10a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V6Zm11 2h2a2 2 0 0 1 0 4h-2M3 3h15"/></Icon>
}
