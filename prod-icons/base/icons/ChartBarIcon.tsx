import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function ChartBarIcon(props: IconProps) {
  return <Icon {...props}><Path d="M4 20V10h4v10m4 0V5h4v15m4 0v-8h-4"/></Icon>
}
