/**
 * Default vaccination schedules for South African cattle farming
 *
 * These are automatically created when a new organization is set up
 * to help farmers get started with proper vaccination management.
 */

import { Q } from "@nozbe/watermelondb"
import { database } from "@/db"
import { TreatmentProtocol, VaccinationSchedule } from "@/db/models"

export type DefaultProtocol = {
  name: string
  productName: string
  dosage: string
  administrationMethod: string
  withdrawalDays: number
  targetSpecies: "cattle"
  description: string
}

export type DefaultSchedule = {
  protocolName: string // Will be matched to created protocol
  name: string
  description: string
  scheduleType: "age_based" | "date_based" | "group_based"
  targetAgeMonths?: number
  ageWindowDays?: number
  repeatAnnually?: boolean
  intervalMonths?: number
  requiresBooster: boolean
  boosterIntervalDays?: number
  boosterCount: number
  targetSex?: string
  minAgeMonths?: number
  maxAgeMonths?: number
}

/**
 * Default vaccination protocols for South African cattle
 */
export const DEFAULT_PROTOCOLS: DefaultProtocol[] = [
  {
    name: "Aftovax - FMD Vaccine",
    productName: "Aftovax (Onderstepoort)",
    dosage: "2ml subcutaneous",
    administrationMethod: "Subcutaneous injection",
    withdrawalDays: 0,
    targetSpecies: "cattle",
    description: "Foot-and-Mouth Disease vaccination - essential for SA cattle",
  },
  {
    name: "Multivax P Plus - Multi-disease",
    productName: "Multivax P Plus",
    dosage: "5ml subcutaneous",
    administrationMethod: "Subcutaneous injection",
    withdrawalDays: 21,
    targetSpecies: "cattle",
    description: "Multi-clostridial vaccine (blackleg, botulism, tetanus, etc.)",
  },
  {
    name: "Bovilis BVD",
    productName: "Bovilis BVD",
    dosage: "2ml intramuscular",
    administrationMethod: "Intramuscular injection",
    withdrawalDays: 0,
    targetSpecies: "cattle",
    description: "Bovine Viral Diarrhoea protection",
  },
  {
    name: "Bovela - Brucellosis",
    productName: "Bovela (RB51)",
    dosage: "2ml subcutaneous",
    administrationMethod: "Subcutaneous injection",
    withdrawalDays: 0,
    targetSpecies: "cattle",
    description: "Brucellosis vaccine for heifers (4-8 months)",
  },
  {
    name: "Lumpy Skin Disease Vaccine",
    productName: "Herbivac LS",
    dosage: "1ml subcutaneous",
    administrationMethod: "Subcutaneous injection",
    withdrawalDays: 0,
    targetSpecies: "cattle",
    description: "Lumpy Skin Disease protection",
  },
  {
    name: "Botulism Vaccine",
    productName: "Onderstepoort Botulism Vaccine",
    dosage: "5ml subcutaneous",
    administrationMethod: "Subcutaneous injection",
    withdrawalDays: 21,
    targetSpecies: "cattle",
    description: "Protection against botulism in cattle",
  },
]

/**
 * Default vaccination schedules matching SA veterinary recommendations
 */
export const DEFAULT_SCHEDULES: DefaultSchedule[] = [
  // FMD - Biannual for all cattle
  {
    protocolName: "Aftovax - FMD Vaccine",
    name: "FMD Primary Vaccination",
    description: "First FMD vaccination at 4 months of age",
    scheduleType: "age_based",
    targetAgeMonths: 4,
    ageWindowDays: 14,
    requiresBooster: true,
    boosterIntervalDays: 90, // 3 months later
    boosterCount: 2,
  },
  {
    protocolName: "Aftovax - FMD Vaccine",
    name: "FMD Biannual Booster",
    description: "FMD booster every 6 months for all adult cattle",
    scheduleType: "group_based",
    intervalMonths: 6,
    requiresBooster: false,
    boosterCount: 1,
    minAgeMonths: 8,
  },

  // Multivax (Clostridial diseases)
  {
    protocolName: "Multivax P Plus - Multi-disease",
    name: "Clostridial Primary - Calves",
    description: "First multivalent vaccination at 3 months",
    scheduleType: "age_based",
    targetAgeMonths: 3,
    ageWindowDays: 7,
    requiresBooster: true,
    boosterIntervalDays: 21, // 3 weeks
    boosterCount: 2,
  },
  {
    protocolName: "Multivax P Plus - Multi-disease",
    name: "Clostridial Annual Booster",
    description: "Annual booster for all adult cattle",
    scheduleType: "group_based",
    intervalMonths: 12,
    requiresBooster: false,
    boosterCount: 1,
    minAgeMonths: 6,
  },

  // Brucellosis - Heifers only
  {
    protocolName: "Bovela - Brucellosis",
    name: "Brucellosis - Heifers",
    description: "Brucellosis vaccination for heifers between 4-8 months",
    scheduleType: "age_based",
    targetAgeMonths: 5,
    ageWindowDays: 60, // Wide window (4-8 months)
    requiresBooster: false,
    boosterCount: 1,
    targetSex: "female",
    minAgeMonths: 4,
    maxAgeMonths: 8,
  },

  // Lumpy Skin Disease - Annual
  {
    protocolName: "Lumpy Skin Disease Vaccine",
    name: "LSD Primary - Calves",
    description: "Lumpy Skin Disease vaccination at 6 months",
    scheduleType: "age_based",
    targetAgeMonths: 6,
    ageWindowDays: 14,
    requiresBooster: false,
    boosterCount: 1,
  },
  {
    protocolName: "Lumpy Skin Disease Vaccine",
    name: "LSD Annual Booster",
    description: "Annual LSD booster for all cattle",
    scheduleType: "group_based",
    intervalMonths: 12,
    requiresBooster: false,
    boosterCount: 1,
    minAgeMonths: 12,
  },

  // BVD
  {
    protocolName: "Bovilis BVD",
    name: "BVD Primary Vaccination",
    description: "BVD protection starting at 6 months",
    scheduleType: "age_based",
    targetAgeMonths: 6,
    ageWindowDays: 14,
    requiresBooster: true,
    boosterIntervalDays: 21, // 3 weeks
    boosterCount: 2,
  },

  // Botulism - High-risk areas
  {
    protocolName: "Botulism Vaccine",
    name: "Botulism Primary - Calves",
    description: "Botulism vaccination in endemic areas at 3 months",
    scheduleType: "age_based",
    targetAgeMonths: 3,
    ageWindowDays: 7,
    requiresBooster: true,
    boosterIntervalDays: 21,
    boosterCount: 2,
  },
  {
    protocolName: "Botulism Vaccine",
    name: "Botulism Annual Booster",
    description: "Annual botulism booster for cattle in endemic areas",
    scheduleType: "group_based",
    intervalMonths: 12,
    requiresBooster: false,
    boosterCount: 1,
    minAgeMonths: 6,
  },
]

