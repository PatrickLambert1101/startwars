export type MonthYearDateResult =
  | { date: Date; error: null }
  | { date: null; error: string }

/**
 * Converts an approximate birth month/year into a stable mid-month date.
 * When the current month is selected, the day is capped at today so a newborn
 * animal never receives a future birth date.
 */
export function birthDateFromMonthYear(
  monthText: string,
  yearText: string,
  today = new Date(),
): MonthYearDateResult {
  if (!/^\d{1,2}$/.test(monthText.trim()) || !/^\d{4}$/.test(yearText.trim())) {
    return { date: null, error: "Enter a month and a four-digit year." }
  }

  const month = Number(monthText)
  const year = Number(yearText)
  if (month < 1 || month > 12) {
    return { date: null, error: "Month must be between 01 and 12." }
  }
  if (year < 1900 || year > today.getFullYear()) {
    return { date: null, error: `Year must be between 1900 and ${today.getFullYear()}.` }
  }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1
  const day = isCurrentMonth ? Math.min(15, today.getDate()) : 15
  const date = new Date(year, month - 1, day, 12)
  if (date > today) {
    return { date: null, error: "Birth month cannot be in the future." }
  }

  return { date, error: null }
}
