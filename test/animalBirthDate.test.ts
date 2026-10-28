import { birthDateFromMonthYear } from "@/utils/animalBirthDate"

describe("birthDateFromMonthYear", () => {
  const today = new Date(2026, 6, 30, 12)

  it("accepts one or two digit months and a four digit year", () => {
    const result = birthDateFromMonthYear("7", "2024", today)

    expect(result.error).toBeNull()
    expect(result.date).toEqual(new Date(2024, 6, 15, 12))
  })

  it("rejects invalid and future months", () => {
    expect(birthDateFromMonthYear("13", "2024", today).error).toContain("01 and 12")
    expect(birthDateFromMonthYear("08", "2026", today).error).toContain("future")
  })

  it("never creates a future day for the current month", () => {
    const earlyInMonth = new Date(2026, 6, 4, 12)
    const result = birthDateFromMonthYear("07", "2026", earlyInMonth)

    expect(result.date).toEqual(new Date(2026, 6, 4, 12))
  })
})
