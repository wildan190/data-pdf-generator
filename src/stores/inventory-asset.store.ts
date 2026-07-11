import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useBaseStore, apiClient } from './base.store'
import type { 
  InventoryAsset, 
  InventoryAssetWithCategory, 
  InventoryAssetWithStats,
  CreateInventoryAssetForm, 
  InventoryAssetFilters,
  StockSummary,
  PaginationState 
} from '../types'

export const useInventoryAssetStore = defineStore('inventoryAsset', () => {
  // Base store functionality
  const baseStore = useBaseStore<InventoryAsset>('inventoryAsset')

  // State
  const assets = ref<InventoryAssetWithCategory[]>([])
  const assetsWithStats = ref<InventoryAssetWithStats[]>([])
  const selectedAsset = ref<InventoryAssetWithCategory | null>(null)
  const lowStockAssets = ref<InventoryAssetWithCategory[]>([])
  const zeroStockAssets = ref<InventoryAssetWithCategory[]>([])
  const mostActiveAssets = ref<InventoryAssetWithStats[]>([])
  const stockSummary = ref<StockSummary | null>(null)
  const pagination = ref<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })
  const currentFilters = ref<InventoryAssetFilters>({})

  // Computed
  const sortedAssets = computed(() => 
    [...assets.value].sort((a, b) => a.materialName.localeCompare(b.materialName))
  )

  const assetOptions = computed(() => 
    assets.value.map(asset => ({
      value: asset.assetId,
      label: asset.materialName,
      category: asset.category?.categoryName,
      currentQuantity: asset.currentQuantity,
      unitMeasure: asset.unitMeasure
    }))
  )

  const categorizedAssets = computed(() => {
    const categories: { [key: string]: InventoryAssetWithCategory[] } = {}
    assets.value.forEach(asset => {
      const categoryName = asset.category?.categoryName || 'Uncategorized'
      if (!categories[categoryName]) {
        categories[categoryName] = []
      }
      categories[categoryName].push(asset)
    })
    return categories
  })

  const filteredAssets = computed(() => {
    let filtered = [...assets.value]

    if (currentFilters.value.categoryId) {
      filtered = filtered.filter(asset => asset.categoryId === currentFilters.value.categoryId)
    }

    if (currentFilters.value.lowStock) {
      filtered = filtered.filter(asset => asset.currentQuantity <= 10 && asset.currentQuantity > 0)
    }

    if (currentFilters.value.zeroStock) {
      filtered = filtered.filter(asset => asset.currentQuantity === 0)
    }

    if (currentFilters.value.search) {
      const searchTerm = currentFilters.value.search.toLowerCase()
      filtered = filtered.filter(asset => 
        asset.materialName.toLowerCase().includes(searchTerm) ||
        asset.category?.categoryName.toLowerCase().includes(searchTerm)
      )
    }

    return filtered
  })

  const totalAssets = computed(() => assets.value.length)

  const stockAlerts = computed(() => ({
    low: lowStockAssets.value.length,
    zero: zeroStockAssets.value.length,
    total: lowStockAssets.value.length + zeroStockAssets.value.length
  }))

  // Actions
  const fetchAssets = async (page = 1, pageSize = 10, filters?: InventoryAssetFilters) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    })

    if (filters?.categoryId) queryParams.append('categoryId', filters.categoryId.toString())
    if (filters?.search) queryParams.append('search', filters.search)

    return baseStore.handleApiCall(
      'fetchAssets',
      () => apiClient.get<InventoryAssetWithCategory[]>(`/inventory-assets?${queryParams}`),
      (data) => {
        assets.value = data
        pagination.value.page = page
        pagination.value.pageSize = pageSize
        if (filters) currentFilters.value = filters
      }
    )
  }

  const fetchAssetsWithStats = async () => {
    return baseStore.handleApiCall(
      'fetchAssetsWithStats',
      () => apiClient.get<InventoryAssetWithStats[]>('/inventory-assets/with-stats'),
      (data) => {
        assetsWithStats.value = data
      }
    )
  }

  const fetchAssetById = async (id: number) => {
    return baseStore.handleApiCall(
      'fetchAssetById',
      () => apiClient.get<InventoryAssetWithCategory>(`/inventory-assets/${id}`),
      (data) => {
        selectedAsset.value = data
      }
    )
  }

  const fetchAssetWithRelations = async (id: number) => {
    return baseStore.handleApiCall(
      'fetchAssetWithRelations',
      () => apiClient.get(`/inventory-assets/${id}/relations`),
      () => {} // Data will be returned in the response
    )
  }

  const createAsset = async (formData: CreateInventoryAssetForm) => {
    return baseStore.handleApiCall(
      'createAsset',
      () => apiClient.post<InventoryAsset>('/inventory-assets', formData),
      (data) => {
        // Convert to InventoryAssetWithCategory for consistency
        const assetWithCategory: InventoryAssetWithCategory = {
          ...data,
          category: undefined // Will be populated by refresh
        }
        assets.value.push(assetWithCategory)
        pagination.value.total += 1
      }
    )
  }

  const updateAsset = async (id: number, formData: Partial<CreateInventoryAssetForm>) => {
    return baseStore.handleApiCall(
      'updateAsset',
      () => apiClient.put<InventoryAsset>(`/inventory-assets/${id}`, formData),
      (data) => {
        const index = assets.value.findIndex(a => a.assetId === id)
        if (index !== -1) {
          // Preserve category info
          const existingCategory = assets.value[index]?.category
          if (existingCategory !== undefined) {
            assets.value[index] = { ...data, category: existingCategory }
          } else {
            assets.value[index] = { ...data, category: undefined }
          }
        }
        if (selectedAsset.value?.assetId === id) {
          const existingCategory = selectedAsset.value?.category
          selectedAsset.value = { ...data, category: existingCategory }
        }
      }
    )
  }

  const deleteAsset = async (id: number) => {
    return baseStore.handleApiCall(
      'deleteAsset',
      () => apiClient.delete(`/inventory-assets/${id}`),
      () => {
        assets.value = assets.value.filter(a => a.assetId !== id)
        lowStockAssets.value = lowStockAssets.value.filter(a => a.assetId !== id)
        zeroStockAssets.value = zeroStockAssets.value.filter(a => a.assetId !== id)
        mostActiveAssets.value = mostActiveAssets.value.filter(a => a.assetId !== id)
        if (selectedAsset.value?.assetId === id) {
          selectedAsset.value = null
        }
        pagination.value.total = Math.max(0, pagination.value.total - 1)
      }
    )
  }

  const fetchLowStockAssets = async (threshold = 10) => {
    return baseStore.handleApiCall(
      'fetchLowStockAssets',
      () => apiClient.get<InventoryAssetWithCategory[]>(`/inventory-assets/low-stock?threshold=${threshold}`),
      (data) => {
        lowStockAssets.value = data
      }
    )
  }

  const fetchZeroStockAssets = async () => {
    return baseStore.handleApiCall(
      'fetchZeroStockAssets',
      () => apiClient.get<InventoryAssetWithCategory[]>('/inventory-assets/zero-stock'),
      (data) => {
        zeroStockAssets.value = data
      }
    )
  }

  const fetchMostActiveAssets = async (limit = 10) => {
    return baseStore.handleApiCall(
      'fetchMostActiveAssets',
      () => apiClient.get<InventoryAssetWithStats[]>(`/inventory-assets/most-active?limit=${limit}`),
      (data) => {
        mostActiveAssets.value = data
      }
    )
  }

  const fetchStockSummary = async () => {
    return baseStore.handleApiCall(
      'fetchStockSummary',
      () => apiClient.get<StockSummary>('/inventory-assets/stock-summary'),
      (data) => {
        stockSummary.value = data
      }
    )
  }

  const searchAssets = async (query: string) => {
    return baseStore.handleApiCall(
      'searchAssets',
      () => apiClient.get<InventoryAssetWithCategory[]>(`/inventory-assets/search?q=${encodeURIComponent(query)}`),
      (data) => {
        assets.value = data
      }
    )
  }

  const validateAsset = async (
    data: CreateInventoryAssetForm, 
    excludeId?: number
  ): Promise<{ isValid: boolean; errors: { [key: string]: string } }> => {
    const errors: { [key: string]: string } = {}

    // Material name validation
    if (!data.materialName.trim()) {
      errors.materialName = 'Material name is required'
    } else if (data.materialName.length < 3) {
      errors.materialName = 'Material name must be at least 3 characters'
    } else if (data.materialName.length > 255) {
      errors.materialName = 'Material name must be less than 255 characters'
    } else {
      // Check if name already exists
      const existing = assets.value.find(a => 
        a.materialName.toLowerCase() === data.materialName.toLowerCase() &&
        a.assetId !== excludeId
      )
      
      if (existing) {
        errors.materialName = 'Material name already exists'
      }
    }

    // Unit measure validation
    const validUnits = ['pcs', 'unit', 'batang', 'sak', 'kg', 'gram', 'liter', 'meter', 'cm', 'inch', 'box', 'carton', 'roll', 'sheet', 'set']
    if (data.unitMeasure && !validUnits.includes(data.unitMeasure)) {
      errors.unitMeasure = 'Invalid unit measure'
    }

    // Initial quantity validation
    if (data.initialQuantity !== undefined && (data.initialQuantity < 0 || data.initialQuantity > 1000000)) {
      errors.initialQuantity = 'Initial quantity must be between 0 and 1,000,000'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  const canDeleteAsset = async (id: number): Promise<{ canDelete: boolean; reason?: string }> => {
    const response = await apiClient.get<{ canDelete: boolean; reason?: string }>(`/inventory-assets/${id}/can-delete`)
    
    if (response.success && response.data) {
      return response.data
    }

    return { canDelete: false, reason: 'Unable to check deletion status' }
  }

  const getAssetHealthCheck = async (id: number) => {
    return baseStore.handleApiCall(
      'getAssetHealthCheck',
      () => apiClient.get(`/inventory-assets/${id}/health-check`),
      () => {} // Data will be returned in the response
    )
  }

  // Utility methods
  const findAssetById = (id: number): InventoryAssetWithCategory | undefined => {
    return assets.value.find(a => a.assetId === id)
  }

  const findAssetByName = (name: string): InventoryAssetWithCategory | undefined => {
    return assets.value.find(a => 
      a.materialName.toLowerCase() === name.toLowerCase()
    )
  }

  const setSelectedAsset = (asset: InventoryAssetWithCategory | null) => {
    selectedAsset.value = asset
  }

  const setFilters = (filters: InventoryAssetFilters) => {
    currentFilters.value = filters
  }

  const clearFilters = () => {
    currentFilters.value = {}
  }

  const refreshAssets = async () => {
    await fetchAssets(pagination.value.page, pagination.value.pageSize, currentFilters.value)
  }

  const refreshStockData = async () => {
    await Promise.all([
      fetchLowStockAssets(),
      fetchZeroStockAssets(),
      fetchStockSummary()
    ])
  }

  const getStockStatusColor = (quantity: number): string => {
    if (quantity === 0) return 'red'
    if (quantity <= 10) return 'yellow'
    return 'green'
  }

  const getStockStatusLabel = (quantity: number): string => {
    if (quantity === 0) return 'Out of Stock'
    if (quantity <= 5) return 'Critical'
    if (quantity <= 10) return 'Low Stock'
    return 'In Stock'
  }

  const resetStore = () => {
    assets.value = []
    selectedAsset.value = null
    lowStockAssets.value = []
    zeroStockAssets.value = []
    mostActiveAssets.value = []
    stockSummary.value = null
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
      fetchAssets(),
      fetchStockSummary(),
      fetchLowStockAssets(),
      fetchZeroStockAssets()
    ])
  }

  return {
    // State
    assets: computed(() => assets.value),
    assetsWithStats: computed(() => assetsWithStats.value),
    selectedAsset: computed(() => selectedAsset.value),
    lowStockAssets: computed(() => lowStockAssets.value),
    zeroStockAssets: computed(() => zeroStockAssets.value),
    mostActiveAssets: computed(() => mostActiveAssets.value),
    stockSummary: computed(() => stockSummary.value),
    pagination: computed(() => pagination.value),
    currentFilters: computed(() => currentFilters.value),

    // Computed
    sortedAssets,
    assetOptions,
    categorizedAssets,
    filteredAssets,
    totalAssets,
    stockAlerts,

    // Loading & Error states from base store
    isLoading: baseStore.isLoading,
    hasError: baseStore.hasError,
    getError: baseStore.getError,
    lastUpdated: baseStore.lastUpdated,

    // Actions
    fetchAssets,
    fetchAssetsWithStats,
    fetchAssetById,
    fetchAssetWithRelations,
    createAsset,
    updateAsset,
    deleteAsset,
    fetchLowStockAssets,
    fetchZeroStockAssets,
    fetchMostActiveAssets,
    fetchStockSummary,
    searchAssets,
    validateAsset,
    canDeleteAsset,
    getAssetHealthCheck,

    // Utility methods
    findAssetById,
    findAssetByName,
    setSelectedAsset,
    setFilters,
    clearFilters,
    refreshAssets,
    refreshStockData,
    getStockStatusColor,
    getStockStatusLabel,
    resetStore,
    initialize
  }
})