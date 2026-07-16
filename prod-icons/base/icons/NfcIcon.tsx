import { Path, Rect } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function NfcIcon(props: IconProps) {
  return <Icon {...props}><Rect x="3" y="3" width="18" height="18" rx="4"/><Path d="M9 8c2.2 2.2 2.2 5.8 0 8m3-10c3.3 3.3 3.3 8.7 0 12m3-8c1.1 1.1 1.1 2.9 0 4"/></Icon>
}
