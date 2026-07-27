import { format } from "date-fns"
import type { TFunction } from "i18next"

import { animalColumnHeader, animalColumnValue, reportGroupLabel } from "./csvExport"
import type { ReportResult } from "./reportEngine"
import { writeAndShareFile } from "./shareFile"

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" as const

function formatDate(date: Date | null | undefined): string {
  return date ? format(date, "yyyy-MM-dd") : ""
}

/**
 * Multi-sheet Excel workbook for a report result: Summary, Animals, then one
 * sheet per included history section. SheetJS is ~1MB of JS, so it is imported
 * lazily here and never touches app startup.
 */
export async function exportReportAsXlsx(
  result: ReportResult,
  baseFileName: string,
  orgName: string,
  t: TFunction,
): Promise<void> {
  const XLSX = await import("xlsx")

  const workbook = XLSX.utils.book_new()

  // --- Summary sheet -------------------------------------------------------
  const summaryRows: (string | number)[][] = [
    [t("reportsScreen.export.workbook.farm"), orgName],
    [t("reportsScreen.export.workbook.generated"), format(new Date(), "yyyy-MM-dd HH:mm")],
    [t("reportsScreen.export.workbook.totalAnimals"), result.totalCount],
  ]
  if (result.config.groupBy) {
    summaryRows.push([])
    summaryRows.push([
      t("reportsScreen.viewer.groupedBy", {
        field: t(`reportsScreen.groupBy.${result.config.groupBy}`),
      }),
      "",
    ])
    for (const group of result.groups) {
      summaryRows.push([reportGroupLabel(result, group, t), group.rows.length])
    }
  }
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet(summaryRows),
    t("reportsScreen.export.workbook.summarySheet"),
  )

  // --- Animals sheet -------------------------------------------------------
  const groupHeader = t("reportsScreen.export.workbook.groupColumn")
  const animalHeader = result.config.groupBy
    ? [groupHeader, ...result.config.columns.map((c) => animalColumnHeader(c, t))]
    : result.config.columns.map((c) => animalColumnHeader(c, t))
  const animalRows: string[][] = []
  for (const group of result.groups) {
    const label = result.config.groupBy ? reportGroupLabel(result, group, t) : null
    for (const row of group.rows) {
      const values = result.config.columns.map((c) => animalColumnValue(c, row))
      animalRows.push(label !== null ? [label, ...values] : values)
    }
  }
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([animalHeader, ...animalRows]),
    t("reportsScreen.export.workbook.animalsSheet"),
  )

  // --- History sheets ------------------------------------------------------
  const animalName = (animalId: string): string => {
    for (const group of result.groups) {
      const found = group.rows.find((r) => r.animal.id === animalId)
      if (found) return found.animal.visualTag || found.animal.displayName
    }
    return animalId
  }

  if (result.config.sections.includes("health")) {
    const rows: string[][] = [
      [
        t("reportsScreen.columns.visualTag"),
        t("reportsScreen.export.workbook.date"),
        t("reportsScreen.export.workbook.type"),
        t("reportsScreen.export.workbook.description"),
        t("reportsScreen.export.workbook.product"),
        t("reportsScreen.export.workbook.dosage"),
        t("reportsScreen.export.workbook.administeredBy"),
      ],
    ]
    for (const [animalId, records] of result.related.health) {
      for (const record of records) {
        rows.push([
          animalName(animalId),
          formatDate(record.recordDate),
          record.recordType,
          record.description ?? "",
          record.productName ?? "",
          record.dosage ?? "",
          record.administeredBy ?? "",
        ])
      }
    }
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(rows),
      t("reportsScreen.export.workbook.healthSheet"),
    )
  }

  if (result.config.sections.includes("weights")) {
    const rows: (string | number)[][] = [
      [
        t("reportsScreen.columns.visualTag"),
        t("reportsScreen.export.workbook.date"),
        t("reportsScreen.export.workbook.weightKg"),
        t("reportsScreen.export.workbook.conditionScore"),
      ],
    ]
    for (const [animalId, records] of result.related.weights) {
      for (const record of records) {
        rows.push([
          animalName(animalId),
          formatDate(record.recordDate),
          record.weightKg,
          record.conditionScore ?? "",
        ])
      }
    }
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(rows),
      t("reportsScreen.export.workbook.weightsSheet"),
    )
  }

  if (result.config.sections.includes("breeding")) {
    const rows: string[][] = [
      [
        t("reportsScreen.columns.visualTag"),
        t("reportsScreen.export.workbook.date"),
        t("reportsScreen.export.workbook.method"),
        t("reportsScreen.export.workbook.outcome"),
        t("reportsScreen.export.workbook.expectedCalving"),
        t("reportsScreen.export.workbook.actualCalving"),
      ],
    ]
    for (const [animalId, records] of result.related.breeding) {
      for (const record of records) {
        rows.push([
          animalName(animalId),
          formatDate(record.breedingDate),
          record.method,
          record.outcome,
          formatDate(record.expectedCalvingDate),
          formatDate(record.actualCalvingDate),
        ])
      }
    }
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(rows),
      t("reportsScreen.export.workbook.breedingSheet"),
    )
  }

  if (result.config.sections.includes("movements")) {
    const rows: string[][] = [
      [
        t("reportsScreen.columns.visualTag"),
        t("reportsScreen.export.workbook.date"),
        t("reportsScreen.export.workbook.pasture"),
        t("reportsScreen.export.workbook.type"),
      ],
    ]
    for (const [animalId, records] of result.related.movements) {
      for (const record of records) {
        rows.push([
          animalName(animalId),
          formatDate(record.movementDate),
          result.pastureNames.get(record.pastureId) ?? record.pastureId,
          record.movementType,
        ])
      }
    }
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(rows),
      t("reportsScreen.export.workbook.movementsSheet"),
    )
  }

  const base64 = XLSX.write(workbook, { type: "base64", bookType: "xlsx" })
  const fileName = `${baseFileName}_${format(new Date(), "yyyy-MM-dd")}.xlsx`
  await writeAndShareFile(fileName, base64, XLSX_MIME, "base64")
}
