export const COMMON_FORAGE_TYPES = [
  "Mixed Grass",
  "Kikuyu",
  "Lucerne",
  "Eragrostis",
  "Clover",
  "Veld Grass",
] as const

/**
 * Combines built-in and farm-specific forage labels without creating duplicate
 * choices that differ only by case or surrounding whitespace.
 */
export function forageTypeOptions(existingValues: Array<string | null | undefined>): string[] {
  const options = new Map<string, string>()

  for (const value of [...COMMON_FORAGE_TYPES, ...existingValues]) {
    const trimmed = value?.trim()
    if (!trimmed) continue
    const key = trimmed.toLocaleLowerCase()
    if (!options.has(key)) options.set(key, trimmed)
  }

  return [...options.values()]
}
