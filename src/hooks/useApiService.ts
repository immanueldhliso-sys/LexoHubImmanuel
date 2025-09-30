/**
 * API Service Hook
 * Provides React hooks for API operations with loading states and error handling
 * Follows LEXO Constitution principles for consistent state management
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  type ApiResponse, 
  type ApiError, 
  ApiErrorHandler,
  RetryHandler,
  ErrorType 
} from '../services/api';

export interface UseApiServiceState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export interface UseApiServiceOptions {
  immediate?: boolean;
  showErrorToast?: boolean;
  retryOnError?: boolean;
  retryOptions?: {
    maxAttempts?: number;
    delay?: number;
  };
}

/**
 * Generic hook for API operations
 */
export function useApiService<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiServiceOptions = {}
): UseApiServiceState<T> {
  const {
    immediate = true,
    showErrorToast = true,
    retryOnError = false,
    retryOptions = {}
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const executeCall = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let response: ApiResponse<T>;

      if (retryOnError) {
        response = await RetryHandler.withRetry(apiCall, retryOptions);
      } else {
        response = await apiCall();
      }

      if (response.error) {
        setError(response.error);
        
        if (showErrorToast) {
          const userMessage = ApiErrorHandler.getUserMessage(response.error);
          toast.error(userMessage);
        }

        // Log error in development
        ApiErrorHandler.logError(response.error, 'useApiService');
      } else {
        setData(response.data);
        setError(null);
      }
    } catch (err) {
      const apiError: ApiError = {
        type: ErrorType.UNKNOWN_ERROR,
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        timestamp: new Date(),
        requestId: `hook_${Date.now()}`
      };

      setError(apiError);
      
      if (showErrorToast) {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, retryOnError, retryOptions, showErrorToast]);

  useEffect(() => {
    if (immediate) {
      executeCall();
    }
  }, [immediate, executeCall]);

  return {
    data,
    loading,
    error,
    refetch: executeCall
  };
}

/**
 * Hook for API mutations (create, update, delete operations)
 */
export function useApiMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options: {
    onSuccess?: (data: TData) => void;
    onError?: (error: ApiError) => void;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
  } = {}
) {
  const {
    onSuccess,
    onError,
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operation completed successfully'
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = useCallback(async (variables: TVariables) => {
    setLoading(true);
    setError(null);

    try {
      const response = await mutationFn(variables);

      if (response.error) {
        setError(response.error);
        
        if (showErrorToast) {
          const userMessage = ApiErrorHandler.getUserMessage(response.error);
          toast.error(userMessage);
        }

        if (onError) {
          onError(response.error);
        }

        ApiErrorHandler.logError(response.error, 'useApiMutation');
        
        return { success: false, data: null, error: response.error };
      } else {
        setError(null);
        
        if (showSuccessToast) {
          toast.success(successMessage);
        }

        if (onSuccess && response.data) {
          onSuccess(response.data);
        }

        return { success: true, data: response.data, error: null };
      }
    } catch (err) {
      const apiError: ApiError = {
        type: ErrorType.UNKNOWN_ERROR,
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        timestamp: new Date(),
        requestId: `mutation_${Date.now()}`
      };

      setError(apiError);
      
      if (showErrorToast) {
        toast.error('An unexpected error occurred');
      }

      if (onError) {
        onError(apiError);
      }

      return { success: false, data: null, error: apiError };
    } finally {
      setLoading(false);
    }
  }, [mutationFn, onSuccess, onError, showSuccessToast, showErrorToast, successMessage]);

  return {
    mutate,
    loading,
    error,
    reset: () => setError(null)
  };
}

/**
 * Hook for paginated API calls
 */
export function usePaginatedApiService<T>(
  apiCall: (page: number, limit: number) => Promise<ApiResponse<T[]>>,
  options: {
    initialPage?: number;
    pageSize?: number;
    immediate?: boolean;
  } = {}
) {
  const { initialPage = 1, pageSize = 10, immediate = true } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | undefined>();

  const loadPage = useCallback(async (pageNumber: number, append: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall(pageNumber, pageSize);

      if (response.error) {
        setError(response.error);
        ApiErrorHandler.logError(response.error, 'usePaginatedApiService');
      } else {
        const newData = response.data || [];
        
        if (append) {
          setData(prev => [...prev, ...newData]);
        } else {
          setData(newData);
        }

        setHasMore(newData.length === pageSize);
        setTotalCount(response.count);
        setPage(pageNumber);
      }
    } catch (err) {
      const apiError: ApiError = {
        type: ErrorType.UNKNOWN_ERROR,
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        timestamp: new Date(),
        requestId: `paginated_${Date.now()}`
      };

      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [apiCall, pageSize]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadPage(page + 1, true);
    }
  }, [loading, hasMore, page, loadPage]);

  const refresh = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    loadPage(initialPage, false);
  }, [initialPage, loadPage]);

  useEffect(() => {
    if (immediate) {
      loadPage(initialPage, false);
    }
  }, [immediate, initialPage, loadPage]);

  return {
    data,
    loading,
    error,
    page,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    goToPage: (pageNumber: number) => loadPage(pageNumber, false)
  };
}

/**
 * Hook for optimistic updates
 */
export function useOptimisticUpdate<T>(
  initialData: T[],
  keyField: keyof T = 'id' as keyof T
) {
  const [data, setData] = useState<T[]>(initialData);

  const optimisticAdd = useCallback((item: T) => {
    setData(prev => [item, ...prev]);
  }, []);

  const optimisticUpdate = useCallback((id: T[keyof T], updates: Partial<T>) => {
    setData(prev => prev.map(item => 
      item[keyField] === id ? { ...item, ...updates } : item
    ));
  }, [keyField]);

  const optimisticRemove = useCallback((id: T[keyof T]) => {
    setData(prev => prev.filter(item => item[keyField] !== id));
  }, [keyField]);

  const revert = useCallback(() => {
    setData(initialData);
  }, [initialData]);

  const sync = useCallback((newData: T[]) => {
    setData(newData);
  }, []);

  return {
    data,
    optimisticAdd,
    optimisticUpdate,
    optimisticRemove,
    revert,
    sync
  };
}

/**
 * Hook for debounced API calls (useful for search)
 */
export function useDebouncedApiService<T>(
  apiCall: (query: string) => Promise<ApiResponse<T>>,
  delay: number = 300,
  options: UseApiServiceOptions = {}
) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  // Use the debounced query for API calls
  const apiServiceState = useApiService(
    () => apiCall(debouncedQuery),
    {
      ...options,
      immediate: false
    }
  );

  // Trigger API call when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      apiServiceState.refetch();
    }
  }, [debouncedQuery, apiServiceState.refetch]);

  return {
    ...apiServiceState,
    query,
    setQuery,
    debouncedQuery
  };
}