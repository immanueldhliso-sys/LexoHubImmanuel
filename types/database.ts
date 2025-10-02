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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      advocate_profiles: {
        Row: {
          accepting_overflow: boolean | null
          accepting_referrals: boolean | null
          advocate_id: string
          areas_of_expertise: string[] | null
          average_completion_days: number | null
          created_at: string | null
          id: string
          is_public: boolean | null
          languages_spoken: string[] | null
          maximum_brief_value: number | null
          minimum_brief_value: number | null
          preferred_matter_types: string[] | null
          professional_summary: string | null
          profile_views: number | null
          success_rate: number | null
          total_referrals_given: number | null
          total_referrals_received: number | null
          typical_turnaround_days: number | null
          updated_at: string | null
        }
        Insert: {
          accepting_overflow?: boolean | null
          accepting_referrals?: boolean | null
          advocate_id: string
          areas_of_expertise?: string[] | null
          average_completion_days?: number | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          languages_spoken?: string[] | null
          maximum_brief_value?: number | null
          minimum_brief_value?: number | null
          preferred_matter_types?: string[] | null
          professional_summary?: string | null
          profile_views?: number | null
          success_rate?: number | null
          total_referrals_given?: number | null
          total_referrals_received?: number | null
          typical_turnaround_days?: number | null
          updated_at?: string | null
        }
        Update: {
          accepting_overflow?: boolean | null
          accepting_referrals?: boolean | null
          advocate_id?: string
          areas_of_expertise?: string[] | null
          average_completion_days?: number | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          languages_spoken?: string[] | null
          maximum_brief_value?: number | null
          minimum_brief_value?: number | null
          preferred_matter_types?: string[] | null
          professional_summary?: string | null
          profile_views?: number | null
          success_rate?: number | null
          total_referrals_given?: number | null
          total_referrals_received?: number | null
          typical_turnaround_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advocate_profiles_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: true
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "advocate_profiles_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: true
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      advocate_specialisations: {
        Row: {
          advocate_id: string
          category: Database["public"]["Enums"]["specialisation_category"]
          certifications: string[] | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          notable_cases: string | null
          sub_speciality: string | null
          updated_at: string | null
          years_experience: number | null
        }
        Insert: {
          advocate_id: string
          category: Database["public"]["Enums"]["specialisation_category"]
          certifications?: string[] | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          notable_cases?: string | null
          sub_speciality?: string | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Update: {
          advocate_id?: string
          category?: Database["public"]["Enums"]["specialisation_category"]
          certifications?: string[] | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          notable_cases?: string | null
          sub_speciality?: string | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "advocate_specialisations_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "advocate_specialisations_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      advocates: {
        Row: {
          bar: Database["public"]["Enums"]["bar_association"]
          chambers_address: string | null
          contingency_rate: number | null
          created_at: string | null
          deleted_at: string | null
          email: string
          full_name: string
          hourly_rate: number
          id: string
          initials: string
          invoice_settings: Json | null
          is_active: boolean | null
          last_login_at: string | null
          matters_count: number | null
          notification_preferences: Json | null
          phone_number: string | null
          postal_address: string | null
          practice_number: string
          specialisations: string[] | null
          success_fee_rate: number | null
          total_collected_ytd: number | null
          total_outstanding: number | null
          updated_at: string | null
          year_admitted: number
        }
        Insert: {
          bar: Database["public"]["Enums"]["bar_association"]
          chambers_address?: string | null
          contingency_rate?: number | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          full_name: string
          hourly_rate: number
          id?: string
          initials: string
          invoice_settings?: Json | null
          is_active?: boolean | null
          last_login_at?: string | null
          matters_count?: number | null
          notification_preferences?: Json | null
          phone_number?: string | null
          postal_address?: string | null
          practice_number: string
          specialisations?: string[] | null
          success_fee_rate?: number | null
          total_collected_ytd?: number | null
          total_outstanding?: number | null
          updated_at?: string | null
          year_admitted: number
        }
        Update: {
          bar?: Database["public"]["Enums"]["bar_association"]
          chambers_address?: string | null
          contingency_rate?: number | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          full_name?: string
          hourly_rate?: number
          id?: string
          initials?: string
          invoice_settings?: Json | null
          is_active?: boolean | null
          last_login_at?: string | null
          matters_count?: number | null
          notification_preferences?: Json | null
          phone_number?: string | null
          postal_address?: string | null
          practice_number?: string
          specialisations?: string[] | null
          success_fee_rate?: number | null
          total_collected_ytd?: number | null
          total_outstanding?: number | null
          updated_at?: string | null
          year_admitted?: number
        }
        Relationships: []
      }
      audit_entries: {
        Row: {
          action_type: string
          after_state: Json | null
          before_state: Json | null
          created_at: string | null
          description: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          description: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          description?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          advocate_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action: string
          advocate_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          advocate_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "audit_log_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_applications: {
        Row: {
          advocate_id: string
          availability_date: string | null
          brief_id: string
          cover_message: string
          created_at: string | null
          id: string
          proposed_fee: number | null
          relevant_experience: string | null
          reviewed_at: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["referral_status"] | null
          updated_at: string | null
        }
        Insert: {
          advocate_id: string
          availability_date?: string | null
          brief_id: string
          cover_message: string
          created_at?: string | null
          id?: string
          proposed_fee?: number | null
          relevant_experience?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["referral_status"] | null
          updated_at?: string | null
        }
        Update: {
          advocate_id?: string
          availability_date?: string | null
          brief_id?: string
          cover_message?: string
          created_at?: string | null
          id?: string
          proposed_fee?: number | null
          relevant_experience?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["referral_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brief_applications_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "brief_applications_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brief_applications_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "available_overflow_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brief_applications_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "overflow_briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_patterns: {
        Row: {
          advocate_id: string
          confidence_level: number | null
          court_recess_impact: number | null
          historical_collection_rate: number | null
          historical_new_matters_ratio: number | null
          historical_payment_delay_days: number | null
          holiday_impact: number | null
          id: string
          month: number
          sample_years: number | null
          typical_client_payment_behavior: string | null
          updated_at: string | null
        }
        Insert: {
          advocate_id: string
          confidence_level?: number | null
          court_recess_impact?: number | null
          historical_collection_rate?: number | null
          historical_new_matters_ratio?: number | null
          historical_payment_delay_days?: number | null
          holiday_impact?: number | null
          id?: string
          month: number
          sample_years?: number | null
          typical_client_payment_behavior?: string | null
          updated_at?: string | null
        }
        Update: {
          advocate_id?: string
          confidence_level?: number | null
          court_recess_impact?: number | null
          historical_collection_rate?: number | null
          historical_new_matters_ratio?: number | null
          historical_payment_delay_days?: number | null
          holiday_impact?: number | null
          id?: string
          month?: number
          sample_years?: number | null
          typical_client_payment_behavior?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_patterns_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "cash_flow_patterns_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_predictions: {
        Row: {
          advocate_id: string
          cash_flow_status:
            | Database["public"]["Enums"]["cash_flow_status"]
            | null
          collection_confidence: number | null
          contingency_fees: number | null
          created_at: string | null
          expected_collections: number
          expected_expenses: number
          expected_net_cash_flow: number | null
          financing_needed: number | null
          id: string
          invoice_collections: number | null
          minimum_balance_amount: number | null
          minimum_balance_date: string | null
          new_matter_fees: number | null
          overdue_risk_amount: number | null
          period_end: string
          period_start: string
          prediction_date: string
          recommended_actions: string[] | null
          recurring_fees: number | null
          seasonal_adjustment: number | null
        }
        Insert: {
          advocate_id: string
          cash_flow_status?:
            | Database["public"]["Enums"]["cash_flow_status"]
            | null
          collection_confidence?: number | null
          contingency_fees?: number | null
          created_at?: string | null
          expected_collections: number
          expected_expenses: number
          expected_net_cash_flow?: number | null
          financing_needed?: number | null
          id?: string
          invoice_collections?: number | null
          minimum_balance_amount?: number | null
          minimum_balance_date?: string | null
          new_matter_fees?: number | null
          overdue_risk_amount?: number | null
          period_end: string
          period_start: string
          prediction_date: string
          recommended_actions?: string[] | null
          recurring_fees?: number | null
          seasonal_adjustment?: number | null
        }
        Update: {
          advocate_id?: string
          cash_flow_status?:
            | Database["public"]["Enums"]["cash_flow_status"]
            | null
          collection_confidence?: number | null
          contingency_fees?: number | null
          created_at?: string | null
          expected_collections?: number
          expected_expenses?: number
          expected_net_cash_flow?: number | null
          financing_needed?: number | null
          id?: string
          invoice_collections?: number | null
          minimum_balance_amount?: number | null
          minimum_balance_date?: string | null
          new_matter_fees?: number | null
          overdue_risk_amount?: number | null
          period_end?: string
          period_start?: string
          prediction_date?: string
          recommended_actions?: string[] | null
          recurring_fees?: number | null
          seasonal_adjustment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_predictions_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "cash_flow_predictions_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_alerts: {
        Row: {
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          matter_id: string | null
          metadata: Json | null
          resolved: boolean | null
          severity: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          matter_id?: string | null
          metadata?: Json | null
          resolved?: boolean | null
          severity: string
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          matter_id?: string | null
          metadata?: Json | null
          resolved?: boolean | null
          severity?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_alerts_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "active_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_alerts_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_deadlines: {
        Row: {
          completed_at: string | null
          completion_notes: string | null
          created_at: string | null
          due_date: string
          id: string
          reminder_schedule: Json | null
          requirement_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          reminder_schedule?: Json | null
          requirement_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          reminder_schedule?: Json | null
          requirement_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_deadlines_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "regulatory_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_violations: {
        Row: {
          affected_entities: Json | null
          alert_id: string
          can_proceed: boolean | null
          category: string
          created_at: string | null
          id: string
          recommendation: string
          requires_disclosure: boolean | null
          rule_id: string
        }
        Insert: {
          affected_entities?: Json | null
          alert_id: string
          can_proceed?: boolean | null
          category: string
          created_at?: string | null
          id?: string
          recommendation: string
          requires_disclosure?: boolean | null
          rule_id: string
        }
        Update: {
          affected_entities?: Json | null
          alert_id?: string
          can_proceed?: boolean | null
          category?: string
          created_at?: string | null
          id?: string
          recommendation?: string
          requires_disclosure?: boolean | null
          rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_violations_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "compliance_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      conflict_checks: {
        Row: {
          advocate_id: string
          check_approved_by: string | null
          client_name: string
          conflict_details: string | null
          conflict_type: string | null
          conflicting_matter_ids: string[] | null
          created_at: string | null
          has_conflict: boolean | null
          id: string
          matter_id: string | null
          opposing_parties: string[] | null
          related_parties: string[] | null
          waiver_details: string | null
          waiver_obtained: boolean | null
        }
        Insert: {
          advocate_id: string
          check_approved_by?: string | null
          client_name: string
          conflict_details?: string | null
          conflict_type?: string | null
          conflicting_matter_ids?: string[] | null
          created_at?: string | null
          has_conflict?: boolean | null
          id?: string
          matter_id?: string | null
          opposing_parties?: string[] | null
          related_parties?: string[] | null
          waiver_details?: string | null
          waiver_obtained?: boolean | null
        }
        Update: {
          advocate_id?: string
          check_approved_by?: string | null
          client_name?: string
          conflict_details?: string | null
          conflict_type?: string | null
          conflicting_matter_ids?: string[] | null
          created_at?: string | null
          has_conflict?: boolean | null
          id?: string
          matter_id?: string | null
          opposing_parties?: string[] | null
          related_parties?: string[] | null
          waiver_details?: string | null
          waiver_obtained?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "conflict_checks_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "conflict_checks_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflict_checks_check_approved_by_fkey"
            columns: ["check_approved_by"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "conflict_checks_check_approved_by_fkey"
            columns: ["check_approved_by"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflict_checks_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "active_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflict_checks_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      court_cases: {
        Row: {
          allocated_judge_id: string | null
          case_details: Json | null
          case_number: string
          case_type: string
          court_registry_id: string | null
          court_room: string | null
          created_at: string | null
          filing_date: string | null
          id: string
          matter_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          allocated_judge_id?: string | null
          case_details?: Json | null
          case_number: string
          case_type: string
          court_registry_id?: string | null
          court_room?: string | null
          created_at?: string | null
          filing_date?: string | null
          id?: string
          matter_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          allocated_judge_id?: string | null
          case_details?: Json | null
          case_number?: string
          case_type?: string
          court_registry_id?: string | null
          court_room?: string | null
          created_at?: string | null
          filing_date?: string | null
          id?: string
          matter_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "court_cases_court_registry_id_fkey"
            columns: ["court_registry_id"]
            isOneToOne: false
            referencedRelation: "court_registries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_cases_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "active_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_cases_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      court_diary_entries: {
        Row: {
          advocate_id: string | null
          court_case_id: string | null
          created_at: string | null
          description: string | null
          hearing_date: string
          hearing_time: string | null
          hearing_type: string
          id: string
          next_hearing_date: string | null
          notes: string | null
          outcome: string | null
          sync_status: string | null
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          advocate_id?: string | null
          court_case_id?: string | null
          created_at?: string | null
          description?: string | null
          hearing_date: string
          hearing_time?: string | null
          hearing_type: string
          id?: string
          next_hearing_date?: string | null
          notes?: string | null
          outcome?: string | null
          sync_status?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          advocate_id?: string | null
          court_case_id?: string | null
          created_at?: string | null
          description?: string | null
          hearing_date?: string
          hearing_time?: string | null
          hearing_type?: string
          id?: string
          next_hearing_date?: string | null
          notes?: string | null
          outcome?: string | null
          sync_status?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "court_diary_entries_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "court_diary_entries_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_diary_entries_court_case_id_fkey"
            columns: ["court_case_id"]
            isOneToOne: false
            referencedRelation: "court_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      court_integration_logs: {
        Row: {
          court_registry_id: string | null
          created_at: string | null
          error_details: Json | null
          id: string
          records_failed: number | null
          records_processed: number | null
          records_updated: number | null
          status: string
          sync_duration_ms: number | null
          sync_type: string
        }
        Insert: {
          court_registry_id?: string | null
          created_at?: string | null
          error_details?: Json | null
          id?: string
          records_failed?: number | null
          records_processed?: number | null
          records_updated?: number | null
          status: string
          sync_duration_ms?: number | null
          sync_type: string
        }
        Update: {
          court_registry_id?: string | null
          created_at?: string | null
          error_details?: Json | null
          id?: string
          records_failed?: number | null
          records_processed?: number | null
          records_updated?: number | null
          status?: string
          sync_duration_ms?: number | null
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "court_integration_logs_court_registry_id_fkey"
            columns: ["court_registry_id"]
            isOneToOne: false
            referencedRelation: "court_registries"
            referencedColumns: ["id"]
          },
        ]
      }
      court_registries: {
        Row: {
          address: string | null
          api_credentials_encrypted: string | null
          api_endpoint: string | null
          code: string
          contact_details: Json | null
          created_at: string | null
          id: string
          integration_status: string | null
          jurisdiction: string
          last_sync_at: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          api_credentials_encrypted?: string | null
          api_endpoint?: string | null
          code: string
          contact_details?: Json | null
          created_at?: string | null
          id?: string
          integration_status?: string | null
          jurisdiction: string
          last_sync_at?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          api_credentials_encrypted?: string | null
          api_endpoint?: string | null
          code?: string
          contact_details?: Json | null
          created_at?: string | null
          id?: string
          integration_status?: string | null
          jurisdiction?: string
          last_sync_at?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      document_analysis_queue: {
        Row: {
          advocate_id: string
          analysis_type: Database["public"]["Enums"]["analysis_type"]
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          document_id: string
          error_message: string | null
          id: string
          last_attempt_at: string | null
          priority: number | null
          requested_features: string[] | null
          result_id: string | null
          status: string | null
        }
        Insert: {
          advocate_id: string
          analysis_type: Database["public"]["Enums"]["analysis_type"]
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          document_id: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          priority?: number | null
          requested_features?: string[] | null
          result_id?: string | null
          status?: string | null
        }
        Update: {
          advocate_id?: string
          analysis_type?: Database["public"]["Enums"]["analysis_type"]
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          document_id?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          priority?: number | null
          requested_features?: string[] | null
          result_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_analysis_queue_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "document_analysis_queue_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_analysis_queue_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_analysis_queue_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "document_intelligence"
            referencedColumns: ["id"]
          },
        ]
      }
      document_intelligence: {
        Row: {
          analysis_type: Database["public"]["Enums"]["analysis_type"] | null
          applicable_laws: string[] | null
          brief_court: string | null
          brief_deadline: string | null
          brief_judge: string | null
          complexity_score: number | null
          confidence_score: number | null
          created_at: string | null
          document_id: string
          error_message: string | null
          extracted_entities: Json | null
          id: string
          is_brief: boolean | null
          key_dates: string[] | null
          key_issues: string[] | null
          matter_value: number | null
          opposing_counsel: string | null
          processing_completed_at: string | null
          processing_started_at: string | null
          processing_time_ms: number | null
          referenced_cases: string[] | null
          risk_factors: Json | null
          status: Database["public"]["Enums"]["document_status"] | null
          suggested_actions: string[] | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          analysis_type?: Database["public"]["Enums"]["analysis_type"] | null
          applicable_laws?: string[] | null
          brief_court?: string | null
          brief_deadline?: string | null
          brief_judge?: string | null
          complexity_score?: number | null
          confidence_score?: number | null
          created_at?: string | null
          document_id: string
          error_message?: string | null
          extracted_entities?: Json | null
          id?: string
          is_brief?: boolean | null
          key_dates?: string[] | null
          key_issues?: string[] | null
          matter_value?: number | null
          opposing_counsel?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          processing_time_ms?: number | null
          referenced_cases?: string[] | null
          risk_factors?: Json | null
          status?: Database["public"]["Enums"]["document_status"] | null
          suggested_actions?: string[] | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          analysis_type?: Database["public"]["Enums"]["analysis_type"] | null
          applicable_laws?: string[] | null
          brief_court?: string | null
          brief_deadline?: string | null
          brief_judge?: string | null
          complexity_score?: number | null
          confidence_score?: number | null
          created_at?: string | null
          document_id?: string
          error_message?: string | null
          extracted_entities?: Json | null
          id?: string
          is_brief?: boolean | null
          key_dates?: string[] | null
          key_issues?: string[] | null
          matter_value?: number | null
          opposing_counsel?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          processing_time_ms?: number | null
          referenced_cases?: string[] | null
          risk_factors?: Json | null
          status?: Database["public"]["Enums"]["document_status"] | null
          suggested_actions?: string[] | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_intelligence_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          advocate_id: string
          content_text: string | null
          content_vector: unknown | null
          deleted_at: string | null
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          filename: string
          id: string
          matter_id: string
          mime_type: string
          original_filename: string
          parent_document_id: string | null
          size_bytes: number
          storage_path: string
          tags: string[] | null
          updated_at: string | null
          uploaded_at: string | null
          version: number | null
        }
        Insert: {
          advocate_id: string
          content_text?: string | null
          content_vector?: unknown | null
          deleted_at?: string | null
          description?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          filename: string
          id?: string
          matter_id: string
          mime_type: string
          original_filename: string
          parent_document_id?: string | null
          size_bytes: number
          storage_path: string
          tags?: string[] | null
          updated_at?: string | null
          uploaded_at?: string | null
          version?: number | null
        }
        Update: {
          advocate_id?: string
          content_text?: string | null
          content_vector?: unknown | null
          deleted_at?: string | null
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          filename?: string
          id?: string
          matter_id?: string
          mime_type?: string
          original_filename?: string
          parent_document_id?: string | null
          size_bytes?: number
          storage_path?: string
          tags?: string[] | null
          updated_at?: string | null
          uploaded_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "documents_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "active_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      factoring_applications: {
        Row: {
          advance_rate: number | null
          advocate_id: string
          approved_amount: number | null
          approved_at: string | null
          created_at: string | null
          discount_rate: number | null
          fees: number | null
          funded_at: string | null
          id: string
          invoice_age_days: number
          invoice_amount: number
          invoice_id: string
          net_amount: number | null
          offer_id: string
          repayment_amount: number | null
          repayment_due_date: string | null
          repayment_received_date: string | null
          requested_amount: number
          reviewed_at: string | null
          risk_factors: Json | null
          risk_score: number | null
          status: Database["public"]["Enums"]["factoring_status"] | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          advance_rate?: number | null
          advocate_id: string
          approved_amount?: number | null
          approved_at?: string | null
          created_at?: string | null
          discount_rate?: number | null
          fees?: number | null
          funded_at?: string | null
          id?: string
          invoice_age_days: number
          invoice_amount: number
          invoice_id: string
          net_amount?: number | null
          offer_id: string
          repayment_amount?: number | null
          repayment_due_date?: string | null
          repayment_received_date?: string | null
          requested_amount: number
          reviewed_at?: string | null
          risk_factors?: Json | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["factoring_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          advance_rate?: number | null
          advocate_id?: string
          approved_amount?: number | null
          approved_at?: string | null
          created_at?: string | null
          discount_rate?: number | null
          fees?: number | null
          funded_at?: string | null
          id?: string
          invoice_age_days?: number
          invoice_amount?: number
          invoice_id?: string
          net_amount?: number | null
          offer_id?: string
          repayment_amount?: number | null
          repayment_due_date?: string | null
          repayment_received_date?: string | null
          requested_amount?: number
          reviewed_at?: string | null
          risk_factors?: Json | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["factoring_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factoring_applications_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "factoring_applications_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factoring_applications_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factoring_applications_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factoring_applications_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "factoring_marketplace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factoring_applications_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "factoring_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      factoring_offers: {
        Row: {
          advance_rate: number | null
          available_capital: number | null
          created_at: string | null
          current_utilization: number | null
          discount_rate: number | null
          id: string
          is_active: boolean | null
          max_invoice_amount: number | null
          maximum_invoice_age_days: number | null
          min_invoice_amount: number | null
          minimum_invoice_age_days: number | null
          minimum_monthly_revenue: number | null
          minimum_practice_age_months: number | null
          provider_id: string
          provider_name: string
          recourse_type: string | null
          required_collection_rate: number | null
          updated_at: string | null
        }
        Insert: {
          advance_rate?: number | null
          available_capital?: number | null
          created_at?: string | null
          current_utilization?: number | null
          discount_rate?: number | null
          id?: string
          is_active?: boolean | null
          max_invoice_amount?: number | null
          maximum_invoice_age_days?: number | null
          min_invoice_amount?: number | null
          minimum_invoice_age_days?: number | null
          minimum_monthly_revenue?: number | null
          minimum_practice_age_months?: number | null
          provider_id: string
          provider_name: string
          recourse_type?: string | null
          required_collection_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          advance_rate?: number | null
          available_capital?: number | null
          created_at?: string | null
          current_utilization?: number | null
          discount_rate?: number | null
          id?: string
          is_active?: boolean | null
          max_invoice_amount?: number | null
          maximum_invoice_age_days?: number | null
          min_invoice_amount?: number | null
          minimum_invoice_age_days?: number | null
          minimum_monthly_revenue?: number | null
          minimum_practice_age_months?: number | null
          provider_id?: string
          provider_name?: string
          recourse_type?: string | null
          required_collection_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fee_narrative_templates: {
        Row: {
          advocate_id: string | null
          category: string
          created_at: string | null
          id: string
          is_community_approved: boolean | null
          is_public: boolean | null
          last_used_at: string | null
          matter_type: string | null
          name: string
          success_rate: number | null
          template_text: string
          updated_at: string | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          advocate_id?: string | null
          category: string
          created_at?: string | null
          id?: string
          is_community_approved?: boolean | null
          is_public?: boolean | null
          last_used_at?: string | null
          matter_type?: string | null
          name: string
          success_rate?: number | null
          template_text: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          advocate_id?: string | null
          category?: string
          created_at?: string | null
          id?: string
          is_community_approved?: boolean | null
          is_public?: boolean | null
          last_used_at?: string | null
          matter_type?: string | null
          name?: string
          success_rate?: number | null
          template_text?: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_narrative_templates_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "fee_narrative_templates_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_optimization_recommendations: {
        Row: {
          accepted: boolean | null
          accepted_at: string | null
          actual_fee_achieved: number | null
          advocate_id: string
          confidence_score: number | null
          created_at: string | null
          current_estimated_fee: number | null
          current_fee_structure:
            | Database["public"]["Enums"]["fee_structure"]
            | null
          current_hourly_rate: number | null
          expires_at: string | null
          id: string
          market_average_rate: number | null
          market_percentile: number | null
          matter_id: string | null
          optimization_factors: Json | null
          potential_revenue_increase: number | null
          recommended_fee_structure:
            | Database["public"]["Enums"]["fee_structure"]
            | null
          recommended_fixed_fee: number | null
          recommended_hourly_rate: number | null
          recommended_model: Database["public"]["Enums"]["fee_optimization_model"]
          recommended_success_percentage: number | null
          similar_matters_analyzed: number | null
        }
        Insert: {
          accepted?: boolean | null
          accepted_at?: string | null
          actual_fee_achieved?: number | null
          advocate_id: string
          confidence_score?: number | null
          created_at?: string | null
          current_estimated_fee?: number | null
          current_fee_structure?:
            | Database["public"]["Enums"]["fee_structure"]
            | null
          current_hourly_rate?: number | null
          expires_at?: string | null
          id?: string
          market_average_rate?: number | null
          market_percentile?: number | null
          matter_id?: string | null
          optimization_factors?: Json | null
          potential_revenue_increase?: number | null
          recommended_fee_structure?:
            | Database["public"]["Enums"]["fee_structure"]
            | null
          recommended_fixed_fee?: number | null
          recommended_hourly_rate?: number | null
          recommended_model: Database["public"]["Enums"]["fee_optimization_model"]
          recommended_success_percentage?: number | null
          similar_matters_analyzed?: number | null
        }
        Update: {
          accepted?: boolean | null
          accepted_at?: string | null
          actual_fee_achieved?: number | null
          advocate_id?: string
          confidence_score?: number | null
          created_at?: string | null
          current_estimated_fee?: number | null
          current_fee_structure?:
            | Database["public"]["Enums"]["fee_structure"]
            | null
          current_hourly_rate?: number | null
          expires_at?: string | null
          id?: string
          market_average_rate?: number | null
          market_percentile?: number | null
          matter_id?: string | null
          optimization_factors?: Json | null
          potential_revenue_increase?: number | null
          recommended_fee_structure?:
            | Database["public"]["Enums"]["fee_structure"]
            | null
          recommended_fixed_fee?: number | null
          recommended_hourly_rate?: number | null
          recommended_model?: Database["public"]["Enums"]["fee_optimization_model"]
          recommended_success_percentage?: number | null
          similar_matters_analyzed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_optimization_recommendations_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "fee_optimization_recommendations_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_optimization_recommendations_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "active_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_optimization_recommendations_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_fee_narratives: {
        Row: {
          advocate_id: string
          clarity_score: number | null
          completeness_score: number | null
          created_at: string | null
          final_narrative: string | null
          id: string
          invoice_id: string | null
          key_activities: string[] | null
          matter_id: string
          missing_elements: string[] | null
          narrative_text: string
          professionalism_score: number | null
          suggested_improvements: string[] | null
          template_id: string | null
          time_entries_analyzed: number | null
          user_rating: number | null
          value_propositions: string[] | null
          was_edited: boolean | null
          work_categories: Json | null
        }
        Insert: {
          advocate_id: string
          clarity_score?: number | null
          completeness_score?: number | null
          created_at?: string | null
          final_narrative?: string | null
          id?: string
          invoice_id?: string | null
          key_activities?: string[] | null
          matter_id: string
          missing_elements?: string[] | null
          narrative_text: string
          professionalism_score?: number | null
          suggested_improvements?: string[] | null
          template_id?: string | null
          time_entries_analyzed?: number | null
          user_rating?: number | null
          value_propositions?: string[] | null
          was_edited?: boolean | null
          work_categories?: Json | null
        }
        Update: {
          advocate_id?: string
          clarity_score?: number | null
          completeness_score?: number | null
          created_at?: string | null
          final_narrative?: string | null
          id?: string
          invoice_id?: string | null
          key_activities?: string[] | null
          matter_id?: string
          missing_elements?: string[] | null
          narrative_text?: string
          professionalism_score?: number | null
          suggested_improvements?: string[] | null
          template_id?: string | null
          time_entries_analyzed?: number | null
          user_rating?: number | null
          value_propositions?: string[] | null
          was_edited?: boolean | null
          work_categories?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_fee_narratives_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "generated_fee_narratives_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_fee_narratives_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_fee_narratives_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_fee_narratives_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "active_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_fee_narratives_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_fee_narratives_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "fee_narrative_performance"
            referencedColumns: ["template_id"]
          },
          {
            foreignKeyName: "generated_fee_narratives_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "fee_narrative_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          advocate_id: string
          amount_paid: number | null
          balance_due: number | null
          bar: Database["public"]["Enums"]["bar_association"]
          converted_to_invoice_id: string | null
          created_at: string | null
          date_paid: string | null
          days_outstanding: number | null
          deleted_at: string | null
          disbursements_amount: number | null
          due_date: string
          fee_narrative: string
          fees_amount: number
          id: string
          internal_notes: string | null
          invoice_date: string
          invoice_number: string
          is_overdue: boolean | null
          is_pro_forma: boolean | null
          last_reminder_date: string | null
          matter_id: string
          next_reminder_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          pro_forma_accepted_at: string | null
          reminder_history: Json | null
          reminders_sent: number | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number | null
          total_amount: number | null
          updated_at: string | null
          vat_amount: number | null
          vat_rate: number | null
          viewed_at: string | null
        }
        Insert: {
          advocate_id: string
          amount_paid?: number | null
          balance_due?: number | null
          bar: Database["public"]["Enums"]["bar_association"]
          converted_to_invoice_id?: string | null
          created_at?: string | null
          date_paid?: string | null
          days_outstanding?: number | null
          deleted_at?: string | null
          disbursements_amount?: number | null
          due_date: string
          fee_narrative: string
          fees_amount: number
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number: string
          is_overdue?: boolean | null
          is_pro_forma?: boolean | null
          last_reminder_date?: string | null
          matter_id: string
          next_reminder_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          pro_forma_accepted_at?: string | null
          reminder_history?: Json | null
          reminders_sent?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
          viewed_at?: string | null
        }
        Update: {
          advocate_id?: string
          amount_paid?: number | null
          balance_due?: number | null
          bar?: Database["public"]["Enums"]["bar_association"]
          converted_to_invoice_id?: string | null
          created_at?: string | null
          date_paid?: string | null
          days_outstanding?: number | null
          deleted_at?: string | null
          disbursements_amount?: number | null
          due_date?: string
          fee_narrative?: string
          fees_amount?: number
          id?: string
          internal_notes?: string | null
          invoice_date?: string
          invoice_number?: string
          is_overdue?: boolean | null
          is_pro_forma?: boolean | null
          last_reminder_date?: string | null
          matter_id?: string
          next_reminder_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          pro_forma_accepted_at?: string | null
          reminder_history?: Json | null
          reminders_sent?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "invoices_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_converted_to_invoice_id_fkey"
            columns: ["converted_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_converted_to_invoice_id_fkey"
            columns: ["converted_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "active_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_analytics: {
        Row: {
          advocate_interactions: Json | null
          average_hearing_duration: unknown | null
          case_types_distribution: Json | null
          created_at: string | null
          id: string
          judge_id: string | null
          judgment_delivery_time_avg: unknown | null
          performance_score: number | null
          period_end: string
          period_start: string
          postponement_rate: number | null
          ruling_patterns: Json | null
          total_cases_heard: number | null
          updated_at: string | null
        }
        Insert: {
          advocate_interactions?: Json | null
          average_hearing_duration?: unknown | null
          case_types_distribution?: Json | null
          created_at?: string | null
          id?: string
          judge_id?: string | null
          judgment_delivery_time_avg?: unknown | null
          performance_score?: number | null
          period_end: string
          period_start: string
          postponement_rate?: number | null
          ruling_patterns?: Json | null
          total_cases_heard?: number | null
          updated_at?: string | null
        }
        Update: {
          advocate_interactions?: Json | null
          average_hearing_duration?: unknown | null
          case_types_distribution?: Json | null
          created_at?: string | null
          id?: string
          judge_id?: string | null
          judgment_delivery_time_avg?: unknown | null
          performance_score?: number | null
          period_end?: string
          period_start?: string
          postponement_rate?: number | null
          ruling_patterns?: Json | null
          total_cases_heard?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "judge_analytics_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "judges"
            referencedColumns: ["id"]
          },
        ]
      }
      judges: {
        Row: {
          appointment_date: string | null
          bio: string | null
          court_registry_id: string | null
          created_at: string | null
          id: string
          name: string
          photo_url: string | null
          specializations: string[] | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          bio?: string | null
          court_registry_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          photo_url?: string | null
          specializations?: string[] | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          bio?: string | null
          court_registry_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          specializations?: string[] | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "judges_court_registry_id_fkey"
            columns: ["court_registry_id"]
            isOneToOne: false
            referencedRelation: "court_registries"
            referencedColumns: ["id"]
          },
        ]
      }
      language_translations: {
        Row: {
          context: string | null
          created_at: string | null
          id: string
          key: string
          language_code: string
          translation: string
          updated_at: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          id?: string
          key: string
          language_code: string
          translation: string
          updated_at?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string | null
          id?: string
          key?: string
          language_code?: string
          translation?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      matters: {
        Row: {
          actual_fee: number | null
          advocate_id: string
          bar: Database["public"]["Enums"]["bar_association"]
          client_address: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          client_type: string | null
          conflict_check_cleared: boolean | null
          conflict_check_completed: boolean | null
          conflict_check_date: string | null
          conflict_notes: string | null
          court_case_number: string | null
          created_at: string | null
          date_accepted: string | null
          date_closed: string | null
          date_commenced: string | null
          date_instructed: string
          date_settled: string | null
          days_active: number | null
          deleted_at: string | null
          description: string | null
          disbursements: number | null
          estimated_fee: number | null
          expected_completion_date: string | null
          fee_cap: number | null
          fee_type: Database["public"]["Enums"]["fee_type"] | null
          id: string
          instructing_attorney: string
          instructing_attorney_email: string | null
          instructing_attorney_phone: string | null
          instructing_firm: string | null
          instructing_firm_ref: string | null
          is_overdue: boolean | null
          matter_type: string
          next_court_date: string | null
          prescription_date: string | null
          reference_number: string
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          settlement_probability: number | null
          status: Database["public"]["Enums"]["matter_status"] | null
          tags: string[] | null
          title: string
          trust_balance: number | null
          updated_at: string | null
          vat_exempt: boolean | null
          wip_value: number | null
        }
        Insert: {
          actual_fee?: number | null
          advocate_id: string
          bar: Database["public"]["Enums"]["bar_association"]
          client_address?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          client_type?: string | null
          conflict_check_cleared?: boolean | null
          conflict_check_completed?: boolean | null
          conflict_check_date?: string | null
          conflict_notes?: string | null
          court_case_number?: string | null
          created_at?: string | null
          date_accepted?: string | null
          date_closed?: string | null
          date_commenced?: string | null
          date_instructed?: string
          date_settled?: string | null
          days_active?: number | null
          deleted_at?: string | null
          description?: string | null
          disbursements?: number | null
          estimated_fee?: number | null
          expected_completion_date?: string | null
          fee_cap?: number | null
          fee_type?: Database["public"]["Enums"]["fee_type"] | null
          id?: string
          instructing_attorney: string
          instructing_attorney_email?: string | null
          instructing_attorney_phone?: string | null
          instructing_firm?: string | null
          instructing_firm_ref?: string | null
          is_overdue?: boolean | null
          matter_type: string
          next_court_date?: string | null
          prescription_date?: string | null
          reference_number: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          settlement_probability?: number | null
          status?: Database["public"]["Enums"]["matter_status"] | null
          tags?: string[] | null
          title: string
          trust_balance?: number | null
          updated_at?: string | null
          vat_exempt?: boolean | null
          wip_value?: number | null
        }
        Update: {
          actual_fee?: number | null
          advocate_id?: string
          bar?: Database["public"]["Enums"]["bar_association"]
          client_address?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          client_type?: string | null
          conflict_check_cleared?: boolean | null
          conflict_check_completed?: boolean | null
          conflict_check_date?: string | null
          conflict_notes?: string | null
          court_case_number?: string | null
          created_at?: string | null
          date_accepted?: string | null
          date_closed?: string | null
          date_commenced?: string | null
          date_instructed?: string
          date_settled?: string | null
          days_active?: number | null
          deleted_at?: string | null
          description?: string | null
          disbursements?: number | null
          estimated_fee?: number | null
          expected_completion_date?: string | null
          fee_cap?: number | null
          fee_type?: Database["public"]["Enums"]["fee_type"] | null
          id?: string
          instructing_attorney?: string
          instructing_attorney_email?: string | null
          instructing_attorney_phone?: string | null
          instructing_firm?: string | null
          instructing_firm_ref?: string | null
          is_overdue?: boolean | null
          matter_type?: string
          next_court_date?: string | null
          prescription_date?: string | null
          reference_number?: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          settlement_probability?: number | null
          status?: Database["public"]["Enums"]["matter_status"] | null
          tags?: string[] | null
          title?: string
          trust_balance?: number | null
          updated_at?: string | null
          vat_exempt?: boolean | null
          wip_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matters_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "matters_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          advocate_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          id: string
          is_important: boolean | null
          is_internal: boolean | null
          matter_id: string
          updated_at: string | null
        }
        Insert: {
          advocate_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_important?: boolean | null
          is_internal?: boolean | null
          matter_id: string
          updated_at?: string | null
        }
        Update: {
          advocate_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_important?: boolean | null
          is_internal?: boolean | null
          matter_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "notes_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "active_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      overflow_briefs: {
        Row: {
          accepted_at: string | null
          accepted_by_advocate_id: string | null
          application_count: number | null
          bar: Database["public"]["Enums"]["bar_association"]
          category: Database["public"]["Enums"]["specialisation_category"]
          completed_at: string | null
          created_at: string | null
          deadline: string | null
          deleted_at: string | null
          description: string
          estimated_fee_range_max: number | null
          estimated_fee_range_min: number | null
          expected_duration_days: number | null
          expires_at: string | null
          fee_type: Database["public"]["Enums"]["fee_type"] | null
          hidden_from_advocates: string[] | null
          id: string
          is_public: boolean | null
          is_urgent: boolean | null
          language_requirements: string[] | null
          matter_type: string
          posting_advocate_id: string
          referral_percentage: number | null
          required_certifications: string[] | null
          required_experience_years: number | null
          status: Database["public"]["Enums"]["brief_status"] | null
          title: string
          updated_at: string | null
          view_count: number | null
          visible_to_advocates: string[] | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_advocate_id?: string | null
          application_count?: number | null
          bar: Database["public"]["Enums"]["bar_association"]
          category: Database["public"]["Enums"]["specialisation_category"]
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          deleted_at?: string | null
          description: string
          estimated_fee_range_max?: number | null
          estimated_fee_range_min?: number | null
          expected_duration_days?: number | null
          expires_at?: string | null
          fee_type?: Database["public"]["Enums"]["fee_type"] | null
          hidden_from_advocates?: string[] | null
          id?: string
          is_public?: boolean | null
          is_urgent?: boolean | null
          language_requirements?: string[] | null
          matter_type: string
          posting_advocate_id: string
          referral_percentage?: number | null
          required_certifications?: string[] | null
          required_experience_years?: number | null
          status?: Database["public"]["Enums"]["brief_status"] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
          visible_to_advocates?: string[] | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by_advocate_id?: string | null
          application_count?: number | null
          bar?: Database["public"]["Enums"]["bar_association"]
          category?: Database["public"]["Enums"]["specialisation_category"]
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          deleted_at?: string | null
          description?: string
          estimated_fee_range_max?: number | null
          estimated_fee_range_min?: number | null
          expected_duration_days?: number | null
          expires_at?: string | null
          fee_type?: Database["public"]["Enums"]["fee_type"] | null
          hidden_from_advocates?: string[] | null
          id?: string
          is_public?: boolean | null
          is_urgent?: boolean | null
          language_requirements?: string[] | null
          matter_type?: string
          posting_advocate_id?: string
          referral_percentage?: number | null
          required_certifications?: string[] | null
          required_experience_years?: number | null
          status?: Database["public"]["Enums"]["brief_status"] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
          visible_to_advocates?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "overflow_briefs_accepted_by_advocate_id_fkey"
            columns: ["accepted_by_advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "overflow_briefs_accepted_by_advocate_id_fkey"
            columns: ["accepted_by_advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overflow_briefs_posting_advocate_id_fkey"
            columns: ["posting_advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "overflow_briefs_posting_advocate_id_fkey"
            columns: ["posting_advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          advocate_id: string
          amount: number
          bank_reference: string | null
          created_at: string | null
          id: string
          invoice_id: string | null
          is_trust_deposit: boolean | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          reconciled: boolean | null
          reconciled_date: string | null
          reference: string | null
          trust_transfer_date: string | null
        }
        Insert: {
          advocate_id: string
          amount: number
          bank_reference?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          is_trust_deposit?: boolean | null
          payment_date?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          reconciled?: boolean | null
          reconciled_date?: string | null
          reference?: string | null
          trust_transfer_date?: string | null
        }
        Update: {
          advocate_id?: string
          amount?: number
          bank_reference?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          is_trust_deposit?: boolean | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reconciled?: boolean | null
          reconciled_date?: string | null
          reference?: string | null
          trust_transfer_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "payments_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_financial_health: {
        Row: {
          advocate_id: string
          average_collection_days: number | null
          calculation_date: string
          cash_runway_days: number | null
          collection_rate_30d: number | null
          collection_rate_90d: number | null
          created_at: string | null
          current_ratio: number | null
          health_trend: string | null
          id: string
          monthly_recurring_revenue: number | null
          opportunities: string[] | null
          overall_health_score: number | null
          quick_ratio: number | null
          realization_rate: number | null
          revenue_concentration: number | null
          revenue_growth_rate: number | null
          risk_alerts: string[] | null
          utilization_rate: number | null
          wip_turnover_days: number | null
          write_off_rate: number | null
        }
        Insert: {
          advocate_id: string
          average_collection_days?: number | null
          calculation_date: string
          cash_runway_days?: number | null
          collection_rate_30d?: number | null
          collection_rate_90d?: number | null
          created_at?: string | null
          current_ratio?: number | null
          health_trend?: string | null
          id?: string
          monthly_recurring_revenue?: number | null
          opportunities?: string[] | null
          overall_health_score?: number | null
          quick_ratio?: number | null
          realization_rate?: number | null
          revenue_concentration?: number | null
          revenue_growth_rate?: number | null
          risk_alerts?: string[] | null
          utilization_rate?: number | null
          wip_turnover_days?: number | null
          write_off_rate?: number | null
        }
        Update: {
          advocate_id?: string
          average_collection_days?: number | null
          calculation_date?: string
          cash_runway_days?: number | null
          collection_rate_30d?: number | null
          collection_rate_90d?: number | null
          created_at?: string | null
          current_ratio?: number | null
          health_trend?: string | null
          id?: string
          monthly_recurring_revenue?: number | null
          opportunities?: string[] | null
          overall_health_score?: number | null
          quick_ratio?: number | null
          realization_rate?: number | null
          revenue_concentration?: number | null
          revenue_growth_rate?: number | null
          risk_alerts?: string[] | null
          utilization_rate?: number | null
          wip_turnover_days?: number | null
          write_off_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_financial_health_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "practice_financial_health_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      precedent_bank: {
        Row: {
          applicable_laws: string[] | null
          average_rating: number | null
          bar: Database["public"]["Enums"]["bar_association"] | null
          category: string
          change_notes: string | null
          contributor_id: string
          court_level: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          document_id: string | null
          download_count: number | null
          id: string
          is_verified: boolean | null
          parent_precedent_id: string | null
          precedent_type: Database["public"]["Enums"]["precedent_type"]
          quality_score: number | null
          rating_count: number | null
          rating_sum: number | null
          subcategory: string | null
          tags: string[] | null
          template_content: string | null
          title: string
          updated_at: string | null
          usage_count: number | null
          verification_date: string | null
          verified_by: string | null
          version: number | null
          year_created: number | null
        }
        Insert: {
          applicable_laws?: string[] | null
          average_rating?: number | null
          bar?: Database["public"]["Enums"]["bar_association"] | null
          category: string
          change_notes?: string | null
          contributor_id: string
          court_level?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          document_id?: string | null
          download_count?: number | null
          id?: string
          is_verified?: boolean | null
          parent_precedent_id?: string | null
          precedent_type: Database["public"]["Enums"]["precedent_type"]
          quality_score?: number | null
          rating_count?: number | null
          rating_sum?: number | null
          subcategory?: string | null
          tags?: string[] | null
          template_content?: string | null
          title: string
          updated_at?: string | null
          usage_count?: number | null
          verification_date?: string | null
          verified_by?: string | null
          version?: number | null
          year_created?: number | null
        }
        Update: {
          applicable_laws?: string[] | null
          average_rating?: number | null
          bar?: Database["public"]["Enums"]["bar_association"] | null
          category?: string
          change_notes?: string | null
          contributor_id?: string
          court_level?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          document_id?: string | null
          download_count?: number | null
          id?: string
          is_verified?: boolean | null
          parent_precedent_id?: string | null
          precedent_type?: Database["public"]["Enums"]["precedent_type"]
          quality_score?: number | null
          rating_count?: number | null
          rating_sum?: number | null
          subcategory?: string | null
          tags?: string[] | null
          template_content?: string | null
          title?: string
          updated_at?: string | null
          usage_count?: number | null
          verification_date?: string | null
          verified_by?: string | null
          version?: number | null
          year_created?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "precedent_bank_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "precedent_bank_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precedent_bank_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precedent_bank_parent_precedent_id_fkey"
            columns: ["parent_precedent_id"]
            isOneToOne: false
            referencedRelation: "popular_precedents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precedent_bank_parent_precedent_id_fkey"
            columns: ["parent_precedent_id"]
            isOneToOne: false
            referencedRelation: "precedent_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precedent_bank_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "precedent_bank_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      precedent_usage: {
        Row: {
          advocate_id: string
          created_at: string | null
          download_date: string | null
          id: string
          matter_id: string | null
          modifications_made: boolean | null
          outcome_notes: string | null
          precedent_id: string
          rating: number | null
          review: string | null
          usage_date: string | null
          was_successful: boolean | null
        }
        Insert: {
          advocate_id: string
          created_at?: string | null
          download_date?: string | null
          id?: string
          matter_id?: string | null
          modifications_made?: boolean | null
          outcome_notes?: string | null
          precedent_id: string
          rating?: number | null
          review?: string | null
          usage_date?: string | null
          was_successful?: boolean | null
        }
        Update: {
          advocate_id?: string
          created_at?: string | null
          download_date?: string | null
          id?: string
          matter_id?: string | null
          modifications_made?: boolean | null
          outcome_notes?: string | null
          precedent_id?: string
          rating?: number | null
          review?: string | null
          usage_date?: string | null
          was_successful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "precedent_usage_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "precedent_usage_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precedent_usage_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "active_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precedent_usage_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precedent_usage_precedent_id_fkey"
            columns: ["precedent_id"]
            isOneToOne: false
            referencedRelation: "popular_precedents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precedent_usage_precedent_id_fkey"
            columns: ["precedent_id"]
            isOneToOne: false
            referencedRelation: "precedent_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliations: {
        Row: {
          bank_statement_data: Json | null
          closing_balance: number
          created_at: string | null
          discrepancy_count: number | null
          id: string
          notes: string | null
          opening_balance: number
          performed_by: string
          reconciliation_date: string | null
          total_deposits: number | null
          total_withdrawals: number | null
          trust_account_id: string
        }
        Insert: {
          bank_statement_data?: Json | null
          closing_balance: number
          created_at?: string | null
          discrepancy_count?: number | null
          id?: string
          notes?: string | null
          opening_balance: number
          performed_by: string
          reconciliation_date?: string | null
          total_deposits?: number | null
          total_withdrawals?: number | null
          trust_account_id: string
        }
        Update: {
          bank_statement_data?: Json | null
          closing_balance?: number
          created_at?: string | null
          discrepancy_count?: number | null
          id?: string
          notes?: string | null
          opening_balance?: number
          performed_by?: string
          reconciliation_date?: string | null
          total_deposits?: number | null
          total_withdrawals?: number | null
          trust_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliations_trust_account_id_fkey"
            columns: ["trust_account_id"]
            isOneToOne: false
            referencedRelation: "trust_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_relationships: {
        Row: {
          advocate_a_id: string
          advocate_b_id: string
          created_at: string | null
          id: string
          last_referral_date: string | null
          reciprocity_ratio: number | null
          referrals_a_to_b: number | null
          referrals_b_to_a: number | null
          relationship_quality: string | null
          total_value_a_to_b: number | null
          total_value_b_to_a: number | null
          updated_at: string | null
        }
        Insert: {
          advocate_a_id: string
          advocate_b_id: string
          created_at?: string | null
          id?: string
          last_referral_date?: string | null
          reciprocity_ratio?: number | null
          referrals_a_to_b?: number | null
          referrals_b_to_a?: number | null
          relationship_quality?: string | null
          total_value_a_to_b?: number | null
          total_value_b_to_a?: number | null
          updated_at?: string | null
        }
        Update: {
          advocate_a_id?: string
          advocate_b_id?: string
          created_at?: string | null
          id?: string
          last_referral_date?: string | null
          reciprocity_ratio?: number | null
          referrals_a_to_b?: number | null
          referrals_b_to_a?: number | null
          relationship_quality?: string | null
          total_value_a_to_b?: number | null
          total_value_b_to_a?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_relationships_advocate_a_id_fkey"
            columns: ["advocate_a_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "referral_relationships_advocate_a_id_fkey"
            columns: ["advocate_a_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_relationships_advocate_b_id_fkey"
            columns: ["advocate_b_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "referral_relationships_advocate_b_id_fkey"
            columns: ["advocate_b_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          matter_id: string
          notes: string | null
          reciprocal_completed: boolean | null
          reciprocal_expected: boolean | null
          referral_date: string
          referral_fee_amount: number | null
          referral_fee_paid: boolean | null
          referral_fee_paid_date: string | null
          referral_fee_percentage: number | null
          referred_to_advocate_id: string | null
          referring_advocate_id: string | null
          referring_firm: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          matter_id: string
          notes?: string | null
          reciprocal_completed?: boolean | null
          reciprocal_expected?: boolean | null
          referral_date?: string
          referral_fee_amount?: number | null
          referral_fee_paid?: boolean | null
          referral_fee_paid_date?: string | null
          referral_fee_percentage?: number | null
          referred_to_advocate_id?: string | null
          referring_advocate_id?: string | null
          referring_firm?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          matter_id?: string
          notes?: string | null
          reciprocal_completed?: boolean | null
          reciprocal_expected?: boolean | null
          referral_date?: string
          referral_fee_amount?: number | null
          referral_fee_paid?: boolean | null
          referral_fee_paid_date?: string | null
          referral_fee_percentage?: number | null
          referred_to_advocate_id?: string | null
          referring_advocate_id?: string | null
          referring_firm?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "active_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_to_advocate_id_fkey"
            columns: ["referred_to_advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "referrals_referred_to_advocate_id_fkey"
            columns: ["referred_to_advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referring_advocate_id_fkey"
            columns: ["referring_advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "referrals_referring_advocate_id_fkey"
            columns: ["referring_advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_requirements: {
        Row: {
          bar_council: string
          compliance_criteria: Json | null
          created_at: string | null
          days_notice: number | null
          description: string
          frequency: string
          id: string
          mandatory: boolean | null
          requirement_code: string
          title: string
          updated_at: string | null
        }
        Insert: {
          bar_council: string
          compliance_criteria?: Json | null
          created_at?: string | null
          days_notice?: number | null
          description: string
          frequency: string
          id?: string
          mandatory?: boolean | null
          requirement_code: string
          title: string
          updated_at?: string | null
        }
        Update: {
          bar_council?: string
          compliance_criteria?: Json | null
          created_at?: string | null
          days_notice?: number | null
          description?: string
          frequency?: string
          id?: string
          mandatory?: boolean | null
          requirement_code?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      success_fee_scenarios: {
        Row: {
          advocate_id: string
          approval_date: string | null
          base_fee: number | null
          breakeven_probability: number | null
          client_approved: boolean | null
          created_at: string | null
          description: string | null
          expected_recovery: number | null
          expected_total_fee: number | null
          id: string
          matter_id: string
          maximum_recovery: number | null
          maximum_total_fee: number | null
          minimum_recovery: number | null
          minimum_total_fee: number | null
          presented_to_client: boolean | null
          risk_adjusted_fee: number | null
          scenario_name: string
          success_definition: string
          success_fee_cap: number | null
          success_fee_percentage: number | null
          success_probability: number | null
          updated_at: string | null
        }
        Insert: {
          advocate_id: string
          approval_date?: string | null
          base_fee?: number | null
          breakeven_probability?: number | null
          client_approved?: boolean | null
          created_at?: string | null
          description?: string | null
          expected_recovery?: number | null
          expected_total_fee?: number | null
          id?: string
          matter_id: string
          maximum_recovery?: number | null
          maximum_total_fee?: number | null
          minimum_recovery?: number | null
          minimum_total_fee?: number | null
          presented_to_client?: boolean | null
          risk_adjusted_fee?: number | null
          scenario_name: string
          success_definition: string
          success_fee_cap?: number | null
          success_fee_percentage?: number | null
          success_probability?: number | null
          updated_at?: string | null
        }
        Update: {
          advocate_id?: string
          approval_date?: string | null
          base_fee?: number | null
          breakeven_probability?: number | null
          client_approved?: boolean | null
          created_at?: string | null
          description?: string | null
          expected_recovery?: number | null
          expected_total_fee?: number | null
          id?: string
          matter_id?: string
          maximum_recovery?: number | null
          maximum_total_fee?: number | null
          minimum_recovery?: number | null
          minimum_total_fee?: number | null
          presented_to_client?: boolean | null
          risk_adjusted_fee?: number | null
          scenario_name?: string
          success_definition?: string
          success_fee_cap?: number | null
          success_fee_percentage?: number | null
          success_probability?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "success_fee_scenarios_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "success_fee_scenarios_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "success_fee_scenarios_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "active_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "success_fee_scenarios_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          advocate_id: string
          amount: number | null
          billable: boolean | null
          billed: boolean | null
          created_at: string | null
          date: string
          deleted_at: string | null
          description: string
          duration_minutes: number
          end_time: string | null
          id: string
          invoice_id: string | null
          matter_id: string
          rate: number
          recording_method:
            | Database["public"]["Enums"]["time_entry_method"]
            | null
          start_time: string | null
          updated_at: string | null
          write_off: boolean | null
          write_off_reason: string | null
        }
        Insert: {
          advocate_id: string
          amount?: number | null
          billable?: boolean | null
          billed?: boolean | null
          created_at?: string | null
          date?: string
          deleted_at?: string | null
          description: string
          duration_minutes: number
          end_time?: string | null
          id?: string
          invoice_id?: string | null
          matter_id: string
          rate: number
          recording_method?:
            | Database["public"]["Enums"]["time_entry_method"]
            | null
          start_time?: string | null
          updated_at?: string | null
          write_off?: boolean | null
          write_off_reason?: string | null
        }
        Update: {
          advocate_id?: string
          amount?: number | null
          billable?: boolean | null
          billed?: boolean | null
          created_at?: string | null
          date?: string
          deleted_at?: string | null
          description?: string
          duration_minutes?: number
          end_time?: string | null
          id?: string
          invoice_id?: string | null
          matter_id?: string
          rate?: number
          recording_method?:
            | Database["public"]["Enums"]["time_entry_method"]
            | null
          start_time?: string | null
          updated_at?: string | null
          write_off?: boolean | null
          write_off_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "time_entries_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "active_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }

      trust_accounts: {
        Row: {
          account_details: Json | null
          account_number: string
          bank_name: string
          created_at: string | null
          current_balance: number | null
          id: string
          last_reconciliation: string | null
          reconciled_balance: number | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_details?: Json | null
          account_number: string
          bank_name: string
          created_at?: string | null
          current_balance?: number | null
          id?: string
          last_reconciliation?: string | null
          reconciled_balance?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_details?: Json | null
          account_number?: string
          bank_name?: string
          created_at?: string | null
          current_balance?: number | null
          id?: string
          last_reconciliation?: string | null
          reconciled_balance?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trust_transactions: {
        Row: {
          amount: number
          bank_details: Json | null
          created_at: string | null
          description: string
          id: string
          matter_id: string | null
          reference_number: string | null
          running_balance: number
          status: string | null
          transaction_date: string | null
          transaction_type: string
          trust_account_id: string
        }
        Insert: {
          amount: number
          bank_details?: Json | null
          created_at?: string | null
          description: string
          id?: string
          matter_id?: string | null
          reference_number?: string | null
          running_balance: number
          status?: string | null
          transaction_date?: string | null
          transaction_type: string
          trust_account_id: string
        }
        Update: {
          amount?: number
          bank_details?: Json | null
          created_at?: string | null
          description?: string
          id?: string
          matter_id?: string | null
          reference_number?: string | null
          running_balance?: number
          status?: string | null
          transaction_date?: string | null
          transaction_type?: string
          trust_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_transactions_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "active_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_transactions_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_transactions_trust_account_id_fkey"
            columns: ["trust_account_id"]
            isOneToOne: false
            referencedRelation: "trust_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          advanced_features: Json
          created_at: string | null
          feature_discovery: Json
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          advanced_features?: Json
          created_at?: string | null
          feature_discovery?: Json
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          advanced_features?: Json
          created_at?: string | null
          feature_discovery?: Json
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }



      service_categories: {
        Row: {
          id: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      matter_services: {
        Row: {
          matter_id: string
          service_id: string
        }
        Insert: {
          matter_id: string
          service_id: string
        }
        Update: {
          matter_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matter_services_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matter_services_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "active_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matter_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      pro_forma_requests: {
        Row: {
          id: string
          token: string
          advocate_id: string
          client_name: string
          client_email: string
          client_phone: string | null
          matter_description: string
          matter_type: string
          urgency_level: Database["public"]["Enums"]["urgency_level"]
          estimated_value: number | null
          preferred_contact_method: string | null
          additional_notes: string | null
          status: Database["public"]["Enums"]["pro_forma_status"]
          expires_at: string
          created_at: string | null
          updated_at: string | null
          processed_at: string | null
          processed_by: string | null
          action_taken: Database["public"]["Enums"]["pro_forma_action"] | null
          rejection_reason: string | null
        }
        Insert: {
          id?: string
          token?: string
          advocate_id: string
          client_name: string
          client_email: string
          client_phone?: string | null
          matter_description: string
          matter_type: string
          urgency_level: Database["public"]["Enums"]["urgency_level"]
          estimated_value?: number | null
          preferred_contact_method?: string | null
          additional_notes?: string | null
          status?: Database["public"]["Enums"]["pro_forma_status"]
          expires_at?: string
          created_at?: string | null
          updated_at?: string | null
          processed_at?: string | null
          processed_by?: string | null
          action_taken?: Database["public"]["Enums"]["pro_forma_action"] | null
          rejection_reason?: string | null
        }
        Update: {
          id?: string
          token?: string
          advocate_id?: string
          client_name?: string
          client_email?: string
          client_phone?: string | null
          matter_description?: string
          matter_type?: string
          urgency_level?: Database["public"]["Enums"]["urgency_level"]
          estimated_value?: number | null
          preferred_contact_method?: string | null
          additional_notes?: string | null
          status?: Database["public"]["Enums"]["pro_forma_status"]
          expires_at?: string
          created_at?: string | null
          updated_at?: string | null
          processed_at?: string | null
          processed_by?: string | null
          action_taken?: Database["public"]["Enums"]["pro_forma_action"] | null
          rejection_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pro_forma_requests_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_forma_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      active_matters: {
        Row: {
          actual_fee: number | null
          advocate_id: string | null
          bar: Database["public"]["Enums"]["bar_association"] | null
          client_address: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          client_type: string | null
          conflict_check_cleared: boolean | null
          conflict_check_completed: boolean | null
          conflict_check_date: string | null
          conflict_notes: string | null
          court_case_number: string | null
          created_at: string | null
          date_accepted: string | null
          date_closed: string | null
          date_commenced: string | null
          date_instructed: string | null
          date_settled: string | null
          days_active: number | null
          deleted_at: string | null
          description: string | null
          disbursements: number | null
          estimated_fee: number | null
          expected_completion_date: string | null
          fee_cap: number | null
          fee_type: Database["public"]["Enums"]["fee_type"] | null
          id: string | null
          instructing_attorney: string | null
          instructing_attorney_email: string | null
          instructing_attorney_phone: string | null
          instructing_firm: string | null
          instructing_firm_ref: string | null
          is_overdue: boolean | null
          matter_type: string | null
          next_court_date: string | null
          prescription_date: string | null
          reference_number: string | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          settlement_probability: number | null
          status: Database["public"]["Enums"]["matter_status"] | null
          tags: string[] | null
          title: string | null
          trust_balance: number | null
          updated_at: string | null
          vat_exempt: boolean | null
          wip_value: number | null
        }
        Insert: {
          actual_fee?: number | null
          advocate_id?: string | null
          bar?: Database["public"]["Enums"]["bar_association"] | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_type?: string | null
          conflict_check_cleared?: boolean | null
          conflict_check_completed?: boolean | null
          conflict_check_date?: string | null
          conflict_notes?: string | null
          court_case_number?: string | null
          created_at?: string | null
          date_accepted?: string | null
          date_closed?: string | null
          date_commenced?: string | null
          date_instructed?: string | null
          date_settled?: string | null
          days_active?: number | null
          deleted_at?: string | null
          description?: string | null
          disbursements?: number | null
          estimated_fee?: number | null
          expected_completion_date?: string | null
          fee_cap?: number | null
          fee_type?: Database["public"]["Enums"]["fee_type"] | null
          id?: string | null
          instructing_attorney?: string | null
          instructing_attorney_email?: string | null
          instructing_attorney_phone?: string | null
          instructing_firm?: string | null
          instructing_firm_ref?: string | null
          is_overdue?: boolean | null
          matter_type?: string | null
          next_court_date?: string | null
          prescription_date?: string | null
          reference_number?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          settlement_probability?: number | null
          status?: Database["public"]["Enums"]["matter_status"] | null
          tags?: string[] | null
          title?: string | null
          trust_balance?: number | null
          updated_at?: string | null
          vat_exempt?: boolean | null
          wip_value?: number | null
        }
        Update: {
          actual_fee?: number | null
          advocate_id?: string | null
          bar?: Database["public"]["Enums"]["bar_association"] | null
          client_address?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_type?: string | null
          conflict_check_cleared?: boolean | null
          conflict_check_completed?: boolean | null
          conflict_check_date?: string | null
          conflict_notes?: string | null
          court_case_number?: string | null
          created_at?: string | null
          date_accepted?: string | null
          date_closed?: string | null
          date_commenced?: string | null
          date_instructed?: string | null
          date_settled?: string | null
          days_active?: number | null
          deleted_at?: string | null
          description?: string | null
          disbursements?: number | null
          estimated_fee?: number | null
          expected_completion_date?: string | null
          fee_cap?: number | null
          fee_type?: Database["public"]["Enums"]["fee_type"] | null
          id?: string | null
          instructing_attorney?: string | null
          instructing_attorney_email?: string | null
          instructing_attorney_phone?: string | null
          instructing_firm?: string | null
          instructing_firm_ref?: string | null
          is_overdue?: boolean | null
          matter_type?: string | null
          next_court_date?: string | null
          prescription_date?: string | null
          reference_number?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          settlement_probability?: number | null
          status?: Database["public"]["Enums"]["matter_status"] | null
          tags?: string[] | null
          title?: string | null
          trust_balance?: number | null
          updated_at?: string | null
          vat_exempt?: boolean | null
          wip_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matters_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "matters_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      advocate_referral_stats: {
        Row: {
          advocate_id: string | null
          full_name: string | null
          reciprocity_ratio: number | null
          referrals_given: number | null
          referrals_received: number | null
          value_given: number | null
          value_received: number | null
        }
        Relationships: []
      }
      available_overflow_briefs: {
        Row: {
          accepted_at: string | null
          accepted_by_advocate_id: string | null
          application_count: number | null
          bar: Database["public"]["Enums"]["bar_association"] | null
          category:
            | Database["public"]["Enums"]["specialisation_category"]
            | null
          completed_at: string | null
          created_at: string | null
          current_applications: number | null
          deadline: string | null
          deleted_at: string | null
          description: string | null
          estimated_fee_range_max: number | null
          estimated_fee_range_min: number | null
          expected_duration_days: number | null
          expires_at: string | null
          fee_type: Database["public"]["Enums"]["fee_type"] | null
          hidden_from_advocates: string[] | null
          id: string | null
          is_public: boolean | null
          is_urgent: boolean | null
          language_requirements: string[] | null
          matter_type: string | null
          posting_advocate_bar:
            | Database["public"]["Enums"]["bar_association"]
            | null
          posting_advocate_id: string | null
          posting_advocate_name: string | null
          referral_percentage: number | null
          required_certifications: string[] | null
          required_experience_years: number | null
          status: Database["public"]["Enums"]["brief_status"] | null
          title: string | null
          updated_at: string | null
          view_count: number | null
          visible_to_advocates: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "overflow_briefs_accepted_by_advocate_id_fkey"
            columns: ["accepted_by_advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "overflow_briefs_accepted_by_advocate_id_fkey"
            columns: ["accepted_by_advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overflow_briefs_posting_advocate_id_fkey"
            columns: ["posting_advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "overflow_briefs_posting_advocate_id_fkey"
            columns: ["posting_advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_forecast: {
        Row: {
          advocate_id: string | null
          advocate_name: string | null
          bar: Database["public"]["Enums"]["bar_association"] | null
          cash_flow_status:
            | Database["public"]["Enums"]["cash_flow_status"]
            | null
          collection_confidence: number | null
          contingency_fees: number | null
          created_at: string | null
          expected_collections: number | null
          expected_expenses: number | null
          expected_net_cash_flow: number | null
          financing_needed: number | null
          forecast_status: string | null
          id: string | null
          invoice_collections: number | null
          minimum_balance_amount: number | null
          minimum_balance_date: string | null
          new_matter_fees: number | null
          overdue_risk_amount: number | null
          period_end: string | null
          period_start: string | null
          prediction_date: string | null
          recommended_actions: string[] | null
          recurring_fees: number | null
          seasonal_adjustment: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_predictions_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "cash_flow_predictions_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      factoring_marketplace: {
        Row: {
          advance_rate: number | null
          available_capital: number | null
          average_funding: number | null
          created_at: string | null
          current_utilization: number | null
          discount_rate: number | null
          funded_applications: number | null
          id: string | null
          is_active: boolean | null
          max_invoice_amount: number | null
          maximum_invoice_age_days: number | null
          min_invoice_amount: number | null
          minimum_invoice_age_days: number | null
          minimum_monthly_revenue: number | null
          minimum_practice_age_months: number | null
          provider_id: string | null
          provider_name: string | null
          recourse_type: string | null
          required_collection_rate: number | null
          total_applications: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      fee_narrative_performance: {
        Row: {
          avg_clarity: number | null
          avg_completeness: number | null
          avg_professionalism: number | null
          avg_user_rating: number | null
          category: string | null
          edit_rate: number | null
          template_id: string | null
          template_name: string | null
          times_used: number | null
        }
        Relationships: []
      }
      overdue_invoices: {
        Row: {
          advocate_id: string | null
          amount_paid: number | null
          balance_due: number | null
          bar: Database["public"]["Enums"]["bar_association"] | null
          created_at: string | null
          date_paid: string | null
          days_outstanding: number | null
          deleted_at: string | null
          disbursements_amount: number | null
          due_date: string | null
          fee_narrative: string | null
          fees_amount: number | null
          id: string | null
          internal_notes: string | null
          invoice_date: string | null
          invoice_number: string | null
          is_overdue: boolean | null
          last_reminder_date: string | null
          matter_id: string | null
          next_reminder_date: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_reference: string | null
          reminder_history: Json | null
          reminders_sent: number | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number | null
          total_amount: number | null
          updated_at: string | null
          vat_amount: number | null
          vat_rate: number | null
          viewed_at: string | null
        }
        Insert: {
          advocate_id?: string | null
          amount_paid?: number | null
          balance_due?: number | null
          bar?: Database["public"]["Enums"]["bar_association"] | null
          created_at?: string | null
          date_paid?: string | null
          days_outstanding?: number | null
          deleted_at?: string | null
          disbursements_amount?: number | null
          due_date?: string | null
          fee_narrative?: string | null
          fees_amount?: number | null
          id?: string | null
          internal_notes?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          is_overdue?: boolean | null
          last_reminder_date?: string | null
          matter_id?: string | null
          next_reminder_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          reminder_history?: Json | null
          reminders_sent?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
          viewed_at?: string | null
        }
        Update: {
          advocate_id?: string | null
          amount_paid?: number | null
          balance_due?: number | null
          bar?: Database["public"]["Enums"]["bar_association"] | null
          created_at?: string | null
          date_paid?: string | null
          days_outstanding?: number | null
          deleted_at?: string | null
          disbursements_amount?: number | null
          due_date?: string | null
          fee_narrative?: string | null
          fees_amount?: number | null
          id?: string | null
          internal_notes?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          is_overdue?: boolean | null
          last_reminder_date?: string | null
          matter_id?: string | null
          next_reminder_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_reference?: string | null
          reminder_history?: Json | null
          reminders_sent?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "invoices_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "active_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      popular_precedents: {
        Row: {
          applicable_laws: string[] | null
          average_rating: number | null
          bar: Database["public"]["Enums"]["bar_association"] | null
          category: string | null
          change_notes: string | null
          contributor_id: string | null
          court_level: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          document_id: string | null
          download_count: number | null
          id: string | null
          is_verified: boolean | null
          parent_precedent_id: string | null
          precedent_type: Database["public"]["Enums"]["precedent_type"] | null
          quality_score: number | null
          rating_count: number | null
          rating_sum: number | null
          subcategory: string | null
          tags: string[] | null
          template_content: string | null
          title: string | null
          total_uses: number | null
          unique_users: number | null
          updated_at: string | null
          usage_count: number | null
          usage_rating: number | null
          verification_date: string | null
          verified_by: string | null
          version: number | null
          year_created: number | null
        }
        Relationships: [
          {
            foreignKeyName: "precedent_bank_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "precedent_bank_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precedent_bank_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precedent_bank_parent_precedent_id_fkey"
            columns: ["parent_precedent_id"]
            isOneToOne: false
            referencedRelation: "popular_precedents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precedent_bank_parent_precedent_id_fkey"
            columns: ["parent_precedent_id"]
            isOneToOne: false
            referencedRelation: "precedent_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precedent_bank_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "precedent_bank_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
        ]
      }
      unbilled_time: {
        Row: {
          advocate_id: string | null
          amount: number | null
          billable: boolean | null
          billed: boolean | null
          client_name: string | null
          created_at: string | null
          date: string | null
          deleted_at: string | null
          description: string | null
          duration_minutes: number | null
          end_time: string | null
          id: string | null
          invoice_id: string | null
          matter_id: string | null
          matter_title: string | null
          rate: number | null
          recording_method:
            | Database["public"]["Enums"]["time_entry_method"]
            | null
          start_time: string | null
          updated_at: string | null
          voice_recording_url: string | null
          voice_transcription: string | null
          write_off: boolean | null
          write_off_reason: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocate_referral_stats"
            referencedColumns: ["advocate_id"]
          },
          {
            foreignKeyName: "time_entries_advocate_id_fkey"
            columns: ["advocate_id"]
            isOneToOne: false
            referencedRelation: "advocates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "overdue_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "active_matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }

    }
    Functions: {
      analyze_brief_document: {
        Args: { p_document_id: string }
        Returns: string
      }
      calculate_compliance_score: {
        Args: { user_uuid: string }
        Returns: number
      }
      calculate_due_date: {
        Args: {
          bar: Database["public"]["Enums"]["bar_association"]
          invoice_date: string
        }
        Returns: string
      }
      calculate_optimal_fee_structure: {
        Args: { p_advocate_id: string; p_matter_id: string }
        Returns: {
          confidence: number
          model: Database["public"]["Enums"]["fee_optimization_model"]
          potential_revenue: number
          recommended_rate: number
        }[]
      }
      can_view_overflow_brief: {
        Args: { p_advocate_id: string; p_brief_id: string }
        Returns: boolean
      }
      check_conflict: {
        Args: {
          p_advocate_id: string
          p_client_name: string
          p_opposing_party: string
        }
        Returns: {
          conflict_reason: string
          conflicting_matters: string[]
          has_conflict: boolean
        }[]
      }
      create_audit_entry: {
        Args: {
          p_action_type: string
          p_after_state?: Json
          p_before_state?: Json
          p_description: string
          p_entity_id: string
          p_entity_type: string
          p_user_id: string
        }
        Returns: string
      }
      generate_compliance_deadlines: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_fee_narrative: {
        Args: {
          p_matter_id: string
          p_template_id?: string
          p_time_entry_ids: string[]
        }
        Returns: string
      }
      get_judge_analytics: {
        Args: { p_judge_id: string; p_period_months?: number }
        Returns: Json
      }
      predict_cash_flow: {
        Args: { p_advocate_id: string; p_months_ahead?: number }
        Returns: undefined
      }

      rate_precedent: {
        Args: {
          p_advocate_id: string
          p_precedent_id: string
          p_rating: number
          p_review?: string
        }
        Returns: undefined
      }
      sync_court_diary: {
        Args: { p_advocate_id: string; p_court_registry_id: string }
        Returns: Json
      }
      update_referral_relationship: {
        Args: {
          p_referral_value: number
          p_referred_to_advocate_id: string
          p_referring_advocate_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      analysis_type: "brief" | "contract" | "opinion" | "pleading" | "general"
      bar_association: "johannesburg" | "cape_town"
      brief_status: "available" | "reviewing" | "accepted" | "withdrawn"
      cash_flow_status: "healthy" | "adequate" | "tight" | "critical"
      document_status: "processing" | "indexed" | "analyzed" | "error"
      document_type:
        | "brief"
        | "opinion"
        | "contract"
        | "correspondence"
        | "court_document"
        | "invoice"
        | "receipt"
        | "other"
      factoring_status:
        | "available"
        | "under_review"
        | "approved"
        | "funded"
        | "repaid"
        | "defaulted"
      fee_optimization_model:
        | "standard"
        | "premium_urgency"
        | "volume_discount"
        | "success_based"
        | "hybrid"
      fee_structure:
        | "hourly"
        | "fixed"
        | "contingency"
        | "success"
        | "retainer"
        | "hybrid"
      fee_type: "standard" | "contingency" | "success" | "retainer" | "pro_bono"
      invoice_status:
        | "draft"
        | "sent"
        | "viewed"
        | "paid"
        | "overdue"
        | "disputed"
        | "written_off"
        | "pro_forma"
        | "pro_forma_accepted"
        | "pro_forma_declined"
      matter_status: "active" | "pending" | "settled" | "closed" | "on_hold"
      payment_method: "eft" | "cheque" | "cash" | "card" | "debit_order"
      pro_forma_action: "create_matter" | "create_invoice" | "reject"
      pro_forma_status: "pending" | "processed" | "expired"
      precedent_type:
        | "pleadings"
        | "notices"
        | "affidavits"
        | "heads_of_argument"
        | "opinions"
        | "contracts"
        | "correspondence"
        | "court_orders"
        | "other"
      referral_status: "pending" | "accepted" | "declined" | "completed"
      risk_level: "low" | "medium" | "high" | "critical"
      specialisation_category:
        | "administrative_law"
        | "banking_finance"
        | "commercial_litigation"
        | "constitutional_law"
        | "construction_law"
        | "criminal_law"
        | "employment_law"
        | "environmental_law"
        | "family_law"
        | "insurance_law"
        | "intellectual_property"
        | "international_law"
        | "medical_law"
        | "mining_law"
        | "property_law"
        | "tax_law"
        | "other"
      time_entry_method: "manual" | "voice" | "timer" | "ai_suggested"
      urgency_level: "low" | "medium" | "high" | "urgent"
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
    Enums: {
      analysis_type: ["brief", "contract", "opinion", "pleading", "general"],
      bar_association: ["johannesburg", "cape_town"],
      brief_status: ["available", "reviewing", "accepted", "withdrawn"],
      cash_flow_status: ["healthy", "adequate", "tight", "critical"],
      document_status: ["processing", "indexed", "analyzed", "error"],
      document_type: [
        "brief",
        "opinion",
        "contract",
        "correspondence",
        "court_document",
        "invoice",
        "receipt",
        "other",
      ],
      factoring_status: [
        "available",
        "under_review",
        "approved",
        "funded",
        "repaid",
        "defaulted",
      ],
      fee_optimization_model: [
        "standard",
        "premium_urgency",
        "volume_discount",
        "success_based",
        "hybrid",
      ],
      fee_structure: [
        "hourly",
        "fixed",
        "contingency",
        "success",
        "retainer",
        "hybrid",
      ],
      fee_type: ["standard", "contingency", "success", "retainer", "pro_bono"],
      invoice_status: [
        "draft",
        "sent",
        "viewed",
        "paid",
        "overdue",
        "disputed",
        "written_off",
        "pro_forma",
        "pro_forma_accepted",
        "pro_forma_declined",
      ],
      matter_status: ["active", "pending", "settled", "closed", "on_hold"],
      payment_method: ["eft", "cheque", "cash", "card", "debit_order"],
      precedent_type: [
        "pleadings",
        "notices",
        "affidavits",
        "heads_of_argument",
        "opinions",
        "contracts",
        "correspondence",
        "court_orders",
        "other",
      ],
      pro_forma_action: ["create_matter", "create_invoice", "reject"],
      pro_forma_status: ["pending", "processed", "expired"],
      referral_status: ["pending", "accepted", "declined", "completed"],
      risk_level: ["low", "medium", "high", "critical"],
      specialisation_category: [
        "administrative_law",
        "banking_finance",
        "commercial_litigation",
        "constitutional_law",
        "construction_law",
        "criminal_law",
        "employment_law",
        "environmental_law",
        "family_law",
        "insurance_law",
        "intellectual_property",
        "international_law",
        "medical_law",
        "mining_law",
        "property_law",
        "tax_law",
        "other",
      ],
      time_entry_method: ["manual", "voice", "timer", "ai_suggested"],
      urgency_level: ["low", "medium", "high", "urgent"],
    },
  },
} as const
