/**
 * Base API Service
 * Provides common CRUD operations and error handling for all API services
 * Follows LEXO Constitution principles for consistency and robustness
 */

import { supabase } from '../../lib/supabase';
import type { PostgrestError, PostgrestResponse } from '@supabase/supabase-js';

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ApiError {
  type: ErrorType;
  message: string;
  details?: Record<string, unknown>;
  code?: string;
  timestamp: Date;
  requestId: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  count?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface FilterOptions {
  [key: string]: unknown;
}

export interface SortOptions {
  column: string;
  ascending?: boolean;
}

/**
 * Base API Service Class
 * Provides common database operations with consistent error handling
 */
export abstract class BaseApiService<T = unknown> {
  protected tableName: string;
  protected selectFields: string;

  constructor(tableName: string, selectFields: string = '*') {
    this.tableName = tableName;
    this.selectFields = selectFields;
  }

  /**
   * Generate unique request ID for error tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Transform Supabase error to standardized API error
   */
  protected transformError(error: PostgrestError | Error, requestId: string): ApiError {
    const timestamp = new Date();

    // Handle Supabase PostgrestError
    if ('code' in error && 'details' in error) {
      const postgrestError = error as PostgrestError;
      
      let errorType: ErrorType;
      let message: string;

      switch (postgrestError.code) {
        case 'PGRST116': // No rows found
          errorType = ErrorType.NOT_FOUND_ERROR;
          message = 'Resource not found';
          break;
        case 'PGRST301': // JWT expired
        case 'PGRST302': // JWT invalid
          errorType = ErrorType.AUTHENTICATION_ERROR;
          message = 'Authentication failed';
          break;
        case 'PGRST001': // Permission denied
          errorType = ErrorType.AUTHORIZATION_ERROR;
          message = 'Access denied';
          break;
        case '23505': // Unique violation
          errorType = ErrorType.CONFLICT_ERROR;
          message = 'Resource already exists';
          break;
        case '23503': // Foreign key violation
        case '23502': // Not null violation
        case '23514': // Check violation
          errorType = ErrorType.VALIDATION_ERROR;
          message = 'Invalid data provided';
          break;
        default:
          errorType = ErrorType.DATABASE_ERROR;
          message = postgrestError.message || 'Database operation failed';
      }

      return {
        type: errorType,
        message,
        details: {
          code: postgrestError.code,
          details: postgrestError.details,
          hint: postgrestError.hint
        },
        code: postgrestError.code,
        timestamp,
        requestId
      };
    }

    // Handle network errors
    if (error.message?.includes('fetch')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network connection failed',
        details: { originalMessage: error.message },
        timestamp,
        requestId
      };
    }

    // Handle generic errors
    return {
      type: ErrorType.UNKNOWN_ERROR,
      message: error.message || 'An unexpected error occurred',
      details: { originalError: error },
      timestamp,
      requestId
    };
  }

  /**
   * Execute database operation with error handling
   */
  protected async executeQuery<R>(
    operation: () => Promise<PostgrestResponse<R>>
  ): Promise<ApiResponse<R>> {
    const requestId = this.generateRequestId();

    try {
      const response = await operation();

      if (response.error) {
        return {
          data: null,
          error: this.transformError(response.error, requestId)
        };
      }

      return {
        data: response.data,
        error: null,
        count: response.count || undefined
      };
    } catch (error) {
      return {
        data: null,
        error: this.transformError(error as Error, requestId)
      };
    }
  }

  /**
   * Get all records with optional filtering, sorting, and pagination
   */
  async getAll(
    options: {
      filters?: FilterOptions;
      sort?: SortOptions;
      pagination?: PaginationOptions;
    } = {}
  ): Promise<ApiResponse<T[]>> {
    const { filters, sort, pagination } = options;

    return this.executeQuery(async () => {
      let query = supabase
        .from(this.tableName)
        .select(this.selectFields, { count: 'exact' });

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (typeof value === 'string' && value.includes('*')) {
              query = query.like(key, value.replace(/\*/g, '%'));
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      // Apply sorting
      if (sort) {
        query = query.order(sort.column, { ascending: sort.ascending ?? true });
      }

      // Apply pagination
      if (pagination) {
        const { page, limit, offset } = pagination;
        if (offset !== undefined) {
          query = query.range(offset, offset + (limit || 10) - 1);
        } else if (page !== undefined && limit !== undefined) {
          const start = (page - 1) * limit;
          query = query.range(start, start + limit - 1);
        }
      }

      return query;
    });
  }

  /**
   * Get single record by ID
   */
  async getById(id: string): Promise<ApiResponse<T>> {
    return this.executeQuery(async () => {
      return supabase
        .from(this.tableName)
        .select(this.selectFields)
        .eq('id', id)
        .single();
    });
  }

  /**
   * Create new record
   */
  async create(data: Partial<T>): Promise<ApiResponse<T>> {
    return this.executeQuery(async () => {
      return supabase
        .from(this.tableName)
        .insert(data)
        .select(this.selectFields)
        .single();
    });
  }

  /**
   * Update existing record
   */
  async update(id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    return this.executeQuery(async () => {
      return supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select(this.selectFields)
        .single();
    });
  }

  /**
   * Delete record (soft delete if deleted_at column exists)
   */
  async delete(id: string, soft: boolean = true): Promise<ApiResponse<void>> {
    return this.executeQuery(async () => {
      if (soft) {
        // Attempt soft delete first
        const softDeleteResponse = await supabase
          .from(this.tableName)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);

        // If soft delete fails (no deleted_at column), do hard delete
        if (softDeleteResponse.error?.code === '42703') {
          return supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);
        }

        return softDeleteResponse;
      } else {
        return supabase
          .from(this.tableName)
          .delete()
          .eq('id', id);
      }
    });
  }

  /**
   * Count records with optional filters
   */
  async count(filters?: FilterOptions): Promise<ApiResponse<number>> {
    return this.executeQuery(async () => {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      return query;
    }).then(response => ({
      data: response.count || 0,
      error: response.error,
      count: response.count
    }));
  }

  /**
   * Check if record exists
   */
  async exists(id: string): Promise<ApiResponse<boolean>> {
    const response = await this.count({ id });
    
    if (response.error) {
      return { data: null, error: response.error };
    }

    return { data: (response.data || 0) > 0, error: null };
  }

  /**
   * Batch create multiple records
   */
  async createMany(data: Partial<T>[]): Promise<ApiResponse<T[]>> {
    return this.executeQuery(async () => {
      return supabase
        .from(this.tableName)
        .insert(data)
        .select(this.selectFields);
    });
  }

  /**
   * Batch update multiple records
   */
  async updateMany(
    updates: { id: string; data: Partial<T> }[]
  ): Promise<ApiResponse<T[]>> {
    const requestId = this.generateRequestId();

    try {
      const results: T[] = [];
      const errors: ApiError[] = [];

      // Execute updates in parallel
      const promises = updates.map(async ({ id, data }) => {
        const response = await this.update(id, data);
        if (response.error) {
          errors.push(response.error);
        } else if (response.data) {
          results.push(response.data);
        }
      });

      await Promise.all(promises);

      if (errors.length > 0) {
        return {
          data: null,
          error: {
            type: ErrorType.DATABASE_ERROR,
            message: `${errors.length} updates failed`,
            details: { errors },
            timestamp: new Date(),
            requestId
          }
        };
      }

      return { data: results, error: null };
    } catch (error) {
      return {
        data: null,
        error: this.transformError(error as Error, requestId)
      };
    }
  }

  /**
   * Search records using full-text search (if supported)
   */
  async search(
    query: string,
    columns: string[],
    options: {
      filters?: FilterOptions;
      pagination?: PaginationOptions;
    } = {}
  ): Promise<ApiResponse<T[]>> {
    const { filters, pagination } = options;

    return this.executeQuery(async () => {
      let dbQuery = supabase
        .from(this.tableName)
        .select(this.selectFields, { count: 'exact' });

      // Apply text search across multiple columns
      if (query.trim()) {
        const searchConditions = columns
          .map(col => `${col}.ilike.%${query}%`)
          .join(',');
        dbQuery = dbQuery.or(searchConditions);
      }

      // Apply additional filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            dbQuery = dbQuery.eq(key, value);
          }
        });
      }

      // Apply pagination
      if (pagination) {
        const { page, limit } = pagination;
        if (page !== undefined && limit !== undefined) {
          const start = (page - 1) * limit;
          dbQuery = dbQuery.range(start, start + limit - 1);
        }
      }

      return dbQuery;
    });
  }
}

