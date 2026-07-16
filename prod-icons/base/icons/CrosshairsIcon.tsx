import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function CrosshairsIcon(props: IconProps) {
  return <Icon {...props}><Circle cx="12" cy="12" r="6"/><Path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></Icon>
}
