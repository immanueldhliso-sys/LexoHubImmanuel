import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import type { TimeEntry } from '@/types';

// Types for Document Intelligence
export interface DocumentIntelligence {
  id: string;
  documentId: string;
  analysisType: 'brief' | 'contract' | 'opinion' | 'pleading' | 'general';
  extractedEntities: {
    parties?: string[];
    dates?: { type: string; date: string }[];
    amounts?: { type: string; amount: number; currency: string }[];
    locations?: string[];
  };
  keyIssues: string[];
  riskFactors: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  suggestedActions: string[];
  summary?: string;
  keyDates?: string[];
  referencedCases?: string[];
  applicableLaws?: string[];
  status: 'processing' | 'indexed' | 'analyzed' | 'error';
  confidenceScore?: number;
  createdAt: string;
}

export interface BriefAnalysis extends DocumentIntelligence {
  isBrief: true;
  briefDeadline?: string;
  briefCourt?: string;
  briefJudge?: string;
  opposingCounsel?: string;
  matterValue?: number;
  complexityScore?: number;
}

export interface FeeNarrativeTemplate {
  id: string;
  advocateId?: string;
  name: string;
  category: string;
  matterType?: string;
  templateText: string;
  variables?: Record<string, string>;
  usageCount: number;
  lastUsedAt?: string;
  successRate?: number;
  isPublic: boolean;
  isCommunityApproved: boolean;
  createdAt: string;
}

export interface GeneratedFeeNarrative {
  id: string;
  invoiceId?: string;
  matterId: string;
  advocateId: string;
  templateId?: string;
  timeEntriesAnalyzed: number;
  narrativeText: string;
  workCategories: Record<string, {
    hours: number;
    entries: number;
    totalValue: number;
  }>;
  keyActivities: string[];
  valuePropositions: string[];
  suggestedImprovements?: string[];
  clarityScore?: number;
  completenessScore?: number;
  professionalismScore?: number;
  wasEdited: boolean;
  finalNarrative?: string;
  userRating?: number;
  createdAt: string;
}

export interface PrecedentDocument {
  id: string;
  contributorId: string;
  title: string;
  description?: string;
  precedentType: PrecedentType;
  category: string;
  subcategory?: string;
  documentId?: string;
  templateContent?: string;
  bar?: 'johannesburg' | 'cape_town';
  courtLevel?: 'magistrate' | 'high_court' | 'sca' | 'constitutional';
  applicableLaws?: string[];
  yearCreated?: number;
  qualityScore: number;
  downloadCount: number;
  usageCount: number;
  averageRating: number;
  tags?: string[];
  isVerified: boolean;
  version: number;
  createdAt: string;
}

export type PrecedentType = 
  | 'pleadings'
  | 'notices'
  | 'affidavits'
  | 'heads_of_argument'
  | 'opinions'
  | 'contracts'
  | 'correspondence'
  | 'court_orders'
  | 'other';

// Work category structure for fee narrative generation
interface WorkCategory {
  hours: number;
  entries: number;
  totalValue: number;
}

// Database record types for mapping
interface DatabaseRecord {
  id: string;
  [key: string]: unknown;
}

// Validation schemas
const DocumentAnalysisRequestSchema = z.object({
  documentId: z.string().uuid(),
  analysisType: z.enum(['brief', 'contract', 'opinion', 'pleading', 'general']),
  priority: z.number().min(1).max(10).optional()
});

const FeeNarrativeGenerationSchema = z.object({
  matterId: z.string().uuid(),
  timeEntryIds: z.array(z.string().uuid()).optional(),
  templateId: z.string().uuid().optional(),
  includeValuePropositions: z.boolean().optional()
});

const PrecedentUploadSchema = z.object({
  title: z.string().min(5).max(500),
  description: z.string().optional(),
  precedentType: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  documentId: z.string().uuid().optional(),
  templateContent: z.string().optional(),
  bar: z.enum(['johannesburg', 'cape_town']).optional(),
  courtLevel: z.enum(['magistrate', 'high_court', 'sca', 'constitutional']).optional(),
  applicableLaws: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional()
});

