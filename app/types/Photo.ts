export interface Photo {
  uri: string // Full-size image URI (Supabase Storage URL or local file URI)
  thumbnailUri?: string // Compressed thumbnail URI
  createdAt: number // Timestamp
  createdBy?: string // User ID or email
  caption?: string // Optional caption/description
}

export interface PhotoWithMetadata extends Photo {
  localUri?: string // Local file path before upload
  uploadStatus?: "pending" | "uploading" | "uploaded" | "failed"
  error?: string
}

/**
 * Helper to parse photos JSON from database
 */
export function parsePhotos(photosJson: string | null): Photo[] {
  if (!photosJson) return []
  try {
    const parsed = JSON.parse(photosJson)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Helper to serialize photos to JSON for database
 */
export function serializePhotos(photos: Photo[]): string {
  return JSON.stringify(photos)
}
