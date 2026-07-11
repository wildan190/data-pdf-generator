<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Material Types</h1>
        <p class="text-gray-600">Manage material categories and types</p>
      </div>
      
      <div class="flex items-center space-x-3">
        <BaseButton
          variant="secondary"
          :loading="isLoading"
          @click="refreshData"
        >
          <i class="fas fa-sync-alt mr-2"></i>
          Refresh
        </BaseButton>
        
        <BaseButton
          variant="primary"
          @click="showCreateModal = true"
        >
          <i class="fas fa-plus mr-2"></i>
          Add Material Type
        </BaseButton>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Categories</p>
            <p class="text-2xl font-bold text-blue-600">{{ materialTypeStore.materialTypes.length }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-tags text-blue-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Assets</p>
            <p class="text-2xl font-bold text-green-600">{{ totalAssets }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-boxes text-green-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Most Used</p>
            <p class="text-lg font-bold text-purple-600">{{ mostUsedCategory }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-crown text-purple-600"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Material Types Table -->
    <div class="bg-white rounded-lg shadow border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">All Material Types</h3>
          
          <div class="flex items-center space-x-3">
            <BaseInput
              v-model="searchTerm"
              placeholder="Search material types..."
              size="sm"
              class="w-64"
            >
              <template #prefix>
                <i class="fas fa-search text-gray-400"></i>
              </template>
            </BaseInput>
          </div>
        </div>
      </div>

      <BaseTable
        :columns="tableColumns"
        :data="filteredMaterialTypes"
        :loading="isLoading"
        :pagination="pagination"
        @page-change="handlePageChange"
        @sort="handleSort"
      >
        <!-- Custom cell for actions -->
        <template #cell-actions="{ item }">
          <div class="flex items-center space-x-2">
            <button
              @click="editMaterialType(item)"
              class="text-blue-600 hover:text-blue-800 p-1"
              title="Edit Material Type"
            >
              <i class="fas fa-edit"></i>
            </button>
            
            <button
              @click="deleteMaterialType(item)"
              class="text-red-600 hover:text-red-800 p-1"
              title="Delete Material Type"
              :disabled="item.assetCount > 0"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </template>

        <!-- Custom cell for asset count -->
        <template #cell-assetCount="{ item }">
          <span :class="[
            'px-2 py-1 text-xs rounded-full',
            item.assetCount > 0
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          ]">
            {{ item.assetCount }} assets
          </span>
        </template>

        <!-- Custom cell for total stock -->
        <template #cell-totalStockQuantity="{ item }">
          <span class="font-medium">{{ item.totalStockQuantity || 0 }} units</span>
        </template>

        <!-- Custom cell for description -->
        <template #cell-description="{ item }">
          <span class="text-gray-600" :title="item.description">
            {{ item.description ? truncateText(item.description, 50) : 'No description' }}
          </span>
        </template>

        <!-- Custom cell for created date -->
        <template #cell-createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
      </BaseTable>
    </div>

    <!-- Create/Edit Modal -->
    <BaseModal
      :show="showCreateModal || showEditModal"
      :title="showEditModal ? 'Edit Material Type' : 'Add New Material Type'"
      @close="handleModalClose"
      @confirm="handleSubmit"
      :confirm-loading="isSubmitting"
      :confirm-disabled="!isFormValid"
    >
      <MaterialTypeForm
        v-model="formData"
        :errors="formErrors"
        @validate="handleFormValidation"
      />
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
          Are you sure you want to delete the material type "<strong>{{ materialTypeToDelete?.categoryName }}</strong>"?
        </p>
        
        <div v-if="materialTypeToDelete?.assetCount > 0" class="bg-red-50 border border-red-200 rounded-lg p-3">
          <div class="flex items-start space-x-2">
            <i class="fas fa-exclamation-triangle text-red-500 mt-0.5"></i>
            <div class="text-red-700 text-sm">
              <p class="font-medium">Cannot delete this material type</p>
              <p>This material type has {{ materialTypeToDelete.assetCount }} associated assets. Please reassign or delete these assets first.</p>
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
import BaseTable from '@/components/ui/BaseTable.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import MaterialTypeForm from '@/components/forms/MaterialTypeForm.vue'
import { useMaterialTypeStore } from '@/stores/material-type.store'
import { useNotificationStore } from '@/stores/notification.store'
import type { 
  MaterialType,
  MaterialTypeWithStats,
  CreateMaterialTypeForm,
  FormErrors,
  PaginationState,
  SortState 
} from '@/types'

// Stores
const materialTypeStore = useMaterialTypeStore()
const notificationStore = useNotificationStore()

// Reactive state
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const searchTerm = ref('')

// Modal state
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)

// Form state
const formData = ref<CreateMaterialTypeForm>({ categoryName: '', description: '' })
const formErrors = ref<FormErrors>({})
const isFormValid = ref(false)
const editingMaterialType = ref<MaterialType | null>(null)
const materialTypeToDelete = ref<MaterialTypeWithStats | null>(null)

// Table state
const pagination = ref<PaginationState>({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0
})

const sortState = ref<SortState>({
  field: 'categoryName',
  direction: 'asc'
})

// Computed
const filteredMaterialTypes = computed(() => {
  let materialTypes = materialTypeStore.materialTypesWithStats

  // Apply search filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    materialTypes = materialTypes.filter(materialType =>
      materialType.categoryName.toLowerCase().includes(term) ||
      materialType.description?.toLowerCase().includes(term)
    )
  }

  // Apply sorting
  materialTypes.sort((a, b) => {
    const aVal = a[sortState.value.field as keyof typeof a]
    const bVal = b[sortState.value.field as keyof typeof b]
    
    if (aVal < bVal) return sortState.value.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortState.value.direction === 'asc' ? 1 : -1
    return 0
  })

  // Update pagination
  pagination.value.total = materialTypes.length
  pagination.value.totalPages = Math.ceil(materialTypes.length / pagination.value.pageSize)

  // Apply pagination
  const start = (pagination.value.page - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  
  return materialTypes.slice(start, end)
})

