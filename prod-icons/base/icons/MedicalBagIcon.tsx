import { Path, Rect } from "react-native-svg"
import { Icon } from "./Icon"
import type { IconProps } from "./types"

export function MedicalBagIcon(props: IconProps) {
  return <Icon {...props}><Rect x="3" y="7" width="18" height="13" rx="2"/><Path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-4 4v5m-2.5-2.5h5"/></Icon>
}
