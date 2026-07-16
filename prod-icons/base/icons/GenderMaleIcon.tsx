import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function GenderMaleIcon(props: IconProps) {
  return <Icon {...props}><Circle cx="9" cy="15" r="5"/><Path d="m12.5 11.5 6-6m-4 0h4v4"/></Icon>
}
