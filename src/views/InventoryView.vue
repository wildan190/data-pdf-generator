<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center space-x-3">
          <h1 class="text-2xl font-bold text-gray-900">Inventory Assets</h1>
          <TooltipGuide
            title="Inventory Management"
            content="Track all your inventory items, stock levels, and asset information."
            :steps="[
              'Use filters to find specific items quickly',
              'Red indicators show critical stock levels',
              'Use Quick Add for new inventory assets',
              'Monitor quantity changes and alerts'
            ]"
            position="bottom-right"
          />
        </div>
        <p class="text-gray-600">Manage inventory assets and stock levels</p>
      </div>
      
      <div class="flex items-center justify-end">
        <BaseButton
          variant="secondary"
          :loading="isLoading"
          @click="refreshData"
          class="w-full sm:w-auto"
        >
          <i class="fas fa-sync-alt mr-2"></i>
          Refresh
        </BaseButton>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
      <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Assets</p>
            <p class="text-2xl font-bold text-blue-600">{{ inventoryStore.assets.length }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-boxes text-blue-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Low Stock</p>
            <p class="text-2xl font-bold text-yellow-600">{{ lowStockCount }}</p>
          </div>
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-exclamation-triangle text-yellow-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Out of Stock</p>
            <p class="text-2xl font-bold text-red-600">{{ outOfStockCount }}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-times-circle text-red-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Value</p>
            <p class="text-2xl font-bold text-green-600">{{ totalValue }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-dollar-sign text-green-600"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <BaseInput
          v-model="searchTerm"
          placeholder="Search assets..."
          size="sm"
        >
          <template #prefix>
            <i class="fas fa-search text-gray-400"></i>
          </template>
        </BaseInput>

        <BaseSelect
          v-model="filters.categoryId"
          :options="categoryOptions"
          placeholder="All categories"
          size="sm"
          clearable
        />

        <BaseSelect
          v-model="stockFilter"
          :options="stockFilterOptions"
          placeholder="Stock status"
          size="sm"
          clearable
        />

        <BaseInput
          v-model="filters.minQuantity"
          type="number"
          placeholder="Min quantity"
          size="sm"
        />

        <BaseInput
          v-model="filters.maxQuantity"
          type="number"
          placeholder="Max quantity"
          size="sm"
        />
      </div>
    </div>

    <!-- Inventory Assets Table -->
    <div class="bg-white rounded-lg shadow border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">
            Inventory Assets 
            <span class="text-sm font-normal text-gray-500">
              ({{ filteredAssets.length }} of {{ inventoryStore.assets.length }})
            </span>
          </h3>
          
          <div class="flex items-center space-x-3">
            <BaseButton
              variant="secondary"
              size="sm"
              @click="exportAssets"
            >
              <i class="fas fa-download mr-2"></i>
              Export
            </BaseButton>
          </div>
        </div>
      </div>

      <BaseTable
        :columns="tableColumns"
        :data="paginatedAssets"
        :loading="isLoading"
        :pagination="pagination"
        @page-change="handlePageChange"
        @sort="handleSort"
      >
        <!-- Custom cell for material name -->
        <template #cell-materialName="{ item }">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-box text-blue-600 text-sm"></i>
            </div>
            <div>
              <div class="font-medium text-gray-900">{{ item.materialName }}</div>
              <div class="text-sm text-gray-500">ID: {{ item.assetId }}</div>
            </div>
          </div>
        </template>

        <!-- Custom cell for category -->
        <template #cell-category="{ item }">
          <span v-if="item.category" class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
            {{ item.category.categoryName }}
          </span>
          <span v-else class="text-gray-400 text-sm">Uncategorized</span>
        </template>

        <!-- Custom cell for current quantity -->
        <template #cell-currentQuantity="{ item }">
          <div class="flex items-center space-x-2">
            <span :class="[
              'font-medium',
              getQuantityColor(item.currentQuantity)
            ]">
              {{ item.currentQuantity }}
            </span>
            <span class="text-sm text-gray-500">{{ item.unitMeasure }}</span>
          </div>
        </template>

        <!-- Custom cell for stock status -->
        <template #cell-stockStatus="{ item }">
          <span :class="[
            'px-2 py-1 text-xs rounded-full',
            getStockStatusClass(item.currentQuantity)
          ]">
            {{ getStockStatus(item.currentQuantity) }}
          </span>
        </template>

        <!-- Custom cell for transaction count -->
        <template #cell-transactionCount="{ item }">
          <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {{ item.transactionCount || 0 }} transactions
          </span>
        </template>

        <!-- Custom cell for last updated -->
        <template #cell-lastUpdatedAt="{ item }">
          {{ formatDate(item.lastUpdatedAt) }}
        </template>

        <!-- Custom cell for actions -->
        <template #cell-actions="{ item }">
          <div class="flex items-center space-x-2">
            <button
              @click="viewAssetDetails(item)"
              class="text-gray-600 hover:text-gray-800 p-1"
              title="View Details"
            >
              <i class="fas fa-eye"></i>
            </button>
            
            <button
              @click="editAsset(item)"
              class="text-blue-600 hover:text-blue-800 p-1"
              title="Edit Asset"
            >
              <i class="fas fa-edit"></i>
            </button>
            
            <button
              @click="deleteAsset(item)"
              class="text-red-600 hover:text-red-800 p-1"
              title="Delete Asset"
              :disabled="(item.transactionCount || 0) > 0"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </template>
      </BaseTable>
    </div>

    <!-- Create/Edit Modal -->
    <BaseModal
      :show="showCreateModal || showEditModal"
      :title="showEditModal ? 'Edit Asset' : 'Add New Asset'"
      size="lg"
      @close="handleModalClose"
      @confirm="handleSubmit"
      :confirm-loading="isSubmitting"
      :confirm-disabled="!isFormValid"
    >
      <InventoryAssetForm
        v-model="formData"
        :errors="formErrors"
        @validate="handleFormValidation"
        @cancel="handleModalClose"
      />
    </BaseModal>

    <!-- Asset Details Modal -->
    <BaseModal
      :show="showDetailsModal"
      title="Asset Details"
      size="lg"
      @close="showDetailsModal = false"
      :show-confirm="false"
    >
      <div v-if="selectedAsset" class="space-y-6">
        <!-- Basic Information -->
        <div>
          <h4 class="font-medium text-gray-900 mb-3">Basic Information</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-600">Asset ID</label>
              <p class="text-gray-900">{{ selectedAsset.assetId }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Material Name</label>
              <p class="text-gray-900">{{ selectedAsset.materialName }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Category</label>
              <p class="text-gray-900">{{ selectedAsset.category?.categoryName || 'Uncategorized' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Unit Measure</label>
              <p class="text-gray-900">{{ selectedAsset.unitMeasure }}</p>
            </div>
          </div>
        </div>

        <!-- Stock Information -->
        <div>
          <h4 class="font-medium text-gray-900 mb-3">Stock Information</h4>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-600">Current Quantity</label>
              <p :class="['text-2xl font-bold', getQuantityColor(selectedAsset.currentQuantity)]">
                {{ selectedAsset.currentQuantity }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Stock Status</label>
              <p>
                <span :class="[
                  'px-2 py-1 text-xs rounded-full',
                  getStockStatusClass(selectedAsset.currentQuantity)
                ]">
                  {{ getStockStatus(selectedAsset.currentQuantity) }}
                </span>
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Last Updated</label>
              <p class="text-gray-900">{{ formatDate(selectedAsset.lastUpdatedAt) }}</p>
            </div>
          </div>
        </div>

        <!-- Transaction Summary -->
        <div>
          <h4 class="font-medium text-gray-900 mb-3">Transaction Summary</h4>
          <div class="text-sm text-gray-600">
            <p>Total Transactions: {{ selectedAsset.transactionCount || 0 }}</p>
          </div>
        </div>
      </div>
    </BaseModal>

    <!-- Delete Confirmation Modal -->
    <BaseModal
      :show="showDeleteModal"
      title="Confirm Deletion"
      variant="danger"
      @close="showDeleteModal = false"
      @confirm="confirmDelete"
      :confirm-loading="isDeleting"
      confirm-text="Delete"
    >
      <div class="space-y-4">
        <p class="text-gray-600">
          Are you sure you want to delete the asset "<strong>{{ assetToDelete?.materialName }}</strong>"?
        </p>
        
        <div v-if="(assetToDelete?.transactionCount || 0) > 0" class="bg-red-50 border border-red-200 rounded-lg p-3">
          <div class="flex items-start space-x-2">
            <i class="fas fa-exclamation-triangle text-red-500 mt-0.5"></i>
            <div class="text-red-700 text-sm">
              <p class="font-medium">Cannot delete this asset</p>
              <p>This asset has {{ assetToDelete?.transactionCount }} associated transactions. Please resolve these transactions first.</p>
            </div>
          </div>
        </div>
        
        <p v-else class="text-red-600 text-sm">
          <i class="fas fa-warning mr-1"></i>
          This action cannot be undone.
        </p>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseTable from '@/components/ui/BaseTable.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import TooltipGuide from '@/components/ui/TooltipGuide.vue'
import InventoryAssetForm from '@/components/forms/InventoryAssetForm.vue'
import { useInventoryAssetStore } from '@/stores/inventory-asset.store'
import { useMaterialTypeStore } from '@/stores/material-type.store'
import { useNotificationStore } from '@/stores/notification.store'
import type { 
  InventoryAssetWithCategory,
  InventoryAssetWithStats,
  CreateInventoryAssetForm,
  FormErrors,
  PaginationState,
  SortState,
  InventoryAssetFilters
} from '@/types'

// Stores
const inventoryStore = useInventoryAssetStore()
const materialTypeStore = useMaterialTypeStore()
const notificationStore = useNotificationStore()

// Reactive state
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const searchTerm = ref('')
const stockFilter = ref('')

// Modal state
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailsModal = ref(false)
const showDeleteModal = ref(false)

// Form state
const formData = ref<CreateInventoryAssetForm>({
  materialName: '',
  unitMeasure: 'pcs',
  initialQuantity: 0
})
const formErrors = ref<FormErrors>({})
const isFormValid = ref(false)
const editingAsset = ref<InventoryAssetWithCategory | null>(null)
const selectedAsset = ref<InventoryAssetWithStats | null>(null)
const assetToDelete = ref<InventoryAssetWithStats | null>(null)

// Filter state
const filters = ref<InventoryAssetFilters & { minQuantity?: number | string; maxQuantity?: number | string }>({})

// Table state
const pagination = ref<PaginationState>({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0
})

const sortState = ref<SortState>({
  field: 'materialName',
  direction: 'asc'
})

// Computed
const filteredAssets = computed(() => {
  let assets = inventoryStore.assetsWithStats

  // Apply search filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    assets = assets.filter(asset =>
      asset.materialName.toLowerCase().includes(term) ||
      asset.category?.categoryName.toLowerCase().includes(term)
    )
  }

  // Apply category filter
  if (filters.value.categoryId) {
    assets = assets.filter(asset => asset.categoryId === filters.value.categoryId)
  }

  // Apply stock filter
  if (stockFilter.value === 'low') {
    assets = assets.filter(asset => asset.currentQuantity > 0 && asset.currentQuantity <= 10)
  } else if (stockFilter.value === 'out') {
    assets = assets.filter(asset => asset.currentQuantity === 0)
  } else if (stockFilter.value === 'in-stock') {
    assets = assets.filter(asset => asset.currentQuantity > 0)
  }

  // Apply quantity range filters
  if (filters.value.minQuantity !== undefined && filters.value.minQuantity !== '') {
    assets = assets.filter(asset => asset.currentQuantity >= Number(filters.value.minQuantity))
  }
  if (filters.value.maxQuantity !== undefined && filters.value.maxQuantity !== '') {
    assets = assets.filter(asset => asset.currentQuantity <= Number(filters.value.maxQuantity))
  }

  // Apply sorting
  assets.sort((a, b) => {
    const aVal = a[sortState.value.field as keyof typeof a] ?? ''
    const bVal = b[sortState.value.field as keyof typeof b] ?? ''
    
    if (aVal < bVal) return sortState.value.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortState.value.direction === 'asc' ? 1 : -1
    return 0
  })

  return assets
})

const paginatedAssets = computed(() => {
  // Update pagination
  pagination.value.total = filteredAssets.value.length
  pagination.value.totalPages = Math.ceil(filteredAssets.value.length / pagination.value.pageSize)

  // Apply pagination
  const start = (pagination.value.page - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  
  return filteredAssets.value.slice(start, end)
})

const lowStockCount = computed(() =>
  inventoryStore.assetsWithStats.filter(asset => 
    asset.currentQuantity > 0 && asset.currentQuantity <= 10
  ).length
)

const outOfStockCount = computed(() =>
  inventoryStore.assetsWithStats.filter(asset => asset.currentQuantity === 0).length
)

const totalValue = computed(() => {
  // This would normally calculate based on unit prices, but we don't have that data
  return inventoryStore.assetsWithStats.reduce((sum, asset) => sum + asset.currentQuantity, 0) + ' units'
})

const categoryOptions = computed(() =>
  materialTypeStore.materialTypes.map(type => ({
    value: type.categoryId,
    label: type.categoryName
  }))
)

const stockFilterOptions = computed(() => [
  { value: 'in-stock', label: 'In Stock' },
  { value: 'low', label: 'Low Stock (≤10)' },
  { value: 'out', label: 'Out of Stock' }
])

const tableColumns = computed(() => [
  { key: 'materialName', label: 'Material', sortable: true },
  { key: 'category', label: 'Category' },
  { key: 'currentQuantity', label: 'Quantity', sortable: true },
  { key: 'stockStatus', label: 'Status' },
  { key: 'transactionCount', label: 'Transactions', sortable: true },
  { key: 'lastUpdatedAt', label: 'Last Updated', sortable: true },
  { key: 'actions', label: 'Actions', width: '150px' }
])

// Watch for filter changes
watch([searchTerm, filters, stockFilter], () => {
  pagination.value.page = 1
}, { deep: true })

// Methods
const refreshData = async () => {
  isLoading.value = true
  try {
    await Promise.all([
      inventoryStore.fetchAssetsWithStats(),
      materialTypeStore.fetchMaterialTypes()
    ])
  } catch (error) {
    notificationStore.addNotification({
      type: 'error',
      title: 'Failed to refresh data',
      message: 'Could not load inventory assets. Please try again.'
    })
  } finally {
    isLoading.value = false
  }
}

const viewAssetDetails = (asset: InventoryAssetWithStats) => {
  selectedAsset.value = asset
  showDetailsModal.value = true
}

const editAsset = (asset: InventoryAssetWithCategory) => {
  editingAsset.value = asset
  formData.value = {
    materialName: asset.materialName,
    categoryId: asset.categoryId,
    unitMeasure: asset.unitMeasure,
    initialQuantity: asset.currentQuantity
  }
  formErrors.value = {}
  showEditModal.value = true
}

const deleteAsset = (asset: InventoryAssetWithStats) => {
  assetToDelete.value = asset
  showDeleteModal.value = true
}

const handleModalClose = () => {
  showCreateModal.value = false
  showEditModal.value = false
  resetForm()
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  isSubmitting.value = true
  try {
    if (showEditModal.value && editingAsset.value) {
      // Update existing asset
      await inventoryStore.updateAsset(editingAsset.value.assetId, formData.value)
      notificationStore.addNotification({
        type: 'success',
        title: 'Asset Updated',
        message: `Asset "${formData.value.materialName}" has been updated successfully.`
      })
    } else {
      // Create new asset
      await inventoryStore.createAsset(formData.value)
      notificationStore.addNotification({
        type: 'success',
        title: 'Asset Created',
        message: `Asset "${formData.value.materialName}" has been created successfully.`
      })
    }

    handleModalClose()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Operation failed'
    notificationStore.addNotification({
      type: 'error',
      title: showEditModal.value ? 'Update Failed' : 'Creation Failed',
      message: errorMessage
    })
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = async () => {
  if (!assetToDelete.value) return

  // Prevent deletion if asset has transactions
  if ((assetToDelete.value.transactionCount || 0) > 0) {
    notificationStore.addNotification({
      type: 'warning',
      title: 'Cannot Delete Asset',
      message: 'This asset has associated transactions and cannot be deleted.'
    })
    return
  }

  isDeleting.value = true
  try {
    await inventoryStore.deleteAsset(assetToDelete.value.assetId)
    notificationStore.addNotification({
      type: 'success',
      title: 'Asset Deleted',
      message: `Asset "${assetToDelete.value.materialName}" has been deleted successfully.`
    })
    showDeleteModal.value = false
    assetToDelete.value = null
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Deletion failed'
    notificationStore.addNotification({
      type: 'error',
      title: 'Deletion Failed',
      message: errorMessage
    })
  } finally {
    isDeleting.value = false
  }
}

const exportAssets = () => {
  // This would typically open an export dialog or directly export
  notificationStore.addNotification({
    type: 'info',
    title: 'Export Feature',
    message: 'Asset export feature will be implemented soon.'
  })
}

const handleFormValidation = (isValid: boolean, errors: FormErrors) => {
  isFormValid.value = isValid
  formErrors.value = errors
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
}

const handleSort = (field: string) => {
  if (sortState.value.field === field) {
    sortState.value.direction = sortState.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    sortState.value.field = field
    sortState.value.direction = 'asc'
  }
}

const resetForm = () => {
  formData.value = {
    materialName: '',
    unitMeasure: 'pcs',
    initialQuantity: 0
  }
  formErrors.value = {}
  isFormValid.value = false
  editingAsset.value = null
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getQuantityColor = (quantity: number) => {
  if (quantity === 0) return 'text-red-600'
  if (quantity <= 10) return 'text-yellow-600'
  return 'text-green-600'
}

const getStockStatus = (quantity: number) => {
  if (quantity === 0) return 'Out of Stock'
  if (quantity <= 10) return 'Low Stock'
  return 'In Stock'
}

const getStockStatusClass = (quantity: number) => {
  if (quantity === 0) return 'bg-red-100 text-red-800'
  if (quantity <= 10) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

// Initialize
onMounted(async () => {
  await refreshData()
})
</script>