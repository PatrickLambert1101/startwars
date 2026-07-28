import { Model } from "@nozbe/watermelondb"
import { date, field, readonly, relation } from "@nozbe/watermelondb/decorators"

import type { PastureBoundaryFeature } from "@/utils/pastureBoundary"
import { parseBoundaryFeature } from "@/utils/pastureBoundary"

export type PastureBoundarySource = "draw" | "kml" | "kmz"

export class PastureBoundary extends Model {
  static table = "pasture_boundaries"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
    pastures: { type: "belongs_to" as const, key: "pasture_id" },
  }

  @field("organization_id") organizationId!: string
  @field("pasture_id") pastureId!: string
  @field("boundary_geojson") boundaryGeojson!: string
  @field("boundary_source") boundarySource!: PastureBoundarySource
  @field("boundary_source_name") boundarySourceName!: string | null
  @field("centroid_latitude") centroidLatitude!: number
  @field("centroid_longitude") centroidLongitude!: number
  @field("calculated_area_hectares") calculatedAreaHectares!: number
  @date("boundary_updated_at") boundaryUpdatedAt!: Date
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date
  @field("is_deleted") isDeleted!: boolean

  @relation("organizations", "organization_id") organization: any
  @relation("pastures", "pasture_id") pasture: any

  get feature(): PastureBoundaryFeature | null {
    return parseBoundaryFeature(this.boundaryGeojson)
  }
}
