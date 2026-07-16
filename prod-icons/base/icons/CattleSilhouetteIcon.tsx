import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"
export function CattleSilhouetteIcon(props: IconProps) { return <Icon {...props}><Path d="M3 16v-5c0-2 2-4 5-4h6c2.2 0 4 1 5 3h2v4h-2v4h-2v3h-2v-3H9v3H7v-3H5v2H3Zm16-6V7l2-2 1 1-1 2v2"/><Circle cx="18" cy="11" r=".5" fill="currentColor" stroke="none"/></Icon> }
