import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// Base types for store operations
export interface LoadingState {
  [key: string]: boolean
}

export interface ErrorState {
  [key: string]: string | null
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: PaginationState
}

// Base store composable for common functionality
export function useBaseStore<T>(storeName: string) {
  const loading = ref<LoadingState>({})
  const errors = ref<ErrorState>({})
  const lastUpdated = ref<Date | null>(null)

  // Loading state management
  const setLoading = (operation: string, isLoading: boolean) => {
    loading.value[operation] = isLoading
  }

  const isLoading = computed(() => (operation?: string) => {
    if (operation) {
      return loading.value[operation] || false
    }
    return Object.values(loading.value).some(Boolean)
  })

  // Error state management
  const setError = (operation: string, error: string | null) => {
    errors.value[operation] = error
  }

  const clearError = (operation?: string) => {
    if (operation) {
      errors.value[operation] = null
    } else {
      Object.keys(errors.value).forEach(key => {
        errors.value[key] = null
      })
    }
  }

  const hasError = computed(() => (operation?: string) => {
    if (operation) {
      return !!errors.value[operation]
    }
    return Object.values(errors.value).some(Boolean)
  })

  const getError = computed(() => (operation?: string) => {
    if (operation) {
      return errors.value[operation]
    }
    return Object.values(errors.value).find(Boolean) || null
  })

  // Generic API call handler
  const handleApiCall = async <R>(
    operation: string,
    apiCall: () => Promise<ApiResponse<R>>,
    onSuccess?: (data: R) => void,
    onError?: (error: string) => void
  ): Promise<ApiResponse<R>> => {
    setLoading(operation, true)
    clearError(operation)

    try {
      const response = await apiCall()
      
      if (response.success && response.data) {
        lastUpdated.value = new Date()
        onSuccess?.(response.data)
      } else {
        const errorMessage = response.error || 'Operation failed'
        setError(operation, errorMessage)
        onError?.(errorMessage)
      }

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(operation, errorMessage)
      onError?.(errorMessage)
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setLoading(operation, false)
    }
  }

  // Pagination helpers
  const createPaginationState = (): PaginationState => ({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })

  const updatePagination = (pagination: PaginationState, newPagination?: Partial<PaginationState>) => {
    if (newPagination) {
      Object.assign(pagination, newPagination)
    }
  }

  // Reset state
  const resetState = () => {
    loading.value = {}
    errors.value = {}
    lastUpdated.value = null
  }

  return {
    // State
    loading: loading.value,
    errors: errors.value,
    lastUpdated,

    // Computed
    isLoading,
    hasError,
    getError,

    // Actions
    setLoading,
    setError,
    clearError,
    handleApiCall,
    createPaginationState,
    updatePagination,
    resetState
  }
}

// API Client utilities (will be replaced with actual HTTP client)
export class ApiClient {
  private baseUrl = 'http://localhost:3001/api'

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()