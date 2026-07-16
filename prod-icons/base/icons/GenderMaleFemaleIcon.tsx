import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"
export function GenderMaleFemaleIcon(props: IconProps) { return <Icon {...props}><Circle cx="8" cy="15" r="4"/><Circle cx="15" cy="8" r="4"/><Path d="m18 5 3-3m-2 0h2v2M8 19v3m-2-2h4"/></Icon> }
