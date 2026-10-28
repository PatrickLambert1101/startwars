import { getDashboardConfidence } from "@/utils/dashboardConfidence"
import { getVaccinationHistory, skipsHistoricalVaccinations } from "@/utils/vaccinationHistory"

const synced = {
  lastSynced: new Date(),
  syncStatus: "idle",
  historiesToReview: 0,
  activeSchedules: 2,
}
describe("dashboard confidence", () => {
  it("does not interpret an empty initial pull as a current all-clear", () => {
    expect(getDashboardConfidence({ ...synced, lastSynced: null })).toBe("firstSync")
  })
  it("explains a failed sync even when old records are present", () => {
    expect(getDashboardConfidence({ ...synced, syncStatus: "error" })).toBe("syncProblem")
  })
  it("surfaces unknown history before offering a local task summary", () => {
    expect(getDashboardConfidence({ ...synced, historiesToReview: 3 })).toBe("reviewHistory")
  })
  it("does not equate missing schedules with completed vaccinations", () => {
    expect(getDashboardConfidence({ ...synced, activeSchedules: 0 })).toBe("setUpSchedules")
  })
  it("qualifies even a complete summary as based on local records", () => {
    expect(getDashboardConfidence(synced)).toBe("localSummary")
  })
})
describe("explicit vaccination history", () => {
  it("keeps unknown distinct from both legacy boolean values", () => {
    expect(
      getVaccinationHistory({ vaccinationHistory: "unknown", vaccinationsUpToDate: true }),
    ).toBe("unknown")
    expect(
      getVaccinationHistory({ vaccinationHistory: "unknown", vaccinationsUpToDate: false }),
    ).toBe("unknown")
  })
  it("preserves existing legacy choices until an explicit review", () => {
    expect(getVaccinationHistory({ vaccinationHistory: null, vaccinationsUpToDate: true })).toBe(
      "current",
    )
    expect(getVaccinationHistory({ vaccinationsUpToDate: false })).toBe("needs_review")
  })
  it("does not fabricate missed historical doses for an unknown history", () => {
    expect(skipsHistoricalVaccinations("unknown")).toBe(true)
    expect(skipsHistoricalVaccinations("current")).toBe(true)
    expect(skipsHistoricalVaccinations("needs_review")).toBe(false)
  })
})
