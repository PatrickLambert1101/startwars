/**
 * Genetic Traits Type Definitions
 *
 * Used for tracking inheritable characteristics in breeding programs
 */

export type HornType = "polled" | "horned" | "scurred" | "unknown"
export type Temperament = "docile" | "average" | "flighty" | "aggressive"
export type ProductionLevel = "low" | "average" | "high"
export type CoatPattern = "solid" | "spotted" | "brindled" | "roan" | "mixed"

export interface GeneticTraits {
  // Physical traits
  horns?: HornType
  coatColor?: string
  coatPattern?: CoatPattern

  // Behavioral
  temperament?: Temperament

  // Production traits (optional, breed-specific)
  milkProduction?: ProductionLevel
  meatQuality?: ProductionLevel
  growthRate?: ProductionLevel

  // Custom notes
  notes?: string
}

// ────────────────────────────────────────────────────────────────────
// Constants for form inputs
// ────────────────────────────────────────────────────────────────────

export const HORN_OPTIONS: { value: HornType; label: string }[] = [
  { value: "polled", label: "Polled (Naturally Hornless)" },
  { value: "horned", label: "Horned" },
  { value: "scurred", label: "Scurred (Small Horns)" },
  { value: "unknown", label: "Unknown" },
]

export const TEMPERAMENT_OPTIONS: { value: Temperament; label: string }[] = [
  { value: "docile", label: "Docile" },
  { value: "average", label: "Average" },
  { value: "flighty", label: "Flighty" },
  { value: "aggressive", label: "Aggressive" },
]

export const PRODUCTION_OPTIONS: { value: ProductionLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "average", label: "Average" },
  { value: "high", label: "High" },
]

export const COAT_PATTERN_OPTIONS: { value: CoatPattern; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "spotted", label: "Spotted" },
  { value: "brindled", label: "Brindled" },
  { value: "roan", label: "Roan" },
  { value: "mixed", label: "Mixed" },
]

// Breed-specific coat colors (South African cattle breeds)
export const COAT_COLORS_CATTLE = [
  "Black",
  "Red",
  "White",
  "Brown",
  "Dun",
  "Grey",
  "Yellow",
  "Brindle",
  "Mixed",
]

export const COAT_COLORS_HORSES = [
  "Bay",
  "Chestnut",
  "Black",
  "Grey",
  "Palomino",
  "Buckskin",
  "Roan",
  "Pinto",
  "Appaloosa",
]

export const COAT_COLORS_SHEEP = [
  "White",
  "Black",
  "Brown",
  "Grey",
  "Mixed",
]

export const COAT_COLORS_GOATS = [
  "White",
  "Black",
  "Brown",
  "Red",
  "Spotted",
  "Mixed",
]

/**
 * Get coat color options based on species
 */
export function getCoatColorsBySpecies(species: string): string[] {
  switch (species) {
    case "cattle":
    case "buffalo":
      return COAT_COLORS_CATTLE
    case "horses":
      return COAT_COLORS_HORSES
    case "sheep":
      return COAT_COLORS_SHEEP
    case "goats":
      return COAT_COLORS_GOATS
    default:
      return ["Black", "White", "Brown", "Mixed"]
  }
}

/**
 * Format genetic traits for display
 */
export function formatTraits(traits: GeneticTraits | null): string[] {
  if (!traits) return []

  const display: string[] = []

  if (traits.horns && traits.horns !== "unknown") {
    display.push(traits.horns.charAt(0).toUpperCase() + traits.horns.slice(1))
  }

  if (traits.coatColor) {
    display.push(traits.coatColor)
  }

  if (traits.coatPattern && traits.coatPattern !== "solid") {
    display.push(traits.coatPattern)
  }

  if (traits.temperament) {
    display.push(`${traits.temperament} temperament`)
  }

  return display
}
