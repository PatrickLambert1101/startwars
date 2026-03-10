import { supabase } from "./supabase"
import * as FileSystem from "expo-file-system"
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
  const fullImageBase64 = await FileSystem.readAsStringAsync(compressedUri, {
    encoding: "base64",
  })
  const thumbnailBase64 = await FileSystem.readAsStringAsync(thumbnailUri, {
    encoding: "base64",
  })

  // Convert base64 to blob
  const fullImageBlob = base64ToBlob(fullImageBase64, "image/jpeg")
  const thumbnailBlob = base64ToBlob(thumbnailBase64, "image/jpeg")

  // Upload full-size image
  const { data: fullImageData, error: fullImageError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, fullImageBlob, {
      contentType: "image/jpeg",
      upsert: false,
    })

  if (fullImageError) {
    throw new Error(`Failed to upload photo: ${fullImageError.message}`)
  }

  // Upload thumbnail
  const { data: thumbnailData, error: thumbnailError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(thumbnailPath, thumbnailBlob, {
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
 * Helper to convert base64 to Blob (for React Native)
 */
function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64)
  const byteArrays: Uint8Array[] = []

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512)
    const byteNumbers = new Array(slice.length)

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    byteArrays.push(byteArray)
  }

  return new Blob(byteArrays, { type: contentType })
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
