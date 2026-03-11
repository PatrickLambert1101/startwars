import { appSchema, tableSchema } from "@nozbe/watermelondb"
import { schemaMigrations } from "@nozbe/watermelondb/Schema/migrations"

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 3,
      steps: [
        {
          type: "add_columns",
          table: "health_records",
          columns: [
            { name: "protocol_id", type: "string", isOptional: true, isIndexed: true },
          ],
        },
        {
          type: "create_table",
          table: "treatment_protocols",
          columns: [
            { name: "remote_id", type: "string", isOptional: true },
            { name: "organization_id", type: "string", isIndexed: true },
            { name: "name", type: "string" },
            { name: "description", type: "string", isOptional: true },
            { name: "protocol_type", type: "string" },
            { name: "product_name", type: "string" },
            { name: "dosage", type: "string" },
            { name: "administration_method", type: "string", isOptional: true },
            { name: "withdrawal_days", type: "number", isOptional: true },
            { name: "target_species", type: "string" },
            { name: "target_age_min", type: "number", isOptional: true },
            { name: "target_age_max", type: "number", isOptional: true },
            { name: "is_active", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "is_deleted", type: "boolean" },
          ],
        },
      ],
    },
    {
      // Migration from v3 to v4 - no schema changes, just version bump to trigger proper migration
      toVersion: 4,
      steps: [],
    },
    {
      toVersion: 5,
      steps: [
        {
          type: "create_table",
          table: "pastures",
          columns: [
            { name: "remote_id", type: "string", isOptional: true },
            { name: "organization_id", type: "string", isIndexed: true },
            { name: "name", type: "string" },
            { name: "code", type: "string" },
            { name: "size_hectares", type: "number", isOptional: true },
            { name: "location_notes", type: "string", isOptional: true },
            { name: "forage_type", type: "string", isOptional: true },
            { name: "water_source", type: "string", isOptional: true },
            { name: "fence_type", type: "string", isOptional: true },
            { name: "has_salt_blocks", type: "boolean", isOptional: true },
            { name: "has_mineral_feeders", type: "boolean", isOptional: true },
            { name: "max_capacity", type: "number", isOptional: true },
            { name: "target_grazing_days", type: "number", isOptional: true },
            { name: "target_rest_days", type: "number", isOptional: true },
            { name: "current_animal_count", type: "number" },
            { name: "last_grazed_date", type: "number", isOptional: true },
            { name: "available_from_date", type: "number", isOptional: true },
            { name: "is_active", type: "boolean" },
            { name: "notes", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "is_deleted", type: "boolean" },
          ],
        },
        {
          type: "create_table",
          table: "pasture_movements",
          columns: [
            { name: "remote_id", type: "string", isOptional: true },
            { name: "organization_id", type: "string", isIndexed: true },
            { name: "pasture_id", type: "string", isIndexed: true },
            { name: "animal_id", type: "string", isIndexed: true },
            { name: "movement_date", type: "number" },
            { name: "movement_type", type: "string" },
            { name: "moved_by", type: "string", isOptional: true },
            { name: "notes", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "is_deleted", type: "boolean" },
          ],
        },
        {
          type: "add_columns",
          table: "animals",
          columns: [
            { name: "current_pasture_id", type: "string", isOptional: true, isIndexed: true },
          ],
        },
      ],
    },
    {
      toVersion: 6,
      steps: [
        {
          type: "create_table",
          table: "organization_members",
          columns: [
            { name: "remote_id", type: "string", isOptional: true },
            { name: "organization_id", type: "string", isIndexed: true },
            { name: "user_id", type: "string", isIndexed: true },
            { name: "user_email", type: "string" },
            { name: "user_display_name", type: "string", isOptional: true },
            { name: "role", type: "string" }, // 'admin' | 'worker'
            { name: "invited_by", type: "string", isOptional: true },
            { name: "invited_at", type: "number", isOptional: true },
            { name: "joined_at", type: "number", isOptional: true },
            { name: "is_active", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
          ],
        },
      ],
    },
    {
      toVersion: 7,
      steps: [
        {
          type: "add_columns",
          table: "weight_records",
          columns: [
            { name: "created_by_user_id", type: "string", isOptional: true },
            { name: "created_by_name", type: "string", isOptional: true },
          ],
        },
        {
          type: "add_columns",
          table: "health_records",
          columns: [
            { name: "created_by_user_id", type: "string", isOptional: true },
            { name: "created_by_name", type: "string", isOptional: true },
          ],
        },
        {
          type: "add_columns",
          table: "breeding_records",
          columns: [
            { name: "created_by_user_id", type: "string", isOptional: true },
            { name: "created_by_name", type: "string", isOptional: true },
          ],
        },
        {
          type: "add_columns",
          table: "pasture_movements",
          columns: [
            { name: "created_by_user_id", type: "string", isOptional: true },
            { name: "created_by_name", type: "string", isOptional: true },
          ],
        },
      ],
    },
    {
      toVersion: 8,
      steps: [
        {
          type: "add_columns",
          table: "weight_records",
          columns: [
            { name: "photos", type: "string", isOptional: true }, // JSON array of photo objects
          ],
        },
        {
          type: "add_columns",
          table: "health_records",
          columns: [
            { name: "photos", type: "string", isOptional: true }, // JSON array of photo objects
          ],
        },
        {
          type: "add_columns",
          table: "breeding_records",
          columns: [
            { name: "photos", type: "string", isOptional: true }, // JSON array of photo objects
          ],
        },
        {
          type: "add_columns",
          table: "animals",
          columns: [
            { name: "photos", type: "string", isOptional: true }, // JSON array of photo objects
          ],
        },
        {
          type: "add_columns",
          table: "pastures",
          columns: [
            { name: "photos", type: "string", isOptional: true }, // JSON array of photo objects
          ],
        },
      ],
    },
    {
      toVersion: 9,
      steps: [
        {
          type: "add_columns",
          table: "organizations",
          columns: [
            { name: "default_breeds", type: "string", isOptional: true }, // JSON: {"cattle": "Nguni", "sheep": "Dorper"}
          ],
        },
      ],
    },
    {
      toVersion: 10,
      steps: [
        {
          type: "add_columns",
          table: "animals",
          columns: [
            { name: "herd_tag", type: "string", isOptional: true, isIndexed: true }, // Group/herd identifier like "23-C", "XYZ"
          ],
        },
      ],
    },
  ],
})

