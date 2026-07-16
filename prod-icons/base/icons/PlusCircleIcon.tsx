import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"
export function PlusCircleIcon(props: IconProps) { return <Icon {...props}><Circle cx="12" cy="12" r="9"/><Path d="M12 8v8m-4-4h8"/></Icon> }
