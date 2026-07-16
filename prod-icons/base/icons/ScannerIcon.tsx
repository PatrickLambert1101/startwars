import { Path, Rect } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function ScannerIcon(props: IconProps) {
  return <Icon {...props}><Rect x="7" y="3" width="10" height="13" rx="2"/><Path d="m10 16-2 5h8l-2-5M10 7h4m-4 3h4M4 5v3m0-3h3m13 0v3m0-3h-3"/></Icon>
}
