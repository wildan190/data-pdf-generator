import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useBaseStore, apiClient } from './base.store'
import type { 
  ReportAlatMasuk,
  ReportAlatKeluar,
  ReportInvestment,
  MaterialTransactionFilters,
  ExportOptions,
  PaginationState 
} from '../types'

export const useReportStore = defineStore('report', () => {
  // Base store functionality
  const baseStore = useBaseStore('report')

  // State
  const incomingReport = ref<ReportAlatMasuk[]>([])
  const outgoingReport = ref<ReportAlatKeluar[]>([])
  const investmentReport = ref<ReportInvestment[]>([])
  const comprehensiveReport = ref<any>(null)
  const monthlyReport = ref<any>(null)
  const stockMovementReport = ref<any>(null)
  
  const reportPagination = ref<PaginationState>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0
  })
  const currentFilters = ref<MaterialTransactionFilters>({})
  const lastGeneratedReport = ref<{
    type: string
    timestamp: Date
    filters?: MaterialTransactionFilters
  } | null>(null)

  // Computed
  const totalIncomingRecords = computed(() => incomingReport.value.length)
  const totalOutgoingRecords = computed(() => outgoingReport.value.length)
  const totalInvestmentRecords = computed(() => investmentReport.value.length)

  const incomingByStatus = computed(() => {
    const grouped = incomingReport.value.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return grouped
  })

  const outgoingByStatus = computed(() => {
    const grouped = outgoingReport.value.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return grouped
  })

  const investmentSummary = computed(() => {
    return investmentReport.value.reduce((acc, item) => {
      acc.totalIncoming += item.totalAlatMasuk
      acc.totalOutgoing += item.totalAlatKeluar
      acc.totalStock += item.netInvestmentStok
      acc.zeroStockItems += item.netInvestmentStok === 0 ? 1 : 0
      return acc
    }, {
      totalIncoming: 0,
      totalOutgoing: 0,
      totalStock: 0,
      zeroStockItems: 0
    })
  })

  // Actions
  const generateIncomingReport = async (
    filters?: MaterialTransactionFilters,
    pagination?: PaginationState
  ) => {
    return baseStore.handleApiCall(
      'generateIncomingReport',
      () => {
        const queryParams = new URLSearchParams()
        if (pagination?.page) queryParams.append('page', pagination.page.toString())
        if (pagination?.pageSize) queryParams.append('pageSize', pagination.pageSize.toString())
        
        if (filters?.priorityStatus) queryParams.append('priorityStatus', filters.priorityStatus)
        if (filters?.divisionId) queryParams.append('divisionId', filters.divisionId.toString())
        if (filters?.assetId) queryParams.append('assetId', filters.assetId.toString())
        if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom.toISOString())
        if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo.toISOString())

        return apiClient.get<ReportAlatMasuk[]>(`/reports/incoming?${queryParams}`)
      },
      (data) => {
        incomingReport.value = data
        if (filters) currentFilters.value = filters
        if (pagination) reportPagination.value = pagination
        lastGeneratedReport.value = {
          type: 'incoming',
          timestamp: new Date(),
          filters
        }
      }
    )
  }

  const generateOutgoingReport = async (
    filters?: MaterialTransactionFilters,
    pagination?: PaginationState
  ) => {
    return baseStore.handleApiCall(
      'generateOutgoingReport',
      () => {
        const queryParams = new URLSearchParams()
        if (pagination?.page) queryParams.append('page', pagination.page.toString())
        if (pagination?.pageSize) queryParams.append('pageSize', pagination.pageSize.toString())
        
        if (filters?.priorityStatus) queryParams.append('priorityStatus', filters.priorityStatus)
        if (filters?.divisionId) queryParams.append('divisionId', filters.divisionId.toString())
        if (filters?.assetId) queryParams.append('assetId', filters.assetId.toString())
        if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom.toISOString())
        if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo.toISOString())

        return apiClient.get<ReportAlatKeluar[]>(`/reports/outgoing?${queryParams}`)
      },
      (data) => {
        outgoingReport.value = data
        if (filters) currentFilters.value = filters
        if (pagination) reportPagination.value = pagination
        lastGeneratedReport.value = {
          type: 'outgoing',
          timestamp: new Date(),
          filters
        }
      }
    )
  }

  const generateInvestmentReport = async (pagination?: PaginationState) => {
    return baseStore.handleApiCall(
      'generateInvestmentReport',
      () => {
        const queryParams = new URLSearchParams()
        if (pagination?.page) queryParams.append('page', pagination.page.toString())
        if (pagination?.pageSize) queryParams.append('pageSize', pagination.pageSize.toString())

        return apiClient.get<ReportInvestment[]>(`/reports/investment?${queryParams}`)
      },
      (data) => {
        investmentReport.value = data
        if (pagination) reportPagination.value = pagination
        lastGeneratedReport.value = {
          type: 'investment',
          timestamp: new Date()
        }
      }
    )
  }

  const generateComprehensiveReport = async (
    filters?: MaterialTransactionFilters & {
      includeIncoming?: boolean
      includeOutgoing?: boolean
      includeInvestment?: boolean
    }
  ) => {
    return baseStore.handleApiCall(
      'generateComprehensiveReport',
      () => apiClient.post('/reports/comprehensive', filters),
      (data) => {
        comprehensiveReport.value = data
        lastGeneratedReport.value = {
          type: 'comprehensive',
          timestamp: new Date(),
          filters
        }
      }
    )
  }

  const generateMonthlyReport = async (year: number, month: number) => {
    return baseStore.handleApiCall(
      'generateMonthlyReport',
      () => apiClient.get(`/reports/monthly/${year}/${month}`),
      (data) => {
        monthlyReport.value = data
        lastGeneratedReport.value = {
          type: 'monthly',
          timestamp: new Date()
        }
      }
    )
  }

  const generateStockMovementReport = async (assetId: number, days = 30) => {
    return baseStore.handleApiCall(
      'generateStockMovementReport',
      () => apiClient.get(`/reports/stock-movement/${assetId}?days=${days}`),
      (data) => {
        stockMovementReport.value = data
        lastGeneratedReport.value = {
          type: 'stock-movement',
          timestamp: new Date()
        }
      }
    )
  }

  const exportReport = async (
    reportType: 'incoming' | 'outgoing' | 'investment',
    options: ExportOptions
  ) => {
    return baseStore.handleApiCall(
      'exportReport',
      () => {
        const exportData = {
          reportType,
          format: options.format,
          filename: options.filename,
          filters: options.filters || currentFilters.value,
          includeHeaders: options.includeHeaders ?? true,
          dateRange: options.dateRange
        }

        return apiClient.post(`/reports/export`, exportData, {
          responseType: 'blob' // For file download
        } as any)
      },
      () => {} // Handle file download in the response
    )
  }

  const getReportForExport = async (
    reportType: 'incoming' | 'outgoing' | 'investment',
    filters?: MaterialTransactionFilters
  ) => {
    return baseStore.handleApiCall(
      'getReportForExport',
      () => apiClient.get(`/reports/${reportType}/export-data?${new URLSearchParams(filters as any)}`),
      () => {} // Data will be returned in the response
    )
  }

  // Utility methods
  const setFilters = (filters: MaterialTransactionFilters) => {
    currentFilters.value = filters
  }

  const clearFilters = () => {
    currentFilters.value = {}
  }

  const refreshCurrentReport = async () => {
    if (!lastGeneratedReport.value) return

    const { type, filters } = lastGeneratedReport.value

    switch (type) {
      case 'incoming':
        await generateIncomingReport(filters, reportPagination.value)
        break
      case 'outgoing':
        await generateOutgoingReport(filters, reportPagination.value)
        break
      case 'investment':
        await generateInvestmentReport(reportPagination.value)
        break
      case 'comprehensive':
        await generateComprehensiveReport(filters)
        break
    }
  }

  const validateDateRange = (dateFrom?: Date, dateTo?: Date): { isValid: boolean; error?: string } => {
    if (!dateFrom && !dateTo) {
      return { isValid: true }
    }

    if (dateFrom && !dateTo) {
      return { isValid: false, error: 'End date is required when start date is provided' }
    }

    if (!dateFrom && dateTo) {
      return { isValid: false, error: 'Start date is required when end date is provided' }
    }

    if (dateFrom && dateTo && dateFrom >= dateTo) {
      return { isValid: false, error: 'Start date must be before end date' }
    }

    // Check if date range is not too large (max 2 years)
    if (dateFrom && dateTo) {
      const diffTime = Math.abs(dateTo.getTime() - dateFrom.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays > 730) { // 2 years
        return { isValid: false, error: 'Date range cannot exceed 2 years' }
      }
    }

    return { isValid: true }
  }

  const formatReportFilters = (filters: MaterialTransactionFilters): string => {
    const filterTexts: string[] = []

    if (filters.transactionType) {
      filterTexts.push(`Type: ${filters.transactionType === 'masuk' ? 'Incoming' : 'Outgoing'}`)
    }

    if (filters.priorityStatus) {
      const statusLabels = {
        prioritas: 'High Priority',
        urgen: 'Urgent',
        trivial: 'Low Priority'
      }
      filterTexts.push(`Priority: ${statusLabels[filters.priorityStatus]}`)
    }

    if (filters.dateFrom || filters.dateTo) {
      let dateText = 'Date: '
      if (filters.dateFrom && filters.dateTo) {
        dateText += `${filters.dateFrom.toLocaleDateString()} - ${filters.dateTo.toLocaleDateString()}`
      } else if (filters.dateFrom) {
        dateText += `From ${filters.dateFrom.toLocaleDateString()}`
      } else if (filters.dateTo) {
        dateText += `Until ${filters.dateTo.toLocaleDateString()}`
      }
      filterTexts.push(dateText)
    }

    return filterTexts.join(', ') || 'No filters applied'
  }

  const resetStore = () => {
    incomingReport.value = []
    outgoingReport.value = []
    investmentReport.value = []
    comprehensiveReport.value = null
    monthlyReport.value = null
    stockMovementReport.value = null
    lastGeneratedReport.value = null
    currentFilters.value = {}
    reportPagination.value = {
      page: 1,
      pageSize: 50,
      total: 0,
      totalPages: 0
    }
    baseStore.resetState()
  }

  return {
    // State
    incomingReport: computed(() => incomingReport.value),
    outgoingReport: computed(() => outgoingReport.value),
    investmentReport: computed(() => investmentReport.value),
    comprehensiveReport: computed(() => comprehensiveReport.value),
    monthlyReport: computed(() => monthlyReport.value),
    stockMovementReport: computed(() => stockMovementReport.value),
    reportPagination: computed(() => reportPagination.value),
    currentFilters: computed(() => currentFilters.value),
    lastGeneratedReport: computed(() => lastGeneratedReport.value),

    // Computed
    totalIncomingRecords,
    totalOutgoingRecords,
    totalInvestmentRecords,
    incomingByStatus,
    outgoingByStatus,
    investmentSummary,

    // Loading & Error states from base store
    isLoading: baseStore.isLoading,
    hasError: baseStore.hasError,
    getError: baseStore.getError,
    lastUpdated: baseStore.lastUpdated,

    // Actions
    generateIncomingReport,
    generateOutgoingReport,
    generateInvestmentReport,
    generateComprehensiveReport,
    generateMonthlyReport,
    generateStockMovementReport,
    exportReport,
    getReportForExport,

    // Utility methods
    setFilters,
    clearFilters,
    refreshCurrentReport,
    validateDateRange,
    formatReportFilters,
    resetStore
  }
})