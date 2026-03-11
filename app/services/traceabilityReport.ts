import { database } from "@/db"
import { Animal } from "@/db/models/Animal"
import { HealthRecord } from "@/db/models/HealthRecord"
import { WeightRecord } from "@/db/models/WeightRecord"
import { BreedingRecord } from "@/db/models/BreedingRecord"
import { PastureMovement } from "@/db/models/PastureMovement"
import { Q } from "@nozbe/watermelondb"
import { format } from "date-fns"

export type AnimalTraceabilityData = {
  animal: Animal
  healthRecords: HealthRecord[]
  weightRecords: WeightRecord[]
  breedingRecords: BreedingRecord[]
  pastureMovements: PastureMovement[]
  sire: Animal | null
  dam: Animal | null
  photos: Array<{ uri: string; timestamp?: string }>
}

export type TraceabilityReportData = {
  organization: {
    name: string
    location: string | null
  }
  animals: AnimalTraceabilityData[]
  generatedAt: Date
}

/**
 * Fetch complete traceability data for a single animal
 */
export async function fetchAnimalTraceabilityData(
  animalId: string,
): Promise<AnimalTraceabilityData> {
  const animal = await database.get<Animal>("animals").find(animalId)

  const [healthRecords, weightRecords, breedingRecords, pastureMovements] = await Promise.all([
    database
      .get<HealthRecord>("health_records")
      .query(Q.where("animal_id", animalId), Q.where("is_deleted", false), Q.sortBy("record_date", Q.desc))
      .fetch(),
    database
      .get<WeightRecord>("weight_records")
      .query(Q.where("animal_id", animalId), Q.where("is_deleted", false), Q.sortBy("record_date", Q.desc))
      .fetch(),
    database
      .get<BreedingRecord>("breeding_records")
      .query(Q.where("animal_id", animalId), Q.where("is_deleted", false), Q.sortBy("breeding_date", Q.desc))
      .fetch(),
    database
      .get<PastureMovement>("pasture_movements")
      .query(Q.where("animal_id", animalId), Q.where("is_deleted", false), Q.sortBy("movement_date", Q.desc))
      .fetch(),
  ])

  // Fetch parent animals if available
  let sire: Animal | null = null
  let dam: Animal | null = null

  if (animal.sireId) {
    try {
      sire = await database.get<Animal>("animals").find(animal.sireId)
    } catch (e) {
      console.log("Sire not found:", animal.sireId)
    }
  }

  if (animal.damId) {
    try {
      dam = await database.get<Animal>("animals").find(animal.damId)
    } catch (e) {
      console.log("Dam not found:", animal.damId)
    }
  }

  // Parse photos from JSON string
  let photos: Array<{ uri: string; timestamp?: string }> = []
  if (animal.photos) {
    try {
      photos = JSON.parse(animal.photos)
    } catch (e) {
      console.error("Failed to parse photos:", e)
    }
  }

  return {
    animal,
    healthRecords,
    weightRecords,
    breedingRecords,
    pastureMovements,
    sire,
    dam,
    photos,
  }
}

/**
 * Generate a formatted text report for an animal
 */
