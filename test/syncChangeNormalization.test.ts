import { reclassifyExistingCreatedRows } from "@/services/syncChangeNormalization"

describe("sync change normalization", () => {
  it("keeps genuinely new rows as created", () => {
    const result = reclassifyExistingCreatedRows(
      [{ id: "new-animal", name: "New animal" }],
      [],
      new Set(),
    )

    expect(result.created).toEqual([{ id: "new-animal", name: "New animal" }])
    expect(result.updated).toEqual([])
    expect(result.reclassifiedCount).toBe(0)
  })

  it("moves server creates for locally existing rows into updated", () => {
    const existingRow = { id: "existing-animal", name: "Existing animal" }
    const serverUpdate = { id: "updated-animal", name: "Updated animal" }

    const result = reclassifyExistingCreatedRows(
      [existingRow, { id: "new-animal", name: "New animal" }],
      [serverUpdate],
      new Set(["existing-animal"]),
    )

    expect(result.created).toEqual([{ id: "new-animal", name: "New animal" }])
    expect(result.updated).toEqual([serverUpdate, existingRow])
    expect(result.reclassifiedCount).toBe(1)
  })
})
