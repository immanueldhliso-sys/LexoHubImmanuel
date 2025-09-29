import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Court Registry Types
export interface CourtRegistry {
  id: string;
  name: string;
  code: string;
  jurisdiction: string;
  address?: string;
  contactDetails?: Record<string, any>;
  integrationStatus: 'active' | 'inactive' | 'maintenance';
  apiEndpoint?: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Court Case Types
export interface CourtCase {
  id: string;
  matterId: string;
  courtRegistryId: string;
  caseNumber: string;
  caseType: string;
  status: 'active' | 'postponed' | 'finalized' | 'struck_off';
  filingDate?: string;
  allocatedJudgeId?: string;
  courtRoom?: string;
  caseDetails?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Court Diary Types
export interface CourtDiaryEntry {
  id: string;
  courtCaseId: string;
  advocateId: string;
  hearingDate: string;
  hearingTime?: string;
  hearingType: string;
  description?: string;
  outcome?: string;
  nextHearingDate?: string;
  notes?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Judge Types
export interface Judge {
  id: string;
  name: string;
  title?: string;
  courtRegistryId: string;
  specializations: string[];
  appointmentDate?: string;
  status: 'active' | 'retired' | 'transferred';
  bio?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Judge Analytics Types
export interface JudgeAnalytics {
  id: string;
  judgeId: string;
  periodStart: string;
  periodEnd: string;
  totalCasesHeard: number;
  averageHearingDuration?: string;
  postponementRate: number;
  judgmentDeliveryTimeAvg?: string;
  caseTypesDistribution?: Record<string, any>;
  rulingPatterns?: Record<string, any>;
  advocateInteractions?: Record<string, any>;
  performanceScore: number;
  createdAt: string;
  updatedAt: string;
}

// Voice Query Types
export interface VoiceQuery {
  id: string;
  advocateId: string;
  queryText: string;
  queryLanguage: string;
  intent?: string;
  confidenceScore?: number;
  extractedEntities?: Record<string, any>;
  responseText?: string;
  responseActions?: Record<string, any>;
  processingTimeMs?: number;
  createdAt: string;
}

// Language Translation Types
export interface LanguageTranslation {
  id: string;
  key: string;
  languageCode: string;
  translation: string;
  context?: string;
  createdAt: string;
  updatedAt: string;
}

// Court Integration Log Types
export interface CourtIntegrationLog {
  id: string;
  courtRegistryId: string;
  syncType: 'diary_sync' | 'case_update' | 'judge_info' | 'full_sync';
  status: 'started' | 'completed' | 'failed' | 'partial';
  recordsProcessed: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorDetails?: Record<string, any>;
  syncDurationMs?: number;
  createdAt: string;
}

export class WorkflowIntegrationsService {
  // Court Registry Management
  static async getCourtRegistries(): Promise<CourtRegistry[]> {
    try {
      const { data, error } = await supabase
        .from('court_registries')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching court registries:', error);
      throw new Error('Failed to fetch court registries');
    }
  }

  static async getCourtRegistry(id: string): Promise<CourtRegistry | null> {
    try {
      const { data, error } = await supabase
        .from('court_registries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching court registry:', error);
      return null;
    }
  }