export function formatAnimalTraceabilityReport(data: AnimalTraceabilityData): string {
  const { animal, healthRecords, weightRecords, breedingRecords, pastureMovements, sire, dam, photos } = data

  let report = ""

  // Header
  report += "═══════════════════════════════════════════════════════\n"
  report += "           LIVESTOCK TRACEABILITY REPORT\n"
  report += "═══════════════════════════════════════════════════════\n\n"

  // Animal Information
  report += "ANIMAL IDENTIFICATION\n"
  report += "─────────────────────────────────────────────────────\n"
  report += `Visual Tag:           ${animal.visualTag}\n`
  report += `RFID Tag:             ${animal.rfidTag}\n`
  if (animal.name) report += `Name:                 ${animal.name}\n`
  if (animal.herdTag) report += `Herd/Group Tag:       ${animal.herdTag}\n`
  if (animal.registrationNumber) report += `Registration No:      ${animal.registrationNumber}\n`
  report += `Species:              ${animal.species}\n`
  report += `Breed:                ${animal.breed}\n`
  report += `Sex:                  ${animal.sexLabel}\n`
  if (animal.dateOfBirth) {
    report += `Date of Birth:        ${format(new Date(animal.dateOfBirth), "yyyy-MM-dd")}\n`
  }
  report += `Status:               ${animal.status}\n`
  report += `Record Created:       ${format(new Date(animal.createdAt), "yyyy-MM-dd HH:mm")}\n`
  if (animal.notes) report += `Notes:                ${animal.notes}\n`
  report += "\n"

  // Parentage
  if (sire || dam) {
    report += "PARENTAGE\n"
    report += "─────────────────────────────────────────────────────\n"
    if (sire) report += `Sire:                 ${sire.displayName} (${sire.breed})\n`
    if (dam) report += `Dam:                  ${dam.displayName} (${dam.breed})\n`
    report += "\n"
  }

  // Health Records
  if (healthRecords.length > 0) {
    report += "HEALTH RECORDS\n"
    report += "─────────────────────────────────────────────────────\n"
    healthRecords.forEach((record, index) => {
      report += `[${index + 1}] ${format(new Date(record.recordDate), "yyyy-MM-dd")} - ${record.recordType.toUpperCase()}\n`
      if (record.description) report += `    Description:      ${record.description}\n`
      if (record.productName) report += `    Product:          ${record.productName}\n`
      if (record.dosage) report += `    Dosage:           ${record.dosage}\n`
      if (record.administeredBy) report += `    Administered By:  ${record.administeredBy}\n`
      if (record.notes) report += `    Notes:            ${record.notes}\n`
      report += "\n"
    })
  } else {
    report += "HEALTH RECORDS\n"
    report += "─────────────────────────────────────────────────────\n"
    report += "No health records found.\n\n"
  }

  // Weight Records
  if (weightRecords.length > 0) {
    report += "WEIGHT RECORDS\n"
    report += "─────────────────────────────────────────────────────\n"
    weightRecords.forEach((record, index) => {
      report += `[${index + 1}] ${format(new Date(record.recordDate), "yyyy-MM-dd")} - ${record.weightKg} kg\n`
      if (record.conditionScore) report += `    Condition Score:  ${record.conditionScore}\n`
      if (record.notes) report += `    Notes:            ${record.notes}\n`
    })
    report += "\n"
  } else {
    report += "WEIGHT RECORDS\n"
    report += "─────────────────────────────────────────────────────\n"
    report += "No weight records found.\n\n"
  }

  // Breeding Records
  if (breedingRecords.length > 0) {
    report += "BREEDING RECORDS\n"
    report += "─────────────────────────────────────────────────────\n"
    breedingRecords.forEach((record, index) => {
      report += `[${index + 1}] ${format(new Date(record.breedingDate), "yyyy-MM-dd")} - ${record.method.toUpperCase()}\n`
      if (record.outcome) report += `    Outcome:          ${record.outcome}\n`
      if (record.expectedCalvingDate) report += `    Expected Calving: ${format(new Date(record.expectedCalvingDate), "yyyy-MM-dd")}\n`
      if (record.actualCalvingDate) report += `    Actual Calving:   ${format(new Date(record.actualCalvingDate), "yyyy-MM-dd")}\n`
      if (record.notes) report += `    Notes:            ${record.notes}\n`
    })
    report += "\n"
  } else {
    report += "BREEDING RECORDS\n"
    report += "─────────────────────────────────────────────────────\n"
    report += "No breeding records found.\n\n"
  }

  // Pasture Movement History
  if (pastureMovements.length > 0) {
    report += "PASTURE MOVEMENT HISTORY\n"
    report += "─────────────────────────────────────────────────────\n"
    pastureMovements.forEach((movement, index) => {
      report += `[${index + 1}] ${format(new Date(movement.movementDate), "yyyy-MM-dd")}\n`
      report += `    Pasture ID:       ${movement.pastureId}\n`
      report += `    Movement Type:    ${movement.movementType}\n`
      if (movement.movedBy) report += `    Moved By:         ${movement.movedBy}\n`
      if (movement.notes) report += `    Notes:            ${movement.notes}\n`
    })
    report += "\n"
  }

  // Photos
  if (photos.length > 0) {
    report += "PHOTOS\n"
    report += "─────────────────────────────────────────────────────\n"
    report += `${photos.length} photo(s) on file\n\n`
  }

  // Footer
  report += "═══════════════════════════════════════════════════════\n"
  report += `Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}\n`
  report += "═══════════════════════════════════════════════════════\n"

  return report
}

/**
 * Generate a full traceability report for multiple animals
 */
export async function generateTraceabilityReport(
  animalIds: string[],
  organizationName: string,
  organizationLocation: string | null,
): Promise<TraceabilityReportData> {
  const animalsData = await Promise.all(animalIds.map((id) => fetchAnimalTraceabilityData(id)))

  return {
    organization: {
      name: organizationName,
      location: organizationLocation,
    },
    animals: animalsData,
    generatedAt: new Date(),
  }
}

/**
 * Format a full report with multiple animals
 */
export function formatFullTraceabilityReport(reportData: TraceabilityReportData): string {
  let fullReport = ""

  // Main Header
  fullReport += "═══════════════════════════════════════════════════════\n"
  fullReport += "         COMPREHENSIVE TRACEABILITY REPORT\n"
  fullReport += "═══════════════════════════════════════════════════════\n\n"

  fullReport += "ORGANIZATION INFORMATION\n"
  fullReport += "─────────────────────────────────────────────────────\n"
  fullReport += `Organization:         ${reportData.organization.name}\n`
  if (reportData.organization.location) {
    fullReport += `Location:             ${reportData.organization.location}\n`
  }
  fullReport += `Report Generated:     ${format(reportData.generatedAt, "yyyy-MM-dd HH:mm:ss")}\n`
  fullReport += `Total Animals:        ${reportData.animals.length}\n`
  fullReport += "\n\n"

  // Individual animal reports
  reportData.animals.forEach((animalData, index) => {
    fullReport += `ANIMAL ${index + 1} OF ${reportData.animals.length}\n\n`
    fullReport += formatAnimalTraceabilityReport(animalData)
    if (index < reportData.animals.length - 1) {
      fullReport += "\n\n\n"
    }
  })

  return fullReport
}
