import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function SortAscIcon(props: IconProps) {
  return <Icon {...props}><Path d="M6 18V6m-3 3 3-3 3 3M12 8h8m-8 4h6m-6 4h3"/></Icon>
}
