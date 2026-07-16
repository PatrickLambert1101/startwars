import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"
export function MagnifyIcon(props: IconProps) { return <Icon {...props}><Circle cx="10.5" cy="10.5" r="5.5"/><Path d="m15 15 5 5"/></Icon> }
