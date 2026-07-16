import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"
export function ClockOutlineIcon(props: IconProps) { return <Icon {...props}><Circle cx="12" cy="12" r="9"/><Path d="M12 7v5l3 2"/></Icon> }
