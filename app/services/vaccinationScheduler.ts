import { Q } from "@nozbe/watermelondb"
import { database } from "@/db"
import { VaccinationSchedule, ScheduledVaccination, Animal } from "@/db/models"

/**
 * Calculate which animals need vaccination based on active schedules
 * This should be run daily or when schedules are created/updated
 */
export async function calculateScheduledVaccinations(organizationId: string) {
  console.log("[VaccinationScheduler] Starting calculation for org:", organizationId)

  try {
    // Get all active schedules
    const schedules = await database
      .get<VaccinationSchedule>("vaccination_schedules")
      .query(
        Q.where("organization_id", organizationId),
        Q.where("is_deleted", false),
        Q.where("is_active", true),
      )
      .fetch()

    console.log("[VaccinationScheduler] Found", schedules.length, "active schedules")

    for (const schedule of schedules) {
      await processSchedule(schedule, organizationId)
    }

    console.log("[VaccinationScheduler] Calculation complete")
  } catch (error) {
    console.error("[VaccinationScheduler] Error calculating vaccinations:", error)
    throw error
  }
}

/**
 * Process a single vaccination schedule
 */
async function processSchedule(schedule: VaccinationSchedule, organizationId: string) {
  console.log("[VaccinationScheduler] Processing schedule:", schedule.name, schedule.scheduleType)

  switch (schedule.scheduleType) {
    case "age_based":
      await processAgeBasedSchedule(schedule, organizationId)
      break
    case "date_based":
      await processDateBasedSchedule(schedule, organizationId)
      break
    case "group_based":
      await processGroupBasedSchedule(schedule, organizationId)
      break
    default:
      console.warn("[VaccinationScheduler] Unknown schedule type:", schedule.scheduleType)
  }
}

/**
 * Process age-based schedule (e.g., "all calves at 3 months")
 */
async function processAgeBasedSchedule(schedule: VaccinationSchedule, organizationId: string) {
  if (!schedule.targetAgeMonths) {
    console.warn("[VaccinationScheduler] Age-based schedule missing target_age_months:", schedule.id)
    return
  }

  const targetAgeMs = schedule.targetAgeMonths * 30.44 * 24 * 60 * 60 * 1000 // ~30.44 days per month
  const windowMs = (schedule.ageWindowDays || 7) * 24 * 60 * 60 * 1000
  const now = Date.now()

  // Calculate age range
  const minAgeMs = targetAgeMs - windowMs
  const maxAgeMs = targetAgeMs + windowMs
  const minBirthDate = new Date(now - maxAgeMs)
  const maxBirthDate = new Date(now - minAgeMs)

  if (__DEV__) {
    console.log(
      `[VaccinationScheduler] Age criteria: ${schedule.targetAgeMonths} months ± ${schedule.ageWindowDays || 7} days`,
      `\n  Birth date range: ${minBirthDate.toISOString()} to ${maxBirthDate.toISOString()}`,
      `\n  Target species: ${schedule.targetSpecies || "any"}`,
      `\n  Target sex: ${schedule.targetSex || "any"}`
    )
  }

  // Query animals matching criteria
  const queryConditions = [
    Q.where("organization_id", organizationId),
    Q.where("is_deleted", false),
    Q.where("status", "active"),
    Q.where("date_of_birth", Q.between(minBirthDate.getTime(), maxBirthDate.getTime())),
  ]

  // Apply filters
  if (schedule.targetSpecies) {
    queryConditions.push(Q.where("species", schedule.targetSpecies))
  }
  if (schedule.targetSex) {
    queryConditions.push(Q.where("sex", schedule.targetSex))
  }

  const animals = await database
    .get<Animal>("animals")
    .query(...queryConditions)
    .fetch()

  if (__DEV__) {
    console.log("[VaccinationScheduler] Found", animals.length, "animals matching age criteria")
    if (animals.length > 0) {
      console.log("  Sample animal:", {
        name: animals[0].displayName,
        species: animals[0].species,
        sex: animals[0].sex,
        dateOfBirth: animals[0].dateOfBirth?.toISOString()
      })
    }
  }

  // Create scheduled vaccinations for animals that don't already have one
  for (const animal of animals) {
    await ensureScheduledVaccination(schedule, animal, calculateDueDate(animal, schedule))
  }
}

/**
 * Process date-based schedule (e.g., "March 15, 2026")
 */
async function processDateBasedSchedule(schedule: VaccinationSchedule, organizationId: string) {
  if (!schedule.scheduledDate) {
    console.warn("[VaccinationScheduler] Date-based schedule missing scheduled_date:", schedule.id)
    return
  }

  // Query animals matching criteria
  const queryConditions = [
    Q.where("organization_id", organizationId),
    Q.where("is_deleted", false),
    Q.where("status", "active"),
  ]

  // Apply filters
  if (schedule.targetSpecies) {
    queryConditions.push(Q.where("species", schedule.targetSpecies))
  }
  if (schedule.targetSex) {
    queryConditions.push(Q.where("sex", schedule.targetSex))
  }

  // Age filters (if any)
  if (schedule.minAgeMonths !== null || schedule.maxAgeMonths !== null) {
    const now = Date.now()
    if (schedule.maxAgeMonths) {
      const minBirthDate = new Date(now - schedule.maxAgeMonths * 30.44 * 24 * 60 * 60 * 1000)
      queryConditions.push(Q.where("date_of_birth", Q.gte(minBirthDate.getTime())))
    }
    if (schedule.minAgeMonths) {
      const maxBirthDate = new Date(now - schedule.minAgeMonths * 30.44 * 24 * 60 * 60 * 1000)
      queryConditions.push(Q.where("date_of_birth", Q.lte(maxBirthDate.getTime())))
    }
  }

  const animals = await database
    .get<Animal>("animals")
    .query(...queryConditions)
    .fetch()

  console.log("[VaccinationScheduler] Found", animals.length, "animals for date-based schedule")

  // Create scheduled vaccinations
  for (const animal of animals) {
    await ensureScheduledVaccination(schedule, animal, schedule.scheduledDate)
  }
}

