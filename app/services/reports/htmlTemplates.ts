import { format } from "date-fns"
import type { TFunction } from "i18next"

import type { AnimalTraceabilityData, TraceabilityReportData } from "@/services/traceabilityReport"

import { animalColumnHeader, animalColumnValue, reportGroupLabel } from "./csvExport"
import type { ReportResult } from "./reportEngine"

const BRAND_GREEN = "#739134"
const BRAND_GREEN_DARK = "#576E28"
const PAPER_GREY = "#F5F3F0"
const TEXT_DARK = "#1E1A16"
const TEXT_DIM = "#5C564F"

export interface ReportShellOptions {
  title: string
  orgName: string
  orgLocation?: string | null
  generatedBy?: string | null
  generatedAt: Date
  isRTL: boolean
  /** Base64 PNG (no data: prefix) for the header logo; omitted if null. */
  logoBase64: string | null
  bodyHtml: string
  t: TFunction
}

export function escapeHtml(value: string | null | undefined): string {
  if (!value) return ""
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Tag numbers and dates are Latin-script even in RTL locales; isolate them so
 * Arabic text around them doesn't reorder the digits.
 */
function ltr(value: string): string {
  return `<span dir="ltr" style="unicode-bidi: isolate;">${value}</span>`
}

function formatDate(date: Date | null | undefined): string {
  return date ? format(date, "yyyy-MM-dd") : ""
}

/**
 * Shared branded chrome for every PDF the app produces. System font stack on
 * purpose: the print WebView renders Latin, Arabic and CJK reliably without
 * shipping an embedded font, and embedded fonts bloat printToFileAsync memory.
 */
export function renderReportShell(options: ReportShellOptions): string {
  const { title, orgName, orgLocation, generatedBy, generatedAt, isRTL, logoBase64, bodyHtml, t } =
    options

  const logoImg = logoBase64
    ? `<img src="data:image/png;base64,${logoBase64}" style="width: 42px; height: 42px; border-radius: 8px;" />`
    : ""

  return `<!DOCTYPE html>
<html dir="${isRTL ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Helvetica Neue", Roboto, "Noto Sans", sans-serif;
    color: ${TEXT_DARK};
    margin: 0;
    padding: 24px;
    font-size: 12px;
    line-height: 1.45;
  }
  .brand-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    background: ${BRAND_GREEN};
    color: #fff;
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 16px;
  }
  .brand-bar h1 { font-size: 18px; margin: 0; font-weight: 700; }
  .brand-bar .app-name { font-size: 11px; opacity: 0.85; margin: 0; }
  .meta {
    background: ${PAPER_GREY};
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 18px;
    color: ${TEXT_DIM};
    font-size: 11px;
  }
  .meta strong { color: ${TEXT_DARK}; }
  h2 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: ${BRAND_GREEN_DARK};
    border-bottom: 2px solid ${BRAND_GREEN};
    padding-bottom: 4px;
    margin: 18px 0 8px;
  }
  h3 { font-size: 12px; margin: 14px 0 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  th {
    text-align: ${isRTL ? "right" : "left"};
    background: ${PAPER_GREY};
    color: ${TEXT_DIM};
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 5px 8px;
    border-bottom: 1px solid #DDD8D0;
  }
  td {
    padding: 5px 8px;
    border-bottom: 1px solid #EEEBE6;
    vertical-align: top;
  }
  tr { page-break-inside: avoid; }
  .kv td:first-child { color: ${TEXT_DIM}; width: 38%; }
  .group-row td {
    background: #EEF2E7;
    color: ${BRAND_GREEN_DARK};
    font-weight: 700;
    border-bottom: 1px solid ${BRAND_GREEN};
  }
  .animal-block { page-break-inside: avoid; margin-bottom: 8px; }
  .page-break { page-break-before: always; }
  .photos { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 10px; }
  .photos img { width: 110px; height: 110px; object-fit: cover; border-radius: 6px; }
  .footer {
    margin-top: 24px;
    padding-top: 10px;
    border-top: 1px solid #DDD8D0;
    color: ${TEXT_DIM};
    font-size: 10px;
    text-align: center;
  }
  .muted { color: ${TEXT_DIM}; }
</style>
</head>
<body>
  <div class="brand-bar">
    ${logoImg}
    <div>
      <h1>${escapeHtml(title)}</h1>
      <p class="app-name">HerdTrackr</p>
    </div>
  </div>
  <div class="meta">
    <strong>${escapeHtml(orgName)}</strong>${orgLocation ? ` &middot; ${escapeHtml(orgLocation)}` : ""}<br/>
    ${escapeHtml(t("reportsScreen.export.pdf.generatedAt"))}: ${ltr(format(generatedAt, "yyyy-MM-dd HH:mm"))}${
      generatedBy
        ? ` &middot; ${escapeHtml(t("reportsScreen.export.pdf.generatedBy"))}: ${escapeHtml(generatedBy)}`
        : ""
    }
  </div>
  ${bodyHtml}
  <div class="footer">${escapeHtml(t("reportsScreen.export.pdf.footer"))}</div>
</body>
</html>`
}

const MAX_PHOTOS_PER_ANIMAL = 3

/** One animal's full traceability history as HTML sections. */
export function renderAnimalTraceabilityHtml(data: AnimalTraceabilityData, t: TFunction): string {
  const {
    animal,
    healthRecords,
    weightRecords,
    breedingRecords,
    pastureMovements,
    sire,
    dam,
    photos,
  } = data
  const tx = (key: string) => escapeHtml(t(`reportsScreen.export.pdf.${key}`))

  const identityRows: string[] = []
  const addRow = (label: string, value: string | null | undefined, isLtr = false) => {
    if (value === null || value === undefined || value === "") return
    identityRows.push(
      `<tr><td>${escapeHtml(label)}</td><td>${isLtr ? ltr(escapeHtml(value)) : escapeHtml(value)}</td></tr>`,
    )
  }

  addRow(t("reportsScreen.export.pdf.visualTag"), animal.visualTag, true)
  addRow(t("reportsScreen.export.pdf.rfidTag"), animal.rfidTag, true)
  addRow(t("reportsScreen.export.pdf.name"), animal.name)
  addRow(t("reportsScreen.export.pdf.herdTag"), animal.herdTag, true)
  addRow(t("reportsScreen.export.pdf.registrationNumber"), animal.registrationNumber, true)
  addRow(t("reportsScreen.export.pdf.species"), animal.species)
  addRow(t("reportsScreen.export.pdf.breed"), animal.breed)
  addRow(t("reportsScreen.export.pdf.sex"), animal.sexLabel)
  addRow(
    t("reportsScreen.export.pdf.dateOfBirth"),
    animal.dateOfBirth ? formatDate(animal.dateOfBirth) : null,
    true,
  )
  addRow(
    t("reportsScreen.export.pdf.status"),
    t(`reportsScreen.statuses.${animal.status}`, { defaultValue: animal.status }) as string,
  )
  addRow(t("reportsScreen.export.pdf.recordCreated"), formatDate(animal.createdAt), true)
  addRow(t("reportsScreen.export.pdf.notes"), animal.notes)

  let html = `<div class="animal-block">`
  html += `<h2>${tx("identification")}</h2><table class="kv">${identityRows.join("")}</table>`

  if (sire || dam) {
    html += `<h2>${tx("parentage")}</h2><table class="kv">`
    if (sire)
      html += `<tr><td>${tx("sire")}</td><td>${escapeHtml(sire.displayName)} (${escapeHtml(sire.breed)})</td></tr>`
    if (dam)
      html += `<tr><td>${tx("dam")}</td><td>${escapeHtml(dam.displayName)} (${escapeHtml(dam.breed)})</td></tr>`
    html += `</table>`
  }

  if (photos.length > 0) {
    html += `<h2>${tx("photos")}</h2><div class="photos">`
    for (const photo of photos.slice(0, MAX_PHOTOS_PER_ANIMAL)) {
      html += `<img src="${escapeHtml(photo.uri)}" />`
    }
    html += `</div>`
    if (photos.length > MAX_PHOTOS_PER_ANIMAL) {
      html += `<p class="muted">${escapeHtml(t("reportsScreen.export.pdf.morePhotos", { count: photos.length - MAX_PHOTOS_PER_ANIMAL }))}</p>`
    }
  }

  html += `<h2>${tx("healthRecords")}</h2>`
  if (healthRecords.length > 0) {
    html += `<table><tr><th>${tx("date")}</th><th>${tx("type")}</th><th>${tx("description")}</th><th>${tx("product")}</th><th>${tx("dosage")}</th><th>${tx("administeredBy")}</th></tr>`
    for (const record of healthRecords) {
      html += `<tr><td>${ltr(formatDate(record.recordDate))}</td><td>${escapeHtml(record.recordType)}</td><td>${escapeHtml(record.description)}</td><td>${escapeHtml(record.productName)}</td><td>${escapeHtml(record.dosage)}</td><td>${escapeHtml(record.administeredBy)}</td></tr>`
    }
    html += `</table>`
  } else {
    html += `<p class="muted">${tx("noRecords")}</p>`
  }

  html += `<h2>${tx("weightRecords")}</h2>`
  if (weightRecords.length > 0) {
    html += `<table><tr><th>${tx("date")}</th><th>${tx("weightKg")}</th><th>${tx("conditionScore")}</th></tr>`
    for (const record of weightRecords) {
      html += `<tr><td>${ltr(formatDate(record.recordDate))}</td><td>${ltr(String(record.weightKg))}</td><td>${record.conditionScore != null ? ltr(String(record.conditionScore)) : ""}</td></tr>`
    }
    html += `</table>`
  } else {
    html += `<p class="muted">${tx("noRecords")}</p>`
  }

  html += `<h2>${tx("breedingRecords")}</h2>`
  if (breedingRecords.length > 0) {
    html += `<table><tr><th>${tx("date")}</th><th>${tx("method")}</th><th>${tx("outcome")}</th><th>${tx("expectedCalving")}</th><th>${tx("actualCalving")}</th></tr>`
    for (const record of breedingRecords) {
      html += `<tr><td>${ltr(formatDate(record.breedingDate))}</td><td>${escapeHtml(record.method)}</td><td>${escapeHtml(record.outcome)}</td><td>${ltr(formatDate(record.expectedCalvingDate))}</td><td>${ltr(formatDate(record.actualCalvingDate))}</td></tr>`
    }
    html += `</table>`
  } else {
    html += `<p class="muted">${tx("noRecords")}</p>`
  }

  if (pastureMovements.length > 0) {
    html += `<h2>${tx("movementHistory")}</h2>`
    html += `<table><tr><th>${tx("date")}</th><th>${tx("type")}</th><th>${tx("movedBy")}</th></tr>`
    for (const movement of pastureMovements) {
      html += `<tr><td>${ltr(formatDate(movement.movementDate))}</td><td>${escapeHtml(movement.movementType)}</td><td>${escapeHtml(movement.movedBy)}</td></tr>`
    }
    html += `</table>`
  }

  html += `</div>`
  return html
}

/** Full traceability certificate body (multiple animals, page break between). */
export function renderTraceabilityBodyHtml(
  reportData: TraceabilityReportData,
  t: TFunction,
): string {
  return reportData.animals
    .map((animalData, index) => {
      const heading =
        reportData.animals.length > 1
          ? `<p class="muted">${escapeHtml(
              t("reportsScreen.export.pdf.animalOf", {
                current: index + 1,
                total: reportData.animals.length,
              }),
            )}</p>`
          : ""
      const pageBreak = index > 0 ? ` page-break` : ""
      return `<div class="${pageBreak.trim()}">${heading}${renderAnimalTraceabilityHtml(animalData, t)}</div>`
    })
    .join("")
}

/** Custom report body: grouped tables with a subtotal header row per group. */
export function renderCustomReportBodyHtml(result: ReportResult, t: TFunction): string {
  const columns = result.config.columns
  const colCount = columns.length

  let html = `<table>`
  html += `<tr>${columns.map((c) => `<th>${escapeHtml(animalColumnHeader(c, t))}</th>`).join("")}</tr>`

  for (const group of result.groups) {
    if (result.config.groupBy) {
      html += `<tr class="group-row"><td colspan="${colCount}">${escapeHtml(reportGroupLabel(result, group, t))} &middot; ${group.rows.length}</td></tr>`
    }
    for (const row of group.rows) {
      html += `<tr>${columns
        .map((c) => {
          const value = animalColumnValue(c, row)
          const isLtrColumn =
            c === "visualTag" || c === "rfidTag" || c === "age" || c === "latestWeight"
          return `<td>${isLtrColumn ? ltr(escapeHtml(value)) : escapeHtml(value)}</td>`
        })
        .join("")}</tr>`
    }
  }
  html += `</table>`
  html += `<p class="muted">${escapeHtml(t("reportsScreen.export.pdf.totalAnimals", { count: result.totalCount }))}</p>`
  return html
}
