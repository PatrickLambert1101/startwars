import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"
export function VsBadgeIcon(props: IconProps) { return <Icon {...props}><Circle cx="12" cy="12" r="9"/><Path d="m7 9 2 6 2-6m3 6 3-6m-3 0h3"/></Icon> }