/**
 * Error handling utilities
 */
export class ApiErrorHandler {
  /**
   * Check if error is of specific type
   */
  static isErrorType(error: ApiError | null, type: ErrorType): boolean {
    return error?.type === type;
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: ApiError): string {
    switch (error.type) {
      case ErrorType.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case ErrorType.AUTHENTICATION_ERROR:
        return 'Please sign in to continue.';
      case ErrorType.AUTHORIZATION_ERROR:
        return 'You don\'t have permission to perform this action.';
      case ErrorType.NOT_FOUND_ERROR:
        return 'The requested resource was not found.';
      case ErrorType.CONFLICT_ERROR:
        return 'This resource already exists or conflicts with existing data.';
      case ErrorType.NETWORK_ERROR:
        return 'Please check your internet connection and try again.';
      case ErrorType.DATABASE_ERROR:
        return 'A database error occurred. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Log error for debugging (in development)
   */
  static logError(error: ApiError, context?: string): void {
    if (import.meta.env.DEV) {
      console.group(`🚨 API Error ${context ? `(${context})` : ''}`);
      console.error('Type:', error.type);
      console.error('Message:', error.message);
      console.error('Request ID:', error.requestId);
      console.error('Timestamp:', error.timestamp);
      if (error.details) {
        console.error('Details:', error.details);
      }
      console.groupEnd();
    }
  }
}

/**
 * Retry utility for transient failures
 */
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<ApiResponse<T>>,
    options: {
      maxAttempts?: number;
      delay?: number;
      backoffMultiplier?: number;
      retryableErrors?: ErrorType[];
    } = {}
  ): Promise<ApiResponse<T>> {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoffMultiplier = 2,
      retryableErrors = [ErrorType.NETWORK_ERROR, ErrorType.DATABASE_ERROR]
    } = options;

    let lastError: ApiError | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await operation();

      if (!response.error) {
        return response;
      }

      lastError = response.error;

      // Don't retry if error is not retryable
      if (!retryableErrors.includes(response.error.type)) {
        break;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Wait before retry with exponential backoff
      const waitTime = delay * Math.pow(backoffMultiplier, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    return { data: null, error: lastError };
  }
}