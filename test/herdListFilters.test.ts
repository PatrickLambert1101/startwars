import {
  DEFAULT_HERD_STATUSES,
  isDefaultStatusFilter,
} from "@/utils/herdListFilters"

describe("herd list default status filter", () => {
  it("shows current and transferred animals while hiding sold and deceased animals", () => {
    expect(DEFAULT_HERD_STATUSES).toEqual(["active", "transferred"])
    expect(DEFAULT_HERD_STATUSES).not.toContain("sold")
    expect(DEFAULT_HERD_STATUSES).not.toContain("deceased")
  })

  it("recognises the default regardless of status order", () => {
    expect(isDefaultStatusFilter(["transferred", "active"])).toBe(true)
    expect(isDefaultStatusFilter(["active", "sold"])).toBe(false)
  })
})
