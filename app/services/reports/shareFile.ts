// expo-file-system v19's default export is the new File API which has no
// base64 string writes; the legacy API is still the supported path for that.
import * as Sharing from "expo-sharing"
import * as FileSystem from "expo-file-system/legacy"

export type ShareMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "text/csv"

const UTI_BY_MIME: Record<ShareMimeType, string> = {
  "application/pdf": "com.adobe.pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    "org.openxmlformats.spreadsheetml.sheet",
  "text/csv": "public.comma-separated-values-text",
}

/** Strip characters that break filenames across iOS/Android share targets. */
export function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_. ]/g, "").replace(/\s+/g, "_")
}

/**
 * Write a string payload to the cache directory and open the OS share sheet.
 * `encoding` should be Base64 for binary formats (xlsx, pdf bytes) and UTF8
 * for text formats.
 */
export async function writeAndShareFile(
  fileName: string,
  contents: string,
  mimeType: ShareMimeType,
  encoding: "base64" | "utf8",
): Promise<void> {
  const uri = `${FileSystem.cacheDirectory}${safeFileName(fileName)}`
  await FileSystem.writeAsStringAsync(uri, contents, {
    encoding: encoding === "base64" ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8,
  })
  await shareFileUri(uri, mimeType)
}

/** Share an existing file (e.g. the PDF produced by expo-print). */
export async function shareFileUri(uri: string, mimeType: ShareMimeType): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device")
  }
  await Sharing.shareAsync(uri, { mimeType, UTI: UTI_BY_MIME[mimeType] })
}

/**
 * Move a file produced elsewhere (expo-print writes to a random name) to a
 * descriptive filename so the share sheet and receiving apps show it nicely.
 */
export async function renameToCache(sourceUri: string, fileName: string): Promise<string> {
  const target = `${FileSystem.cacheDirectory}${safeFileName(fileName)}`
  // Overwrite any stale file from a previous export with the same name
  await FileSystem.deleteAsync(target, { idempotent: true })
  await FileSystem.moveAsync({ from: sourceUri, to: target })
  return target
}
