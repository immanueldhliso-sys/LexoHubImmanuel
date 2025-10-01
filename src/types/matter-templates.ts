/**
 * Matter Templates Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the Matter Templates system.
 * These types correspond to the database schema defined in the migration file.
 */

// Base template data structure that gets stored in JSONB
export interface MatterTemplateData {
  // Basic matter information
  matterTitle?: string;
  matterType?: string;
  description?: string;
  courtCaseNumber?: string;
  bar?: string;
  
  // Client information
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientType?: string;
  
  // Attorney information
  instructingAttorney?: string;
  instructingAttorneyEmail?: string;
  instructingAttorneyPhone?: string;
  instructingFirm?: string;
  instructingFirmRef?: string;
  
  // Fee structure
  feeType?: string;
  estimatedFee?: string;
  feeCap?: string;
  riskLevel?: string;
  settlementProbability?: string;
  expectedCompletionDate?: string;
  vatExempt?: boolean;
  
  // Additional fields that can be customized
  customFields?: Record<string, unknown>;
  tags?: string;
  
  // Voice integration specific fields
  workType?: string; // Maps to matterType for voice integration
  billable?: boolean; // Maps to feeType determination
}

// Template category interface
export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  color_code: string;
  sort_order: number;
  created_at: string;
}

// Main matter template interface
export interface MatterTemplate {
  id: string;
  advocate_id: string;
  name: string;
  description?: string;
  category: string;
  template_data: MatterTemplateData;
  is_default: boolean;
  is_shared: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// Extended template interface with sharing information (from get_user_templates function)
export interface MatterTemplateWithSharing extends MatterTemplate {
  is_owner: boolean;
  shared_by_name?: string;
}

// Template sharing interface
export interface TemplateShare {
  id: string;
  template_id: string;
  shared_by_advocate_id: string;
  shared_with_advocate_id: string;
  permissions: 'read' | 'copy';
  shared_at: string;
}

// Template suggestion interface (from suggest_templates_for_matter function)
export interface TemplateSuggestion {
  id: string;
  name: string;
  category: string;
  confidence_score: number;
}

// API request/response types
export interface CreateTemplateRequest {
  name: string;
  description?: string;
  category: string;
  template_data: MatterTemplateData;
  is_default?: boolean;
  is_shared?: boolean;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  category?: string;
  template_data?: MatterTemplateData;
  is_default?: boolean;
  is_shared?: boolean;
}

export interface ShareTemplateRequest {
  template_id: string;
  shared_with_advocate_id: string;
  permissions: 'read' | 'copy';
}

export interface TemplateSearchFilters {
  category?: string;
  is_shared?: boolean;
  is_default?: boolean;
  search_term?: string;
  sort_by?: 'name' | 'usage_count' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface TemplateSuggestionRequest {
  matter_type?: string;
  client_type?: string;
  description?: string;
}

// UI-specific types
export interface TemplateFormData extends MatterTemplateData {
  templateName: string;
  templateDescription?: string;
  templateCategory: string;
  isShared: boolean;
  isDefault: boolean;
}

export interface TemplateLibraryState {
  templates: MatterTemplateWithSharing[];
  categories: TemplateCategory[];
  selectedCategory?: string;
  searchTerm: string;
  isLoading: boolean;
  error?: string;
}

export interface SaveTemplateModalState {
  isOpen: boolean;
  sourceData?: MatterTemplateData;
  isLoading: boolean;
  error?: string;
}

// Voice integration types
export interface VoiceTemplateMapping {
  workType: string;
  suggestedTemplates: TemplateSuggestion[];
  confidence: number;
}

// Template usage analytics
export interface TemplateUsageStats {
  template_id: string;
  template_name: string;
  usage_count: number;
  last_used: string;
  matters_created: number;
}

// Error types
export interface TemplateError {
  code: string;
  message: string;
  details?: unknown;
}

// Constants
export const DEFAULT_TEMPLATE_CATEGORIES = [
  'Commercial Litigation',
  'Contract Law',
  'Employment Law',
  'Family Law',
  'Criminal Law',
  'Property Law',
  'Intellectual Property',
  'Tax Law',
  'Constitutional Law',
  'Administrative Law',
  'General'
] as const;

export type TemplateCategory_Name = typeof DEFAULT_TEMPLATE_CATEGORIES[number];

// Template permissions
export const TEMPLATE_PERMISSIONS = {
  READ: 'read' as const,
  COPY: 'copy' as const
};

export type TemplatePermission = typeof TEMPLATE_PERMISSIONS[keyof typeof TEMPLATE_PERMISSIONS];

// Template sorting options
export const TEMPLATE_SORT_OPTIONS = {
  NAME: 'name' as const,
  USAGE_COUNT: 'usage_count' as const,
  CREATED_AT: 'created_at' as const,
  UPDATED_AT: 'updated_at' as const
};

export type TemplateSortOption = typeof TEMPLATE_SORT_OPTIONS[keyof typeof TEMPLATE_SORT_OPTIONS];