import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function DnaIcon(props: IconProps) {
  return <Icon {...props}><Path d="M7 3c8 4 2 14 10 18M17 3C9 7 15 17 7 21M8.5 6h7m-9 6h11m-9 6h7"/></Icon>
}
