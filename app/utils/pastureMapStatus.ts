import type { Pasture } from "@/db/models"

export type PastureMapStatusLevel = "green" | "amber" | "red" | "grey"

export interface PastureMapStatus {
  level: PastureMapStatusLevel
  label: string
  reason: string
}

export function getPastureMapStatus(
  pasture: Pasture,
  latestTickScore: number | null,
  now = new Date(),
): PastureMapStatus {
  if (!pasture.isActive) {
    return { level: "grey", label: "Inactive", reason: "Pasture is marked inactive" }
  }

  if (pasture.isOverCapacity) {
    return { level: "red", label: "Over capacity", reason: "Animal count is above capacity" }
  }

  if (pasture.shouldRotate) {
    return { level: "red", label: "Rotation due", reason: "Target grazing period has been reached" }
  }

  if (latestTickScore !== null && latestTickScore >= 4) {
    return {
      level: "red",
      label: "High tick load",
      reason: `Latest tick score is ${latestTickScore}/5`,
    }
  }

  const stillResting =
    !pasture.isOccupied &&
    pasture.availableFromDate !== null &&
    pasture.availableFromDate.getTime() > now.getTime()

  if (stillResting) {
    return { level: "amber", label: "Resting", reason: "Target rest period is not complete" }
  }

  if (pasture.statusColor === "yellow") {
    return {
      level: "amber",
      label: "Rotation nearing",
      reason: "Pasture is nearing its grazing target",
    }
  }

  if (latestTickScore !== null && latestTickScore >= 2) {
    return {
      level: "amber",
      label: "Watch ticks",
      reason: `Latest tick score is ${latestTickScore}/5`,
    }
  }

  const hasOperationalData =
    pasture.maxCapacity !== null ||
    pasture.targetGrazingDays !== null ||
    pasture.targetRestDays !== null ||
    latestTickScore !== null

  if (!hasOperationalData) {
    return {
      level: "grey",
      label: "Needs data",
      reason: "Add grazing targets, capacity, or tick observations",
    }
  }

  return pasture.isOccupied
    ? { level: "green", label: "On track", reason: "Within current capacity and grazing targets" }
    : { level: "green", label: "Available", reason: "No current rotation or tick alert" }
}
