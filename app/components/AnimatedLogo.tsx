import React from "react"
import { AnimatedLogoSVG } from "./AnimatedLogoSVG"

interface AnimatedLogoProps {
  size?: number
}

/**
 * Animated HerdTrackr logo with spinning rings
 * - Outer ring: continuous full rotation (slow)
 * - Inner ring: 3/4 rotation back and forth
 * - Center cow: static
 */
export function AnimatedLogo({ size = 200 }: AnimatedLogoProps) {
  return <AnimatedLogoSVG size={size} />
}
