import { Path, Rect } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"
export function CalendarCheckIcon(props: IconProps) { return <Icon {...props}><Rect x="3" y="5" width="18" height="16" rx="2"/><Path d="M7 3v4m10-4v4M3 10h18m-9 6 2 2 4-4"/></Icon> }
