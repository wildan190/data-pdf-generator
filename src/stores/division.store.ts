import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useBaseStore, apiClient, type ApiResponse } from './base.store'
import type { 
  Division, 
  DivisionWithStats, 
  CreateDivisionForm, 
  PaginationState 
} from '../types'

export const useDivisionStore = defineStore('division', () => {
  // Base store functionality
  const baseStore = useBaseStore<Division>('division')

  // State
  const divisions = ref<Division[]>([])
  const divisionsWithStats = ref<DivisionWithStats[]>([])
  const selectedDivision = ref<Division | null>(null)
  const pagination = ref<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })

  // Computed
  const sortedDivisions = computed(() => 
    [...divisions.value].sort((a, b) => a.divisionName.localeCompare(b.divisionName))
  )

  const divisionOptions = computed(() => 
    divisions.value.map(division => ({
      value: division.divisionId,
      label: division.divisionName
    }))
  )

  const totalDivisions = computed(() => divisions.value.length)

  // Actions
  const fetchDivisions = async (page = 1, pageSize = 10) => {
    return baseStore.handleApiCall(
      'fetchDivisions',
      () => apiClient.get<Division[]>(`/divisions?page=${page}&pageSize=${pageSize}`),
      (data) => {
        divisions.value = data
        pagination.value.page = page
        pagination.value.pageSize = pageSize
      }
    )
  }

  const fetchDivisionsWithStats = async () => {
    return baseStore.handleApiCall(
      'fetchDivisionsWithStats',
      () => apiClient.get<DivisionWithStats[]>('/divisions/stats'),
      (data) => {
        divisionsWithStats.value = data
      }
    )
  }

  const fetchDivisionById = async (id: number) => {
    return baseStore.handleApiCall(
      'fetchDivisionById',
      () => apiClient.get<Division>(`/divisions/${id}`),
      (data) => {
        selectedDivision.value = data
      }
    )
  }

  const createDivision = async (formData: CreateDivisionForm) => {
    return baseStore.handleApiCall(
      'createDivision',
      () => apiClient.post<Division>('/divisions', formData),
      (data) => {
        divisions.value.push(data)
        // Also add to divisionsWithStats with 0 transactions
        divisionsWithStats.value.push({
          ...data,
          transactionCount: 0
        })
        pagination.value.total += 1
      }
    )
  }

  const updateDivision = async (id: number, formData: Partial<CreateDivisionForm>) => {
    return baseStore.handleApiCall(
      'updateDivision',
      () => apiClient.put<Division>(`/divisions/${id}`, formData),
      (data) => {
        const index = divisions.value.findIndex(d => d.divisionId === id)
        if (index !== -1) {
          divisions.value[index] = data
        }
        
        // Also update in divisionsWithStats
        const statsIndex = divisionsWithStats.value.findIndex(d => d.divisionId === id)
        if (statsIndex !== -1) {
          divisionsWithStats.value[statsIndex] = {
            ...divisionsWithStats.value[statsIndex],
            ...data
          }
        }
        
        if (selectedDivision.value?.divisionId === id) {
          selectedDivision.value = data
        }
      }
    )
  }

  const deleteDivision = async (id: number) => {
    return baseStore.handleApiCall(
      'deleteDivision',
      () => apiClient.delete(`/divisions/${id}`),
      () => {
        divisions.value = divisions.value.filter(d => d.divisionId !== id)
        divisionsWithStats.value = divisionsWithStats.value.filter(d => d.divisionId !== id)
        if (selectedDivision.value?.divisionId === id) {
          selectedDivision.value = null
        }
        pagination.value.total = Math.max(0, pagination.value.total - 1)
      }
    )
  }

  const searchDivisions = async (query: string) => {
    return baseStore.handleApiCall(
      'searchDivisions',
      () => apiClient.get<Division[]>(`/divisions/search?q=${encodeURIComponent(query)}`),
      (data) => {
        divisions.value = data
      }
    )
  }

  const validateDivisionName = async (name: string): Promise<{ isValid: boolean; message?: string }> => {
    if (!name.trim()) {
      return { isValid: false, message: 'Division name is required' }
    }

    if (name.length < 2) {
      return { isValid: false, message: 'Division name must be at least 2 characters' }
    }

    if (name.length > 100) {
      return { isValid: false, message: 'Division name must be less than 100 characters' }
    }

    // Check if name already exists
    const existing = divisions.value.find(d => 
      d.divisionName.toLowerCase() === name.toLowerCase()
    )
    
    if (existing) {
      return { isValid: false, message: 'Division name already exists' }
    }

    return { isValid: true }
  }

  const canDeleteDivision = async (id: number): Promise<{ canDelete: boolean; reason?: string }> => {
    const response = await apiClient.get<{ canDelete: boolean; reason?: string }>(`/divisions/${id}/can-delete`)
    
    if (response.success && response.data) {
      return response.data
    }

    return { canDelete: false, reason: 'Unable to check deletion status' }
  }

  const getDivisionUsageReport = async (id: number) => {
    return baseStore.handleApiCall(
      'getDivisionUsageReport',
      () => apiClient.get(`/divisions/${id}/usage-report`),
      () => {} // Data will be returned in the response
    )
  }

  // Utility methods
  const findDivisionById = (id: number): Division | undefined => {
    return divisions.value.find(d => d.divisionId === id)
  }

  const findDivisionByName = (name: string): Division | undefined => {
    return divisions.value.find(d => 
      d.divisionName.toLowerCase() === name.toLowerCase()
    )
  }

  const setSelectedDivision = (division: Division | null) => {
    selectedDivision.value = division
  }

  const refreshDivisions = async () => {
    await fetchDivisions(pagination.value.page, pagination.value.pageSize)
  }

  const resetStore = () => {
    divisions.value = []
    divisionsWithStats.value = []
    selectedDivision.value = null
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
    await fetchDivisions()
  }

  return {
    // State
    divisions: computed(() => divisions.value),
    divisionsWithStats: computed(() => divisionsWithStats.value),
    selectedDivision: computed(() => selectedDivision.value),
    pagination: computed(() => pagination.value),

    // Computed
    sortedDivisions,
    divisionOptions,
    totalDivisions,

    // Loading & Error states from base store
    isLoading: baseStore.isLoading,
    hasError: baseStore.hasError,
    getError: baseStore.getError,
    lastUpdated: baseStore.lastUpdated,

    // Actions
    fetchDivisions,
    fetchDivisionsWithStats,
    fetchDivisionById,
    createDivision,
    updateDivision,
    deleteDivision,
    searchDivisions,
    validateDivisionName,
    canDeleteDivision,
    getDivisionUsageReport,

    // Utility methods
    findDivisionById,
    findDivisionByName,
    setSelectedDivision,
    refreshDivisions,
    resetStore,
    initialize
  }
})