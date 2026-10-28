import af from "../app/i18n/af"
import en from "../app/i18n/en"
import nso from "../app/i18n/nso"
import xh from "../app/i18n/xh"
import zu from "../app/i18n/zu"

const translations = { af, en, nso, xh, zu }

const requiredPaths = [
  "count_one",
  "count_other",
  "countWithFilter_one",
  "countWithFilter_other",
  "badges.inactive",
  "details.withdrawal",
  "empty.title",
  "empty.noFilter",
  "empty.withFilter",
  "empty.showAllButton",
  "empty.loadDefaultsButton",
  "empty.createButton",
  "alerts.toggleError.title",
  "alerts.toggleError.message",
  "alerts.protocolsAdded.title",
  "alerts.protocolsAdded.message",
] as const

function valueAtPath(source: object, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined
    return (value as Record<string, unknown>)[key]
  }, source)
}

describe("treatment protocol translations", () => {
  it.each(Object.entries(translations))("defines every rendered key in %s", (_locale, copy) => {
    for (const path of requiredPaths) {
      const value = valueAtPath(copy.treatmentProtocolsScreen, path)
      expect(typeof value).toBe("string")
      expect(value).not.toBe("")
    }
  })
})
