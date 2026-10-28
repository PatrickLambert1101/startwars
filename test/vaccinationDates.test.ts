import { getVaccinationDaysUntilDue, getVaccinationUrgency } from "@/utils/vaccinationDates"

describe("vaccination date calculations", () => {
  const afternoon = new Date(2026, 6, 29, 15, 30)

  it("treats every time on the same calendar date as due today", () => {
    expect(getVaccinationDaysUntilDue(new Date(2026, 6, 29, 0, 0), afternoon)).toBe(0)
    expect(getVaccinationDaysUntilDue(new Date(2026, 6, 29, 23, 59), afternoon)).toBe(0)
  })

  it("does not label tomorrow as due today", () => {
    expect(getVaccinationDaysUntilDue(new Date(2026, 6, 30, 0, 0), afternoon)).toBe(1)
  })

  it("labels an earlier calendar date as overdue", () => {
    const yesterday = new Date(2026, 6, 28, 23, 59)

    expect(getVaccinationDaysUntilDue(yesterday, afternoon)).toBe(-1)
    expect(getVaccinationUrgency("pending", yesterday, afternoon)).toBe("overdue")
  })

  it("keeps completed vaccinations out of urgency categories", () => {
    const yesterday = new Date(2026, 6, 28)

    expect(getVaccinationUrgency("administered", yesterday, afternoon)).toBe("ok")
  })
})
