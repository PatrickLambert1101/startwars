export type VaccinationHistory = "current" | "needs_review" | "unknown"

/** Retain legacy choices until the farmer explicitly reviews the history. */
export function getVaccinationHistory(animal: {
  vaccinationHistory?: string | null
  vaccinationsUpToDate: boolean
}): VaccinationHistory {
  if (["current", "needs_review", "unknown"].includes(animal.vaccinationHistory ?? "")) {
    return animal.vaccinationHistory as VaccinationHistory
  }
  return animal.vaccinationsUpToDate ? "current" : "needs_review"
}

/** Unknown history must not manufacture a backlog of assumed missed doses. */
export function skipsHistoricalVaccinations(history: VaccinationHistory): boolean {
  return history !== "needs_review"
}
