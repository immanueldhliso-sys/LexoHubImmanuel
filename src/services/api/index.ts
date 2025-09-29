/**
 * API Services Index
 * Centralized exports for all API services
 */

// Base service and utilities
export { 
  BaseApiService, 
  ApiErrorHandler, 
  RetryHandler,
  ErrorType,
  type ApiError,
  type ApiResponse,
  type PaginationOptions,
  type FilterOptions,
  type SortOptions
} from './base-api.service';

// Entity-specific services
export { 
  MatterApiService, 
  matterApiService,
  type MatterFilters,
  type MatterStats,
  type MatterSearchOptions
} from './matter-api.service';

export { 
  InvoiceApiService, 
  invoiceApiService,
  type InvoiceFilters,
  type InvoiceStats,
  type InvoiceGenerationOptions
} from './invoice-api.service';

export {
  userPreferencesService,
  type UserPreferencesUpdate
} from './user-preferences.service';

export {
  academyService,
  type AcademyCourse,
  type AcademyEvent
} from './academy.service';

// Re-export commonly used types from the main types file
export type {
  Matter,
  Invoice,
  TimeEntry,
  User,
  MatterStatus,
  InvoiceStatus,
  NewMatterForm,
  NewInvoiceForm
} from '../../types';