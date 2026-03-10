import { supabase } from "./supabase"
import { readAsStringAsync } from "expo-file-system/legacy"
import { manipulateAsync, SaveFormat } from "expo-image-manipulator"
import type { Photo } from "@/types/Photo"

const BUCKET_NAME = "herdtrackr-photos"
const MAX_IMAGE_WIDTH = 1920
const MAX_IMAGE_HEIGHT = 1920
const THUMBNAIL_SIZE = 300
const IMAGE_QUALITY = 0.8
const THUMBNAIL_QUALITY = 0.7

/**
 * Photo storage service using Supabase Storage
 *
 * Bucket structure:
 * - {org_id}/animals/{animal_id}/{timestamp}.jpg
 * - {org_id}/records/weight/{record_id}/{timestamp}.jpg
 * - {org_id}/records/health/{record_id}/{timestamp}.jpg
 * - {org_id}/records/breeding/{record_id}/{timestamp}.jpg
 * - {org_id}/pastures/{pasture_id}/{timestamp}.jpg
 */

export interface UploadPhotoOptions {
  localUri: string
  organizationId: string
  category: "animals" | "weight" | "health" | "breeding" | "pastures"
  recordId: string
  userId?: string
  caption?: string
}

export interface UploadPhotoResult {
  photo: Photo
  thumbnailUri: string
}

/**
 * Compress and resize image
 */
async function compressImage(
  uri: string,
  maxWidth: number,
  maxHeight: number,
  quality: number,
): Promise<string> {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: maxWidth, height: maxHeight } }],
    { compress: quality, format: SaveFormat.JPEG },
  )
  return result.uri
}

/**
 * Upload a photo to Supabase Storage
 */
export async function uploadPhoto(options: UploadPhotoOptions): Promise<UploadPhotoResult> {
  const { localUri, organizationId, category, recordId, userId, caption } = options
  const timestamp = Date.now()
  const filename = `${timestamp}.jpg`

  // Determine path based on category
  let path: string
  if (category === "animals") {
    path = `${organizationId}/animals/${recordId}/${filename}`
  } else if (category === "pastures") {
    path = `${organizationId}/pastures/${recordId}/${filename}`
  } else {
    path = `${organizationId}/records/${category}/${recordId}/${filename}`
  }

  // Compress full-size image
  const compressedUri = await compressImage(localUri, MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, IMAGE_QUALITY)

  // Create thumbnail
  const thumbnailUri = await compressImage(localUri, THUMBNAIL_SIZE, THUMBNAIL_SIZE, THUMBNAIL_QUALITY)
  const thumbnailPath = `${organizationId}/thumbnails/${category}/${recordId}/${filename}`

  // Read file as base64
  const fullImageBase64 = await readAsStringAsync(compressedUri, {
    encoding: "base64",
  })
  const thumbnailBase64 = await readAsStringAsync(thumbnailUri, {
    encoding: "base64",
  })

  // Decode base64 to binary for upload
  const fullImageBinary = decode(fullImageBase64)
  const thumbnailBinary = decode(thumbnailBase64)

  // Upload full-size image
  const { data: fullImageData, error: fullImageError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, fullImageBinary, {
      contentType: "image/jpeg",
      upsert: false,
    })

  if (fullImageError) {
    throw new Error(`Failed to upload photo: ${fullImageError.message}`)
  }

  // Upload thumbnail
  const { data: thumbnailData, error: thumbnailError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(thumbnailPath, thumbnailBinary, {
      contentType: "image/jpeg",
      upsert: false,
    })

  if (thumbnailError) {
    throw new Error(`Failed to upload thumbnail: ${thumbnailError.message}`)
  }

  // Get public URLs
  const { data: fullImageUrl } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fullImageData.path)
  const { data: thumbnailUrl } = supabase.storage.from(BUCKET_NAME).getPublicUrl(thumbnailData.path)

  const photo: Photo = {
    uri: fullImageUrl.publicUrl,
    thumbnailUri: thumbnailUrl.publicUrl,
    createdAt: timestamp,
    createdBy: userId,
    caption,
  }

  return { photo, thumbnailUri: thumbnailUrl.publicUrl }
}

/**
 * Delete a photo from Supabase Storage
 */
export async function deletePhoto(photoUri: string): Promise<void> {
  // Extract path from public URL
  const url = new URL(photoUri)
  const path = url.pathname.split(`/storage/v1/object/public/${BUCKET_NAME}/`)[1]

  if (!path) {
    throw new Error("Invalid photo URI")
  }

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path])

  if (error) {
    throw new Error(`Failed to delete photo: ${error.message}`)
  }
}

/**
 * Delete multiple photos
 */
export async function deletePhotos(photoUris: string[]): Promise<void> {
  await Promise.all(photoUris.map((uri) => deletePhoto(uri)))
}

/**
 * Helper to decode base64 to ArrayBuffer (React Native compatible)
 */
function decode(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Initialize the storage bucket (run this once during setup)
 * This function should be called from Supabase dashboard or via admin API
 */
export async function initializeBucket(): Promise<void> {
  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`)
  }

  const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME)

  if (!bucketExists) {
    // Create bucket
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/jpg"],
    })

    if (createError) {
      throw new Error(`Failed to create bucket: ${createError.message}`)
    }

    console.log(`✅ Created bucket: ${BUCKET_NAME}`)
  } else {
    console.log(`ℹ️  Bucket ${BUCKET_NAME} already exists`)
  }
}
