import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function BarcodeScanIcon(props: IconProps) {
  return <Icon {...props}><Path d="M4 8V5a1 1 0 0 1 1-1h3m8 0h3a1 1 0 0 1 1 1v3m0 8v3a1 1 0 0 1-1 1h-3m-8 0H5a1 1 0 0 1-1-1v-3M7 8v8m3-8v8m2-8v8m2-8v8m3-8v8"/></Icon>
}
