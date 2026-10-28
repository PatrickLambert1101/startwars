import { buildCsv } from "@/services/reports/csvFormat"
import { writeAndShareFile } from "@/services/reports/shareFile"

import type { DataImportType } from "./types"

const ANIMAL_TEMPLATE = [
  [
    "Visual Tag",
    "RFID Tag",
    "Name",
    "Species",
    "Breed",
    "Sex",
    "Birth Date",
    "Status",
    "Sire",
    "Sire Breed",
    "Dam",
    "Dam Breed",
    "Registration Number",
    "Herd/Group",
    "Vaccinations Current",
    "Acquired By",
    "Source Farm or Breeder",
    "Notes",
  ],
  [
    "C102",
    "900001234567",
    "Daisy",
    "Cattle",
    "Bonsmara",
    "Female",
    "14/06/2024",
    "Active",
    "BULL-12",
    "Boran",
    "C087",
    "Nguni",
    "",
    "Breeding herd",
    "Yes",
    "Birth",
    "Example Boran Stud",
    "Example row — replace or remove",
  ],
]

const TREATMENT_TEMPLATE = [
  [
    "Animal Tag",
    "Date",
    "Type",
    "Description",
    "Product",
    "Dosage",
    "Given By",
    "Withdrawal Date",
    "Withdrawal Days",
    "Notes",
  ],
  [
    "C102",
    "14/06/2026",
    "Treatment",
    "Tick treatment",
    "Example product",
    "10 ml",
    "Farm manager",
    "28/06/2026",
    "",
    "Example row — replace or remove",
  ],
]

const GRAZING_TEMPLATE = [
  ["Pasture", "Start Date", "End Date", "Herd/Group", "Animal Count", "Notes"],
  [
    "North Camp",
    "01/05/2026",
    "08/05/2026",
    "Breeding herd",
    43,
    "Example row — replace or remove",
  ],
]

export async function shareImportTemplate(type: DataImportType): Promise<void> {
  const rows =
    type === "animals"
      ? ANIMAL_TEMPLATE
      : type === "treatments"
        ? TREATMENT_TEMPLATE
        : GRAZING_TEMPLATE
  const fileName =
    type === "animals"
      ? "HerdTrackr_animal_import_template.csv"
      : type === "treatments"
        ? "HerdTrackr_treatment_import_template.csv"
        : "HerdTrackr_grazing_import_template.csv"
  await writeAndShareFile(fileName, `\uFEFF${buildCsv(rows)}`, "text/csv", "utf8")
}
