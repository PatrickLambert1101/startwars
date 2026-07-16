import { Circle, Path, Rect } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"
export function LockBadgeIcon(props: IconProps) { return <Icon {...props}><Circle cx="12" cy="12" r="9"/><Rect x="8" y="11" width="8" height="6" rx="1"/><Path d="M10 11V9a2 2 0 0 1 4 0v2"/></Icon> }
