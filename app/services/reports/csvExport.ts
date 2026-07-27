import { format } from "date-fns"
import type { TFunction } from "i18next"

import { Animal, SEX_LABELS } from "@/db/models/Animal"

import { buildCsv } from "./csvFormat"
import type { AnimalColumnKey, ReportResult } from "./reportEngine"
import { writeAndShareFile } from "./shareFile"

export { buildCsv, csvEscape } from "./csvFormat"

export function animalColumnHeader(column: AnimalColumnKey, t: TFunction): string {
  return t(`reportsScreen.columns.${column}`)
}

export function animalColumnValue(
  column: AnimalColumnKey,
  row: { animal: Animal; ageMonths: number | null; latestWeightKg: number | null },
): string {
  const { animal } = row
  switch (column) {
    case "visualTag":
      return animal.visualTag ?? ""
    case "rfidTag":
      return animal.rfidTag ?? ""
    case "name":
      return animal.name ?? ""
    case "breed":
      return animal.breed ?? ""
    case "sex":
      return SEX_LABELS[animal.species]?.[animal.sex] ?? animal.sex
    case "age":
      return row.ageMonths !== null ? String(row.ageMonths) : ""
    case "status":
      return animal.status
    case "herdTag":
      return animal.herdTag ?? ""
    case "latestWeight":
      return row.latestWeightKg !== null ? String(row.latestWeightKg) : ""
    case "tags":
      return animal.tagsList.join("; ")
  }
}

export function reportGroupLabel(
  result: ReportResult,
  group: { key: string; rows: { animal: Animal }[] },
  t: TFunction,
): string {
  const { key } = group
  if (key === "") return t("reportsScreen.viewer.ungrouped")
  switch (result.config.groupBy) {
    case "age_bracket":
      return t(`reportsScreen.ageBrackets.${key}`)
    case "pasture":
      return result.pastureNames.get(key) ?? key
    case "sex":
      // Species-specific label (Bull/Cow/Ram/Ewe...), same convention as list screens
      return group.rows[0]?.animal.sexLabel ?? key
    case "status":
      return t(`reportsScreen.statuses.${key}`, { defaultValue: key })
    default:
      return key
  }
}

/** Flatten a report result into CSV rows (with group header rows if grouped). */
export function reportToCsv(result: ReportResult, t: TFunction): string {
  const rows: (string | number | null)[][] = []
  rows.push(result.config.columns.map((c) => animalColumnHeader(c, t)))

  for (const group of result.groups) {
    if (result.config.groupBy) {
      rows.push([`${reportGroupLabel(result, group, t)} (${group.rows.length})`])
    }
    for (const row of group.rows) {
      rows.push(result.config.columns.map((c) => animalColumnValue(c, row)))
    }
  }
  return buildCsv(rows)
}

/**
 * Share a report as a .csv file. A UTF-8 BOM is prepended so Excel detects
 * the encoding (accented breed names, non-Latin translations).
 */
export async function exportReportAsCsv(
  result: ReportResult,
  baseFileName: string,
  t: TFunction,
): Promise<void> {
  const csv = "﻿" + reportToCsv(result, t)
  const fileName = `${baseFileName}_${format(new Date(), "yyyy-MM-dd")}.csv`
  await writeAndShareFile(fileName, csv, "text/csv", "utf8")
}
