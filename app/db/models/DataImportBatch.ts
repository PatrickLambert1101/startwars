import { Model } from "@nozbe/watermelondb"
import { date, field, readonly, relation } from "@nozbe/watermelondb/decorators"

import type { DataImportType } from "@/services/dataImport/types"

export type DataImportStatus = "completed" | "undone"

export class DataImportBatch extends Model {
  static table = "data_import_batches"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
  }

  @field("organization_id") organizationId!: string
  @field("import_type") importType!: DataImportType
  @field("file_name") fileName!: string
  @field("sheet_name") sheetName!: string | null
  @field("total_rows") totalRows!: number
  @field("imported_rows") importedRows!: number
  @field("skipped_rows") skippedRows!: number
  @field("record_ids") recordIdsJson!: string
  @field("status") status!: DataImportStatus
  @date("imported_at") importedAt!: Date
  @date("undone_at") undoneAt!: Date | null
  @field("created_by_user_id") createdByUserId!: string | null
  @field("created_by_name") createdByName!: string | null
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("organizations", "organization_id") organization: any

  get recordIds(): string[] {
    try {
      const parsed = JSON.parse(this.recordIdsJson)
      return Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === "string")
        : []
    } catch {
      return []
    }
  }
}
