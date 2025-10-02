// Navigation Types
export type Page =
  | 'dashboard'
  | 'ai-analytics'
  | 'matters'
  | 'matter-templates'
  | 'matter-workbench'
  | 'invoices'
  | 'invoice-designer'
  | 'proforma'
  | 'reports'
  | 'practice-growth'
  | 'strategic-finance'
  | 'workflow-integrations'
  | 'api-integrations'
  | 'compliance'
  | 'settings'
  | 'design-system'
  | 'matter-details'
  | 'pricing-management'
  | 'profile';

// Export integration types
export * from './integrations';

export type ModalType =
  | 'new-brief'
  | 'edit-matter'
  | 'confirm-delete'
  | null;

// Navigation System Types (Phase 1)
export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  page?: Page;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
  isNew?: boolean;
  isComingSoon?: boolean;
  requiresUpgrade?: boolean;
  minTier?: UserTier;
}

export interface NavigationSection {
  id: string;
  title: string;
  items: NavigationItem[];
}

export interface NavigationCategory {
  id: string;
  label: string;
  href?: string;
  page?: Page;
  icon: React.ComponentType<{ className?: string }>;
  sections: NavigationSection[];
  featured?: NavigationItem[];
  description?: string;
}

export interface NavigationConfig {
  categories: NavigationCategory[];
  quickActions: NavigationItem[];
}

// Phase 2: Command Bar and Quick Actions Types
export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: SearchCategory;
  icon?: React.ComponentType<{ className?: string }>;
  page?: Page;
  href?: string;
  metadata?: Record<string, unknown>;
  relevanceScore?: number;
}

export enum SearchCategory {
  MATTERS = 'matters',
  CLIENTS = 'clients', 
  INVOICES = 'invoices',
  ACTIONS = 'actions',
  DOCUMENTS = 'documents',
  RECENT = 'recent'
}

export interface SearchState {
  query: string;
  isOpen: boolean;
  isLoading: boolean;
  results: SearchResult[];
  selectedIndex: number;
  recentSearches: string[];
  categories: SearchCategory[];
}

export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  page?: Page;
  action?: () => void;
  badge?: string;
  isNew?: boolean;
  minTier?: UserTier;
  usageCount?: number;
  lastUsed?: string;
}

export interface QuickActionsState {
  isOpen: boolean;
  actions: QuickAction[];
  customActions: QuickAction[];
  defaultActions: QuickAction[];
}

export interface CommandBarState {
  search: SearchState;
  quickActions: QuickActionsState;
}

export interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
}

// User Tier Types for Access Control
export enum UserTier {
  JUNIOR_START = 'junior_start',
  ADVOCATE_PRO = 'advocate_pro', 
  SENIOR_ADVOCATE = 'senior_advocate',
  CHAMBERS_ENTERPRISE = 'chambers_enterprise'
}

export type { UserRole, Permission, RolePermissions, FeatureAccess, RestrictedAction } from './rbac';
export { ROLE_PERMISSIONS, FEATURE_ACCESS_MATRIX, RESTRICTED_ACTIONS } from './rbac';

// Navigation State Types
export interface NavigationState {
  activeCategory: string | null;
  activePage: Page;
  megaMenuOpen: boolean;
  mobileMenuOpen: boolean;
  hoveredCategory: string | null;
}

// Accessibility Types
export interface NavigationA11y {
  ariaLabel: string;
  ariaExpanded?: boolean;
  ariaHaspopup?: boolean;
  role?: string;
  tabIndex?: number;
}

// Database Enums (matching Supabase schema)
export enum BarAssociation {
  JOHANNESBURG = 'johannesburg',
  CAPE_TOWN = 'cape_town'
}

export enum MatterStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SETTLED = 'settled',
  CLOSED = 'closed',
  ON_HOLD = 'on_hold'
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  PAID = 'paid',
  OVERDUE = 'overdue',
  DISPUTED = 'disputed',
  WRITTEN_OFF = 'written_off',
  PRO_FORMA = 'pro_forma',
  CONVERTED = 'converted'
}

