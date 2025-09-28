import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { z } from 'zod';

// Types for Practice Growth features
export interface OverflowBrief {
  id: string;
  postingAdvocateId: string;
  title: string;
  description: string;
  category: SpecialisationCategory;
  matterType: string;
  bar: 'johannesburg' | 'cape_town';
  requiredExperienceYears: number;
  estimatedFeeRangeMin?: number;
  estimatedFeeRangeMax?: number;
  feeType: 'standard' | 'contingency' | 'success' | 'retainer' | 'pro_bono';
  referralPercentage?: number;
  deadline?: string;
  expectedDurationDays?: number;
  isUrgent: boolean;
  status: 'available' | 'reviewing' | 'accepted' | 'withdrawn';
  acceptedByAdvocateId?: string;
  acceptedAt?: string;
  viewCount: number;
  applicationCount: number;
  createdAt: string;
  expiresAt: string;
}

export interface BriefApplication {
  id: string;
  briefId: string;
  advocateId: string;
  coverMessage: string;
  proposedFee?: number;
  availabilityDate?: string;
  relevantExperience?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  reviewedAt?: string;
  createdAt: string;
}

export interface AdvocateSpecialisation {
  id: string;
  advocateId: string;
  category: SpecialisationCategory;
  subSpeciality?: string;
  yearsExperience: number;
  notableCases?: string;
  certifications?: string[];
  isPrimary: boolean;
}

export interface ReferralRelationship {
  id: string;
  advocateAId: string;
  advocateBId: string;
  referralsAToB: number;
  referralsBToA: number;
  totalValueAToB: number;
  totalValueBToA: number;
  reciprocityRatio?: number;
  relationshipQuality: 'balanced' | 'imbalanced' | 'one_sided';
  lastReferralDate?: string;
}

export interface AdvocateProfile {
  id: string;
  advocateId: string;
  professionalSummary?: string;
  areasOfExpertise?: string[];
  languagesSpoken?: string[];
  acceptingReferrals: boolean;
  acceptingOverflow: boolean;
  typicalTurnaroundDays?: number;
  preferredMatterTypes?: string[];
  minimumBriefValue?: number;
  maximumBriefValue?: number;
  totalReferralsReceived: number;
  totalReferralsGiven: number;
  averageCompletionDays?: number;
  successRate?: number;
  isPublic: boolean;
}

export type SpecialisationCategory = 
  | 'administrative_law'
  | 'banking_finance'
  | 'commercial_litigation'
  | 'constitutional_law'
  | 'construction_law'
  | 'criminal_law'
  | 'employment_law'
  | 'environmental_law'
  | 'family_law'
  | 'insurance_law'
  | 'intellectual_property'
  | 'international_law'
  | 'medical_law'
  | 'mining_law'
  | 'property_law'
  | 'tax_law'
  | 'other';

// Validation schemas
const OverflowBriefSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(500),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  category: z.string(),
  matterType: z.string().min(2),
  bar: z.enum(['johannesburg', 'cape_town']),
  requiredExperienceYears: z.number().min(0).max(50),
  estimatedFeeRangeMin: z.number().positive().optional(),
  estimatedFeeRangeMax: z.number().positive().optional(),
  feeType: z.enum(['standard', 'contingency', 'success', 'retainer', 'pro_bono']),
  referralPercentage: z.number().min(0).max(0.5).optional(),
  deadline: z.string().optional(),
  expectedDurationDays: z.number().positive().optional(),
  isUrgent: z.boolean(),
  isPublic: z.boolean(),
  visibleToAdvocates: z.array(z.string()).optional(),
  hiddenFromAdvocates: z.array(z.string()).optional()
});

const BriefApplicationSchema = z.object({
  briefId: z.string().uuid(),
  coverMessage: z.string().min(50, 'Cover message must be at least 50 characters'),
  proposedFee: z.number().positive().optional(),
  availabilityDate: z.string().optional(),
  relevantExperience: z.string().optional()
});

