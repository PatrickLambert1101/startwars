import { Circle, Path } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"
export function LightbulbOnIcon(props: IconProps) { return <Icon {...props}><Circle cx="12" cy="10" r="5"/><Path d="M9 15h6m-5 3h4M12 2v1m7 7h2M3 10h2m10-7 .8-1.5M8.2 3 7.5 1.5M17 17l1.5 1M7 17l-1.5 1"/></Icon> }
