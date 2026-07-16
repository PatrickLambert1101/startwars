import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function PastureIcon(props: IconProps) {
  return <Icon {...props}><Path d="M3 20h18M4 17c3-3 5-3 8 0 3-2.5 5-2.5 8 0M5 20V9m14 11V9M5 12h14M9 20v-4m3 4v-6m3 6v-4"/></Icon>
}