export enum PaymentMethod {
  EFT = 'eft',
  CHEQUE = 'cheque',
  CASH = 'cash',
  CARD = 'card',
  DEBIT_ORDER = 'debit_order'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum TimeEntryMethod {
  MANUAL = 'manual',
  TIMER = 'timer',
  AI_SUGGESTED = 'ai_suggested'
}

export enum DocumentType {
  BRIEF = 'brief',
  OPINION = 'opinion',
  CONTRACT = 'contract',
  CORRESPONDENCE = 'correspondence',
  COURT_DOCUMENT = 'court_document',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  OTHER = 'other'
}

export enum FeeType {
  STANDARD = 'standard',
  CONTINGENCY = 'contingency',
  SUCCESS = 'success',
  RETAINER = 'retainer',
  PRO_BONO = 'pro_bono'
}

export enum ClientType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
  TRUST = 'trust',
  GOVERNMENT = 'government',
  NGO = 'ngo'
}

// Legacy enums for backward compatibility
export const Bar = BarAssociation;

// Core Business Entities (matching database schema)
export interface Advocate {
  id: string;
  email: string;
  full_name: string;
  initials: string;
  practice_number: string;
  bar: BarAssociation;
  year_admitted: number;
  specialisations: string[];
  hourly_rate: number;
  contingency_rate?: number;
  success_fee_rate?: number;
  phone_number?: string;
  chambers_address?: string;
  postal_address?: string;
  firm_name?: string;
  firm_tagline?: string;
  firm_logo_url?: string;
  vat_number?: string;
  banking_details?: {
    bank_name: string;
    account_name: string;
    account_number: string;
    branch_code: string;
    swift_code?: string;
  };
  notification_preferences: {
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
  invoice_settings: {
    auto_remind: boolean;
    reminder_days: number[];
  };
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  is_active: boolean;
  deleted_at?: string;
  total_outstanding: number;
  total_collected_ytd: number;
  matters_count: number;
}

export interface Matter {
  id: string;
  advocate_id: string;
  reference_number: string;
  title: string;
  description?: string;
  matter_type: string;
  court_case_number?: string;
  bar: BarAssociation;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_type?: ClientType;
  instructing_attorney: string;
  instructing_attorney_email?: string;
  instructing_attorney_phone?: string;
  instructing_firm?: string;
  instructing_firm_ref?: string;
  fee_type: FeeType;
  estimated_fee?: number;
  fee_cap?: number;
  actual_fee?: number;
  wip_value: number;
  trust_balance: number;
  disbursements: number;
  vat_exempt: boolean;
  status: MatterStatus;
  risk_level: RiskLevel;
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
}

export interface Invoice {
  id: string;
  matter_id: string;
  advocate_id: string;
  invoice_number: string;
  dateIssued: string;
  dateDue: string;
  bar: BarAssociation;
  fees_amount: number;
  disbursements_amount: number;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  amount_paid: number;
  balance_due: number;
  datePaid?: string;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  fee_narrative: string;
  internal_notes?: string;
  reminders_sent: number;
  last_reminder_date?: string;
  next_reminder_date?: string;
  reminder_history: unknown[];
  created_at: string;
  updated_at: string;
  sent_at?: string;
  viewed_at?: string;
  deleted_at?: string;
  days_outstanding: number;
  is_overdue: boolean;
}

export interface TimeEntry {
  id: string;
  matter_id: string;
  advocate_id: string;
  invoice_id?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  description: string;
  billable: boolean;
  rate: number;
  amount: number;
  recording_method: TimeEntryMethod;
  billed: boolean;
  write_off: boolean;
  write_off_reason?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Pro Forma Types
export enum ProFormaStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  AWAITING_ACCEPTANCE = 'awaiting_acceptance',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  CONVERTED_TO_INVOICE = 'converted_to_invoice'
}

export interface ProForma {
  id: string;
  matter_id: string;
  advocate_id: string;
  quote_number: string;
  quote_date: string;
  valid_until: string;
  fee_narrative: string;
  total_amount: number;
  status: ProFormaStatus;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  accepted_at?: string;
  declined_at?: string;
  converted_at?: string;
  notes?: string;
}

export interface ProFormaGenerationRequest {
  matter_id: string;
  fee_narrative: string;
  total_amount: number;
  valid_until: string;
  quote_date: string;
  notes?: string;
  services?: string[]; // Array of service IDs to associate with the pro forma
}

export interface ProFormaFilters {
  search: string;
  status: ProFormaStatus | 'all';
  dateRange?: { start: string; end: string } | null;
}

export interface ProFormaSummaryStats {
  totalCount: number;
  estimatedValue: number;
  currentMonthCount: number;
  conversionRate: number;
  averageValue: number;
  pendingAcceptance: number;
}

// User is now an alias for Advocate for backward compatibility
export type User = Advocate;

export interface Document {
  id: string;
  matter_id: string;
  advocate_id: string;
  filename: string;
  original_filename: string;
  document_type: DocumentType;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  version: number;
  parent_document_id?: string;
  description?: string;
  tags: string[];
  uploaded_at: string;
  updated_at: string;
  deleted_at?: string;
  content_text?: string;
}

export interface Note {
  id: string;
  matter_id: string;
  advocate_id: string;
  content: string;
  is_internal: boolean;
  is_important: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Referral {
  id: string;
  matter_id: string;
  referring_advocate_id?: string;
  referred_to_advocate_id?: string;
  referring_firm?: string;
  referral_date: string;
  referral_fee_percentage?: number;
  referral_fee_amount?: number;
  referral_fee_paid: boolean;
  referral_fee_paid_date?: string;
  reciprocal_expected: boolean;
  reciprocal_completed: boolean;
  notes?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id?: string;
  advocate_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference?: string;
  bank_reference?: string;
  reconciled: boolean;
  reconciled_date?: string;
  is_trust_deposit: boolean;
  trust_transfer_date?: string;
  created_at: string;
}

export interface UserSettings {
  notifications: {
    email: boolean;
    whatsapp: boolean;
    invoiceReminders: boolean;
    matterUpdates: boolean;
    weeklyReports: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'af';
  timezone: string;
  dateFormat: string;
}

// Application State
export interface AppState {
  // User & Auth
  user: User | null;
  isAuthenticated: boolean;
  // Navigation
  activePage: Page;
  activeModal: ModalType;
  viewingMatterId: string | null;
  // UI State
  sidebarOpen: boolean;
  isLoading: boolean;
  globalError: Error | null;
  // Data Cache
  matters: Matter[];
  invoices: Invoice[];
  timeEntries: TimeEntry[];
  // Filters & Sorting
  filters: {
    matters: MatterFilters;
    invoices: InvoiceFilters;
  };
  sorting: {
    matters: SortConfig<Matter>;
    invoices: SortConfig<Invoice>;
  };
  // Pagination
  pagination: {
    matters: PaginationConfig;
    invoices: PaginationConfig;
  };
}

export interface MatterFilters {
  status?: MatterStatus[];
  bar?: BarAssociation[];
  dateRange?: { start: string; end: string };
  search?: string;
  minWipValue?: number;
  maxWipValue?: number;
  attorney?: string;
  hasConflictCheck?: boolean;
  riskLevel?: RiskLevel[];
  clientType?: ClientType[];
  feeType?: FeeType[];
}

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  bar?: BarAssociation[];
  dateRange?: { start: string; end: string };
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  isOverdue?: boolean;
  paymentMethod?: PaymentMethod[];
}



export interface SortConfig<T> {
  field: keyof T;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error: null;
  meta?: {
    pagination?: PaginationConfig;
    timestamp: string;
  };
}

export interface ApiError {
  data: null;
  error: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
}

// Form Types
export interface NewMatterForm {
  advocateId?: string;
  referenceNumber?: string;
  title: string;
  description?: string;
  matterType: string;
  matter_type: string;
  courtCaseNumber?: string;
  clientName: string;
  client_name: string;
  clientEmail?: string;
  client_email?: string;
  clientPhone?: string;
  client_phone?: string;
  clientAddress?: string;
  client_address?: string;
  clientType?: ClientType;
  client_type?: ClientType;
  instructingAttorney: string;
  instructing_attorney: string;
  instructingAttorneyEmail?: string;
  instructing_attorney_email?: string;
  instructingAttorneyPhone?: string;
  instructing_attorney_phone?: string;
  instructingFirm?: string;
  instructing_firm?: string;
  instructingFirmRef?: string;
  instructing_firm_ref?: string;
  bar: BarAssociation;
  feeType: FeeType;
  fee_type: FeeType;
  estimatedFee?: number;
  estimated_fee?: number;
  feeCap?: number;
  fee_cap?: number;
  vatExempt?: boolean;
  riskLevel: RiskLevel;
  risk_level: RiskLevel;
  expectedCompletionDate?: string;
  expected_completion_date?: string;
  tags?: string[];
  services?: string[]; // Array of service IDs to associate with the matter
}

export interface NewInvoiceForm {
  matter_id: string;
  fees_amount: number;
  disbursements_amount?: number;
  vat_rate?: number;
  fee_narrative: string;
  internal_notes?: string;
  time_entry_ids?: string[];
}

// Analytics Types
export interface PracticeMetrics {
  totalWip: number;
  totalBilled: number;
  totalCollected: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  averageCollectionDays: number;
  monthlyBillings: MonthlyBilling[];
  workTypeDistribution: WorkTypeDistribution[];
  settlementRate: number;
}

export interface MonthlyBilling {
  month: string;
  year: number;
  amount: number;
  invoiceCount: number;
  collectionRate: number;
}

// Additional types for Phase 3 implementation
export interface Payment {
  id: string;
  invoiceId: string;
  advocateId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'EFT' | 'Cheque' | 'Cash' | 'Card';
  reference?: string;
  createdAt: string;
}

export interface BarPaymentRules {
  paymentTermDays: number;
  reminderSchedule: number[];
  vatRate: number;
  trustTransferDays: number;
  lateFeePercentage: number;
  prescriptionYears: number;
}

export interface InvoiceGenerationRequest {
  matterId: string;
  timeEntryIds?: string[];
  customNarrative?: string;
  includeUnbilledTime?: boolean;
  isProForma?: boolean;
}

// Performance-Based Pricing Types
export enum PricingModel {
  STANDARD = 'Standard',
  SUCCESS_SHARING = 'Success Sharing',
  CONTINGENCY = 'Contingency',
  HYBRID = 'Hybrid'
}

export interface PerformanceBasedPricing {
  id: string;
  advocateId: string;
  pricingModel: PricingModel;
  baseSubscriptionRate: number; // Reduced subscription cost
  successFeePercentage: number; // Percentage of collected fees
  minimumMonthlyFee?: number;
  maximumMonthlyFee?: number;
  contractStartDate: string;
  contractEndDate?: string;
  isActive: boolean;
  terms: PricingTerms;
  performance: PerformanceMetrics;
}

export interface PricingTerms {
  collectionThreshold: number; // Minimum collection amount before success sharing kicks in
  paymentSchedule: 'Monthly' | 'Quarterly' | 'Annual';
  successFeeCalculationMethod: 'Gross' | 'Net'; // Based on gross or net collections
  excludedFeeTypes?: string[]; // Fee types excluded from success sharing
  cappedAt?: number; // Maximum success fee per matter
}

export interface PerformanceMetrics {
  totalCollected: number;
  totalSuccessFees: number;
  averageCollectionRate: number;
  matterCount: number;
  lastCalculationDate: string;
  projectedAnnualSavings: number;
}

export interface SuccessFeeCalculation {
  id: string;
  advocateId: string;
  matterId: string;
  invoiceId: string;
  collectedAmount: number;
  successFeePercentage: number;
  successFeeAmount: number;
  calculationDate: string;
  paymentStatus: 'Pending' | 'Paid' | 'Disputed';
  notes?: string;
}



export interface ExtractedTimeEntryData {
  matterId?: string;
  matterTitle?: string;
  clientName?: string;
  duration?: number; // in minutes
  description: string;
  workType?: string;
  date?: string;
  confidence: number; // 0-1 confidence score
  extractedFields: {
    matter?: { value: string; confidence: number };
    duration?: { value: number; confidence: number };
    description?: { value: string; confidence: number };
    date?: { value: string; confidence: number };
  };
}



// Workflow & Integration Types
export interface CourtRegistry {
  id: string;
  name: string;
  code: string;
  jurisdiction: string;
  address?: string;
  contactDetails?: Record<string, unknown>;
  integrationStatus: 'active' | 'inactive' | 'maintenance';
  apiEndpoint?: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

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
  caseDetails?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

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

export interface JudgeAnalytics {
  judgeId: string;
  periodMonths: number;
  recentCases: number;
  averageCasesPerPeriod: number;
  averagePostponementRate: number;
  averagePerformanceScore: number;
  periodsAnalyzed: number;
}



export interface LanguageTranslation {
  id: string;
  key: string;
  languageCode: string;
  translation: string;
  context?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourtIntegrationLog {
  id: string;
  courtRegistryId: string;
  syncType: 'diary_sync' | 'case_update' | 'judge_info' | 'full_sync';
  status: 'started' | 'completed' | 'failed' | 'partial';
  recordsProcessed: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorDetails?: Record<string, unknown>;
  syncDurationMs?: number;
  createdAt: string;
}

// Document Intelligence Types
export enum DocumentStatus {
  PROCESSING = 'processing',
  INDEXED = 'indexed',
  ANALYZED = 'analyzed',
  ERROR = 'error'
}

export enum AnalysisType {
  BRIEF = 'brief',
  CONTRACT = 'contract',
  OPINION = 'opinion',
  PLEADING = 'pleading',
  GENERAL = 'general'
}

export interface DocumentIntelligence {
  id: string;
  document_id: string;
  analysis_type?: AnalysisType;
  extracted_entities?: unknown;
  key_issues: string[];
  risk_factors?: unknown;
  suggested_actions: string[];
  is_brief: boolean;
  brief_deadline?: string;
  brief_court?: string;
  brief_judge?: string;
  opposing_counsel?: string;
  matter_value?: number;
  complexity_score?: number;
  summary?: string;
  key_dates: string[];
  referenced_cases: string[];
  applicable_laws: string[];
  status: DocumentStatus;
  processing_started_at?: string;
  processing_completed_at?: string;
  error_message?: string;
  confidence_score?: number;
  processing_time_ms?: number;
  created_at: string;
  updated_at: string;
}

// Practice Growth Types
export enum SpecialisationCategory {
  ADMINISTRATIVE_LAW = 'administrative_law',
  BANKING_FINANCE = 'banking_finance',
  COMMERCIAL_LITIGATION = 'commercial_litigation',
  CONSTITUTIONAL_LAW = 'constitutional_law',
  CONSTRUCTION_LAW = 'construction_law',
  CRIMINAL_LAW = 'criminal_law',
  EMPLOYMENT_LAW = 'employment_law',
  ENVIRONMENTAL_LAW = 'environmental_law',
  FAMILY_LAW = 'family_law',
  INSURANCE_LAW = 'insurance_law',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  INTERNATIONAL_LAW = 'international_law',
  MEDICAL_LAW = 'medical_law',
  MINING_LAW = 'mining_law',
  PROPERTY_LAW = 'property_law',
  TAX_LAW = 'tax_law',
  OTHER = 'other'
}

export enum BriefStatus {
  AVAILABLE = 'available',
  REVIEWING = 'reviewing',
  ACCEPTED = 'accepted',
  WITHDRAWN = 'withdrawn'
}

export enum ReferralStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  COMPLETED = 'completed'
}

export interface AdvocateSpecialisation {
  id: string;
  advocate_id: string;
  category: SpecialisationCategory;
  sub_speciality?: string;
  years_experience?: number;
  notable_cases?: string;
  certifications: string[];
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface OverflowBrief {
  id: string;
  posting_advocate_id: string;
  title: string;
  description: string;
  category: SpecialisationCategory;
  matter_type: string;
  bar: BarAssociation;
  required_experience_years: number;
  required_certifications: string[];
  language_requirements: string[];
  estimated_fee_range_min?: number;
  estimated_fee_range_max?: number;
  fee_type: FeeType;
  referral_percentage?: number;
  deadline?: string;
  expected_duration_days?: number;
  is_urgent: boolean;
  status: BriefStatus;
  accepted_by_advocate_id?: string;
  accepted_at?: string;
  completed_at?: string;
  is_public: boolean;
  visible_to_advocates: string[];
  hidden_from_advocates: string[];
  view_count: number;
  application_count: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
  deleted_at?: string;
}

// Strategic Finance Types
export enum FeeOptimizationModel {
  STANDARD = 'standard',
  PREMIUM_URGENCY = 'premium_urgency',
  VOLUME_DISCOUNT = 'volume_discount',
  SUCCESS_BASED = 'success_based',
  HYBRID = 'hybrid'
}

export enum CashFlowStatus {
  HEALTHY = 'healthy',
  ADEQUATE = 'adequate',
  TIGHT = 'tight',
  CRITICAL = 'critical'
}

export enum FactoringStatus {
  AVAILABLE = 'available',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  FUNDED = 'funded',
  REPAID = 'repaid',
  DEFAULTED = 'defaulted'
}

export interface FeeOptimizationRecommendation {
  id: string;
  advocate_id: string;
  matter_id?: string;
  current_hourly_rate?: number;
  current_fee_structure: string;
  current_estimated_fee?: number;
  market_average_rate?: number;
  market_percentile?: number;
  similar_matters_analyzed?: number;
  recommended_model: FeeOptimizationModel;
  recommended_hourly_rate?: number;
  recommended_fee_structure: string;
  recommended_fixed_fee?: number;
  recommended_success_percentage?: number;
  optimization_factors?: unknown;
  potential_revenue_increase?: number;
  confidence_score?: number;
  accepted: boolean;
  accepted_at?: string;
  actual_fee_achieved?: number;
  created_at: string;
  expires_at: string;
}

export interface CashFlowPrediction {
  id: string;
  advocate_id: string;
  prediction_date: string;
  period_start: string;
  period_end: string;
  expected_collections: number;
  expected_expenses: number;
  expected_net_cash_flow: number;
  invoice_collections?: number;
  new_matter_fees?: number;
  recurring_fees?: number;
  contingency_fees?: number;
  collection_confidence?: number;
  seasonal_adjustment?: number;
  overdue_risk_amount?: number;
  cash_flow_status?: CashFlowStatus;
  minimum_balance_date?: string;
  minimum_balance_amount?: number;
  recommended_actions: string[];
  financing_needed?: number;
  created_at: string;
}

// Workflow Page Types
export type WorkflowPage = 'court-diary' | 'judge-analytics' | 'integrations';

// Enhanced Invoice Generation Types
export interface InvoiceGenerationOptions {
  matterId: string;
  includeTimeEntries: string[]; // time_entry IDs
  includeExpenses: string[]; // expense IDs
  feeStructureOverride?: FeeStructure;
  narrative?: string;
  discountAmount?: number;
  discountPercentage?: number;
}

export interface FeeStructure {
  id?: string;
  name: string;
  type: FeeType;
  hourlyRate?: number;
  fixedFee?: number;
  contingencyPercentage?: number;
  successFeePercentage?: number;
  minimumFee?: number;
  maximumFee?: number;
  vatRate: number;
  description?: string;
  isDefault?: boolean;
}

export interface Expense {
  id: string;
  matter_id: string;
  advocate_id: string;
  invoice_id?: string;
  date: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  vat_amount?: number;
  receipt_url?: string;
  billable: boolean;
  billed: boolean;
  write_off: boolean;
  write_off_reason?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export enum ExpenseCategory {
  TRAVEL = 'travel',
  ACCOMMODATION = 'accommodation',
  MEALS = 'meals',
  COURT_FEES = 'court_fees',
  FILING_FEES = 'filing_fees',
  EXPERT_FEES = 'expert_fees',
  PHOTOCOPYING = 'photocopying',
  POSTAGE = 'postage',
  TELEPHONE = 'telephone',
  RESEARCH = 'research',
  OTHER = 'other'
}

// Fee Narrative Generator Types
export interface NarrativePrompt {
  litigation: string;
  advisory: string;
}

export interface NarrativeGenerationRequest {
  matterTitle: string;
  services: string[];
  totalHours: number;
  matterType: 'litigation' | 'advisory';
  complexity?: 'low' | 'medium' | 'high';
  clientType?: ClientType;
  customInstructions?: string;
}

export interface NarrativeGenerationResponse {
  narrative: string;
  confidence: number;
  suggestions: string[];
  compliance_notes: string[];
}

// PDF Generation Types
export interface PDFGenerationOptions {
  includeHeader?: boolean;
  includeFirmDetails?: boolean;
  includeClientDetails?: boolean;
  includePaymentTerms?: boolean;
  includeBankingDetails?: boolean;
  watermark?: string;
  customFooter?: string;
  logoUrl?: string;
}

export interface PDFDocumentInfo {
  title: string;
  subject: string;
  author: string;
  creator: string;
  producer: string;
  keywords?: string[];
}

export interface FirmDetails {
  name: string;
  address: string[];
  phone: string;
  email: string;
  website?: string;
  vatNumber: string;
  practiceNumber: string;
  barAssociation: BarAssociation;
  logo?: string;
}

export interface BankingDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  swiftCode?: string;
  reference: string;
}

export interface PaymentTerms {
  paymentDays: number;
  lateFeePercentage?: number;
  discountDays?: number;
  discountPercentage?: number;
  additionalTerms?: string[];
}

// Email Service Types
export interface EmailAttachment {
  filename: string;
  content: Blob | Buffer | string;
  contentType: string;
  encoding?: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
  isHtml?: boolean;
}

export interface EmailSendRequest {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: EmailAttachment[];
  replyTo?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface EmailSendResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

export interface ProFormaEmailOptions {
  recipientEmail: string;
  message?: string;
  includePaymentInstructions?: boolean;
  customSubject?: string;
  sendCopy?: boolean;
}

export interface InvoiceEmailOptions {
  recipientEmail: string;
  message?: string;
  includePaymentReminder?: boolean;
  customSubject?: string;
  sendCopy?: boolean;
  isReminder?: boolean;
  reminderNumber?: number;
}

// Line Items for Invoices/Pro Formas
export interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  vatRate?: number;
  vatAmount?: number;
  type: 'time_entry' | 'expense' | 'fixed_fee' | 'disbursement';
  reference_id?: string; // Links to time_entry or expense
  date?: string;
}

// Enhanced Invoice interface with line items
export interface InvoiceWithLineItems extends Invoice {
  line_items: LineItem[];
  firm_details?: FirmDetails;
  banking_details?: BankingDetails;
  payment_terms?: PaymentTerms;
  is_pro_forma?: boolean;
  converted_to_invoice_id?: string;
  pro_forma_accepted_at?: string;
}

// Service Response Types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PDFGenerationResult {
  blob: Blob;
  filename: string;
  size: number;
  pages: number;
}

// Bar Council Compliance Types
export interface BarComplianceCheck {
  isCompliant: boolean;
  violations: string[];
  warnings: string[];
  recommendations: string[];
  checkedAt: string;
}

export interface BarComplianceRules {
  maxHourlyRate?: number;
  requiredDisclosures: string[];
  mandatoryTerms: string[];
  prohibitedPractices: string[];
  vatRequirements: {
    mustShowVatNumber: boolean;
    mustShowVatBreakdown: boolean;
    exemptionRules: string[];
  };
}

// Advanced Compliance Engine Types
export enum ComplianceAlertType {
  TRUST_ACCOUNT = 'trust_account',
  ETHICS = 'ethics',
  DEADLINE = 'deadline',
  FINANCIAL = 'financial',
  REGULATORY = 'regulatory',
  CONFLICT = 'conflict',
  DOCUMENTATION = 'documentation'
}

export enum ComplianceAlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ComplianceAlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export enum ComplianceRequirementType {
  TRUST_ACCOUNT_RECONCILIATION = 'trust_account_reconciliation',
  ANNUAL_RETURN = 'annual_return',
  CPD_COMPLIANCE = 'cpd_compliance',
  INSURANCE_RENEWAL = 'insurance_renewal',
  PRACTICE_CERTIFICATE = 'practice_certificate',
  ETHICS_DECLARATION = 'ethics_declaration',
  FINANCIAL_AUDIT = 'financial_audit',
  REGULATORY_FILING = 'regulatory_filing'
}

export enum ComplianceViolationType {
  TRUST_ACCOUNT_SHORTAGE = 'trust_account_shortage',
  OVERDUE_RECONCILIATION = 'overdue_reconciliation',
  MISSING_DOCUMENTATION = 'missing_documentation',
  ETHICS_BREACH = 'ethics_breach',
  REGULATORY_NON_COMPLIANCE = 'regulatory_non_compliance',
  FINANCIAL_IRREGULARITY = 'financial_irregularity',
  DEADLINE_MISSED = 'deadline_missed'
}

export interface ComplianceAlert {
  id: string;
  advocate_id: string;
  matter_id?: string;
  alert_type: ComplianceAlertType;
  severity: ComplianceAlertSeverity;
  status: ComplianceAlertStatus;
  title: string;
  description: string;
  recommendation?: string;
  due_date?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ComplianceDeadline {
  id: string;
  requirement_id: string;
  advocate_id: string;
  matter_id?: string;
  requirement_type: ComplianceRequirementType;
  title: string;
  description: string;
  due_date: string;
  reminder_dates: string[];
  is_recurring: boolean;
  recurrence_pattern?: string;
  completed: boolean;
  completed_at?: string;
  completed_by?: string;
  completion_notes?: string;
  auto_generated: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ComplianceViolation {
  id: string;
  alert_id?: string;
  advocate_id: string;
  matter_id?: string;
  violation_type: ComplianceViolationType;
  severity: ComplianceAlertSeverity;
  title: string;
  description: string;
  detected_at: string;
  resolved_at?: string;
  resolution_action?: string;
  financial_impact?: number;
  regulatory_reference?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ComplianceRequirement {
  id: string;
  advocate_id: string;
  requirement_type: ComplianceRequirementType;
  title: string;
  description: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  is_mandatory: boolean;
  bar_specific: boolean;
  applicable_bars: BarAssociation[];
  compliance_criteria?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ComplianceDashboardStats {
  totalAlerts: number;
  criticalAlerts: number;
  upcomingDeadlines: number;
  overdueDeadlines: number;
  activeViolations: number;
  complianceScore: number;
  lastAuditDate?: string;
  nextAuditDate?: string;
  trustAccountBalance?: number;
  trustAccountLastReconciled?: string;
}

export interface ComplianceFilters {
  alertType?: ComplianceAlertType[];
  severity?: ComplianceAlertSeverity[];
  status?: ComplianceAlertStatus[];
  dateRange?: { start: string; end: string };
  search?: string;
  matterId?: string;
  requirementType?: ComplianceRequirementType[];
  violationType?: ComplianceViolationType[];
}

export interface ComplianceAuditLog {
  id: string;
  advocate_id: string;
  action: string;
  entity_type: 'alert' | 'deadline' | 'violation' | 'requirement';
  entity_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  performed_by: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}