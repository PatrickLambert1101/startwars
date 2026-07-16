import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function MedicationIcon(props: IconProps) {
  return <Icon {...props}><Path d="m8.2 5.2 10.6 10.6a4 4 0 0 1-5.6 5.6L2.6 10.8a4 4 0 0 1 5.6-5.6Z"/><Path d="m6 8 10 10"/></Icon>
}
