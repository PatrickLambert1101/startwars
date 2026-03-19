/**
 * Test Data Generator
 *
 * Generates realistic sample data for development and demo purposes.
 * Creates animals, pastures, health records, weight records, and breeding records.
 */

import { database } from "@/db"
import { BREEDS_BY_SPECIES } from "@/db/models/Animal"
import type { AnimalSex, AnimalStatus } from "@/db/models/Animal"

// ─── Helpers ────────────────────────────────────────────────────────────────

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

function randomPastDate(minDaysAgo: number, maxDaysAgo: number): Date {
  return daysAgo(randomInt(minDaysAgo, maxDaysAgo))
}

// ─── Pasture data ────────────────────────────────────────────────────────────

const PASTURE_DATA = [
  { name: "North Pasture", code: "NP-01", forageType: "Kikuyu", waterSource: "Borehole", fenceType: "Electric" },
  { name: "South Pasture", code: "SP-01", forageType: "Eragrostis", waterSource: "Dam", fenceType: "Barbed wire" },
  { name: "East Paddock", code: "EP-01", forageType: "Buffel grass", waterSource: "River", fenceType: "Electric" },
  { name: "West Pasture", code: "WP-01", forageType: "Smuts finger", waterSource: "Borehole", fenceType: "Electric" },
  { name: "Breeding Camp", code: "BC-01", forageType: "Kikuyu", waterSource: "Trough", fenceType: "Game fence" },
  { name: "Weaning Camp", code: "WC-01", forageType: "Rye grass", waterSource: "Trough", fenceType: "Barbed wire" },
]

// ─── Animal names ─────────────────────────────────────────────────────────────

const BULL_NAMES = ["Thor", "Titan", "Goliath", "Duke", "Rex", "Atlas", "Samson", "Brutus", "Diesel", "Chief"]
const COW_NAMES = ["Daisy", "Bella", "Rosie", "Molly", "Nala", "Luna", "Stella", "Grace", "Amber", "Pearl"]

// ─── Health record data ───────────────────────────────────────────────────────

const HEALTH_RECORDS_DATA = [
  { type: "vaccination", description: "FMD Vaccination", product: "Aftovax", dosage: "2ml subcutaneous", withdrawalDays: 0 },
  { type: "vaccination", description: "Multivax Annual", product: "Multivax P Plus", dosage: "5ml subcutaneous", withdrawalDays: 21 },
  { type: "vaccination", description: "LSD Vaccination", product: "Herbivac LS", dosage: "1ml subcutaneous", withdrawalDays: 0 },
  { type: "treatment", description: "Deworming treatment", product: "Dectomax", dosage: "1ml per 10kg", withdrawalDays: 35 },
  { type: "treatment", description: "Tick treatment", product: "Triatix", dosage: "Spray application", withdrawalDays: 14 },
  { type: "vet_visit", description: "Routine health check", product: null, dosage: null, withdrawalDays: 0 },
  { type: "treatment", description: "Antibiotic treatment - respiratory", product: "Draxxin", dosage: "2.5mg/kg", withdrawalDays: 63 },
  { type: "condition_score", description: "Body condition scoring", product: null, dosage: null, withdrawalDays: 0 },
]

const ADMINISTERED_BY = ["Dr. van der Merwe", "Farmer", "Farmhand", "Dr. Nkosi", "Dr. Pretorius"]

// ─── Main generator ───────────────────────────────────────────────────────────

export interface GenerateTestDataOptions {
  animalCount?: number
  includeHealthRecords?: boolean
  includeWeightRecords?: boolean
  includeBreedingRecords?: boolean
  includePastures?: boolean
}

export interface GenerateTestDataResult {
  animalsCreated: number
  pasturesCreated: number
  healthRecordsCreated: number
  weightRecordsCreated: number
  breedingRecordsCreated: number
}