export class PracticeGrowthService {
  // Create overflow brief posting
  static async createOverflowBrief(data: z.infer<typeof OverflowBriefSchema>): Promise<OverflowBrief> {
    try {
      const validated = OverflowBriefSchema.parse(data);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate fee range
      if (validated.estimatedFeeRangeMin && validated.estimatedFeeRangeMax) {
        if (validated.estimatedFeeRangeMin > validated.estimatedFeeRangeMax) {
          throw new Error('Minimum fee cannot be greater than maximum fee');
        }
      }

      const { data: brief, error } = await supabase
        .from('overflow_briefs')
        .insert({
          posting_advocate_id: user.id,
          title: validated.title,
          description: validated.description,
          category: validated.category,
          matter_type: validated.matterType,
          bar: validated.bar,
          required_experience_years: validated.requiredExperienceYears,
          estimated_fee_range_min: validated.estimatedFeeRangeMin,
          estimated_fee_range_max: validated.estimatedFeeRangeMax,
          fee_type: validated.feeType,
          referral_percentage: validated.referralPercentage,
          deadline: validated.deadline,
          expected_duration_days: validated.expectedDurationDays,
          is_urgent: validated.isUrgent,
          is_public: validated.isPublic,
          visible_to_advocates: validated.visibleToAdvocates || [],
          hidden_from_advocates: validated.hiddenFromAdvocates || [],
          status: 'available'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Overflow brief posted successfully');
      return this.mapOverflowBrief(brief);
    } catch (error) {
      console.error('Error creating overflow brief:', error);
      const message = error instanceof Error ? error.message : 'Failed to create overflow brief';
      toast.error(message);
      throw error;
    }
  }

  // Get available overflow briefs
  static async getAvailableOverflowBriefs(filters?: {
    category?: SpecialisationCategory;
    bar?: string;
    minFee?: number;
    maxFee?: number;
    search?: string;
  }): Promise<OverflowBrief[]> {
    try {
      let query = supabase
        .from('available_overflow_briefs')
        .select('*')
        .order('is_urgent', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.bar) {
        query = query.eq('bar', filters.bar);
      }
      if (filters?.minFee) {
        query = query.gte('estimated_fee_range_min', filters.minFee);
      }
      if (filters?.maxFee) {
        query = query.lte('estimated_fee_range_max', filters.maxFee);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(this.mapOverflowBrief);
    } catch (error) {
      console.error('Error fetching overflow briefs:', error);
      toast.error('Failed to fetch available briefs');
      throw error;
    }
  }

  // Apply for overflow brief
  static async applyForBrief(data: z.infer<typeof BriefApplicationSchema>): Promise<BriefApplication> {
    try {
      const validated = BriefApplicationSchema.parse(data);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already applied
      const { data: existing } = await supabase
        .from('brief_applications')
        .select('id')
        .eq('brief_id', validated.briefId)
        .eq('advocate_id', user.id)
        .single();

      if (existing) {
        throw new Error('You have already applied for this brief');
      }

      const { data: application, error } = await supabase
        .from('brief_applications')
        .insert({
          brief_id: validated.briefId,
          advocate_id: user.id,
          cover_message: validated.coverMessage,
          proposed_fee: validated.proposedFee,
          availability_date: validated.availabilityDate,
          relevant_experience: validated.relevantExperience,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Update application count
      await supabase.rpc('increment', {
        table_name: 'overflow_briefs',
        column_name: 'application_count',
        row_id: validated.briefId
      });

      toast.success('Application submitted successfully');
      return this.mapBriefApplication(application);
    } catch (error) {
      console.error('Error applying for brief:', error);
      const message = error instanceof Error ? error.message : 'Failed to submit application';
      toast.error(message);
      throw error;
    }
  }

  // Update advocate specialisations
  static async updateSpecialisations(specialisations: Omit<AdvocateSpecialisation, 'id' | 'advocateId'>[]): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Delete existing specialisations
      await supabase
        .from('advocate_specialisations')
        .delete()
        .eq('advocate_id', user.id);

      // Insert new specialisations
      if (specialisations.length > 0) {
        const { error } = await supabase
          .from('advocate_specialisations')
          .insert(
            specialisations.map(spec => ({
              advocate_id: user.id,
              category: spec.category,
              sub_speciality: spec.subSpeciality,
              years_experience: spec.yearsExperience,
              notable_cases: spec.notableCases,
              certifications: spec.certifications,
              is_primary: spec.isPrimary
            }))
          );

        if (error) throw error;
      }

      toast.success('Specialisations updated successfully');
    } catch (error) {
      console.error('Error updating specialisations:', error);
      toast.error('Failed to update specialisations');
      throw error;
    }
  }

  // Get referral statistics
  static async getReferralStats(): Promise<{
    given: number;
    received: number;
    valueGiven: number;
    valueReceived: number;
    reciprocityRatio?: number;
    relationships: ReferralRelationship[];
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get overall stats
      const { data: stats } = await supabase
        .from('advocate_referral_stats')
        .select('*')
        .eq('advocate_id', user.id)
        .single();

      // Get detailed relationships
      const { data: relationships } = await supabase
        .from('referral_relationships')
        .select('*')
        .or(`advocate_a_id.eq.${user.id},advocate_b_id.eq.${user.id}`)
        .order('last_referral_date', { ascending: false });

      return {
        given: stats?.referrals_given || 0,
        received: stats?.referrals_received || 0,
        valueGiven: stats?.value_given || 0,
        valueReceived: stats?.value_received || 0,
        reciprocityRatio: stats?.reciprocity_ratio,
        relationships: (relationships || []).map(this.mapReferralRelationship)
      };
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      toast.error('Failed to fetch referral statistics');
      throw error;
    }
  }

  // Update advocate profile
  static async updateAdvocateProfile(profile: Partial<Omit<AdvocateProfile, 'id' | 'advocateId'>>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('advocate_profiles')
        .upsert({
          advocate_id: user.id,
          professional_summary: profile.professionalSummary,
          areas_of_expertise: profile.areasOfExpertise,
          languages_spoken: profile.languagesSpoken,
          accepting_referrals: profile.acceptingReferrals,
          accepting_overflow: profile.acceptingOverflow,
          typical_turnaround_days: profile.typicalTurnaroundDays,
          preferred_matter_types: profile.preferredMatterTypes,
          minimum_brief_value: profile.minimumBriefValue,
          maximum_brief_value: profile.maximumBriefValue,
          is_public: profile.isPublic
        })
        .eq('advocate_id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  }

  // Search advocate directory
  static async searchAdvocateDirectory(filters: {
    specialisation?: SpecialisationCategory;
    bar?: string;
    acceptingReferrals?: boolean;
    search?: string;
  }): Promise<AdvocateProfile[]> {
    try {
      let query = supabase
        .from('advocate_profiles')
        .select(`
          *,
          advocate:advocates!inner(full_name, bar, email),
          specialisations:advocate_specialisations(category, sub_speciality, years_experience)
        `)
        .eq('is_public', true);

      if (filters.bar) {
        query = query.eq('advocate.bar', filters.bar);
      }
      if (filters.acceptingReferrals !== undefined) {
        query = query.eq('accepting_referrals', filters.acceptingReferrals);
      }
      if (filters.search) {
        query = query.or(`professional_summary.ilike.%${filters.search}%,advocate.full_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by specialisation if provided
      let results = data || [];
      if (filters.specialisation) {
        results = results.filter(profile => 
          profile.specialisations?.some((s: any) => s.category === filters.specialisation)
        );
      }

      return results.map(this.mapAdvocateProfile);
    } catch (error) {
      console.error('Error searching advocate directory:', error);
      toast.error('Failed to search advocate directory');
      throw error;
    }
  }

  // Helper functions to map database records to frontend types
  private static mapOverflowBrief(record: any): OverflowBrief {
    return {
      id: record.id,
      postingAdvocateId: record.posting_advocate_id,
      title: record.title,
      description: record.description,
      category: record.category,
      matterType: record.matter_type,
      bar: record.bar,
      requiredExperienceYears: record.required_experience_years,
      estimatedFeeRangeMin: record.estimated_fee_range_min,
      estimatedFeeRangeMax: record.estimated_fee_range_max,
      feeType: record.fee_type,
      referralPercentage: record.referral_percentage,
      deadline: record.deadline,
      expectedDurationDays: record.expected_duration_days,
      isUrgent: record.is_urgent,
      status: record.status,
      acceptedByAdvocateId: record.accepted_by_advocate_id,
      acceptedAt: record.accepted_at,
      viewCount: record.view_count,
      applicationCount: record.application_count,
      createdAt: record.created_at,
      expiresAt: record.expires_at
    };
  }

  private static mapBriefApplication(record: any): BriefApplication {
    return {
      id: record.id,
      briefId: record.brief_id,
      advocateId: record.advocate_id,
      coverMessage: record.cover_message,
      proposedFee: record.proposed_fee,
      availabilityDate: record.availability_date,
      relevantExperience: record.relevant_experience,
      status: record.status,
      reviewedAt: record.reviewed_at,
      createdAt: record.created_at
    };
  }

  private static mapReferralRelationship(record: any): ReferralRelationship {
    return {
      id: record.id,
      advocateAId: record.advocate_a_id,
      advocateBId: record.advocate_b_id,
      referralsAToB: record.referrals_a_to_b,
      referralsBToA: record.referrals_b_to_a,
      totalValueAToB: record.total_value_a_to_b,
      totalValueBToA: record.total_value_b_to_a,
      reciprocityRatio: record.reciprocity_ratio,
      relationshipQuality: record.relationship_quality,
      lastReferralDate: record.last_referral_date
    };
  }

  private static mapAdvocateProfile(record: any): AdvocateProfile {
    return {
      id: record.id,
      advocateId: record.advocate_id,
      professionalSummary: record.professional_summary,
      areasOfExpertise: record.areas_of_expertise,
      languagesSpoken: record.languages_spoken,
      acceptingReferrals: record.accepting_referrals,
      acceptingOverflow: record.accepting_overflow,
      typicalTurnaroundDays: record.typical_turnaround_days,
      preferredMatterTypes: record.preferred_matter_types,
      minimumBriefValue: record.minimum_brief_value,
      maximumBriefValue: record.maximum_brief_value,
      totalReferralsReceived: record.total_referrals_received,
      totalReferralsGiven: record.total_referrals_given,
      averageCompletionDays: record.average_completion_days,
      successRate: record.success_rate,
      isPublic: record.is_public
    };
  }
}

