export type DashboardConfidence =
  | "firstSync"
  | "syncProblem"
  | "reviewHistory"
  | "setUpSchedules"
  | "localSummary"

export function getDashboardConfidence({
  lastSynced,
  syncStatus,
  historiesToReview,
  activeSchedules,
}: {
  lastSynced: Date | null
  syncStatus: string
  historiesToReview: number
  activeSchedules: number
}): DashboardConfidence {
  if (syncStatus === "error") return "syncProblem"
  if (!lastSynced) return "firstSync"
  if (historiesToReview > 0) return "reviewHistory"
  if (activeSchedules === 0) return "setUpSchedules"
  return "localSummary"
}
