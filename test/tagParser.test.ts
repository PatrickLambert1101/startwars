import { extractTagNumbers } from "../app/hooks/useTagScanner/tagParser"

describe("tag OCR parser", () => {
  it.each(["7", "A"])("accepts a single-character animal tag: %s", (text) => {
    expect(extractTagNumbers([{ text, confidence: 0.8 }])).toEqual(
      expect.arrayContaining([expect.objectContaining({ tagNumber: text })]),
    )
  })

  it("ignores single-character punctuation noise", () => {
    expect(extractTagNumbers([{ text: "|", confidence: 0.8 }])).toEqual([])
  })
})
