import { differenceInCalendarDays } from "date-fns"

export type VaccinationUrgency = "ok" | "soon" | "overdue" | "critical"

/**
 * Vaccination schedules are date-based, so compare local calendar dates rather
 * than elapsed 24-hour periods. This keeps "today" stable throughout the day.
 */
export function getVaccinationDaysUntilDue(dueDate: Date, now = new Date()): number {
  return differenceInCalendarDays(dueDate, now)
}

export function getVaccinationUrgency(
  status: string,
  dueDate: Date,
  now = new Date(),
): VaccinationUrgency {
  if (status !== "pending") return "ok"

  const daysUntilDue = getVaccinationDaysUntilDue(dueDate, now)
  if (daysUntilDue < -7) return "critical"
  if (daysUntilDue < 0) return "overdue"
  if (daysUntilDue <= 7) return "soon"
  return "ok"
}