const totalAssets = computed(() =>
  materialTypeStore.materialTypesWithStats.reduce((sum, materialType) => sum + materialType.assetCount, 0)
)

const mostUsedCategory = computed(() => {
  const materialTypes = materialTypeStore.materialTypesWithStats
  if (materialTypes.length === 0) return 'N/A'
  
  const mostUsed = materialTypes.reduce((prev, current) => 
    current.assetCount > prev.assetCount ? current : prev
  )
  
  return mostUsed.assetCount > 0 ? mostUsed.categoryName : 'No usage'
})

const tableColumns = computed(() => [
  { key: 'categoryName', label: 'Category Name', sortable: true },
  { key: 'description', label: 'Description' },
  { key: 'assetCount', label: 'Assets', sortable: true },
  { key: 'totalStockQuantity', label: 'Total Stock', sortable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
  { key: 'actions', label: 'Actions', width: '120px' }
])

// Watch for data changes
watch(() => materialTypeStore.materialTypes, () => {
  // Reset to first page when data changes
  pagination.value.page = 1
})

// Methods
const refreshData = async () => {
  isLoading.value = true
  try {
    await materialTypeStore.fetchMaterialTypesWithStats()
  } catch (error) {
    notificationStore.addNotification({
      type: 'error',
      title: 'Failed to refresh data',
      message: 'Could not load material types. Please try again.'
    })
  } finally {
    isLoading.value = false
  }
}

const editMaterialType = (materialType: MaterialType) => {
  editingMaterialType.value = materialType
  formData.value = {
    categoryName: materialType.categoryName,
    description: materialType.description || ''
  }
  formErrors.value = {}
  showEditModal.value = true
}

const deleteMaterialType = (materialType: MaterialTypeWithStats) => {
  materialTypeToDelete.value = materialType
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
    if (showEditModal.value && editingMaterialType.value) {
      // Update existing material type
      await materialTypeStore.updateMaterialType(editingMaterialType.value.categoryId, formData.value)
      notificationStore.addNotification({
        type: 'success',
        title: 'Material Type Updated',
        message: `Material type "${formData.value.categoryName}" has been updated successfully.`
      })
    } else {
      // Create new material type
      await materialTypeStore.createMaterialType(formData.value)
      notificationStore.addNotification({
        type: 'success',
        title: 'Material Type Created',
        message: `Material type "${formData.value.categoryName}" has been created successfully.`
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
  if (!materialTypeToDelete.value) return

  // Prevent deletion if material type has assets
  if (materialTypeToDelete.value.assetCount > 0) {
    notificationStore.addNotification({
      type: 'warning',
      title: 'Cannot Delete Material Type',
      message: 'This material type has associated assets and cannot be deleted.'
    })
    return
  }

  isDeleting.value = true
  try {
    await materialTypeStore.deleteMaterialType(materialTypeToDelete.value.categoryId)
    notificationStore.addNotification({
      type: 'success',
      title: 'Material Type Deleted',
      message: `Material type "${materialTypeToDelete.value.categoryName}" has been deleted successfully.`
    })
    showDeleteModal.value = false
    materialTypeToDelete.value = null
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
  formData.value = { categoryName: '', description: '' }
  formErrors.value = {}
  isFormValid.value = false
  editingMaterialType.value = null
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Initialize
onMounted(async () => {
  await refreshData()
})
</script>