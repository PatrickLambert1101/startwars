import { appSchema, tableSchema } from "@nozbe/watermelondb"

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: "organizations",
      columns: [
        { name: "remote_id", type: "string", isOptional: true },
        { name: "name", type: "string" },
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
        { name: "rfid_tag", type: "string", isIndexed: true },
        { name: "visual_tag", type: "string" },
        { name: "name", type: "string", isOptional: true },
        { name: "breed", type: "string" },
        { name: "sex", type: "string" }, // bull | cow | steer | heifer | calf
        { name: "date_of_birth", type: "number", isOptional: true },
        { name: "sire_id", type: "string", isOptional: true },
        { name: "dam_id", type: "string", isOptional: true },
        { name: "registration_number", type: "string", isOptional: true },
        { name: "status", type: "string" }, // active | sold | deceased | transferred
        { name: "notes", type: "string", isOptional: true },
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
        { name: "record_date", type: "number" },
        { name: "record_type", type: "string" }, // vaccination | treatment | vet_visit | condition_score | other
        { name: "description", type: "string" },
        { name: "product_name", type: "string", isOptional: true },
        { name: "dosage", type: "string", isOptional: true },
        { name: "administered_by", type: "string", isOptional: true },
        { name: "withdrawal_date", type: "number", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
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
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
        { name: "is_deleted", type: "boolean" },
      ],
    }),
  ],
})
