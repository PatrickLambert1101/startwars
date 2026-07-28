import {
  PASTURE_ACTIVITY_LABELS,
  PASTURE_ACTIVITY_TYPES,
  TICK_LOAD_OPTIONS,
} from "../app/db/models/PastureActivity"

describe("pasture activity configuration", () => {
  test("includes tick observations in the shared activity types", () => {
    expect(PASTURE_ACTIVITY_TYPES).toContain("tick_observation")
    expect(PASTURE_ACTIVITY_LABELS.tick_observation).toBe("Tick observation")
  })

  test("uses a complete ordered 0–5 tick-load scale", () => {
    expect(TICK_LOAD_OPTIONS.map(({ score }) => score)).toEqual([0, 1, 2, 3, 4, 5])
    expect(TICK_LOAD_OPTIONS[0].label).toBe("None")
    expect(TICK_LOAD_OPTIONS[5].label).toBe("Very high")
  })
})
