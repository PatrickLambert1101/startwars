import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"
export function MapMarkerIcon(props: IconProps) { return <Icon {...props}><Path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><Circle cx="12" cy="10" r="2.5"/></Icon> }
