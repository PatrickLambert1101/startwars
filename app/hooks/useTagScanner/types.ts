export interface OCRResult {
  text: string
  confidence: number
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface TagScanResult {
  tagNumber: string
  confidence: number
  rawText: string
}

export interface TagPattern {
  name: string
  regex: RegExp
  priority: number
  validate?: (text: string) => boolean
}

export interface ScannerState {
  isScanning: boolean
  detectedText: OCRResult[]
  stableTagNumber: string | null
  scanHistory: string[]
}