/**
 * Process group-based schedule (e.g., "Pasture A every 6 months")
 */
async function processGroupBasedSchedule(schedule: VaccinationSchedule, organizationId: string) {
  if (!schedule.pastureId || !schedule.intervalMonths) {
    console.warn("[VaccinationScheduler] Group-based schedule missing pasture_id or interval_months:", schedule.id)
    return
  }

  // Query animals in the specified pasture
  const queryConditions = [
    Q.where("organization_id", organizationId),
    Q.where("is_deleted", false),
    Q.where("status", "active"),
    Q.where("current_pasture_id", schedule.pastureId),
  ]

  // Apply filters
  if (schedule.targetSpecies) {
    queryConditions.push(Q.where("species", schedule.targetSpecies))
  }
  if (schedule.targetSex) {
    queryConditions.push(Q.where("sex", schedule.targetSex))
  }

  const animals = await database
    .get<Animal>("animals")
    .query(...queryConditions)
    .fetch()

  console.log("[VaccinationScheduler] Found", animals.length, "animals in pasture")

  // Calculate due date based on last applied date or interval
  const dueDate = schedule.lastAppliedDate
    ? new Date(schedule.lastAppliedDate.getTime() + schedule.intervalMonths * 30.44 * 24 * 60 * 60 * 1000)
    : new Date() // If never applied, due now

  // Create scheduled vaccinations
  for (const animal of animals) {
    await ensureScheduledVaccination(schedule, animal, dueDate)
  }
}

/**
 * Calculate due date for an animal based on their birth date
 */
function calculateDueDate(animal: Animal, schedule: VaccinationSchedule): Date {
  if (!animal.dateOfBirth || !schedule.targetAgeMonths) {
    return new Date() // Default to now if no birth date
  }

  const birthTime = animal.dateOfBirth.getTime()
  const targetAgeMs = schedule.targetAgeMonths * 30.44 * 24 * 60 * 60 * 1000
  return new Date(birthTime + targetAgeMs)
}

/**
 * Ensure a scheduled vaccination exists for an animal + schedule combo
 * Only creates if one doesn't already exist (pending or administered)
 */
async function ensureScheduledVaccination(schedule: VaccinationSchedule, animal: Animal, dueDate: Date) {
  // Check if already scheduled
  const existing = await database
    .get<ScheduledVaccination>("scheduled_vaccinations")
    .query(
      Q.where("animal_id", animal.id),
      Q.where("schedule_id", schedule.id),
      Q.where("is_deleted", false),
      Q.where("dose_number", 1), // Only check for first dose
      Q.or(
        Q.where("status", "pending"),
        Q.where("status", "administered"),
      ),
    )
    .fetch()

  if (existing.length > 0) {
    console.log("[VaccinationScheduler] Vaccination already scheduled for animal:", animal.displayName)
    return
  }

  // Create new scheduled vaccination
  await database.write(async () => {
    await database.get<ScheduledVaccination>("scheduled_vaccinations").create((v) => {
      v.organizationId = animal.organizationId
      v.animalId = animal.id
      v.scheduleId = schedule.id
      v.status = "pending"
      v.dueDate = dueDate
      v.doseNumber = 1
      v.parentVaccinationId = null
      v.isDeleted = false
    })
  })

  console.log("[VaccinationScheduler] Created vaccination for:", animal.displayName, "due:", dueDate.toLocaleDateString())
}

/**
 * Update overdue status for pending vaccinations
 * Run this daily to mark vaccinations that have passed their due date
 */
export async function updateOverdueVaccinations(organizationId: string) {
  console.log("[VaccinationScheduler] Updating overdue status")

  const now = new Date()
  const pending = await database
    .get<ScheduledVaccination>("scheduled_vaccinations")
    .query(
      Q.where("organization_id", organizationId),
      Q.where("is_deleted", false),
      Q.where("status", "pending"),
      Q.where("due_date", Q.lt(now.getTime())),
    )
    .fetch()

  console.log("[VaccinationScheduler] Found", pending.length, "overdue vaccinations")

  await database.write(async () => {
    for (const vaccination of pending) {
      await vaccination.update((v) => {
        v.status = "overdue"
      })
    }
  })
}

/**
 * Recalculate vaccinations for a specific schedule
 * Useful when a schedule is created or modified
 */
export async function recalculateSchedule(scheduleId: string) {
  console.log("[VaccinationScheduler] Recalculating schedule:", scheduleId)

  const schedule = await database.get<VaccinationSchedule>("vaccination_schedules").find(scheduleId)
  await processSchedule(schedule, schedule.organizationId)
}
