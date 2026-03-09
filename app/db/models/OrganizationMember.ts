import { Model } from "@nozbe/watermelondb"
import { field, date, readonly, relation } from "@nozbe/watermelondb/decorators"

export type MemberRole = "admin" | "worker"

export class OrganizationMember extends Model {
  static table = "organization_members"

  static associations = {
    organizations: { type: "belongs_to" as const, key: "organization_id" },
  }

  @field("remote_id") remoteId!: string | null
  @field("organization_id") organizationId!: string
  @field("user_id") userId!: string
  @field("user_email") userEmail!: string
  @field("user_display_name") userDisplayName!: string | null
  @field("role") role!: MemberRole
  @field("invited_by") invitedBy!: string | null
  @date("invited_at") invitedAt!: Date | null
  @date("joined_at") joinedAt!: Date | null
  @field("is_active") isActive!: boolean
  @readonly @date("created_at") createdAt!: Date
  @date("updated_at") updatedAt!: Date

  @relation("organizations", "organization_id") organization: any

  get isAdmin(): boolean {
    return this.role === "admin"
  }

  get isWorker(): boolean {
    return this.role === "worker"
  }

  get displayName(): string {
    return this.userDisplayName || this.userEmail.split("@")[0]
  }

  get roleLabel(): string {
    return this.role === "admin" ? "Admin" : "Worker"
  }
}
