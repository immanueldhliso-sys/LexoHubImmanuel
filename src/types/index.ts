// Navigation Types
export type Page =
  | 'dashboard'
  | 'matters'
  | 'invoices'
  | 'reports'
  | 'practice-growth'
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

// Bar Association Enum
export enum Bar {
  JOHANNESBURG = 'Johannesburg',
  CAPE_TOWN = 'Cape Town'
}

// Matter Status Enum
export enum MatterStatus {
  ACTIVE = 'Active',
  PENDING = 'Pending',
  SETTLED = 'Settled',
  CLOSED = 'Closed'
}

// Invoice Status Enum
export enum InvoiceStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PAID = 'Paid',
  UNPAID = 'Unpaid',
  OVERDUE = 'Overdue',
  PENDING = 'Pending'
}

// Core Business Entities
export interface Matter {
  id: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  instructingAttorney: string;
  instructingAttorneyEmail?: string;
  instructingFirm?: string;
  wipValue: number;
  estimatedFee?: number;
  actualFee?: number;
  status: MatterStatus;
  dateCreated: string; // ISO 8601
  dateModified: string; // ISO 8601
  dateClosed?: string; // ISO 8601
  bar: Bar;
  briefType: string;
  description?: string;
  conflictCheckCompleted: boolean;
  conflictCheckDate?: string;
  documents?: Document[];
  timeEntries?: TimeEntry[];
  notes?: Note[];
  tags?: string[];
  riskLevel?: 'Low' | 'Medium' | 'High';
  settlementProbability?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  matterId: string;
  matterTitle: string;
  clientName: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  dateIssued: string; // ISO 8601
  dateDue: string; // ISO 8601 - calculated based on bar rules
  datePaid?: string; // ISO 8601
  status: InvoiceStatus;
  bar: Bar;
  paymentMethod?: 'EFT' | 'Cheque' | 'Cash' | 'Card';
  remindersSent: number;
  lastReminderDate?: string;
  nextReminderDate?: string;
  notes?: string;
  feeNarrative?: string;
  disbursements?: number;
  sentAt?: string;
  amountPaid?: number;
  paymentReference?: string;
}

export interface TimeEntry {
  id: string;
  matterId: string;
  date: string; // ISO 8601
  duration: number; // in minutes
  description: string;
  rate: number;
  amount: number;
  billed: boolean;
  invoiceId?: string;
  recordedBy: string;
  recordingMethod: 'Manual' | 'Voice' | 'Timer';
  createdAt: string;
  modifiedAt?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  initials: string;
  bar: Bar;
  practiceNumber: string;
  yearAdmitted: number;
  specialisations: string[];
  hourlyRate: number;
  phoneNumber?: string;
  avatar?: string;
  settings: UserSettings;
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
  bar?: Bar[];
  dateRange?: { start: string; end: string };
  search?: string;
  minWipValue?: number;
  maxWipValue?: number;
  attorney?: string;
  hasConflictCheck?: boolean;
}

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  bar?: Bar[];
  dateRange?: { start: string; end: string };
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  isOverdue?: boolean;
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
  title: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  instructingAttorney: string;
  instructingAttorneyEmail?: string;
  instructingFirm?: string;
  bar: Bar;
  briefType: string;
  estimatedFee?: number;
  description?: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface NewInvoiceForm {
  matterId: string;
  amount: number;
  vatRate: number;
  description: string;
  timeEntryIds?: string[];
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