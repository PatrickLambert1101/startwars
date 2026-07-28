import type { Pasture } from "@/db/models"
import { getPastureMapStatus } from "@/utils/pastureMapStatus"

function pasture(overrides: Partial<Pasture> = {}): Pasture {
  return {
    isActive: true,
    isOverCapacity: false,
    shouldRotate: false,
    isOccupied: true,
    statusColor: "green",
    maxCapacity: 40,
    targetGrazingDays: 7,
    targetRestDays: 30,
    availableFromDate: null,
    ...overrides,
  } as Pasture
}

describe("pasture map status", () => {
  it("prioritizes over-capacity and rotation alerts", () => {
    expect(getPastureMapStatus(pasture({ isOverCapacity: true }), 0).level).toBe("red")
    expect(getPastureMapStatus(pasture({ shouldRotate: true }), 0).label).toBe("Rotation due")
  })

  it("uses the latest tick score as an alert", () => {
    expect(getPastureMapStatus(pasture(), 4).level).toBe("red")
    expect(getPastureMapStatus(pasture(), 2).level).toBe("amber")
    expect(getPastureMapStatus(pasture(), 1).level).toBe("green")
  })

  it("shows resting and insufficient-data states", () => {
    const now = new Date("2026-07-27T12:00:00Z")
    const resting = pasture({
      isOccupied: false,
      availableFromDate: new Date("2026-08-01T12:00:00Z"),
    })
    expect(getPastureMapStatus(resting, null, now).label).toBe("Resting")

    const noData = pasture({
      isOccupied: false,
      maxCapacity: null,
      targetGrazingDays: null,
      targetRestDays: null,
    })
    expect(getPastureMapStatus(noData, null, now).level).toBe("grey")
  })
})

