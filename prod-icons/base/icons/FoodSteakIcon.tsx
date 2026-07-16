import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function FoodSteakIcon(props: IconProps) {
  return <Icon {...props}><Path d="M7 5c4-3 10-1 12 3 2.3 4 .2 9.3-4.5 11.2-4 1.6-9.3-.3-10.4-4.7C3 10.7 4.2 7 7 5Z"/><Circle cx="12" cy="12" r="2"/><Path d="M5 17 3 20m2-3 2 2"/></Icon>
}
