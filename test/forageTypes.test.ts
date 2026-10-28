import { forageTypeOptions } from "@/utils/forageTypes"

describe("forage type options", () => {
  it("adds farm-specific grass types and removes case-insensitive duplicates", () => {
    const options = forageTypeOptions(["Smuts Finger", " kikuyu ", "SMUTS FINGER", null])

    expect(options).toContain("Smuts Finger")
    expect(options.filter((value) => value.toLowerCase() === "smuts finger")).toHaveLength(1)
    expect(options.filter((value) => value.toLowerCase() === "kikuyu")).toHaveLength(1)
  })
})
