import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function SettingsIcon(props: IconProps) {
  return <Icon {...props}><Path d="m12 3 .8 2.2 2.3.5 1.7-1.5 1.8 1.8-1.5 1.7.5 2.3 2.2.8v2.5l-2.2.8-.5 2.3 1.5 1.7-1.8 1.8-1.7-1.5-2.3.5L12 21l-.8-2.2-2.3-.5-1.7 1.5-1.8-1.8 1.5-1.7-.5-2.3-2.2-.8V10l2.2-.8.5-2.3-1.5-1.7 1.8-1.8 1.7 1.5 2.3-.5L12 3Z"/><Circle cx="12" cy="12" r="3"/></Icon>
}
