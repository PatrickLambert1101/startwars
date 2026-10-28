import type { DocumentPickerAsset } from "expo-document-picker"
import * as FileSystem from "expo-file-system/legacy"
import * as XLSX from "xlsx"

import type {
  ColumnMapping,
  ImportFieldDefinition,
  ParsedSpreadsheet,
  SpreadsheetCell,
  SpreadsheetRow,
  SpreadsheetSheet,
} from "./types"

const MAX_IMPORT_ROWS = 10_000
const HEADER_SCAN_ROWS = 15

export function normalizeColumnName(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function cellHasValue(value: SpreadsheetCell): boolean {
  return value instanceof Date || String(value ?? "").trim().length > 0
}

function headerLikelihood(values: SpreadsheetCell[]): number {
  const populated = values.filter(cellHasValue)
  const textCells = populated.filter(
    (value) => typeof value === "string" && value.trim().length > 0,
  )
  const dataCells = populated.length - textCells.length

  // Headers are normally mostly text, while a dense cattle row may contain
  // more total cells because age/calving formulas extend past the named
  // columns. Weight text heavily so those formula rows do not become headers.
  return textCells.length * 4 + populated.length - dataCells * 2
}

function makeUniqueHeaders(values: SpreadsheetCell[], width: number): string[] {
  const seen = new Map<string, number>()

  return Array.from({ length: width }, (_, index) => {
    const raw = String(values[index] ?? "").trim() || `Column ${index + 1}`
    const count = (seen.get(raw) ?? 0) + 1
    seen.set(raw, count)
    return count === 1 ? raw : `${raw} (${count})`
  })
}

export function rowsToSpreadsheetSheet(
  name: string,
  matrix: SpreadsheetCell[][],
): SpreadsheetSheet | null {
  if (matrix.length === 0) return null

  const candidates = matrix.slice(0, HEADER_SCAN_ROWS)
  let headerIndex = 0
  let bestScore = -1

  candidates.forEach((row, index) => {
    const score = headerLikelihood(row)
    if (score > bestScore) {
      bestScore = score
      headerIndex = index
    }
  })

  if (bestScore <= 0) return null

  const dataRows = matrix.slice(headerIndex + 1)
  const populatedRows = dataRows
    .map((values, index) => ({ values, index }))
    .filter(({ values }) => values.some(cellHasValue))

  if (populatedRows.length > MAX_IMPORT_ROWS) {
    throw new Error(
      `This sheet contains ${populatedRows.length.toLocaleString()} rows. Split it into files of ${MAX_IMPORT_ROWS.toLocaleString()} rows or fewer.`,
    )
  }

  const width = populatedRows.reduce(
    (maximum, { values }) => Math.max(maximum, values.length),
    matrix[headerIndex]?.length ?? 0,
  )
  const headers = makeUniqueHeaders(matrix[headerIndex] ?? [], width)
  const rows: SpreadsheetRow[] = populatedRows.map(({ values, index }) => {
    return {
      rowNumber: headerIndex + index + 2,
      values: Array.from({ length: width }, (_, column) => values[column] ?? null),
    }
  })

  return rows.length > 0 ? { name, headers, rows } : null
}

export async function readSpreadsheetFile(asset: DocumentPickerAsset): Promise<ParsedSpreadsheet> {
  const base64 = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  })
  const workbook = XLSX.read(base64, {
    type: "base64",
    cellDates: true,
    raw: true,
    dense: true,
  })

  const sheets = workbook.SheetNames.map((name) => {
    const worksheet = workbook.Sheets[name]
    const matrix = XLSX.utils.sheet_to_json<SpreadsheetCell[]>(worksheet, {
      header: 1,
      defval: null,
      raw: true,
      blankrows: false,
    })
    return rowsToSpreadsheetSheet(name, matrix)
  }).filter((sheet): sheet is SpreadsheetSheet => sheet !== null)

  if (sheets.length === 0) {
    throw new Error("No rows were found in this file.")
  }

  return {
    fileName: asset.name || "Imported spreadsheet",
    sheets,
  }
}

function matchScore(header: string, alias: string): number {
  if (!header || !alias) return 0
  if (header === alias) return 100
  if (header.startsWith(alias) || alias.startsWith(header)) return 70
  if (alias.length >= 4 && header.includes(alias)) return 50
  return 0
}

export function autoMapColumns(headers: string[], fields: ImportFieldDefinition[]): ColumnMapping {
  const normalizedHeaders = headers.map(normalizeColumnName)
  const used = new Set<number>()
  const mapping: ColumnMapping = {}

  // Reserve exact matches first. Without this pass a broad field such as
  // "Breed" can greedily take "Sire Breed" before the more specific pedigree
  // field gets a chance to claim its exact header.
  fields.forEach((field) => {
    const aliases = [field.label, ...field.aliases].map(normalizeColumnName)
    const exactIndex = normalizedHeaders.findIndex(
      (header, index) => !used.has(index) && aliases.includes(header),
    )
    mapping[field.key] = exactIndex >= 0 ? exactIndex : null
    if (exactIndex >= 0) used.add(exactIndex)
  })

  fields.forEach((field) => {
    if (mapping[field.key] !== null) return
    let bestIndex: number | null = null
    let bestScore = 0
    const aliases = [field.label, ...field.aliases].map(normalizeColumnName)

    normalizedHeaders.forEach((header, index) => {
      if (used.has(index)) return
      aliases.forEach((alias) => {
        const score = matchScore(header, alias)
        if (score > bestScore) {
          bestScore = score
          bestIndex = index
        }
      })
    })

    mapping[field.key] = bestIndex
    if (bestIndex !== null) used.add(bestIndex)
  })

  return mapping
}

export function mappedCell(
  row: SpreadsheetRow,
  mapping: ColumnMapping,
  field: string,
): SpreadsheetCell {
  const index = mapping[field]
  return index === null || index === undefined ? null : (row.values[index] ?? null)
}

export function cellText(value: SpreadsheetCell): string {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10)
  }
  return String(value).trim()
}
