import { Circle, Path, Rect } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"
export function CameraOffIcon(props: IconProps) { return <Icon {...props}><Rect x="3" y="7" width="18" height="12" rx="2"/><Path d="m8 7 1.5-3h5L16 7M3 3l18 18"/><Circle cx="12" cy="13" r="3"/></Icon> }
