import { getContactPhone, normalizeContactPhone } from "./contactPhone"

describe("contact phone numbers", () => {
  it.each([
    ["082 123 4567", "+27821234567"],
    ["27 82 123 4567", "+27821234567"],
    ["+27 (82) 123-4567", "+27821234567"],
    ["0044 7700 900123", "+447700900123"],
    ["+1 202 555 0123", "+12025550123"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeContactPhone(input)).toBe(expected)
  })

  it.each([
    "",
    "abc0821234567",
    "123",
    "+270821234567",
    "+2782123456",
    "08212345678",
    "+1234567890123456",
    "++27821234567",
    "2025550123",
  ])("rejects %s", (input) => {
    expect(normalizeContactPhone(input)).toBeNull()
  })

  it("prefers the editable contact number over the authentication number", () => {
    expect(
      getContactPhone({ user_metadata: { contact_phone: "+27821234567" }, phone: "+447700900123" }),
    ).toBe("+27821234567")
    expect(getContactPhone({ user_metadata: { contact_phone: 123 }, phone: "+447700900123" })).toBe(
      "+447700900123",
    )
    expect(getContactPhone(null)).toBe("")
  })
})
