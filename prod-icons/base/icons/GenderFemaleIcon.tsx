import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function GenderFemaleIcon(props: IconProps) {
  return <Icon {...props}><Circle cx="12" cy="9" r="5"/><Path d="M12 14v7m-3-3h6"/></Icon>
}
