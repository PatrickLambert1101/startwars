import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"
export function CloseCircleIcon(props: IconProps) { return <Icon {...props}><Circle cx="12" cy="12" r="9"/><Path d="m9 9 6 6m0-6-6 6"/></Icon> }
