/** Basic contact-number validation, not proof of ownership or SMS authentication. */
export function normalizeContactPhone(input: string): string | null {
  if (!/^[+\d\s().-]+$/.test(input.trim())) return null
  let number = input.replace(/[\s().-]/g, "")
  if (number.startsWith("00")) number = `+${number.slice(2)}`
  // Local South African numbers are the default; other countries must include +.
  if (/^0\d{9}$/.test(number)) number = `+27${number.slice(1)}`
  if (/^27\d{9}$/.test(number)) number = `+${number}`
  if (!/^\+[1-9]\d{7,14}$/.test(number)) return null
  if (number.startsWith("+27") && !/^\+27[1-9]\d{8}$/.test(number)) return null
  return number
}

export function getContactPhone(
  user: { user_metadata?: Record<string, unknown>; phone?: string } | null,
): string {
  const contact = user?.user_metadata?.contact_phone
  return typeof contact === "string" && contact.trim() ? contact : user?.phone || ""
}
