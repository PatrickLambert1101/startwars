import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function BarnIcon(props: IconProps) {
  return <Icon {...props}><Path d="M3 21V10l5-6h8l5 6v11M3 10h18M8 4v6m8-6v6M8 21v-7h8v7M12 14v7"/></Icon>
}
