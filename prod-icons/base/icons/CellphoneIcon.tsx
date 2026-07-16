import { Circle, Rect } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"
export function CellphoneIcon(props: IconProps) { return <Icon {...props}><Rect x="7" y="2" width="10" height="20" rx="2"/><Circle cx="12" cy="18.5" r=".5" fill="currentColor" stroke="none"/></Icon> }
