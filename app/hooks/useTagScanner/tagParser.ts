import { TagPattern, OCRResult, TagScanResult } from "./types"

/**
 * South African ear tag patterns
 * Priority determines which pattern is checked first (higher = more specific)
 */
export const SA_TAG_PATTERNS: TagPattern[] = [
  // ZA official format: ZA 012 345 6789 (with or without spaces)
  {
    name: "ZA_OFFICIAL",
    regex: /\b(ZA\s*\d{3}\s*\d{3}\s*\d{4})\b/i,
    priority: 100,
    validate: (text) => {
      const digits = text.replace(/\D/g, "")
      return digits.length === 10
    },
  },
  // Farm code prefix: B-0472, A-123, etc
  {
    name: "FARM_PREFIX",
    regex: /\b([A-Z]-?\d{3,8})\b/i,
    priority: 90,
    validate: (text) => {
      const match = text.match(/([A-Z])-?(\d{3,8})/i)
      return !!match && match[2].length >= 3
    },
  },
  // Pure numeric 4-8 digits (most common)
  {
    name: "NUMERIC_LONG",
    regex: /\b(\d{4,8})\b/,
    priority: 80,
    validate: (text) => {
      const num = parseInt(text, 10)
      return num >= 1 && num <= 99999999
    },
  },
  // Short numeric 2-3 digits (less common but valid)
  {
    name: "NUMERIC_SHORT",
    regex: /\b(\d{2,3})\b/,
    priority: 70,
    validate: (text) => {
      const num = parseInt(text, 10)
      return num >= 1 && num <= 999
    },
  },
]

/**
 * Extract potential tag numbers from OCR text
 */
export function extractTagNumbers(ocrResults: OCRResult[]): TagScanResult[] {
  const results: TagScanResult[] = []

  for (const ocr of ocrResults) {
    // Skip low confidence results
    if (ocr.confidence < 0.5) continue

    const text = ocr.text.trim()
    if (!text) continue

    // Try each pattern in priority order
    for (const pattern of SA_TAG_PATTERNS.sort((a, b) => b.priority - a.priority)) {
      const match = text.match(pattern.regex)
      if (!match) continue

      const tagNumber = match[1]
      const isValid = pattern.validate ? pattern.validate(tagNumber) : true

      if (isValid) {
        results.push({
          tagNumber: normalizeTagNumber(tagNumber),
          confidence: ocr.confidence,
          rawText: text,
        })
        break // Only take the highest priority match per text block
      }
    }
  }

  return results
}

/**
 * Normalize tag number for consistent formatting
 * Removes extra spaces, converts to uppercase
 */
export function normalizeTagNumber(tag: string): string {
  return tag.toUpperCase().replace(/\s+/g, " ").trim()
}

/**
 * Check if a tag number is within the viewfinder bounds
 */
export function isWithinViewfinder(
  boundingBox: { x: number; y: number; width: number; height: number },
  viewfinderBox: { x: number; y: number; width: number; height: number },
  tolerance: number = 0.1, // 10% tolerance
): boolean {
  const margin = tolerance * viewfinderBox.width

  return (
    boundingBox.x >= viewfinderBox.x - margin &&
    boundingBox.y >= viewfinderBox.y - margin &&
    boundingBox.x + boundingBox.width <= viewfinderBox.x + viewfinderBox.width + margin &&
    boundingBox.y + boundingBox.height <= viewfinderBox.y + viewfinderBox.height + margin
  )
}

/**
 * Stability checker - confirms tag number appears in multiple frames
 */
export class TagStabilityChecker {
  private history: string[] = []
  private readonly requiredMatches: number
  private readonly maxHistorySize: number

  constructor(requiredMatches: number = 3, maxHistorySize: number = 10) {
    this.requiredMatches = requiredMatches
    this.maxHistorySize = maxHistorySize
  }

  addReading(tagNumber: string | null): string | null {
    if (!tagNumber) {
      this.history = []
      return null
    }

    this.history.push(tagNumber)

    // Keep history size limited
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
    }

    // Check if we have enough consecutive matches
    const recentReadings = this.history.slice(-this.requiredMatches)
    if (recentReadings.length === this.requiredMatches) {
      const allMatch = recentReadings.every((reading) => reading === tagNumber)
      if (allMatch) {
        return tagNumber
      }
    }

    return null
  }

  reset(): void {
    this.history = []
  }

  getHistory(): string[] {
    return [...this.history]
  }
}
