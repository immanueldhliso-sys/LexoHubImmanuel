/**
 * Advanced Features Types
 * Defines types and interfaces for the advanced features toggle system
 */

export enum FeatureCategory {
  FINANCIAL_GROWTH_TOOLS = 'financial_growth_tools',
  AI_DOCUMENT_INTELLIGENCE = 'ai_document_intelligence',
  PROFESSIONAL_DEVELOPMENT = 'professional_development'
}

export interface AdvancedFeature {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  pages: string[];
  icon?: string;
  tooltip?: string;
  enabled: boolean;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  advanced_features: {
    financial_growth_tools: boolean;
    ai_document_intelligence: boolean;
    professional_development: boolean;
  };
  feature_discovery: {
    notification_shown: boolean;
    notification_dismissed_at?: Date | null;
    first_login_date?: Date | null;
  };
  created_at: Date;
  updated_at: Date;
}

export interface FeatureToggleState {
  [key: string]: boolean;
}

export enum FeatureAccessError {
  FEATURE_DISABLED = 'FEATURE_DISABLED',
  FEATURE_NOT_FOUND = 'FEATURE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

export interface FeatureAccessResult {
  allowed: boolean;
  error?: FeatureAccessError;
  message?: string;
  redirectTo?: string;
}

export interface FeatureUsageEvent {
  feature_id: string;
  event_type: 'enabled' | 'disabled' | 'accessed';
  user_id: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}