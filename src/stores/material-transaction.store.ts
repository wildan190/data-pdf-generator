import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useBaseStore, apiClient } from './base.store'
import type { 
  MaterialTransaction,
  MaterialTransactionWithRelations, 
  CreateMaterialTransactionForm, 
  MaterialTransactionFilters,
  PaginationState 
} from '../types'

export const useMaterialTransactionStore = defineStore('materialTransaction', () => {
  // Base store functionality
  const baseStore = useBaseStore<MaterialTransaction>('materialTransaction')

  // State
  const transactions = ref<MaterialTransactionWithRelations[]>([])
  const selectedTransaction = ref<MaterialTransactionWithRelations | null>(null)
  const recentTransactions = ref<MaterialTransactionWithRelations[]>([])
  const transactionSummary = ref<{
    totalTransactions: number
    totalIncoming: number
    totalOutgoing: number
    pendingCount: number
    urgentCount: number
  } | null>(null)
  const pagination = ref<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })
  const currentFilters = ref<MaterialTransactionFilters>({})

  // Computed
  const sortedTransactions = computed(() => 
    [...transactions.value].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  )

  const incomingTransactions = computed(() => 
    transactions.value.filter(t => t.transactionType === 'masuk')
  )

  const outgoingTransactions = computed(() => 
    transactions.value.filter(t => t.transactionType === 'keluar')
  )

  const urgentTransactions = computed(() => 
    transactions.value.filter(t => t.priorityStatus === 'urgen')
  )

  const filteredTransactions = computed(() => {
    let filtered = [...transactions.value]

    if (currentFilters.value.transactionType) {
      filtered = filtered.filter(t => t.transactionType === currentFilters.value.transactionType)
    }

    if (currentFilters.value.priorityStatus) {
      filtered = filtered.filter(t => t.priorityStatus === currentFilters.value.priorityStatus)
    }

    if (currentFilters.value.divisionId) {
      filtered = filtered.filter(t => t.divisionId === currentFilters.value.divisionId)
    }

    if (currentFilters.value.assetId) {
      filtered = filtered.filter(t => t.assetId === currentFilters.value.assetId)
    }

    if (currentFilters.value.dateFrom) {
      filtered = filtered.filter(t => new Date(t.createdAt) >= currentFilters.value.dateFrom!)
    }

    if (currentFilters.value.dateTo) {
      filtered = filtered.filter(t => new Date(t.createdAt) <= currentFilters.value.dateTo!)
    }

    return filtered
  })

  const transactionsByType = computed(() => ({
    masuk: transactions.value.filter(t => t.transactionType === 'masuk'),
    keluar: transactions.value.filter(t => t.transactionType === 'keluar')
  }))

  const transactionsByPriority = computed(() => ({
    prioritas: transactions.value.filter(t => t.priorityStatus === 'prioritas'),
    urgen: transactions.value.filter(t => t.priorityStatus === 'urgen'),
    trivial: transactions.value.filter(t => t.priorityStatus === 'trivial')
  }))

  const totalTransactions = computed(() => transactions.value.length)

  // Actions
  const fetchTransactions = async (
    page = 1, 
    pageSize = 10, 
    filters?: MaterialTransactionFilters
  ) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    })

    if (filters?.transactionType) queryParams.append('transactionType', filters.transactionType)
    if (filters?.priorityStatus) queryParams.append('priorityStatus', filters.priorityStatus)
    if (filters?.divisionId) queryParams.append('divisionId', filters.divisionId.toString())
    if (filters?.assetId) queryParams.append('assetId', filters.assetId.toString())
    if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom.toISOString())
    if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo.toISOString())

    return baseStore.handleApiCall(
      'fetchTransactions',
      () => apiClient.get<MaterialTransactionWithRelations[]>(`/material-transactions?${queryParams}`),
      (data) => {
        transactions.value = data
        pagination.value.page = page
        pagination.value.pageSize = pageSize
        if (filters) currentFilters.value = filters
      }
    )
  }

  const fetchTransactionById = async (id: number) => {
    return baseStore.handleApiCall(
      'fetchTransactionById',
      () => apiClient.get<MaterialTransactionWithRelations>(`/material-transactions/${id}`),
      (data) => {
        selectedTransaction.value = data
      }
    )
  }

  const fetchRecentTransactions = async (limit = 10) => {
    return baseStore.handleApiCall(
      'fetchRecentTransactions',
      () => apiClient.get<MaterialTransactionWithRelations[]>(`/material-transactions/recent?limit=${limit}`),
      (data) => {
        recentTransactions.value = data
      }
    )
  }

  const fetchTransactionSummary = async (filters?: MaterialTransactionFilters) => {
    const queryParams = new URLSearchParams()

    if (filters?.transactionType) queryParams.append('transactionType', filters.transactionType)
    if (filters?.priorityStatus) queryParams.append('priorityStatus', filters.priorityStatus)
    if (filters?.divisionId) queryParams.append('divisionId', filters.divisionId.toString())
    if (filters?.assetId) queryParams.append('assetId', filters.assetId.toString())
    if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom.toISOString())
    if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo.toISOString())

    return baseStore.handleApiCall(
      'fetchTransactionSummary',
      () => apiClient.get(`/material-transactions/summary?${queryParams}`),
      (data) => {
        transactionSummary.value = data as any
      }
    )
  }

  const createTransaction = async (formData: CreateMaterialTransactionForm) => {
    return baseStore.handleApiCall(
      'createTransaction',
      () => apiClient.post<MaterialTransaction>('/material-transactions', formData),
      async (data) => {
        // Fetch the created transaction with relations
        await fetchTransactionById(data.transactionId)
        if (selectedTransaction.value) {
          transactions.value.unshift(selectedTransaction.value)
          pagination.value.total += 1
        }
      }
    )
  }

  const updateTransaction = async (
    id: number, 
    formData: { notes?: string; priorityStatus?: 'prioritas' | 'urgen' | 'trivial' }
  ) => {
    return baseStore.handleApiCall(
      'updateTransaction',
      () => apiClient.put<MaterialTransaction>(`/material-transactions/${id}`, formData),
      async (data) => {
        // Refresh the transaction with relations
        await fetchTransactionById(id)
        if (selectedTransaction.value) {
          const index = transactions.value.findIndex(t => t.transactionId === id)
          if (index !== -1) {
            transactions.value[index] = selectedTransaction.value
          }
        }
      }
    )
  }

  const deleteTransaction = async (id: number) => {
    return baseStore.handleApiCall(
      'deleteTransaction',
      () => apiClient.delete(`/material-transactions/${id}`),
      () => {
        transactions.value = transactions.value.filter(t => t.transactionId !== id)
        recentTransactions.value = recentTransactions.value.filter(t => t.transactionId !== id)
        if (selectedTransaction.value?.transactionId === id) {
          selectedTransaction.value = null
        }
        pagination.value.total = Math.max(0, pagination.value.total - 1)
      }
    )
  }

  const fetchTransactionsByAsset = async (assetId: number, page = 1, pageSize = 10) => {
    return baseStore.handleApiCall(
      'fetchTransactionsByAsset',
      () => apiClient.get<MaterialTransactionWithRelations[]>(`/material-transactions/by-asset/${assetId}?page=${page}&pageSize=${pageSize}`),
      () => {} // Data will be returned in the response
    )
  }

  const fetchTransactionsByDivision = async (divisionId: number, page = 1, pageSize = 10) => {
    return baseStore.handleApiCall(
      'fetchTransactionsByDivision',
      () => apiClient.get<MaterialTransactionWithRelations[]>(`/material-transactions/by-division/${divisionId}?page=${page}&pageSize=${pageSize}`),
      () => {} // Data will be returned in the response
    )
  }

  const fetchTransactionsByDateRange = async (
    dateFrom: Date, 
    dateTo: Date, 
    page = 1, 
    pageSize = 10
  ) => {
    return baseStore.handleApiCall(
      'fetchTransactionsByDateRange',
      () => apiClient.get<MaterialTransactionWithRelations[]>(
        `/material-transactions/by-date-range?from=${dateFrom.toISOString()}&to=${dateTo.toISOString()}&page=${page}&pageSize=${pageSize}`
      ),
      () => {} // Data will be returned in the response
    )
  }

  const validateTransaction = async (
    data: CreateMaterialTransactionForm
  ): Promise<{ isValid: boolean; errors: { [key: string]: string } }> => {
    const errors: { [key: string]: string } = {}

    // Asset ID validation
    if (!data.assetId) {
      errors.assetId = 'Asset is required'
    }

    // Division ID validation
    if (!data.divisionId) {
      errors.divisionId = 'Division is required'
    }

    // Quantity validation
    if (!data.quantity || data.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0'
    } else if (data.quantity > 1000000) {
      errors.quantity = 'Quantity cannot exceed 1,000,000'
    }

    // Transaction type validation
    if (!data.transactionType || !['masuk', 'keluar'].includes(data.transactionType)) {
      errors.transactionType = 'Valid transaction type is required'
    }

    // Priority status validation
    if (!data.priorityStatus || !['prioritas', 'urgen', 'trivial'].includes(data.priorityStatus)) {
      errors.priorityStatus = 'Valid priority status is required'
    }

    // Notes validation
    if (data.notes && data.notes.length > 1000) {
      errors.notes = 'Notes must be less than 1000 characters'
    }

    // For outgoing transactions, check stock availability
    if (data.transactionType === 'keluar' && data.assetId && data.quantity) {
      const stockResponse = await apiClient.get<{ available: boolean; currentStock: number; shortfall?: number }>(
        `/material-transactions/validate-stock/${data.assetId}?quantity=${data.quantity}`
      )
      
      if (stockResponse.success && stockResponse.data && !stockResponse.data.available) {
        errors.quantity = `Insufficient stock. Available: ${stockResponse.data.currentStock}, Requested: ${data.quantity}`
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  const canDeleteTransaction = async (id: number): Promise<{ canDelete: boolean; reason?: string }> => {
    const response = await apiClient.get<{ canDelete: boolean; reason?: string }>(
      `/material-transactions/${id}/can-delete`
    )
    
    if (response.success && response.data) {
      return response.data
    }

    return { canDelete: false, reason: 'Unable to check deletion status' }
  }

  const getTransactionImpact = async (id: number) => {
    return baseStore.handleApiCall(
      'getTransactionImpact',
      () => apiClient.get(`/material-transactions/${id}/impact`),
      () => {} // Data will be returned in the response
    )
  }

  const getDailyTransactionStats = async (date: Date) => {
    return baseStore.handleApiCall(
      'getDailyTransactionStats',
      () => apiClient.get(`/material-transactions/daily-stats?date=${date.toISOString()}`),
      () => {} // Data will be returned in the response
    )
  }

  // Utility methods
  const findTransactionById = (id: number): MaterialTransactionWithRelations | undefined => {
    return transactions.value.find(t => t.transactionId === id)
  }

  const setSelectedTransaction = (transaction: MaterialTransactionWithRelations | null) => {
    selectedTransaction.value = transaction
  }

  const setFilters = (filters: MaterialTransactionFilters) => {
    currentFilters.value = filters
  }

  const clearFilters = () => {
    currentFilters.value = {}
  }

  const refreshTransactions = async () => {
    await fetchTransactions(pagination.value.page, pagination.value.pageSize, currentFilters.value)
  }

  const refreshSummary = async () => {
    await fetchTransactionSummary(currentFilters.value)
  }

  const getTransactionTypeLabel = (type: 'masuk' | 'keluar'): string => {
    return type === 'masuk' ? 'Incoming' : 'Outgoing'
  }

  const getPriorityStatusLabel = (status: 'prioritas' | 'urgen' | 'trivial'): string => {
    const labels = {
      prioritas: 'High Priority',
      urgen: 'Urgent',
      trivial: 'Low Priority'
    }
    return labels[status]
  }

  const getPriorityStatusColor = (status: 'prioritas' | 'urgen' | 'trivial'): string => {
    const colors = {
      prioritas: 'red',
      urgen: 'orange',
      trivial: 'green'
    }
    return colors[status]
  }

  const resetStore = () => {
    transactions.value = []
    selectedTransaction.value = null
    recentTransactions.value = []
    transactionSummary.value = null
    currentFilters.value = {}
    pagination.value = {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0
    }
    baseStore.resetState()
  }

  // Initialize store
  const initialize = async () => {
    await Promise.all([
      fetchTransactions(),
      fetchRecentTransactions(),
      fetchTransactionSummary()
    ])
  }

  return {
    // State
    transactions: computed(() => transactions.value),
    selectedTransaction: computed(() => selectedTransaction.value),
    recentTransactions: computed(() => recentTransactions.value),
    transactionSummary: computed(() => transactionSummary.value),
    pagination: computed(() => pagination.value),
    currentFilters: computed(() => currentFilters.value),

    // Computed
    sortedTransactions,
    incomingTransactions,
    outgoingTransactions,
    urgentTransactions,
    filteredTransactions,
    transactionsByType,
    transactionsByPriority,
    totalTransactions,

    // Loading & Error states from base store
    isLoading: baseStore.isLoading,
    hasError: baseStore.hasError,
    getError: baseStore.getError,
    lastUpdated: baseStore.lastUpdated,

    // Actions
    fetchTransactions,
    fetchTransactionById,
    fetchRecentTransactions,
    fetchTransactionSummary,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchTransactionsByAsset,
    fetchTransactionsByDivision,
    fetchTransactionsByDateRange,
    validateTransaction,
    canDeleteTransaction,
    getTransactionImpact,
    getDailyTransactionStats,

    // Utility methods
    findTransactionById,
    setSelectedTransaction,
    setFilters,
    clearFilters,
    refreshTransactions,
    refreshSummary,
    getTransactionTypeLabel,
    getPriorityStatusLabel,
    getPriorityStatusColor,
    resetStore,
    initialize
  }
})