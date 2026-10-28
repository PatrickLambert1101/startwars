import {
  filterAndSortBreedingRecords,
  expectedCalvingFromBreedingDate,
  getCalvingTiming,
  summarizeBreedingRecords,
  type BreedingDashboardItem,
} from "@/utils/breedingDashboard"

const today = new Date(2026, 6, 30, 12)
const records: BreedingDashboardItem[] = [
  {
    id: "overdue",
    animalName: "Cow 12",
    breedingDate: new Date(2025, 9, 1),
    expectedCalvingDate: new Date(2026, 6, 20),
    outcome: "pending",
  },
  {
    id: "soon",
    animalName: "Cow 5",
    breedingDate: new Date(2025, 10, 1),
    expectedCalvingDate: new Date(2026, 7, 10),
    outcome: "pending",
  },
  {
    id: "later",
    animalName: "Cow 30",
    breedingDate: new Date(2026, 1, 1),
    expectedCalvingDate: new Date(2026, 10, 30),
    outcome: "pending",
  },
  {
    id: "complete",
    animalName: "Cow 2",
    breedingDate: new Date(2025, 0, 1),
    expectedCalvingDate: new Date(2025, 9, 10),
    outcome: "live_calf",
  },
]

describe("breeding dashboard", () => {
  it("calculates expected calving from the species gestation average", () => {
    expect(expectedCalvingFromBreedingDate(new Date(2026, 0, 1, 12), "cattle")).toEqual(
      new Date(2026, 9, 11, 12),
    )
    expect(expectedCalvingFromBreedingDate(new Date(2026, 0, 1, 12), "sheep")).toEqual(
      new Date(2026, 4, 28, 12),
    )
  })

  it("labels overdue and upcoming calvings in farmer-friendly language", () => {
    expect(getCalvingTiming(records[0], today)).toMatchObject({
      status: "overdue",
      days: -10,
      label: "10 days overdue",
    })
    expect(getCalvingTiming(records[1], today).status).toBe("soon")
  })

  it("summarizes pending, attention, overdue, and completed records", () => {
    expect(summarizeBreedingRecords(records, today)).toEqual({
      total: 4,
      pending: 3,
      attention: 2,
      overdue: 1,
      history: 1,
    })
  })

  it("puts urgent records first and supports attention and search filters", () => {
    expect(filterAndSortBreedingRecords(records, "all", "", today).map((item) => item.id)).toEqual([
      "overdue",
      "soon",
      "later",
      "complete",
    ])
    expect(
      filterAndSortBreedingRecords(records, "attention", "", today).map((item) => item.id),
    ).toEqual(["overdue", "soon"])
    expect(filterAndSortBreedingRecords(records, "all", "cow 30", today)).toHaveLength(1)
  })
})