export const schema = appSchema({
  version: 10,
  tables: [
    tableSchema({
      name: "organizations",
      columns: [
        { name: "remote_id", type: "string", isOptional: true },
        { name: "name", type: "string" },
        { name: "livestock_types", type: "string" }, // JSON array: ["cattle","horses",...]
        { name: "location", type: "string", isOptional: true },
        { name: "default_breeds", type: "string", isOptional: true }, // JSON: {"cattle": "Nguni"}
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
        { name: "is_deleted", type: "boolean" },
      ],
    }),
    tableSchema({
      name: "animals",
      columns: [
        { name: "remote_id", type: "string", isOptional: true },
        { name: "organization_id", type: "string", isIndexed: true },
        { name: "species", type: "string" }, // cattle | buffalo | horse | sheep | goat | game | pig
        { name: "rfid_tag", type: "string", isIndexed: true },
        { name: "visual_tag", type: "string" },
        { name: "name", type: "string", isOptional: true },
        { name: "breed", type: "string" },
        { name: "sex", type: "string" }, // varies by species
        { name: "date_of_birth", type: "number", isOptional: true },
        { name: "sire_id", type: "string", isOptional: true },
        { name: "dam_id", type: "string", isOptional: true },
        { name: "registration_number", type: "string", isOptional: true },
        { name: "current_pasture_id", type: "string", isOptional: true, isIndexed: true },
        { name: "status", type: "string" }, // active | sold | deceased | transferred
        { name: "herd_tag", type: "string", isOptional: true, isIndexed: true }, // Group/herd identifier like "23-C", "XYZ"
        { name: "notes", type: "string", isOptional: true },
        { name: "photos", type: "string", isOptional: true }, // JSON array of photo objects
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
        { name: "is_deleted", type: "boolean" },
      ],
    }),
    tableSchema({
      name: "health_records",
      columns: [
        { name: "remote_id", type: "string", isOptional: true },
        { name: "organization_id", type: "string", isIndexed: true },
        { name: "animal_id", type: "string", isIndexed: true },
        { name: "protocol_id", type: "string", isOptional: true, isIndexed: true },
        { name: "record_date", type: "number" },
        { name: "record_type", type: "string" }, // vaccination | treatment | vet_visit | condition_score | other
        { name: "description", type: "string" },
        { name: "product_name", type: "string", isOptional: true },
        { name: "dosage", type: "string", isOptional: true },
        { name: "administered_by", type: "string", isOptional: true },
        { name: "withdrawal_date", type: "number", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
        { name: "created_by_user_id", type: "string", isOptional: true },
        { name: "created_by_name", type: "string", isOptional: true },
        { name: "photos", type: "string", isOptional: true }, // JSON array of photo objects
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
        { name: "is_deleted", type: "boolean" },
      ],
    }),
    tableSchema({
      name: "weight_records",
      columns: [
        { name: "remote_id", type: "string", isOptional: true },
        { name: "organization_id", type: "string", isIndexed: true },
        { name: "animal_id", type: "string", isIndexed: true },
        { name: "record_date", type: "number" },
        { name: "weight_kg", type: "number" },
        { name: "condition_score", type: "number", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
        { name: "created_by_user_id", type: "string", isOptional: true },
        { name: "created_by_name", type: "string", isOptional: true },
        { name: "photos", type: "string", isOptional: true }, // JSON array of photo objects
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
        { name: "is_deleted", type: "boolean" },
      ],
    }),
    tableSchema({
      name: "breeding_records",
      columns: [
        { name: "remote_id", type: "string", isOptional: true },
        { name: "organization_id", type: "string", isIndexed: true },
        { name: "animal_id", type: "string", isIndexed: true }, // the cow/heifer
        { name: "bull_id", type: "string", isOptional: true },
        { name: "breeding_date", type: "number" },
        { name: "method", type: "string" }, // natural | ai | embryo_transfer
        { name: "expected_calving_date", type: "number", isOptional: true },
        { name: "actual_calving_date", type: "number", isOptional: true },
        { name: "calf_id", type: "string", isOptional: true },
        { name: "outcome", type: "string" }, // pending | live_calf | stillborn | aborted | open
        { name: "notes", type: "string", isOptional: true },
        { name: "created_by_user_id", type: "string", isOptional: true },
        { name: "created_by_name", type: "string", isOptional: true },
        { name: "photos", type: "string", isOptional: true }, // JSON array of photo objects
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
        { name: "is_deleted", type: "boolean" },
      ],
    }),
    tableSchema({
      name: "treatment_protocols",
      columns: [
        { name: "remote_id", type: "string", isOptional: true },
        { name: "organization_id", type: "string", isIndexed: true },
        { name: "name", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "protocol_type", type: "string" }, // vaccination | treatment | deworming | other
        { name: "product_name", type: "string" },
        { name: "dosage", type: "string" },
        { name: "administration_method", type: "string", isOptional: true },
        { name: "withdrawal_days", type: "number", isOptional: true },
        { name: "target_species", type: "string" }, // cattle | all | etc
        { name: "target_age_min", type: "number", isOptional: true },
        { name: "target_age_max", type: "number", isOptional: true },
        { name: "is_active", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
        { name: "is_deleted", type: "boolean" },
      ],
    }),
    tableSchema({
      name: "pastures",
      columns: [
        { name: "remote_id", type: "string", isOptional: true },
        { name: "organization_id", type: "string", isIndexed: true },
        { name: "name", type: "string" },
        { name: "code", type: "string" },
        { name: "size_hectares", type: "number", isOptional: true },
        { name: "location_notes", type: "string", isOptional: true },
        { name: "forage_type", type: "string", isOptional: true },
        { name: "water_source", type: "string", isOptional: true },
        { name: "fence_type", type: "string", isOptional: true },
        { name: "has_salt_blocks", type: "boolean", isOptional: true },
        { name: "has_mineral_feeders", type: "boolean", isOptional: true },
        { name: "max_capacity", type: "number", isOptional: true },
        { name: "target_grazing_days", type: "number", isOptional: true },
        { name: "target_rest_days", type: "number", isOptional: true },
        { name: "current_animal_count", type: "number" },
        { name: "last_grazed_date", type: "number", isOptional: true },
        { name: "available_from_date", type: "number", isOptional: true },
        { name: "is_active", type: "boolean" },
        { name: "notes", type: "string", isOptional: true },
        { name: "photos", type: "string", isOptional: true }, // JSON array of photo objects
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
        { name: "is_deleted", type: "boolean" },
      ],
    }),
    tableSchema({
      name: "pasture_movements",
      columns: [
        { name: "remote_id", type: "string", isOptional: true },
        { name: "organization_id", type: "string", isIndexed: true },
        { name: "pasture_id", type: "string", isIndexed: true },
        { name: "animal_id", type: "string", isIndexed: true },
        { name: "movement_date", type: "number" },
        { name: "movement_type", type: "string" },
        { name: "moved_by", type: "string", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
        { name: "created_by_user_id", type: "string", isOptional: true },
        { name: "created_by_name", type: "string", isOptional: true },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
        { name: "is_deleted", type: "boolean" },
      ],
    }),
    tableSchema({
      name: "organization_members",
      columns: [
        { name: "remote_id", type: "string", isOptional: true },
        { name: "organization_id", type: "string", isIndexed: true },
        { name: "user_id", type: "string", isIndexed: true },
        { name: "user_email", type: "string" },
        { name: "user_display_name", type: "string", isOptional: true },
        { name: "role", type: "string" },
        { name: "invited_by", type: "string", isOptional: true },
        { name: "invited_at", type: "number", isOptional: true },
        { name: "joined_at", type: "number", isOptional: true },
        { name: "is_active", type: "boolean" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
  ],
})