  // Court Diary Management
  static async getCourtDiary(advocateId: string, startDate?: string, endDate?: string): Promise<CourtDiaryEntry[]> {
    try {
      let query = supabase
        .from('court_diary_entries')
        .select(`
          *,
          court_cases (
            case_number,
            case_type,
            court_registries (name, code)
          )
        `)
        .eq('advocate_id', advocateId)
        .order('hearing_date', { ascending: true });

      if (startDate) {
        query = query.gte('hearing_date', startDate);
      }
      if (endDate) {
        query = query.lte('hearing_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching court diary:', error);
      throw new Error('Failed to fetch court diary');
    }
  }

  static async syncCourtDiary(courtRegistryId: string, advocateId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('sync_court_diary', {
          p_court_registry_id: courtRegistryId,
          p_advocate_id: advocateId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error syncing court diary:', error);
      throw new Error('Failed to sync court diary');
    }
  }

  static async createCourtDiaryEntry(entry: Partial<CourtDiaryEntry>): Promise<CourtDiaryEntry> {
    try {
      const { data, error } = await supabase
        .from('court_diary_entries')
        .insert(entry)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating court diary entry:', error);
      throw new Error('Failed to create court diary entry');
    }
  }

  static async updateCourtDiaryEntry(id: string, updates: Partial<CourtDiaryEntry>): Promise<CourtDiaryEntry> {
    try {
      const { data, error } = await supabase
        .from('court_diary_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating court diary entry:', error);
      throw new Error('Failed to update court diary entry');
    }
  }

  // Judge Analytics
  static async getJudges(courtRegistryId?: string): Promise<Judge[]> {
    try {
      let query = supabase
        .from('judges')
        .select('*')
        .order('name');

      if (courtRegistryId) {
        query = query.eq('court_registry_id', courtRegistryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching judges:', error);
      throw new Error('Failed to fetch judges');
    }
  }

  static async getJudgeAnalytics(judgeId: string, periodMonths: number = 6): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_judge_analytics', {
          p_judge_id: judgeId,
          p_period_months: periodMonths
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching judge analytics:', error);
      throw new Error('Failed to fetch judge analytics');
    }
  }

  static async getJudgesBySpecialization(specialization: string): Promise<Judge[]> {
    try {
      const { data, error } = await supabase
        .from('judges')
        .select('*')
        .contains('specializations', [specialization])
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching judges by specialization:', error);
      throw new Error('Failed to fetch judges by specialization');
    }
  }

  // Voice Query Processing
  static async processVoiceQuery(
    advocateId: string, 
    queryText: string, 
    languageCode: string = 'en'
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('process_voice_query', {
          p_advocate_id: advocateId,
          p_query_text: queryText,
          p_language_code: languageCode
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error processing voice query:', error);
      throw new Error('Failed to process voice query');
    }
  }

  static async getVoiceQueryHistory(advocateId: string, limit: number = 50): Promise<VoiceQuery[]> {
    try {
      const { data, error } = await supabase
        .from('voice_queries')
        .select('*')
        .eq('advocate_id', advocateId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching voice query history:', error);
      throw new Error('Failed to fetch voice query history');
    }
  }

  // Language Support
  static async getTranslations(languageCode: string): Promise<Record<string, string>> {
    try {
      const { data, error } = await supabase
        .from('language_translations')
        .select('key, translation')
        .eq('language_code', languageCode);

      if (error) throw error;
      
      const translations: Record<string, string> = {};
      data?.forEach(item => {
        translations[item.key] = item.translation;
      });
      
      return translations;
    } catch (error) {
      console.error('Error fetching translations:', error);
      return {};
    }
  }

  static async getSupportedLanguages(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('language_translations')
        .select('language_code')
        .distinct();

      if (error) throw error;
      return data?.map(item => item.language_code) || ['en'];
    } catch (error) {
      console.error('Error fetching supported languages:', error);
      return ['en'];
    }
  }

  // Court Case Management
  static async getCourtCases(matterId?: string): Promise<CourtCase[]> {
    try {
      let query = supabase
        .from('court_cases')
        .select(`
          *,
          court_registries (name, code),
          judges (name, title)
        `)
        .order('created_at', { ascending: false });

      if (matterId) {
        query = query.eq('matter_id', matterId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching court cases:', error);
      throw new Error('Failed to fetch court cases');
    }
  }

  static async createCourtCase(courtCase: Partial<CourtCase>): Promise<CourtCase> {
    try {
      const { data, error } = await supabase
        .from('court_cases')
        .insert(courtCase)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating court case:', error);
      throw new Error('Failed to create court case');
    }
  }

  static async updateCourtCase(id: string, updates: Partial<CourtCase>): Promise<CourtCase> {
    try {
      const { data, error } = await supabase
        .from('court_cases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating court case:', error);
      throw new Error('Failed to update court case');
    }
  }

  // Integration Logs
  static async getIntegrationLogs(courtRegistryId?: string, limit: number = 100): Promise<CourtIntegrationLog[]> {
    try {
      let query = supabase
        .from('court_integration_logs')
        .select(`
          *,
          court_registries (name, code)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (courtRegistryId) {
        query = query.eq('court_registry_id', courtRegistryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching integration logs:', error);
      throw new Error('Failed to fetch integration logs');
    }
  }
}
