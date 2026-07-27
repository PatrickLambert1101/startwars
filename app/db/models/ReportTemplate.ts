import { Model } from "@nozbe/watermelondb"
import { field, date, readonly, relation } from "@nozbe/watermelondb/decorators"

import {
  DEFAULT_REPORT_COLUMNS,
  DEFAULT_REPORT_FILTERS,
  type AnimalColumnKey,
  type ReportConfig,
  type ReportFilters,
  type ReportGroupByField,
  type ReportSectionKey,
} from "@/services/reports/reportConfig"

export type ReportTemplateType = "custom" | "traceability"

/**
 * A saved, re-runnable report definition ("Weaner weights by camp"). The
 * filters/columns/sections are stored as JSON strings (same convention as
 * Animal.tags) and parsed through typed getters.
 */
export class ReportTemplate extends Model {
  static table = "report_templates"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
  }

  @field("organization_id") organizationId!: string
  @field("name") name!: string
  @field("description") description!: string | null
  @field("report_type") reportType!: ReportTemplateType
  @field("filters") filters!: string | null // JSON ReportFilters
  @field("group_by") groupBy!: ReportGroupByField | null
  @field("sections") sections!: string | null // JSON ReportSectionKey[]
  @field("columns") columns!: string | null // JSON AnimalColumnKey[]
  @date("last_run_at") lastRunAt!: Date | null
  @field("created_by_user_id") createdByUserId!: string | null
  @field("created_by_name") createdByName!: string | null
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("organizations", "organization_id") organization: any

  get filtersParsed(): ReportFilters {
    try {
      return this.filters
        ? { ...DEFAULT_REPORT_FILTERS, ...JSON.parse(this.filters) }
        : { ...DEFAULT_REPORT_FILTERS }
    } catch {
      return { ...DEFAULT_REPORT_FILTERS }
    }
  }

  get sectionsParsed(): ReportSectionKey[] {
    try {
      return this.sections ? JSON.parse(this.sections) : []
    } catch {
      return []
    }
  }

  get columnsParsed(): AnimalColumnKey[] {
    try {
      const parsed = this.columns ? JSON.parse(this.columns) : []
      return parsed.length > 0 ? parsed : [...DEFAULT_REPORT_COLUMNS]
    } catch {
      return [...DEFAULT_REPORT_COLUMNS]
    }
  }

  get config(): ReportConfig {
    return {
      filters: this.filtersParsed,
      groupBy: this.groupBy ?? null,
      columns: this.columnsParsed,
      sections: this.sectionsParsed,
    }
  }
}
