import { saveWeightAndTreatment, type CombinedRecordingData } from "@/services/combinedRecording"

const data: CombinedRecordingData = {
  animalId: "cow",
  recordDate: new Date("2026-10-28T08:00:00Z"),
  weightKg: 450,
  conditionScore: 5,
  protocolId: "protocol",
  recordType: "treatment",
  description: "Treatment",
  productName: "Product",
  dosage: "10 mL",
}
function store({ fail = false, vaccination = false } = {}) {
  const saved: any[] = []
  const scheduled: any = {
    id: "due",
    status: "pending",
    doseNumber: 1,
    scheduleId: "schedule",
    schedule: {
      fetch: async () => ({
        protocolId: "protocol",
        requiresBooster: true,
        boosterCount: 2,
        boosterIntervalDays: 21,
      }),
    },
    prepareUpdate: (update: any) => {
      const next = { ...scheduled }
      update(next)
      return { ...next, commit: () => Object.assign(scheduled, next) }
    },
  }
  let id = 0
  const db: any = {
    write: jest.fn((write: any) => write()),
    get: (table: string) => ({
      prepareCreate: (create: any) => {
        const record: any = { id: `new-${++id}`, table }
        create(record)
        return record
      },
      query: () => ({ fetch: async () => (vaccination ? [scheduled] : []) }),
    }),
    batch: jest.fn(async (...records: any[]) => {
      if (fail) throw new Error("commit failed")
      records.forEach((record) => {
        record.commit?.()
        saved.push(record)
      })
    }),
  }
  return { db, saved, scheduled }
}
it("commits matching animal, author and date for weight and treatment together", async () => {
  const { db, saved } = store()
  await saveWeightAndTreatment(db, "farm", { id: "user", name: "Farmer" }, data)
  expect(saved.map((record) => record.table)).toEqual(["weight_records", "health_records"])
  for (const record of saved)
    expect(record).toMatchObject({
      animalId: "cow",
      organizationId: "farm",
      createdByUserId: "user",
      recordDate: data.recordDate,
    })
  expect(db.batch).toHaveBeenCalledTimes(1)
})
it("does not leave a weight-only success when the combined commit fails", async () => {
  const { db, saved } = store({ fail: true })
  await expect(saveWeightAndTreatment(db, "farm", {}, data)).rejects.toThrow("commit failed")
  expect(saved).toHaveLength(0)
})
it("includes completion of the pending vaccination and its booster in the same write", async () => {
  const { db, saved, scheduled } = store({ vaccination: true })
  await saveWeightAndTreatment(db, "farm", {}, { ...data, recordType: "vaccination" })
  expect(scheduled.status).toBe("administered")
  expect(scheduled.healthRecordId).toBe(
    saved.find((record) => record.table === "health_records").id,
  )
  expect(saved.find((record) => record.table === "scheduled_vaccinations")).toMatchObject({
    status: "pending",
    doseNumber: 2,
    parentVaccinationId: "due",
    dueDate: new Date("2026-11-18T08:00:00Z"),
  })
  expect(db.batch).toHaveBeenCalledTimes(1)
})
it("keeps the due vaccination pending if the combined transaction fails", async () => {
  const { db, saved, scheduled } = store({ vaccination: true, fail: true })
  await expect(
    saveWeightAndTreatment(db, "farm", {}, { ...data, recordType: "vaccination" }),
  ).rejects.toThrow()
  expect(scheduled.status).toBe("pending")
  expect(saved).toHaveLength(0)
})
it("rejects invalid measurements before any database operation", async () => {
  const { db } = store()
  await expect(
    saveWeightAndTreatment(db, "farm", {}, { ...data, weightKg: Infinity }),
  ).rejects.toThrow()
  expect(db.write).not.toHaveBeenCalled()
})
