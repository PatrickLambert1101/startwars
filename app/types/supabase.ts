/**
 * Auto-generated TypeScript types from Supabase schema
 * 
 * To regenerate:
 * npx supabase gen types typescript --project-id geczhyukynirvpdjnbel > app/types/supabase.ts
 * 
 * @generated 2026-03-26
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      animals: {
        Row: {
          _changed: string | null
          _status: string | null
          breed: string
          created_at: string
          current_pasture_id: string | null
          dam_id: string | null
          date_of_birth: string | null
          herd_tag: string | null
          id: string
          is_deleted: boolean
          name: string | null
          notes: string | null
          organization_id: string
          photos: string | null
          registration_number: string | null
          remote_id: string | null
          rfid_tag: string | null
          sex: string
          sire_id: string | null
          species: string
          status: string
          tags: string | null
          updated_at: string
          visual_tag: string | null
        }
        Insert: {
          _changed?: string | null
          _status?: string | null
          breed: string
          created_at?: string
          current_pasture_id?: string | null
          dam_id?: string | null
          date_of_birth?: string | null
          herd_tag?: string | null
          id: string
          is_deleted?: boolean
          name?: string | null
          notes?: string | null
          organization_id: string
          photos?: string | null
          registration_number?: string | null
          remote_id?: string | null
          rfid_tag?: string | null
          sex: string
          sire_id?: string | null
          species: string
          status?: string
          tags?: string | null
          updated_at?: string
          visual_tag?: string | null
        }
        Update: {
          _changed?: string | null
          _status?: string | null
          breed?: string
          created_at?: string
          current_pasture_id?: string | null
          dam_id?: string | null
          date_of_birth?: string | null
          herd_tag?: string | null
          id?: string
          is_deleted?: boolean
          name?: string | null
          notes?: string | null
          organization_id?: string
          photos?: string | null
          registration_number?: string | null
          remote_id?: string | null
          rfid_tag?: string | null
          sex?: string
          sire_id?: string | null
          species?: string
          status?: string
          tags?: string | null
          updated_at?: string
          visual_tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_current_pasture_id_fkey"
            columns: ["current_pasture_id"]
            isOneToOne: false
            referencedRelation: "pastures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_dam_id_fkey"
            columns: ["dam_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_sire_id_fkey"
            columns: ["sire_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      breeding_records: {
        Row: {
          _changed: string | null
          _status: string | null
          actual_calving_date: string | null
          animal_id: string
          breeding_date: string
          bull_id: string | null
          calf_id: string | null
          created_at: string
          created_by_name: string | null
          created_by_user_id: string | null
          expected_calving_date: string | null
          id: string
          is_deleted: boolean
          method: string
          notes: string | null
          organization_id: string
          outcome: string
          photos: string | null
          remote_id: string | null
          updated_at: string
        }
        Insert: {
          _changed?: string | null
          _status?: string | null
          actual_calving_date?: string | null
          animal_id: string
          breeding_date: string
          bull_id?: string | null
          calf_id?: string | null
          created_at?: string
          created_by_name?: string | null
          created_by_user_id?: string | null
          expected_calving_date?: string | null
          id: string
          is_deleted?: boolean
          method: string
          notes?: string | null
          organization_id: string
          outcome: string
          photos?: string | null
          remote_id?: string | null
          updated_at?: string
        }
        Update: {
          _changed?: string | null
          _status?: string | null
          actual_calving_date?: string | null
          animal_id?: string
          breeding_date?: string
          bull_id?: string | null
          calf_id?: string | null
          created_at?: string
          created_by_name?: string | null
          created_by_user_id?: string | null
          expected_calving_date?: string | null
          id?: string
          is_deleted?: boolean
          method?: string
          notes?: string | null
          organization_id?: string
          outcome?: string
          photos?: string | null
          remote_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "breeding_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_records_bull_id_fkey"
            columns: ["bull_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_records_calf_id_fkey"
            columns: ["calf_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "breeding_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          _changed: string | null
          _status: string | null
          administered_by: string | null
          animal_id: string
          created_at: string
          created_by_name: string | null
          created_by_user_id: string | null
          description: string
          dosage: string | null
          id: string
          is_deleted: boolean
          notes: string | null
          organization_id: string
          photos: string | null
          product_name: string | null
          protocol_id: string | null
          record_date: string
          record_type: string
          remote_id: string | null
          updated_at: string
          withdrawal_date: string | null
        }
        Insert: {
          _changed?: string | null
          _status?: string | null
          administered_by?: string | null
          animal_id: string
          created_at?: string
          created_by_name?: string | null
          created_by_user_id?: string | null
          description: string
          dosage?: string | null
          id: string
          is_deleted?: boolean
          notes?: string | null
          organization_id: string
          photos?: string | null
          product_name?: string | null
          protocol_id?: string | null
          record_date: string
          record_type: string
          remote_id?: string | null
          updated_at?: string
          withdrawal_date?: string | null
        }
        Update: {
          _changed?: string | null
          _status?: string | null
          administered_by?: string | null
          animal_id?: string
          created_at?: string
          created_by_name?: string | null
          created_by_user_id?: string | null
          description?: string
          dosage?: string | null
          id?: string
          is_deleted?: boolean
          notes?: string | null
          organization_id?: string
          photos?: string | null
          product_name?: string | null
          protocol_id?: string | null
          record_date?: string
          record_type?: string
          remote_id?: string | null
          updated_at?: string
          withdrawal_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_records_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "treatment_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string | null
          expires_at: string
          id: string
          invite_code: string
          invite_method: string | null
          invited_by: string
          organization_id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          expires_at: string
          id: string
          invite_code: string
          invite_method?: string | null
          invited_by: string
          organization_id: string
          phone?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invite_code?: string
          invite_method?: string | null
          invited_by?: string
          organization_id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          _changed: string | null
          _status: string | null
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean
          is_deleted: boolean
          joined_at: string | null
          organization_id: string
          remote_id: string | null
          role: string
          updated_at: string
          user_display_name: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          _changed?: string | null
          _status?: string | null
          created_at?: string
          id: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          is_deleted?: boolean
          joined_at?: string | null
          organization_id: string
          remote_id?: string | null
          role: string
          updated_at?: string
          user_display_name?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          _changed?: string | null
          _status?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          is_deleted?: boolean
          joined_at?: string | null
          organization_id?: string
          remote_id?: string | null
          role?: string
          updated_at?: string
          user_display_name?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          _changed: string | null
          _status: string | null
          created_at: string
          default_breeds: Json | null
          id: string
          is_deleted: boolean
          livestock_types: string | null
          location: string | null
          name: string
          remote_id: string | null
          subscription_ends_at: string | null
          subscription_starts_at: string | null
          subscription_status: string | null
          subscription_tier: string
          updated_at: string
        }
        Insert: {
          _changed?: string | null
          _status?: string | null
          created_at?: string
          default_breeds?: Json | null
          id: string
          is_deleted?: boolean
          livestock_types?: string | null
          location?: string | null
          name: string
          remote_id?: string | null
          subscription_ends_at?: string | null
          subscription_starts_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string
          updated_at?: string
        }
        Update: {
          _changed?: string | null
          _status?: string | null
          created_at?: string
          default_breeds?: Json | null
          id?: string
          is_deleted?: boolean
          livestock_types?: string | null
          location?: string | null
          name?: string
          remote_id?: string | null
          subscription_ends_at?: string | null
          subscription_starts_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      pasture_movements: {
        Row: {
          _changed: string | null
          _status: string | null
          animal_id: string
          created_at: string
          created_by_name: string | null
          created_by_user_id: string | null
          id: string
          is_deleted: boolean
          moved_by: string | null
          movement_date: string
          movement_type: string
          notes: string | null
          organization_id: string
          pasture_id: string
          remote_id: string | null
          updated_at: string
        }
        Insert: {
          _changed?: string | null
          _status?: string | null
          animal_id: string
          created_at?: string
          created_by_name?: string | null
          created_by_user_id?: string | null
          id: string
          is_deleted?: boolean
          moved_by?: string | null
          movement_date: string
          movement_type: string
          notes?: string | null
          organization_id: string
          pasture_id: string
          remote_id?: string | null
          updated_at?: string
        }
        Update: {
          _changed?: string | null
          _status?: string | null
          animal_id?: string
          created_at?: string
          created_by_name?: string | null
          created_by_user_id?: string | null
          id?: string
          is_deleted?: boolean
          moved_by?: string | null
          movement_date?: string
          movement_type?: string
          notes?: string | null
          organization_id?: string
          pasture_id?: string
          remote_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pasture_movements_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pasture_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pasture_movements_pasture_id_fkey"
            columns: ["pasture_id"]
            isOneToOne: false
            referencedRelation: "pastures"
            referencedColumns: ["id"]
          },
        ]
      }
      pastures: {
        Row: {
          _changed: string | null
          _status: string | null
          available_from_date: string | null
          code: string
          created_at: string
          current_animal_count: number
          fence_type: string | null
          forage_type: string | null
          has_mineral_feeders: boolean | null
          has_salt_blocks: boolean | null
          id: string
          is_active: boolean
          is_deleted: boolean
          last_grazed_date: string | null
          location_notes: string | null
          max_capacity: number | null
          name: string
          notes: string | null
          organization_id: string
          photos: string | null
          remote_id: string | null
          size_hectares: number | null
          target_grazing_days: number | null
          target_rest_days: number | null
          updated_at: string
          water_source: string | null
        }
        Insert: {
          _changed?: string | null
          _status?: string | null
          available_from_date?: string | null
          code: string
          created_at?: string
          current_animal_count?: number
          fence_type?: string | null
          forage_type?: string | null
          has_mineral_feeders?: boolean | null
          has_salt_blocks?: boolean | null
          id: string
          is_active?: boolean
          is_deleted?: boolean
          last_grazed_date?: string | null
          location_notes?: string | null
          max_capacity?: number | null
          name: string
          notes?: string | null
          organization_id: string
          photos?: string | null
          remote_id?: string | null
          size_hectares?: number | null
          target_grazing_days?: number | null
          target_rest_days?: number | null
          updated_at?: string
          water_source?: string | null
        }
        Update: {
          _changed?: string | null
          _status?: string | null
          available_from_date?: string | null
          code?: string
          created_at?: string
          current_animal_count?: number
          fence_type?: string | null
          forage_type?: string | null
          has_mineral_feeders?: boolean | null
          has_salt_blocks?: boolean | null
          id?: string
          is_active?: boolean
          is_deleted?: boolean
          last_grazed_date?: string | null
          location_notes?: string | null
          max_capacity?: number | null
          name?: string
          notes?: string | null
          organization_id?: string
          photos?: string | null
          remote_id?: string | null
          size_hectares?: number | null
          target_grazing_days?: number | null
          target_rest_days?: number | null
          updated_at?: string
          water_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pastures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_vaccinations: {
        Row: {
          _changed: string | null
          _status: string | null
          administered_date: string | null
          animal_id: string
          created_at: string
          dose_number: number
          due_date: string
          health_record_id: string | null
          id: string
          is_deleted: boolean
          organization_id: string
          parent_vaccination_id: string | null
          remote_id: string | null
          schedule_id: string
          skipped_reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          _changed?: string | null
          _status?: string | null
          administered_date?: string | null
          animal_id: string
          created_at?: string
          dose_number?: number
          due_date: string
          health_record_id?: string | null
          id: string
          is_deleted?: boolean
          organization_id: string
          parent_vaccination_id?: string | null
          remote_id?: string | null
          schedule_id: string
          skipped_reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          _changed?: string | null
          _status?: string | null
          administered_date?: string | null
          animal_id?: string
          created_at?: string
          dose_number?: number
          due_date?: string
          health_record_id?: string | null
          id?: string
          is_deleted?: boolean
          organization_id?: string
          parent_vaccination_id?: string | null
          remote_id?: string | null
          schedule_id?: string
          skipped_reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_vaccinations_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_vaccinations_health_record_id_fkey"
            columns: ["health_record_id"]
            isOneToOne: false
            referencedRelation: "health_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_vaccinations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_vaccinations_parent_vaccination_id_fkey"
            columns: ["parent_vaccination_id"]
            isOneToOne: false
            referencedRelation: "scheduled_vaccinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_vaccinations_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "vaccination_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      super_users: {
        Row: {
          created_at: string | null
          email: string
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      treatment_protocols: {
        Row: {
          _changed: string | null
          _status: string | null
          administration_method: string | null
          created_at: string
          description: string | null
          dosage: string
          id: string
          is_active: boolean
          is_deleted: boolean
          name: string
          organization_id: string
          product_name: string
          protocol_type: string
          remote_id: string | null
          target_age_max: number | null
          target_age_min: number | null
          target_species: string
          updated_at: string
          withdrawal_days: number | null
        }
        Insert: {
          _changed?: string | null
          _status?: string | null
          administration_method?: string | null
          created_at?: string
          description?: string | null
          dosage: string
          id: string
          is_active?: boolean
          is_deleted?: boolean
          name: string
          organization_id: string
          product_name: string
          protocol_type: string
          remote_id?: string | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_species: string
          updated_at?: string
          withdrawal_days?: number | null
        }
        Update: {
          _changed?: string | null
          _status?: string | null
          administration_method?: string | null
          created_at?: string
          description?: string | null
          dosage?: string
          id?: string
          is_active?: boolean
          is_deleted?: boolean
          name?: string
          organization_id?: string
          product_name?: string
          protocol_type?: string
          remote_id?: string | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_species?: string
          updated_at?: string
          withdrawal_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_protocols_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccination_schedules: {
        Row: {
          _changed: string | null
          _status: string | null
          age_window_days: number | null
          booster_count: number
          booster_interval_days: number | null
          created_at: string
          description: string | null
          id: string
          interval_months: number | null
          is_active: boolean
          is_deleted: boolean
          last_applied_date: string | null
          max_age_months: number | null
          min_age_months: number | null
          name: string
          organization_id: string
          pasture_id: string | null
          protocol_id: string
          remote_id: string | null
          repeat_annually: boolean
          requires_booster: boolean
          schedule_type: string
          scheduled_date: string | null
          target_age_months: number | null
          target_sex: string | null
          target_species: string | null
          updated_at: string
        }
        Insert: {
          _changed?: string | null
          _status?: string | null
          age_window_days?: number | null
          booster_count?: number
          booster_interval_days?: number | null
          created_at?: string
          description?: string | null
          id: string
          interval_months?: number | null
          is_active?: boolean
          is_deleted?: boolean
          last_applied_date?: string | null
          max_age_months?: number | null
          min_age_months?: number | null
          name: string
          organization_id: string
          pasture_id?: string | null
          protocol_id: string
          remote_id?: string | null
          repeat_annually?: boolean
          requires_booster?: boolean
          schedule_type: string
          scheduled_date?: string | null
          target_age_months?: number | null
          target_sex?: string | null
          target_species?: string | null
          updated_at?: string
        }
        Update: {
          _changed?: string | null
          _status?: string | null
          age_window_days?: number | null
          booster_count?: number
          booster_interval_days?: number | null
          created_at?: string
          description?: string | null
          id?: string
          interval_months?: number | null
          is_active?: boolean
          is_deleted?: boolean
          last_applied_date?: string | null
          max_age_months?: number | null
          min_age_months?: number | null
          name?: string
          organization_id?: string
          pasture_id?: string | null
          protocol_id?: string
          remote_id?: string | null
          repeat_annually?: boolean
          requires_booster?: boolean
          schedule_type?: string
          scheduled_date?: string | null
          target_age_months?: number | null
          target_sex?: string | null
          target_species?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_schedules_pasture_id_fkey"
            columns: ["pasture_id"]
            isOneToOne: false
            referencedRelation: "pastures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_schedules_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "treatment_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_records: {
        Row: {
          _changed: string | null
          _status: string | null
          animal_id: string
          condition_score: number | null
          created_at: string
          created_by_name: string | null
          created_by_user_id: string | null
          id: string
          is_deleted: boolean
          notes: string | null
          organization_id: string
          photos: string | null
          record_date: string
          remote_id: string | null
          updated_at: string
          weight_kg: number
        }
        Insert: {
          _changed?: string | null
          _status?: string | null
          animal_id: string
          condition_score?: number | null
          created_at?: string
          created_by_name?: string | null
          created_by_user_id?: string | null
          id: string
          is_deleted?: boolean
          notes?: string | null
          organization_id: string
          photos?: string | null
          record_date: string
          remote_id?: string | null
          updated_at?: string
          weight_kg: number
        }
        Update: {
          _changed?: string | null
          _status?: string | null
          animal_id?: string
          condition_score?: number | null
          created_at?: string
          created_by_name?: string | null
          created_by_user_id?: string | null
          id?: string
          is_deleted?: boolean
          notes?: string | null
          organization_id?: string
          photos?: string | null
          record_date?: string
          remote_id?: string | null
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: { Args: { invite_code_param: string }; Returns: Json }
      add_super_user: {
        Args: { admin_notes?: string; user_email: string }
        Returns: string
      }
      epoch_to_timestamp: { Args: { epoch: number }; Returns: string }
      generate_invite_code: { Args: never; Returns: string }
      is_org_admin: {
        Args: { org_id: string; user_id?: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { org_id: string; user_id?: string }
        Returns: boolean
      }
      is_super_user: {
        Args: { check_email?: string; check_user_id?: string }
        Returns: boolean
      }
      sync_pull: { Args: { last_pulled_at?: number }; Returns: Json }
      sync_push: { Args: { changes: Json }; Returns: Json }
      sync_push_changes: { Args: { changes: Json }; Returns: Json }
      timestamp_to_epoch: { Args: { ts: string }; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
