import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function ReportsIcon(props: IconProps) {
  return <Icon {...props}><Path d="M6 3h9l3 3v15H6V3Zm9 0v4h4M9 17v-3m3 3v-6m3 6v-9"/></Icon>
}
