import { Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function ChuteIcon(props: IconProps) {
  return <Icon {...props}><Path d="M4 20 8 4m8 16L12 4M6 12h12M5 16h14M8 4h8M4 20h16M9 8h6"/></Icon>
}
