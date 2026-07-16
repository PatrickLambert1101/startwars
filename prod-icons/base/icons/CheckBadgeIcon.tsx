import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"
export function CheckBadgeIcon(props: IconProps) { return <Icon {...props}><Circle cx="12" cy="12" r="8"/><Path d="m8 12 2.5 2.5L16 9"/></Icon> }
