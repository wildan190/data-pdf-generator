import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useBaseStore, apiClient } from './base.store'
import type { 
  MaterialType, 
  MaterialTypeWithStats, 
  CreateMaterialTypeForm, 
  PaginationState 
} from '../types'

export const useMaterialTypeStore = defineStore('materialType', () => {
  // Base store functionality
  const baseStore = useBaseStore<MaterialType>('materialType')

  // State
  const materialTypes = ref<MaterialType[]>([])
  const materialTypesWithStats = ref<MaterialTypeWithStats[]>([])
  const selectedMaterialType = ref<MaterialType | null>(null)
  const pagination = ref<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })

  // Computed
  const sortedMaterialTypes = computed(() => 
    [...materialTypes.value].sort((a, b) => a.categoryName.localeCompare(b.categoryName))
  )

  const materialTypeOptions = computed(() => 
    materialTypes.value.map(type => ({
      value: type.categoryId,
      label: type.categoryName,
      description: type.description
    }))
  )

  const totalMaterialTypes = computed(() => materialTypes.value.length)

  const categorizedMaterialTypes = computed(() => {
    const categories: { [key: string]: MaterialType[] } = {}
    materialTypes.value.forEach(type => {
      const firstLetter = type.categoryName.charAt(0).toUpperCase()
      if (!categories[firstLetter]) {
        categories[firstLetter] = []
      }
      categories[firstLetter].push(type)
    })
    return categories
  })

  // Actions
  const fetchMaterialTypes = async (page = 1, pageSize = 10) => {
    return baseStore.handleApiCall(
      'fetchMaterialTypes',
      () => apiClient.get<MaterialType[]>(`/material-types?page=${page}&pageSize=${pageSize}`),
      (data) => {
        materialTypes.value = data
        pagination.value.page = page
        pagination.value.pageSize = pageSize
      }
    )
  }

  const fetchMaterialTypesWithStats = async () => {
    return baseStore.handleApiCall(
      'fetchMaterialTypesWithStats',
      () => apiClient.get<MaterialTypeWithStats[]>('/material-types/stats'),
      (data) => {
        materialTypesWithStats.value = data
      }
    )
  }

  const fetchMaterialTypeById = async (id: number) => {
    return baseStore.handleApiCall(
      'fetchMaterialTypeById',
      () => apiClient.get<MaterialType>(`/material-types/${id}`),
      (data) => {
        selectedMaterialType.value = data
      }
    )
  }

  const createMaterialType = async (formData: CreateMaterialTypeForm) => {
    return baseStore.handleApiCall(
      'createMaterialType',
      () => apiClient.post<MaterialType>('/material-types', formData),
      (data) => {
        materialTypes.value.push(data)
        // Also add to materialTypesWithStats with 0 assets
        materialTypesWithStats.value.push({
          ...data,
          assetCount: 0,
          totalStockQuantity: 0
        })
        pagination.value.total += 1
      }
    )
  }

  const updateMaterialType = async (id: number, formData: Partial<CreateMaterialTypeForm>) => {
    return baseStore.handleApiCall(
      'updateMaterialType',
      () => apiClient.put<MaterialType>(`/material-types/${id}`, formData),
      (data) => {
        const index = materialTypes.value.findIndex(mt => mt.categoryId === id)
        if (index !== -1) {
          materialTypes.value[index] = data
        }
        
        // Also update in materialTypesWithStats
        const statsIndex = materialTypesWithStats.value.findIndex(mt => mt.categoryId === id)
        if (statsIndex !== -1) {
          const currentStats = materialTypesWithStats.value[statsIndex]
          if (currentStats) {
            materialTypesWithStats.value[statsIndex] = {
              ...currentStats,
              ...data,
              assetCount: currentStats.assetCount,
              totalStockQuantity: currentStats.totalStockQuantity
            }
          }
        }
        
        if (selectedMaterialType.value?.categoryId === id) {
          selectedMaterialType.value = data
        }
      }
    )
  }

  const deleteMaterialType = async (id: number) => {
    return baseStore.handleApiCall(
      'deleteMaterialType',
      () => apiClient.delete(`/material-types/${id}`),
      () => {
        materialTypes.value = materialTypes.value.filter(mt => mt.categoryId !== id)
        materialTypesWithStats.value = materialTypesWithStats.value.filter(mt => mt.categoryId !== id)
        if (selectedMaterialType.value?.categoryId === id) {
          selectedMaterialType.value = null
        }
        pagination.value.total = Math.max(0, pagination.value.total - 1)
      }
    )
  }

  const searchMaterialTypes = async (query: string) => {
    return baseStore.handleApiCall(
      'searchMaterialTypes',
      () => apiClient.get<MaterialType[]>(`/material-types/search?q=${encodeURIComponent(query)}`),
      (data) => {
        materialTypes.value = data
      }
    )
  }

  const getMostUsedTypes = async (limit = 10) => {
    return baseStore.handleApiCall(
      'getMostUsedTypes',
      () => apiClient.get(`/material-types/most-used?limit=${limit}`),
      () => {} // Data will be returned in the response
    )
  }

  const validateMaterialType = async (
    data: CreateMaterialTypeForm, 
    excludeId?: number
  ): Promise<{ isValid: boolean; errors: { [key: string]: string } }> => {
    const errors: { [key: string]: string } = {}

    // Category name validation
    if (!data.categoryName.trim()) {
      errors.categoryName = 'Category name is required'
    } else if (data.categoryName.length < 2) {
      errors.categoryName = 'Category name must be at least 2 characters'
    } else if (data.categoryName.length > 100) {
      errors.categoryName = 'Category name must be less than 100 characters'
    } else {
      // Check if name already exists
      const existing = materialTypes.value.find(mt => 
        mt.categoryName.toLowerCase() === data.categoryName.toLowerCase() &&
        mt.categoryId !== excludeId
      )
      
      if (existing) {
        errors.categoryName = 'Category name already exists'
      }
    }

    // Description validation
    if (data.description && data.description.length > 500) {
      errors.description = 'Description must be less than 500 characters'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  const canDeleteMaterialType = async (id: number): Promise<{ canDelete: boolean; reason?: string }> => {
    const response = await apiClient.get<{ canDelete: boolean; reason?: string }>(`/material-types/${id}/can-delete`)
    
    if (response.success && response.data) {
      return response.data
    }

    return { canDelete: false, reason: 'Unable to check deletion status' }
  }

  const getMaterialTypeReport = async (id: number) => {
    return baseStore.handleApiCall(
      'getMaterialTypeReport',
      () => apiClient.get(`/material-types/${id}/report`),
      () => {} // Data will be returned in the response
    )
  }

  // Utility methods
  const findMaterialTypeById = (id: number): MaterialType | undefined => {
    return materialTypes.value.find(mt => mt.categoryId === id)
  }

  const findMaterialTypeByName = (name: string): MaterialType | undefined => {
    return materialTypes.value.find(mt => 
      mt.categoryName.toLowerCase() === name.toLowerCase()
    )
  }

  const setSelectedMaterialType = (materialType: MaterialType | null) => {
    selectedMaterialType.value = materialType
  }

  const refreshMaterialTypes = async () => {
    await fetchMaterialTypes(pagination.value.page, pagination.value.pageSize)
  }

  const getStatsForMaterialType = (id: number): MaterialTypeWithStats | undefined => {
    return materialTypesWithStats.value.find(mt => mt.categoryId === id)
  }

  const resetStore = () => {
    materialTypes.value = []
    materialTypesWithStats.value = []
    selectedMaterialType.value = null
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
    await fetchMaterialTypes()
  }

  return {
    // State
    materialTypes: computed(() => materialTypes.value),
    materialTypesWithStats: computed(() => materialTypesWithStats.value),
    selectedMaterialType: computed(() => selectedMaterialType.value),
    pagination: computed(() => pagination.value),

    // Computed
    sortedMaterialTypes,
    materialTypeOptions,
    totalMaterialTypes,
    categorizedMaterialTypes,

    // Loading & Error states from base store
    isLoading: baseStore.isLoading,
    hasError: baseStore.hasError,
    getError: baseStore.getError,
    lastUpdated: baseStore.lastUpdated,

    // Actions
    fetchMaterialTypes,
    fetchMaterialTypesWithStats,
    fetchMaterialTypeById,
    createMaterialType,
    updateMaterialType,
    deleteMaterialType,
    searchMaterialTypes,
    getMostUsedTypes,
    validateMaterialType,
    canDeleteMaterialType,
    getMaterialTypeReport,

    // Utility methods
    findMaterialTypeById,
    findMaterialTypeByName,
    setSelectedMaterialType,
    refreshMaterialTypes,
    getStatsForMaterialType,
    resetStore,
    initialize
  }
})