export async function generateTestData(
  organizationId: string,
  options: GenerateTestDataOptions = {},
): Promise<GenerateTestDataResult> {
  const {
    animalCount = 20,
    includeHealthRecords = true,
    includeWeightRecords = true,
    includeBreedingRecords = true,
    includePastures = true,
  } = options

  const result: GenerateTestDataResult = {
    animalsCreated: 0,
    pasturesCreated: 0,
    healthRecordsCreated: 0,
    weightRecordsCreated: 0,
    breedingRecordsCreated: 0,
  }

  // ── Step 1: Create pastures ──────────────────────────────────────────────
  const createdPastures: any[] = []

  if (includePastures) {
    await database.write(async () => {
      const pastureCollection = database.get("pastures")
      for (const p of PASTURE_DATA) {
        const pasture = await pastureCollection.create((record: any) => {
          record.organizationId = organizationId
          record.name = p.name
          record.code = p.code
          record.sizeHectares = randomFloat(10, 150)
          record.forageType = p.forageType
          record.waterSource = p.waterSource
          record.fenceType = p.fenceType
          record.hasSaltBlocks = Math.random() > 0.4
          record.hasMineralFeeders = Math.random() > 0.5
          record.maxCapacity = randomInt(20, 80)
          record.targetGrazingDays = randomInt(14, 45)
          record.targetRestDays = randomInt(30, 90)
          record.currentAnimalCount = 0
          record.isActive = true
          record.isDeleted = false
        })
        createdPastures.push(pasture)
        result.pasturesCreated++
      }
    })
  }

  // ── Step 2: Create animals ───────────────────────────────────────────────
  const createdAnimals: any[] = []
  const breeds = BREEDS_BY_SPECIES["cattle"]
  const sexOptions: AnimalSex[] = ["male", "female", "castrated"]
  const sexWeights: number[] = [0.15, 0.60, 0.25] // 15% bulls, 60% cows, 25% steers

  const bullIds: string[] = []
  const cowIds: string[] = []

  await database.write(async () => {
    const animalCollection = database.get("animals")
    let bullNameIdx = 0
    let cowNameIdx = 0

    for (let i = 0; i < animalCount; i++) {
      // Weighted sex selection
      const r = Math.random()
      let sex: AnimalSex
      if (r < sexWeights[0]) {
        sex = "male"
      } else if (r < sexWeights[0] + sexWeights[1]) {
        sex = "female"
      } else {
        sex = "castrated"
      }

      const visualTag = `${randomItem(["A", "B", "C", "T", "W"])}${String(i + 1).padStart(3, "0")}`
      const rfidTag = `ZA${Date.now().toString().slice(-6)}${String(i).padStart(4, "0")}`
      const dobDaysAgo = randomInt(365, 365 * 8) // 1-8 years old
      const hasPasture = includePastures && createdPastures.length > 0 && Math.random() > 0.2
      const pasture = hasPasture ? randomItem(createdPastures) : null
      const status: AnimalStatus = Math.random() > 0.05 ? "active" : randomItem(["sold", "transferred"])

      // Assign names only to bulls and some cows
      let name: string | null = null
      if (sex === "male" && Math.random() > 0.3 && bullNameIdx < BULL_NAMES.length) {
        name = BULL_NAMES[bullNameIdx++]
      } else if (sex === "female" && Math.random() > 0.6 && cowNameIdx < COW_NAMES.length) {
        name = COW_NAMES[cowNameIdx++]
      }

      const animal = await animalCollection.create((record: any) => {
        record.organizationId = organizationId
        record.species = "cattle"
        record.rfidTag = rfidTag
        record.visualTag = visualTag
        record.name = name
        record.breed = randomItem(breeds)
        record.sex = sex
        record.dateOfBirth = randomPastDate(dobDaysAgo, dobDaysAgo + 30)
        record.currentPastureId = pasture?.id ?? null
        record.status = status
        record.herdTag = randomItem(["A", "B", "C", null, null])
        record.isDeleted = false
      })

      createdAnimals.push(animal)
      result.animalsCreated++

      if (sex === "male") bullIds.push(animal.id)
      if (sex === "female") cowIds.push(animal.id)
    }
  })

  // ── Step 3: Health records ──────────────────────────────────────────────
  if (includeHealthRecords && createdAnimals.length > 0) {
    await database.write(async () => {
      const hrCollection = database.get("health_records")

      for (const animal of createdAnimals) {
        // 1-3 health records per animal
        const count = randomInt(1, 3)
        for (let i = 0; i < count; i++) {
          const template = randomItem(HEALTH_RECORDS_DATA)
          const recordDate = randomPastDate(30, 365)
          const withdrawalDate = template.withdrawalDays > 0
            ? new Date(recordDate.getTime() + template.withdrawalDays * 86400000)
            : null

          await hrCollection.create((record: any) => {
            record.organizationId = organizationId
            record.animalId = animal.id
            record.recordDate = recordDate
            record.recordType = template.type
            record.description = template.description
            record.productName = template.product
            record.dosage = template.dosage
            record.administeredBy = randomItem(ADMINISTERED_BY)
            record.withdrawalDate = withdrawalDate
            record.isDeleted = false
          })
          result.healthRecordsCreated++
        }
      }
    })
  }

  // ── Step 4: Weight records ───────────────────────────────────────────────
  if (includeWeightRecords && createdAnimals.length > 0) {
    await database.write(async () => {
      const wrCollection = database.get("weight_records")

      for (const animal of createdAnimals) {
        // 2-5 weight records per animal (historical trend)
        const count = randomInt(2, 5)
        // Base weight by sex
        const baseWeight = animal.sex === "male" ? randomFloat(380, 650) : animal.sex === "female" ? randomFloat(280, 480) : randomFloat(300, 500)

        for (let i = count; i >= 1; i--) {
          // Each record is older, weight slightly less (growth trend going forward)
          const daysBack = i * randomInt(45, 90)
          const growthFactor = 1 - i * randomFloat(0.02, 0.05)
          const weight = parseFloat((baseWeight * Math.max(0.5, growthFactor)).toFixed(1))

          await wrCollection.create((record: any) => {
            record.organizationId = organizationId
            record.animalId = animal.id
            record.recordDate = daysAgo(daysBack)
            record.weightKg = weight
            record.conditionScore = randomFloat(2.5, 4.5)
            record.isDeleted = false
          })
          result.weightRecordsCreated++
        }
      }
    })
  }

  // ── Step 5: Breeding records ─────────────────────────────────────────────
  if (includeBreedingRecords && cowIds.length > 0) {
    await database.write(async () => {
      const brCollection = database.get("breeding_records")

      // ~60% of cows have a breeding record
      const eligibleCows = createdAnimals.filter(
        (a) => a.sex === "female" && a.status === "active"
      )
      const cowsToBreed = eligibleCows.slice(0, Math.ceil(eligibleCows.length * 0.6))
      const methods = ["natural", "natural", "natural", "ai"] as const
      const outcomes = ["live_calf", "live_calf", "live_calf", "pending", "open", "aborted"] as const

      for (const cow of cowsToBreed) {
        const breedingDate = randomPastDate(90, 400)
        const method = randomItem(methods)
        const outcome = randomItem(outcomes)
        const expectedCalvingDate = new Date(breedingDate.getTime() + 283 * 86400000) // ~283 days gestation
        const actualCalvingDate = outcome === "live_calf"
          ? new Date(expectedCalvingDate.getTime() + randomInt(-14, 14) * 86400000)
          : null

        await brCollection.create((record: any) => {
          record.organizationId = organizationId
          record.animalId = cow.id
          record.bullId = bullIds.length > 0 ? randomItem(bullIds) : null
          record.breedingDate = breedingDate
          record.method = method
          record.expectedCalvingDate = expectedCalvingDate
          record.actualCalvingDate = actualCalvingDate
          record.outcome = outcome
          record.isDeleted = false
        })
        result.breedingRecordsCreated++
      }
    })
  }

  return result
}

/**
 * Remove all test/sample data created for an organization.
 * Soft-deletes all animals and related records.
 */
export async function clearAllData(organizationId: string): Promise<void> {
  await database.write(async () => {
    const tables = [
      "animals",
      "health_records",
      "weight_records",
      "breeding_records",
      "pastures",
      "pasture_movements",
    ]

    for (const table of tables) {
      const records = await database
        .get(table)
        .query()
        .fetch()

      const orgRecords = records.filter((r: any) => r.organizationId === organizationId)

      for (const record of orgRecords) {
        await (record as any).update((r: any) => {
          r.isDeleted = true
        })
      }
    }
  })
}
