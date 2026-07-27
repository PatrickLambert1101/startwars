import { Asset } from "expo-asset"
import * as Print from "expo-print"
import { format } from "date-fns"
import * as FileSystem from "expo-file-system/legacy"
import type { TFunction } from "i18next"

import { isRTL } from "@/i18n"
import type { TraceabilityReportData } from "@/services/traceabilityReport"

import {
  renderCustomReportBodyHtml,
  renderReportShell,
  renderTraceabilityBodyHtml,
} from "./htmlTemplates"
import type { ReportResult } from "./reportEngine"
import { renameToCache, shareFileUri } from "./shareFile"

let cachedLogoBase64: string | null | undefined

/**
 * Resolve the bundled PDF logo to base64 once per session. Failure is not
 * fatal — the PDF just renders without the logo mark.
 */
async function getLogoBase64(): Promise<string | null> {
  if (cachedLogoBase64 !== undefined) return cachedLogoBase64
  try {
    const asset = Asset.fromModule(require("../../../assets/images/pdf-logo.png"))
    await asset.downloadAsync()
    if (!asset.localUri) throw new Error("logo asset has no local uri")
    cachedLogoBase64 = await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    })
  } catch (error) {
    console.warn("[pdfExport] Could not load logo for PDF header:", error)
    cachedLogoBase64 = null
  }
  return cachedLogoBase64
}

interface PdfMeta {
  title: string
  orgName: string
  orgLocation?: string | null
  generatedBy?: string | null
  baseFileName: string
}

async function renderAndSharePdf(bodyHtml: string, meta: PdfMeta, t: TFunction): Promise<void> {
  const html = renderReportShell({
    title: meta.title,
    orgName: meta.orgName,
    orgLocation: meta.orgLocation,
    generatedBy: meta.generatedBy,
    generatedAt: new Date(),
    isRTL,
    logoBase64: await getLogoBase64(),
    bodyHtml,
    t,
  })

  const { uri } = await Print.printToFileAsync({ html, base64: false })
  const fileName = `${meta.baseFileName}_${format(new Date(), "yyyy-MM-dd")}.pdf`
  const namedUri = await renameToCache(uri, fileName)
  await shareFileUri(namedUri, "application/pdf")
}

/** Branded traceability certificate PDF (replaces the old ASCII text share). */
export async function exportTraceabilityPdf(
  reportData: TraceabilityReportData,
  t: TFunction,
): Promise<void> {
  const singleAnimalTag =
    reportData.animals.length === 1 ? reportData.animals[0].animal.visualTag : null
  await renderAndSharePdf(
    renderTraceabilityBodyHtml(reportData, t),
    {
      title: t("reportsScreen.export.pdf.traceabilityTitle"),
      orgName: reportData.organization.name,
      orgLocation: reportData.organization.location,
      generatedBy: reportData.generatedBy,
      baseFileName: singleAnimalTag
        ? `Traceability_${singleAnimalTag}`
        : `Traceability_${reportData.animals.length}_Animals`,
    },
    t,
  )
}

/** Custom report PDF from a report engine result. */
export async function exportReportPdf(
  result: ReportResult,
  reportName: string,
  orgName: string,
  orgLocation: string | null,
  generatedBy: string | null,
  t: TFunction,
): Promise<void> {
  await renderAndSharePdf(
    renderCustomReportBodyHtml(result, t),
    {
      title: reportName,
      orgName,
      orgLocation,
      generatedBy,
      baseFileName: reportName.replace(/\s+/g, "_") || "Herd_Report",
    },
    t,
  )
}
