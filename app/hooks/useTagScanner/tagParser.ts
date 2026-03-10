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
      'worklet'
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
      'worklet'
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
      'worklet'
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
      'worklet'
      const num = parseInt(text, 10)
      return num >= 1 && num <= 999
    },
  },
]

/**
 * Extract potential tag numbers from OCR text
 * Now accepts ANY text, but prioritizes pattern matches
 */
export function extractTagNumbers(ocrResults: OCRResult[]): TagScanResult[] {
  'worklet'
  const results: TagScanResult[] = []

  console.log(`extractTagNumbers: Processing ${ocrResults.length} OCR results`)

  try {
    for (const ocr of ocrResults) {
      try {
        // Skip low confidence results
        if (ocr.confidence < 0.3) {
          console.log(`  Skipping low confidence: "${ocr.text}" (${ocr.confidence})`)
          continue
        }

        const text = ocr.text.trim()
        if (!text) {
          console.log(`  Skipping empty text`)
          continue
        }
        if (text.length < 2) {
          console.log(`  Skipping short text: "${text}"`)
          continue
        }

        console.log(`  Processing text: "${text}"`)

        let matched = false
        let highestPriority = 0

        // Try each pattern in priority order
        for (const pattern of SA_TAG_PATTERNS.sort((a, b) => b.priority - a.priority)) {
          const match = text.match(pattern.regex)
          if (!match || !match[1]) continue

          const tagNumber = match[1]
          const isValid = pattern.validate ? pattern.validate(tagNumber) : true

          if (isValid && pattern.priority > highestPriority) {
            // Normalize inline (can't call function from worklet)
            const normalized = tagNumber.toUpperCase().replace(/\s+/g, " ").trim()
            results.push({
              tagNumber: normalized,
              confidence: ocr.confidence * 1.2, // Boost confidence for pattern matches
              rawText: text,
            })
            matched = true
            highestPriority = pattern.priority
            break
          }
        }

        // If no pattern matched, accept it anyway (user can configure patterns later)
        if (!matched) {
          console.log(`    No pattern match, accepting as-is`)
          // Normalize inline (can't call function from worklet)
          const normalized = text.toUpperCase().replace(/\s+/g, " ").trim()
          console.log(`    Normalized to: "${normalized}"`)
          results.push({
            tagNumber: normalized,
            confidence: ocr.confidence * 0.8, // Lower confidence for non-pattern text
            rawText: text,
          })
          console.log(`    Added to results (now ${results.length} total)`)
        }
      } catch (err) {
        console.log(`    ERROR processing item: ${err}`)
      }
    }
  } catch (err) {
    console.log(`  FATAL ERROR in extractTagNumbers: ${err}`)
  }

  console.log(`extractTagNumbers: Returning ${results.length} results`)
  return results
}

/**
 * Normalize tag number for consistent formatting
 * Removes extra spaces, converts to uppercase
 */
export function normalizeTagNumber(tag: string): string {
  'worklet'
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
 * Now uses fuzzy matching to handle OCR variations (BULL vs BULI vs BUL)
 */
export class TagStabilityChecker {
  private history: string[] = []
  private readonly requiredMatches: number
  private readonly maxHistorySize: number

  constructor(requiredMatches: number = 3, maxHistorySize: number = 10) {
    this.requiredMatches = requiredMatches
    this.maxHistorySize = maxHistorySize
  }

  /**
   * Check if two tag numbers are similar enough to be considered the same
   * Handles OCR variations like "BULL" vs "BULI" vs "BUL"
   */
  private areSimilar(tag1: string, tag2: string): boolean {
    'worklet'
    // Exact match
    if (tag1 === tag2) return true

    // One is contained in the other (e.g., "BUL" in "BULL")
    if (tag1.includes(tag2) || tag2.includes(tag1)) {
      // Allow if length difference is small
      return Math.abs(tag1.length - tag2.length) <= 2
    }

    // Levenshtein distance check for small differences
    const distance = this.levenshteinDistance(tag1, tag2)
    const maxLength = Math.max(tag1.length, tag2.length)

    // Allow 1-2 character difference depending on length
    return distance <= Math.min(2, Math.ceil(maxLength * 0.25))
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    'worklet'
    const len1 = str1.length
    const len2 = str2.length
    const matrix: number[][] = []

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        )
      }
    }

    return matrix[len1][len2]
  }

  addReading(tagNumber: string | null): string | null {
    'worklet'
    if (!tagNumber) {
      this.history = []
      return null
    }

    this.history.push(tagNumber)

    // Keep history size limited
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
    }

    // Check if we have enough similar matches in recent history
    const recentReadings = this.history.slice(-this.requiredMatches)
    if (recentReadings.length >= this.requiredMatches) {
      // Find the most common tag (with fuzzy matching)
      const tagGroups = new Map<string, string[]>()

      for (const reading of recentReadings) {
        let foundGroup = false
        for (const [groupKey, groupTags] of tagGroups.entries()) {
          if (this.areSimilar(reading, groupKey)) {
            groupTags.push(reading)
            foundGroup = true
            break
          }
        }
        if (!foundGroup) {
          tagGroups.set(reading, [reading])
        }
      }

      // Find the largest group
      let largestGroup: string[] = []
      let largestGroupKey = ""
      for (const [key, group] of tagGroups.entries()) {
        if (group.length > largestGroup.length) {
          largestGroup = group
          largestGroupKey = key
        }
      }

      // If the largest group has enough matches, return the most recent tag from that group
      if (largestGroup.length >= this.requiredMatches) {
        return largestGroup[largestGroup.length - 1]
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
