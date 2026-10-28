/**
 * Persistent photo upload queue (offline-first).
 *
 * Records save to WatermelonDB immediately, but their photos upload to Supabase
 * Storage over the network. In the field there is often no connection, so an
 * upload attempted at save time would fail and the photo would be lost.
 *
 * This queue persists any photo that couldn't be uploaded (offline, or a
 * transient failure) to AsyncStorage, keyed by the record it belongs to. The
 * queue is flushed after every successful database sync (see useSync.ts): each
 * pending photo is uploaded via the existing `uploadPhoto` service and the
 * resulting remote `Photo` is merged into the owning record's `photos` field.
 *
 * The record's own row syncs independently through WatermelonDB; this only
 * backfills the `photos` JSON once the image bytes reach Storage.
 */
import AsyncStorage from "@react-native-async-storage/async-storage"

import { database } from "@/db"
import { uploadPhoto, type UploadPhotoOptions } from "@/services/photoStorage"
import { parsePhotos, serializePhotos, type Photo } from "@/types/Photo"

const QUEUE_KEY = "photo_upload_queue"

/** Give up on a single photo after this many failed flush attempts. */
const MAX_ATTEMPTS = 8

export interface PendingPhotoUpload {
  /** Stable id so we can dedupe and remove individual entries. */
  id: string
  /** Local WatermelonDB table that owns the record (e.g. "animals"). */
  table: string
  /** Id of the record whose `photos` field will receive the uploaded photo. */
  recordId: string
  category: UploadPhotoOptions["category"]
  organizationId: string
  localUri: string
  userId?: string
  caption?: string
  attempts: number
  queuedAt: number
}

type NewPendingPhoto = Omit<PendingPhotoUpload, "id" | "attempts" | "queuedAt">

async function readQueue(): Promise<PendingPhotoUpload[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn("[PhotoQueue] Failed to read queue:", err)
    return []
  }
}

async function writeQueue(queue: PendingPhotoUpload[]): Promise<void> {
  try {
    if (queue.length === 0) {
      await AsyncStorage.removeItem(QUEUE_KEY)
    } else {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    }
  } catch (err) {
    console.warn("[PhotoQueue] Failed to persist queue:", err)
  }
}

function makeId(entry: NewPendingPhoto): string {
  return `${entry.table}:${entry.recordId}:${entry.localUri}`
}

/**
 * Add photos to the persistent upload queue. Deduplicates on
 * (table, recordId, localUri) so retrying a save doesn't enqueue twice.
 */
export async function enqueuePhotoUploads(entries: NewPendingPhoto[]): Promise<void> {
  if (entries.length === 0) return

  const queue = await readQueue()
  const existingIds = new Set(queue.map((e) => e.id))

  for (const entry of entries) {
    const id = makeId(entry)
    if (existingIds.has(id)) continue
    queue.push({ ...entry, id, attempts: 0, queuedAt: Date.now() })
    existingIds.add(id)
  }

  await writeQueue(queue)
  if (__DEV__) console.log(`[PhotoQueue] Enqueued ${entries.length} photo(s); queue size ${queue.length}`)
}

/** Merge an uploaded photo into the owning record's `photos` JSON field. */
async function attachPhotoToRecord(
  table: string,
  recordId: string,
  photo: Photo,
): Promise<void> {
  await database.write(async () => {
    const record = await database.get(table).find(recordId)
    await record.update((r: any) => {
      const existing = parsePhotos(r.photos ?? null)
      // Skip if this exact remote URI is somehow already attached.
      if (existing.some((p) => p.uri === photo.uri)) return
      r.photos = serializePhotos([...existing, photo])
    })
  })
}

let isFlushing = false

/**
 * Attempt to upload every queued photo and attach it to its record.
 * Safe to call repeatedly; concurrent calls are ignored. Called after each
 * successful sync. Returns the number of photos successfully uploaded.
 */
export async function flushPhotoQueue(): Promise<number> {
  if (isFlushing) return 0
  isFlushing = true

  try {
    let queue = await readQueue()
    if (queue.length === 0) return 0

    if (__DEV__) console.log(`[PhotoQueue] Flushing ${queue.length} pending photo(s)`)

    const remaining: PendingPhotoUpload[] = []
    let uploaded = 0

    for (const entry of queue) {
      try {
        const { photo } = await uploadPhoto({
          localUri: entry.localUri,
          organizationId: entry.organizationId,
          category: entry.category,
          recordId: entry.recordId,
          userId: entry.userId,
          caption: entry.caption,
        })

        try {
          await attachPhotoToRecord(entry.table, entry.recordId, photo)
          uploaded += 1
        } catch (attachErr) {
          // The bytes are in Storage but the record is gone (e.g. deleted
          // before reconnect). Drop the entry rather than retrying forever.
          console.warn(
            `[PhotoQueue] Uploaded but could not attach to ${entry.table}/${entry.recordId}:`,
            attachErr,
          )
        }
      } catch (uploadErr) {
        const attempts = entry.attempts + 1
        if (attempts >= MAX_ATTEMPTS) {
          console.error(
            `[PhotoQueue] Giving up on photo after ${attempts} attempts (${entry.table}/${entry.recordId}):`,
            uploadErr,
          )
        } else {
          // Still offline / transient failure — keep it for the next flush.
          remaining.push({ ...entry, attempts })
        }
      }
    }

    await writeQueue(remaining)
    if (__DEV__) {
      console.log(`[PhotoQueue] Flush complete: ${uploaded} uploaded, ${remaining.length} still pending`)
    }
    return uploaded
  } catch (err) {
    console.error("[PhotoQueue] Flush failed:", err)
    return 0
  } finally {
    isFlushing = false
  }
}

/** Number of photos currently waiting to upload (for optional UI). */
export async function getPendingPhotoCount(): Promise<number> {
  const queue = await readQueue()
  return queue.length
}
