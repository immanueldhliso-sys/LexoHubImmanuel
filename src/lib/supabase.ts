import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const resolvedUrl = String(supabaseUrl);
const isLocalSupabase = resolvedUrl.includes('127.0.0.1') || resolvedUrl.includes('localhost');

if (isLocalSupabase) {
  console.warn('[Supabase] Local URL detected for VITE_SUPABASE_URL:', resolvedUrl);
}

console.log('[Supabase] Using URL:', resolvedUrl);

export const supabase = createClient(resolvedUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { 'x-application-name': 'lexo' },
  },
});

// Database types (these would be generated from Supabase CLI in production)
export interface Database {
  public: {
    Tables: {
      advocates: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          initials: string;
          practice_number: string;
          bar: 'johannesburg' | 'cape_town';
          year_admitted: number;
          specialisations: string[];
          hourly_rate: number;
          contingency_rate?: number;
          success_fee_rate?: number;
          phone_number?: string;
          chambers_address?: string;
          postal_address?: string;
          notification_preferences: Record<string, unknown>;
          invoice_settings: Record<string, unknown>;
          created_at: string;
          updated_at: string;
          last_login_at?: string;
          is_active: boolean;
          deleted_at?: string;
          total_outstanding: number;
          total_collected_ytd: number;
          matters_count: number;
        };
        Insert: Omit<Database['public']['Tables']['advocates']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['advocates']['Insert']>;
      };
      matters: {
        Row: {
          id: string;
          advocate_id: string;
          reference_number: string;
          title: string;
          description?: string;
          matter_type: string;
          court_case_number?: string;
          bar: 'johannesburg' | 'cape_town';
          client_name: string;
          client_email?: string;
          client_phone?: string;
          client_address?: string;
          client_type?: string;
          instructing_attorney: string;
          instructing_attorney_email?: string;
          instructing_attorney_phone?: string;
          instructing_firm?: string;
          instructing_firm_ref?: string;
          fee_type: 'standard' | 'contingency' | 'success' | 'retainer' | 'pro_bono';
          estimated_fee?: number;
          fee_cap?: number;
          actual_fee?: number;
          wip_value: number;
          trust_balance: number;
          disbursements: number;
          vat_exempt: boolean;
          status: 'active' | 'pending' | 'settled' | 'closed' | 'on_hold';
          risk_level: 'low' | 'medium' | 'high' | 'critical';
          settlement_probability?: number;
          expected_completion_date?: string;
          conflict_check_completed: boolean;
          conflict_check_date?: string;
          conflict_check_cleared?: boolean;
          conflict_notes?: string;
          date_instructed: string;
          date_accepted?: string;
          date_commenced?: string;
          date_settled?: string;
          date_closed?: string;
          next_court_date?: string;
          prescription_date?: string;
          tags: string[];
          created_at: string;
          updated_at: string;
          deleted_at?: string;
          days_active: number;
          is_overdue: boolean;
        };
        Insert: Omit<Database['public']['Tables']['matters']['Row'], 'id' | 'created_at' | 'updated_at' | 'days_active' | 'is_overdue'>;
        Update: Partial<Database['public']['Tables']['matters']['Insert']>;
      };
      // Add other table types as needed
    };
  };
}

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];
  
export type Inserts<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];
  
export type Updates<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];