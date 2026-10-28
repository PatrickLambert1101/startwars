export type SyncChangeRow = Record<string, unknown>

/**
 * Some server rows are classified as "created" from their created_at timestamp,
 * even when this device already has the row (for example, immediately after
 * pushing it). WatermelonDB expects those rows in "updated".
 */
export function reclassifyExistingCreatedRows(
  created: SyncChangeRow[],
  updated: SyncChangeRow[],
  existingIds: ReadonlySet<string>,
): { created: SyncChangeRow[]; updated: SyncChangeRow[]; reclassifiedCount: number } {
  const genuinelyCreated: SyncChangeRow[] = []
  const existingCreated: SyncChangeRow[] = []

  for (const row of created) {
    const id = row.id
    if (typeof id === "string" && existingIds.has(id)) {
      existingCreated.push(row)
    } else {
      genuinelyCreated.push(row)
    }
  }

  return {
    created: genuinelyCreated,
    updated: [...updated, ...existingCreated],
    reclassifiedCount: existingCreated.length,
  }
}
