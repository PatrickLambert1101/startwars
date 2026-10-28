import { buildDashboardActivity } from "@/utils/dashboardActivity"

describe("dashboard activity feed", () => {
  it("sorts different farm records newest first", () => {
    const activities = buildDashboardActivity({
      healthRecords: [
        {
          id: "health-1",
          animalId: "cow-1",
          recordDate: new Date(2026, 6, 29),
          recordType: "treatment",
          description: "Treated eye",
          productName: "Product A",
        },
      ],
      breedingRecords: [
        {
          id: "breeding-1",
          animalId: "cow-1",
          breedingDate: new Date(2026, 6, 31),
          method: "natural",
          outcome: "pending",
          expectedCalvingDate: new Date(2027, 4, 10),
        },
      ],
      pastureMovements: [],
      pastureActivities: [
        {
          id: "pasture-1",
          pastureId: "north",
          activityDate: new Date(2026, 6, 30),
          activityType: "tick_observation",
          notes: null,
          tickLoadScore: 4,
          animalsInspected: 12,
        },
      ],
      animalNames: new Map([["cow-1", "Cow 12"]]),
      pastureNames: new Map([["north", "North Camp"]]),
    })

    expect(activities.map((activity) => activity.kind)).toEqual(["breeding", "pasture", "health"])
    expect(activities[1].detail).toBe("Tick load 4/5 · 12 inspected")
  })

  it("groups a herd movement recorded in the same minute", () => {
    const activities = buildDashboardActivity({
      healthRecords: [],
      breedingRecords: [],
      pastureActivities: [],
      pastureMovements: [
        {
          id: "move-1",
          animalId: "cow-1",
          pastureId: "south",
          movementDate: new Date(2026, 6, 31, 9, 15, 1),
          movementType: "move_in",
          notes: null,
        },
        {
          id: "move-2",
          animalId: "cow-2",
          pastureId: "south",
          movementDate: new Date(2026, 6, 31, 9, 15, 40),
          movementType: "move_in",
          notes: null,
        },
      ],
      animalNames: new Map([
        ["cow-1", "Cow 1"],
        ["cow-2", "Cow 2"],
      ]),
      pastureNames: new Map([["south", "South Camp"]]),
    })

    expect(activities).toHaveLength(1)
    expect(activities[0].title).toBe("Moved 2 animals into South Camp")
  })
})