/**
 * Seed default protocols and schedules for a new organization
 */
export async function seedDefaultSchedules(organizationId: string) {
  console.log(`[DefaultSchedules] Seeding defaults for org: ${organizationId}`)

  try {
    await database.write(async () => {
      // Create default protocols
      const protocolMap = new Map<string, string>() // name -> id

      for (const defaultProtocol of DEFAULT_PROTOCOLS) {
        // Check if protocol already exists
        const existing = await database
          .get<TreatmentProtocol>("treatment_protocols")
          .query(
            Q.where("organization_id", organizationId),
            Q.where("name", defaultProtocol.name),
            Q.where("is_deleted", false),
          )
          .fetch()

        if (existing.length > 0) {
          console.log(`[DefaultSchedules] Protocol already exists: ${defaultProtocol.name}`)
          protocolMap.set(defaultProtocol.name, existing[0].id)
          continue
        }

        const protocol = await database.get<TreatmentProtocol>("treatment_protocols").create((p) => {
          p.organizationId = organizationId
          p.name = defaultProtocol.name
          p.description = defaultProtocol.description
          p.protocolType = "vaccination"
          p.productName = defaultProtocol.productName
          p.dosage = defaultProtocol.dosage
          p.administrationMethod = defaultProtocol.administrationMethod
          p.withdrawalDays = defaultProtocol.withdrawalDays
          p.targetSpecies = defaultProtocol.targetSpecies
          p.isActive = true
        })

        protocolMap.set(defaultProtocol.name, protocol.id)
        console.log(`[DefaultSchedules] Created protocol: ${defaultProtocol.name}`)
      }

      // Create default schedules
      for (const defaultSchedule of DEFAULT_SCHEDULES) {
        const protocolId = protocolMap.get(defaultSchedule.protocolName)
        if (!protocolId) {
          console.warn(`[DefaultSchedules] Protocol not found: ${defaultSchedule.protocolName}`)
          continue
        }

        // Check if schedule already exists
        const existing = await database
          .get<VaccinationSchedule>("vaccination_schedules")
          .query(
            Q.where("organization_id", organizationId),
            Q.where("name", defaultSchedule.name),
            Q.where("is_deleted", false),
          )
          .fetch()

        if (existing.length > 0) {
          console.log(`[DefaultSchedules] Schedule already exists: ${defaultSchedule.name}`)
          continue
        }

        await database.get<VaccinationSchedule>("vaccination_schedules").create((s) => {
          s.organizationId = organizationId
          s.protocolId = protocolId
          s.name = defaultSchedule.name
          s.description = defaultSchedule.description || ""
          s.scheduleType = defaultSchedule.scheduleType
          s.targetAgeMonths = defaultSchedule.targetAgeMonths || null
          s.ageWindowDays = defaultSchedule.ageWindowDays || null
          s.scheduledDate = null
          s.repeatAnnually = defaultSchedule.repeatAnnually || false
          s.pastureId = null
          s.intervalMonths = defaultSchedule.intervalMonths || null
          s.lastAppliedDate = null
          s.targetSpecies = "cattle"
          s.targetSex = defaultSchedule.targetSex || null
          s.minAgeMonths = defaultSchedule.minAgeMonths || null
          s.maxAgeMonths = defaultSchedule.maxAgeMonths || null
          s.requiresBooster = defaultSchedule.requiresBooster
          s.boosterIntervalDays = defaultSchedule.boosterIntervalDays || null
          s.boosterCount = defaultSchedule.boosterCount
          s.isActive = true
        })

        console.log(`[DefaultSchedules] Created schedule: ${defaultSchedule.name}`)
      }
    })

    console.log(`[DefaultSchedules] Successfully seeded defaults for org: ${organizationId}`)
    return true
  } catch (error) {
    console.error("[DefaultSchedules] Failed to seed defaults:", error)
    return false
  }
}
