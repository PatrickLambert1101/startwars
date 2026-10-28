import { mergeTagsWithDraft } from "../app/components/TagInput"

describe("animal tag drafts", () => {
  it("includes a typed tag when the animal is saved before keyboard submit", () => {
    expect(mergeTagsWithDraft(["Breeding Stock"], "For Sale ")).toEqual([
      "Breeding Stock",
      "For Sale",
    ])
  })

  it("does not duplicate an existing tag with different casing", () => {
    expect(mergeTagsWithDraft(["For Sale"], "for sale")).toEqual(["For Sale"])
  })
})
