/**
 * RFC-4180 CSV building. Dependency-free so unit tests can run it without
 * pulling in native modules.
 */

/** Wrap every field in quotes and double any quotes inside it. */
export function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""'
  return `"${String(value).replace(/"/g, '""')}"`
}

export function buildCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n")
}
