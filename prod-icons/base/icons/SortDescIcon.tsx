import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function SortDescIcon(props: IconProps) {
  return <Icon {...props}><Path d="M6 6v12m-3-3 3 3 3-3M12 8h3m-3 4h6m-6 4h8"/></Icon>
}
