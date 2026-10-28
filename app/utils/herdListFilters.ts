export const DEFAULT_HERD_STATUSES = ["active", "transferred"] as const

export function isDefaultStatusFilter(statuses: string[]): boolean {
  return (
    statuses.length === DEFAULT_HERD_STATUSES.length &&
    DEFAULT_HERD_STATUSES.every((status) => statuses.includes(status))
  )
}