export class DocumentIntelligenceService {
  // Analyze document with AI
  static async analyzeDocument(data: z.infer<typeof DocumentAnalysisRequestSchema>): Promise<string> {
    try {
      const validated = DocumentAnalysisRequestSchema.parse(data);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Add to analysis queue
      const { data: queueItem, error } = await supabase
        .from('document_analysis_queue')
        .insert({
          document_id: validated.documentId,
          advocate_id: user.id,
          priority: validated.priority || 5,
          analysis_type: validated.analysisType,
          requested_features: this.getRequestedFeatures(validated.analysisType),
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // In production, this would trigger an async analysis job
      // For now, we'll simulate with a placeholder
      setTimeout(() => {
        this.processDocumentAnalysis(queueItem.id);
      }, 2000);

      toast.success('Document analysis started');
      return queueItem.id;
    } catch (error) {
      console.error('Error starting document analysis:', error);
      const message = error instanceof Error ? error.message : 'Failed to start analysis';
      toast.error(message);
      throw error;
    }
  }

  // Generate fee narrative with AI assistance
  static async generateFeeNarrative(data: z.infer<typeof FeeNarrativeGenerationSchema>): Promise<GeneratedFeeNarrative> {
    try {
      const validated = FeeNarrativeGenerationSchema.parse(data);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get time entries if not specified
      let timeEntryIds = validated.timeEntryIds;
      if (!timeEntryIds || timeEntryIds.length === 0) {
        const { data: entries } = await supabase
          .from('time_entries')
          .select('id')
          .eq('matter_id', validated.matterId)
          .eq('billed', false)
          .is('deleted_at', null);
        
        timeEntryIds = entries?.map(e => e.id) || [];
      }

      if (timeEntryIds.length === 0) {
        throw new Error('No unbilled time entries found for this matter');
      }

      // Call database function to generate narrative
      const { data: narrative, error } = await supabase
        .rpc('generate_fee_narrative', {
          p_matter_id: validated.matterId,
          p_time_entry_ids: timeEntryIds,
          p_template_id: validated.templateId || null
        });

      if (error) throw error;

      // Analyze work categories
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('*')
        .in('id', timeEntryIds);

      const workCategories = this.categorizeTimeEntries(timeEntries || []);
      const keyActivities = this.extractKeyActivities(timeEntries || []);
      const valuePropositions = validated.includeValuePropositions 
        ? this.generateValuePropositions(workCategories, keyActivities)
        : [];

      // Save generated narrative
      const { data: savedNarrative, error: saveError } = await supabase
        .from('generated_fee_narratives')
        .insert({
          matter_id: validated.matterId,
          advocate_id: user.id,
          template_id: validated.templateId,
          time_entries_analyzed: timeEntryIds.length,
          narrative_text: narrative,
          work_categories: workCategories,
          key_activities: keyActivities,
          value_propositions: valuePropositions,
          clarity_score: 0.85, // Placeholder scores
          completeness_score: 0.90,
          professionalism_score: 0.95,
          was_edited: false
        })
        .select()
        .single();

      if (saveError) throw saveError;

      toast.success('Fee narrative generated successfully');
      return this.mapGeneratedNarrative(savedNarrative);
    } catch (error) {
      console.error('Error generating fee narrative:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate narrative';
      toast.error(message);
      throw error;
    }
  }

  // Search precedent bank
  static async searchPrecedents(filters: {
    search?: string;
    precedentType?: PrecedentType;
    category?: string;
    bar?: string;
    courtLevel?: string;
    verifiedOnly?: boolean;
  }): Promise<PrecedentDocument[]> {
    try {
      let query = supabase
        .from('precedent_bank')
        .select('*')
        .is('deleted_at', null)
        .order('download_count', { ascending: false })
        .order('average_rating', { ascending: false });

      if (filters.search) {
        query = query.textSearch('title', filters.search, {
          type: 'websearch',
          config: 'english'
        });
      }
      if (filters.precedentType) {
        query = query.eq('precedent_type', filters.precedentType);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.bar) {
        query = query.eq('bar', filters.bar);
      }
      if (filters.courtLevel) {
        query = query.eq('court_level', filters.courtLevel);
      }
      if (filters.verifiedOnly) {
        query = query.eq('is_verified', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(this.mapPrecedentDocument);
    } catch (error) {
      console.error('Error searching precedents:', error);
      toast.error('Failed to search precedent bank');
      throw error;
    }
  }

  // Upload precedent to community bank
  static async uploadPrecedent(data: z.infer<typeof PrecedentUploadSchema>): Promise<PrecedentDocument> {
    try {
      const validated = PrecedentUploadSchema.parse(data);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (!validated.documentId && !validated.templateContent) {
        throw new Error('Either document or template content must be provided');
      }

      const { data: precedent, error } = await supabase
        .from('precedent_bank')
        .insert({
          contributor_id: user.id,
          title: validated.title,
          description: validated.description,
          precedent_type: validated.precedentType,
          category: validated.category,
          subcategory: validated.subcategory,
          document_id: validated.documentId,
          template_content: validated.templateContent,
          bar: validated.bar,
          court_level: validated.courtLevel,
          applicable_laws: validated.applicableLaws || [],
          year_created: new Date().getFullYear(),
          tags: validated.tags || [],
          quality_score: 0,
          download_count: 0,
          usage_count: 0,
          rating_sum: 0,
          rating_count: 0,
          is_verified: false,
          version: 1
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Precedent uploaded successfully');
      return this.mapPrecedentDocument(precedent);
    } catch (error) {
      console.error('Error uploading precedent:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload precedent';
      toast.error(message);
      throw error;
    }
  }

  // Download and track precedent usage
  static async downloadPrecedent(precedentId: string, matterId?: string): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Record usage
      await supabase
        .from('precedent_usage')
        .insert({
          precedent_id: precedentId,
          advocate_id: user.id,
          matter_id: matterId,
          download_date: new Date().toISOString()
        });

      // Increment download count
      await supabase.rpc('increment', {
        table_name: 'precedent_bank',
        column_name: 'download_count',
        row_id: precedentId
      });

      // Get precedent details
      const { data: precedent, error } = await supabase
        .from('precedent_bank')
        .select('document_id, template_content')
        .eq('id', precedentId)
        .single();

      if (error) throw error;

      if (precedent.document_id) {
        // Return document download URL
        const { data } = supabase.storage
          .from('documents')
          .getPublicUrl(precedent.document_id);
        
        return data.publicUrl;
      } else if (precedent.template_content) {
        // Return template content as blob URL
        const blob = new Blob([precedent.template_content], { type: 'text/plain' });
        return URL.createObjectURL(blob);
      }

      throw new Error('No content found for this precedent');
    } catch (error) {
      console.error('Error downloading precedent:', error);
      toast.error('Failed to download precedent');
      throw error;
    }
  }

  // Rate precedent
  static async ratePrecedent(precedentId: string, rating: number, review?: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await supabase.rpc('rate_precedent', {
        p_precedent_id: precedentId,
        p_advocate_id: user.id,
        p_rating: rating,
        p_review: review || null
      });

      toast.success('Thank you for your feedback');
    } catch (error) {
      console.error('Error rating precedent:', error);
      toast.error('Failed to submit rating');
      throw error;
    }
  }

  // Helper functions
  private static getRequestedFeatures(analysisType: string): string[] {
    const baseFeatures = ['extract_entities', 'identify_key_dates', 'summarize'];
    
    switch (analysisType) {
      case 'brief':
        return [...baseFeatures, 'extract_parties', 'identify_issues', 'assess_complexity', 'extract_deadlines'];
      case 'contract':
        return [...baseFeatures, 'identify_obligations', 'extract_terms', 'identify_risks'];
      case 'opinion':
        return [...baseFeatures, 'extract_legal_principles', 'identify_recommendations'];
      case 'pleading':
        return [...baseFeatures, 'extract_claims', 'identify_relief_sought'];
      default:
        return baseFeatures;
    }
  }

  private static categorizeTimeEntries(entries: TimeEntry[]): Record<string, WorkCategory> {
    const categories: Record<string, WorkCategory> = {};
    
    entries.forEach(entry => {
      const category = this.getTimeEntryCategory(entry.description);
      if (!categories[category]) {
        categories[category] = {
          hours: 0,
          entries: 0,
          totalValue: 0
        };
      }
      
      categories[category].hours += entry.duration_minutes / 60;
      categories[category].entries += 1;
      categories[category].totalValue += entry.amount || 0;
    });
    
    return categories;
  }

  private static getTimeEntryCategory(description: string): string {
    const lower = description.toLowerCase();
    
    if (lower.includes('draft')) return 'Drafting';
    if (lower.includes('research')) return 'Research';
    if (lower.includes('consult') || lower.includes('meeting')) return 'Consultation';
    if (lower.includes('court') || lower.includes('hearing')) return 'Court Appearance';
    if (lower.includes('review')) return 'Review';
    if (lower.includes('correspond') || lower.includes('email')) return 'Correspondence';
    
    return 'General Legal Services';
  }

  private static extractKeyActivities(entries: TimeEntry[]): string[] {
    const activities = new Set<string>();
    
    entries.forEach(entry => {
      const activity = entry.description
        .split(/[.;]/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 10)
        .slice(0, 1)[0];
      
      if (activity) {
        activities.add(activity);
      }
    });
    
    return Array.from(activities).slice(0, 10);
  }

  private static generateValuePropositions(categories: Record<string, WorkCategory>, activities: string[]): string[] {
    const propositions: string[] = [];
    
    // Based on work categories
    if (categories['Drafting']?.hours > 5) {
      propositions.push('Comprehensive document drafting ensuring legal precision and clarity');
    }
    if (categories['Research']?.hours > 3) {
      propositions.push('Thorough legal research providing solid foundation for arguments');
    }
    if (categories['Court Appearance']?.entries > 0) {
      propositions.push('Skilled court representation advancing client interests');
    }
    
    // Based on total work
    const totalHours = Object.values(categories).reduce((sum: number, cat: any) => sum + cat.hours, 0);
    if (totalHours > 20) {
      propositions.push('Dedicated commitment of substantial time and expertise to matter resolution');
    }
    
    return propositions;
  }

  // Placeholder for async document processing
  private static async processDocumentAnalysis(queueId: string): Promise<void> {
    // In production, this would be handled by a background job
    // Here we'll just update the status
    await supabase
      .from('document_analysis_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', queueId);
  }

  // Mapping functions
  private static mapGeneratedNarrative(record: DatabaseRecord): GeneratedFeeNarrative {
    return {
      id: record.id,
      invoiceId: record.invoice_id,
      matterId: record.matter_id,
      advocateId: record.advocate_id,
      templateId: record.template_id,
      timeEntriesAnalyzed: record.time_entries_analyzed,
      narrativeText: record.narrative_text,
      workCategories: record.work_categories,
      keyActivities: record.key_activities,
      valuePropositions: record.value_propositions,
      suggestedImprovements: record.suggested_improvements,
      clarityScore: record.clarity_score,
      completenessScore: record.completeness_score,
      professionalismScore: record.professionalism_score,
      wasEdited: record.was_edited,
      finalNarrative: record.final_narrative,
      userRating: record.user_rating,
      createdAt: record.created_at
    };
  }

  private static mapPrecedentDocument(record: any): PrecedentDocument {
    return {
      id: record.id,
      contributorId: record.contributor_id,
      title: record.title,
      description: record.description,
      precedentType: record.precedent_type,
      category: record.category,
      subcategory: record.subcategory,
      documentId: record.document_id,
      templateContent: record.template_content,
      bar: record.bar,
      courtLevel: record.court_level,
      applicableLaws: record.applicable_laws,
      yearCreated: record.year_created,
      qualityScore: record.quality_score,
      downloadCount: record.download_count,
      usageCount: record.usage_count,
      averageRating: record.average_rating,
      tags: record.tags,
      isVerified: record.is_verified,
      version: record.version,
      createdAt: record.created_at
    };
  }
}

