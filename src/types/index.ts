// Navigation Types
export type Page =
  | 'dashboard'
  | 'ai-analytics'
  | 'matters'
  | 'invoices'
  | 'proforma'
  | 'reports'
  | 'practice-growth'
  | 'strategic-finance'
  | 'workflow-integrations'
  | 'settings'
  | 'design-system'
  | 'matter-details'
  | 'pricing-management'
  | 'profile';

export type ModalType =
  | 'new-brief'
  | 'voice-capture'
  | 'edit-matter'
  | 'confirm-delete'
  | null;

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
  WRITTEN_OFF = 'written_off'
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
  VOICE = 'voice',
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
  invoice_date: string;
  due_date: string;
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
  date_paid?: string;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  fee_narrative: string;
  internal_notes?: string;
  reminders_sent: number;
  last_reminder_date?: string;
  next_reminder_date?: string;
  reminder_history: any[];
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
  voice_transcription?: string;
  voice_recording_url?: string;
  billed: boolean;
  write_off: boolean;
  write_off_reason?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
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

// Voice Recording Types
export interface VoiceRecording {
  id: string;
  userId: string;
  matterId?: string;
  audioBlob?: Blob;
  audioUrl?: string;
  duration: number; // in seconds
  transcription?: string;
  extractedData?: ExtractedTimeEntryData;
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
  confidence?: number;
  language?: string;
  createdAt: string;
  processedAt?: string;
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

export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
  error?: string;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  alternatives?: string[];
  processingTime: number;
}

// Workflow & Integration Types
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
  errorDetails?: Record<string, any>;
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
  extracted_entities?: any;
  key_issues: string[];
  risk_factors?: any;
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
  optimization_factors?: any;
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
export type WorkflowPage = 'court-diary' | 'judge-analytics' | 'voice-assistant' | 'integrations';