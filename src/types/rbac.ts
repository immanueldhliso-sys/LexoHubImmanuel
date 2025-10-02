export enum UserRole {
  JUNIOR_ADVOCATE = 'junior_advocate',
  SENIOR_COUNSEL = 'senior_counsel',
  CHAMBERS_ADMIN = 'chambers_admin'
}

export enum Permission {
  VIEW_DASHBOARD = 'view:dashboard',
  VIEW_MATTERS = 'view:matters',
  CREATE_MATTERS = 'create:matters',
  EDIT_MATTERS = 'edit:matters',
  DELETE_MATTERS = 'delete:matters',
  
  VIEW_INVOICES = 'view:invoices',
  CREATE_INVOICES = 'create:invoices',
  EDIT_INVOICES = 'edit:invoices',
  DELETE_INVOICES = 'delete:invoices',
  
  VIEW_PROFORMA = 'view:proforma',
  CREATE_PROFORMA = 'create:proforma',
  EDIT_PROFORMA = 'edit:proforma',
  DELETE_PROFORMA = 'delete:proforma',
  
  VIEW_REPORTS = 'view:reports',
  EXPORT_REPORTS = 'export:reports',
  
  VIEW_AI_ANALYTICS = 'view:ai_analytics',
  USE_AI_FEATURES = 'use:ai_features',
  
  VIEW_STRATEGIC_FINANCE = 'view:strategic_finance',
  USE_CASH_FLOW_TOOLS = 'use:cash_flow_tools',
  USE_FEE_OPTIMIZATION = 'use:fee_optimization',
  ACCESS_FACTORING = 'access:factoring',
  
  VIEW_PRACTICE_GROWTH = 'view:practice_growth',
  POST_OVERFLOW_BRIEFS = 'post:overflow_briefs',
  APPLY_OVERFLOW_BRIEFS = 'apply:overflow_briefs',
  ACCESS_REFERRAL_NETWORK = 'access:referral_network',
  
  USE_DOCUMENT_INTELLIGENCE = 'use:document_intelligence',
  
  VIEW_WORKFLOW_INTEGRATIONS = 'view:workflow_integrations',
  MANAGE_INTEGRATIONS = 'manage:integrations',
  
  VIEW_COMPLIANCE = 'view:compliance',
  MANAGE_COMPLIANCE = 'manage:compliance',
  
  VIEW_ACADEMY = 'view:academy',
  ACCESS_PREMIUM_COURSES = 'access:premium_courses',
  
  VIEW_PRICING_MANAGEMENT = 'view:pricing_management',
  EDIT_PRICING = 'edit:pricing',
  
  MANAGE_USERS = 'manage:users',
  VIEW_AUDIT_LOGS = 'view:audit_logs',
  MANAGE_SETTINGS = 'manage:settings'
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  description: string;
  displayName: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [UserRole.JUNIOR_ADVOCATE]: {
    role: UserRole.JUNIOR_ADVOCATE,
    displayName: 'Junior Advocate',
    description: 'Entry-level advocate with access to essential practice management features',
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_MATTERS,
      Permission.CREATE_MATTERS,
      Permission.EDIT_MATTERS,
      Permission.VIEW_INVOICES,
      Permission.CREATE_INVOICES,
      Permission.VIEW_PROFORMA,
      Permission.CREATE_PROFORMA,
      Permission.EDIT_PROFORMA,
      Permission.VIEW_REPORTS,
      Permission.VIEW_COMPLIANCE,
      Permission.VIEW_ACADEMY,
      Permission.VIEW_PRICING_MANAGEMENT,
    ]
  },
  [UserRole.SENIOR_COUNSEL]: {
    role: UserRole.SENIOR_COUNSEL,
    displayName: 'Senior Counsel',
    description: 'Senior advocate with full access to all practice management and advanced features',
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_MATTERS,
      Permission.CREATE_MATTERS,
      Permission.EDIT_MATTERS,
      Permission.DELETE_MATTERS,
      
      Permission.VIEW_INVOICES,
      Permission.CREATE_INVOICES,
      Permission.EDIT_INVOICES,
      Permission.DELETE_INVOICES,
      
      Permission.VIEW_PROFORMA,
      Permission.CREATE_PROFORMA,
      Permission.EDIT_PROFORMA,
      Permission.DELETE_PROFORMA,
      
      Permission.VIEW_REPORTS,
      Permission.EXPORT_REPORTS,
      
      Permission.VIEW_AI_ANALYTICS,
      Permission.USE_AI_FEATURES,
      
      Permission.VIEW_STRATEGIC_FINANCE,
      Permission.USE_CASH_FLOW_TOOLS,
      Permission.USE_FEE_OPTIMIZATION,
      Permission.ACCESS_FACTORING,
      
      Permission.VIEW_PRACTICE_GROWTH,
      Permission.POST_OVERFLOW_BRIEFS,
      Permission.APPLY_OVERFLOW_BRIEFS,
      Permission.ACCESS_REFERRAL_NETWORK,
      
      Permission.USE_DOCUMENT_INTELLIGENCE,
      
      Permission.VIEW_WORKFLOW_INTEGRATIONS,
      Permission.MANAGE_INTEGRATIONS,
      
      Permission.VIEW_COMPLIANCE,
      Permission.MANAGE_COMPLIANCE,
      
      Permission.VIEW_ACADEMY,
      Permission.ACCESS_PREMIUM_COURSES,
      
      Permission.VIEW_PRICING_MANAGEMENT,
      Permission.EDIT_PRICING,
      
      Permission.MANAGE_SETTINGS,
    ]
  },
  [UserRole.CHAMBERS_ADMIN]: {
    role: UserRole.CHAMBERS_ADMIN,
    displayName: 'Chambers Administrator',
    description: 'Full administrative access to all features and user management',
    permissions: Object.values(Permission)
  }
};

