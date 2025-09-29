/**
 * Advanced Features Configuration
 * Defines all available advanced features and their properties
 */

import { AdvancedFeature, FeatureCategory } from '../types/advanced-features';

export const ADVANCED_FEATURES: AdvancedFeature[] = [
  // Financial & Growth Tools
  {
    id: 'strategic-finance',
    name: 'Strategic Finance',
    description: 'Advanced cash flow forecasting and factoring tools',
    category: FeatureCategory.FINANCIAL_GROWTH_TOOLS,
    pages: ['strategic-finance'],
    icon: 'TrendingUp',
    tooltip: 'Includes cash flow analysis, factoring tools, and financial projections',
    enabled: false
  },
  {
    id: 'practice-growth',
    name: 'Practice Growth',
    description: 'Tools for finding new work, briefs, and referrals',
    category: FeatureCategory.FINANCIAL_GROWTH_TOOLS,
    pages: ['practice-growth'],
    icon: 'Users',
    tooltip: 'Brief analysis, referral engine, and business development tools',
    enabled: false
  },
  {
    id: 'advanced-reports',
    name: 'Advanced Reports',
    description: 'Comprehensive reporting and analytics dashboard',
    category: FeatureCategory.FINANCIAL_GROWTH_TOOLS,
    pages: ['reports'],
    icon: 'BarChart3',
    tooltip: 'Detailed analytics, custom reports, and performance metrics',
    enabled: false
  },
  
  // AI & Document Intelligence
  {
    id: 'document-intelligence',
    name: 'Document Intelligence',
    description: 'AI-powered document analysis and insights',
    category: FeatureCategory.AI_DOCUMENT_INTELLIGENCE,
    pages: ['document-intelligence'],
    icon: 'FileSearch',
    tooltip: 'AI document analysis, contract review, and legal insights',
    enabled: false
  },
  {
    id: 'ai-analytics',
    name: 'AI Analytics Dashboard',
    description: 'Comprehensive AI analytics and performance metrics',
    category: FeatureCategory.AI_DOCUMENT_INTELLIGENCE,
    pages: ['ai-analytics'],
    icon: 'Brain',
    tooltip: 'AI performance tracking, usage analytics, and optimization insights',
    enabled: false
  },
  {
    id: 'precedent-bank',
    name: 'Precedent Bank',
    description: 'Legal precedent research and management tools',
    category: FeatureCategory.AI_DOCUMENT_INTELLIGENCE,
    pages: ['precedent-bank'],
    icon: 'BookOpen',
    tooltip: 'Legal precedent database, case law research, and citation management',
    enabled: false
  },
  
  // Professional Development & Workflow
  {
    id: 'academy',
    name: 'Professional Academy',
    description: 'CPD tracking and peer networking features',
    category: FeatureCategory.PROFESSIONAL_DEVELOPMENT,
    pages: ['academy'],
    icon: 'GraduationCap',
    tooltip: 'CPD tracking, professional development, and peer networking',
    enabled: false
  },
  {
    id: 'workflow-integrations',
    name: 'Workflow Integrations',
    description: 'Third-party software integrations and automation',
    category: FeatureCategory.PROFESSIONAL_DEVELOPMENT,
    pages: ['workflow-integrations'],
    icon: 'Workflow',
    tooltip: 'Connect with external tools, automate workflows, and sync data',
    enabled: false
  }
];

export const FEATURE_CATEGORIES = [
  {
    id: FeatureCategory.FINANCIAL_GROWTH_TOOLS,
    name: 'Financial & Growth Tools',
    description: 'Advanced financial analysis and business development features',
    icon: 'TrendingUp'
  },
  {
    id: FeatureCategory.AI_DOCUMENT_INTELLIGENCE,
    name: 'AI & Document Intelligence',
    description: 'AI-powered document analysis and legal intelligence tools',
    icon: 'Brain'
  },
  {
    id: FeatureCategory.PROFESSIONAL_DEVELOPMENT,
    name: 'Professional Development & Workflow',
    description: 'CPD tracking, networking, and workflow automation features',
    icon: 'GraduationCap'
  }
];

// Helper functions
export const getFeaturesByCategory = (category: FeatureCategory): AdvancedFeature[] => {
  return ADVANCED_FEATURES.filter(feature => feature.category === category);
};

export const getFeatureById = (id: string): AdvancedFeature | undefined => {
  return ADVANCED_FEATURES.find(feature => feature.id === id);
};

export const getFeatureByPage = (page: string): AdvancedFeature | undefined => {
  return ADVANCED_FEATURES.find(feature => feature.pages.includes(page));
};

export const getAllAdvancedPages = (): string[] => {
  return ADVANCED_FEATURES.flatMap(feature => feature.pages);
};