export interface FeatureAccess {
  id: string;
  name: string;
  description: string;
  requiredRole: UserRole;
  requiredPermissions: Permission[];
  isPremium: boolean;
  category: 'core' | 'advanced' | 'ai' | 'finance' | 'growth' | 'workflow';
}

export const FEATURE_ACCESS_MATRIX: FeatureAccess[] = [
  {
    id: 'ai-analytics',
    name: 'AI Analytics Dashboard',
    description: 'AI-powered insights and analytics for practice optimization',
    requiredRole: UserRole.SENIOR_COUNSEL,
    requiredPermissions: [Permission.VIEW_AI_ANALYTICS, Permission.USE_AI_FEATURES],
    isPremium: true,
    category: 'ai'
  },
  {
    id: 'strategic-finance',
    name: 'Strategic Finance',
    description: 'Advanced cash flow forecasting, fee optimization, and factoring tools',
    requiredRole: UserRole.SENIOR_COUNSEL,
    requiredPermissions: [Permission.VIEW_STRATEGIC_FINANCE, Permission.USE_CASH_FLOW_TOOLS],
    isPremium: true,
    category: 'finance'
  },
  {
    id: 'practice-growth',
    name: 'Practice Growth',
    description: 'Overflow brief marketplace and referral networking',
    requiredRole: UserRole.SENIOR_COUNSEL,
    requiredPermissions: [Permission.VIEW_PRACTICE_GROWTH, Permission.ACCESS_REFERRAL_NETWORK],
    isPremium: true,
    category: 'growth'
  },

  {
    id: 'document-intelligence',
    name: 'Document Intelligence',
    description: 'AI-powered document analysis and insights',
    requiredRole: UserRole.SENIOR_COUNSEL,
    requiredPermissions: [Permission.USE_DOCUMENT_INTELLIGENCE],
    isPremium: true,
    category: 'ai'
  },
  {
    id: 'workflow-integrations',
    name: 'Workflow Integrations',
    description: 'Third-party integrations and automation',
    requiredRole: UserRole.SENIOR_COUNSEL,
    requiredPermissions: [Permission.VIEW_WORKFLOW_INTEGRATIONS, Permission.MANAGE_INTEGRATIONS],
    isPremium: true,
    category: 'workflow'
  },
  {
    id: 'advanced-reports',
    name: 'Advanced Reporting',
    description: 'Comprehensive practice analytics and custom reports',
    requiredRole: UserRole.SENIOR_COUNSEL,
    requiredPermissions: [Permission.VIEW_REPORTS, Permission.EXPORT_REPORTS],
    isPremium: true,
    category: 'advanced'
  }
];

export interface RestrictedAction {
  action: string;
  requiredPermissions: Permission[];
  denialMessage: string;
}

export const RESTRICTED_ACTIONS: Record<string, RestrictedAction> = {
  DELETE_MATTER: {
    action: 'Delete Matter',
    requiredPermissions: [Permission.DELETE_MATTERS],
    denialMessage: 'Only Senior Counsel can delete matters. Please contact your administrator.'
  },
  DELETE_INVOICE: {
    action: 'Delete Invoice',
    requiredPermissions: [Permission.DELETE_INVOICES],
    denialMessage: 'Only Senior Counsel can delete invoices. Please contact your administrator.'
  },
  ACCESS_AI_FEATURES: {
    action: 'Access AI Features',
    requiredPermissions: [Permission.USE_AI_FEATURES],
    denialMessage: 'AI features are available for Senior Counsel. Upgrade your account to access this feature.'
  },
  ACCESS_STRATEGIC_FINANCE: {
    action: 'Access Strategic Finance',
    requiredPermissions: [Permission.VIEW_STRATEGIC_FINANCE],
    denialMessage: 'Strategic Finance tools are available for Senior Counsel. Upgrade your account to access this feature.'
  },
  POST_OVERFLOW_BRIEF: {
    action: 'Post Overflow Brief',
    requiredPermissions: [Permission.POST_OVERFLOW_BRIEFS],
    denialMessage: 'Only Senior Counsel can post overflow briefs. Upgrade your account to access this feature.'
  },
  MANAGE_INTEGRATIONS: {
    action: 'Manage Integrations',
    requiredPermissions: [Permission.MANAGE_INTEGRATIONS],
    denialMessage: 'Integration management is available for Senior Counsel. Upgrade your account to access this feature.'
  },
  EXPORT_REPORTS: {
    action: 'Export Reports',
    requiredPermissions: [Permission.EXPORT_REPORTS],
    denialMessage: 'Report export is available for Senior Counsel. Upgrade your account to access this feature.'
  }
};
