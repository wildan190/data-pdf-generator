<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center space-x-3">
          <h1 class="text-2xl font-bold text-gray-900">Divisions</h1>
          <TooltipGuide
            title="Divisions Management"
            content="Organize your inventory by departments or organizational units."
            :steps="[
              'Use Quick Add to create new divisions',
              'Click on division cards to view details',
              'Monitor transaction counts per division',
              'Track which divisions are most active'
            ]"
            position="bottom-right"
          />
        </div>
        <p class="text-gray-600">Manage organizational divisions</p>
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
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Divisions</p>
            <p class="text-2xl font-bold text-blue-600">{{ divisionStore.divisions.length }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-building text-blue-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Active Transactions</p>
            <p class="text-2xl font-bold text-green-600">{{ totalTransactions }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-exchange-alt text-green-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Most Active</p>
            <p class="text-lg font-bold text-purple-600">{{ mostActiveDivision }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-trophy text-purple-600"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Divisions Table -->
    <div class="bg-white rounded-lg shadow border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">All Divisions</h3>
          
          <div class="flex items-center space-x-3">
            <BaseInput
              v-model="searchTerm"
              placeholder="Search divisions..."
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
        :data="filteredDivisions"
        :loading="isLoading"
        :pagination="pagination"
        @page-change="handlePageChange"
        @sort="handleSort"
      >
        <!-- Custom cell for actions -->
        <template #cell-actions="{ item }">
          <div class="flex items-center space-x-2">
            <button
              @click="editDivision(item)"
              class="text-blue-600 hover:text-blue-800 p-1"
              title="Edit Division"
            >
              <i class="fas fa-edit"></i>
            </button>
            
            <button
              @click="deleteDivision(item)"
              class="text-red-600 hover:text-red-800 p-1"
              title="Delete Division"
              :disabled="item.transactionCount > 0"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </template>

        <!-- Custom cell for transaction count -->
        <template #cell-transactionCount="{ item }">
          <span :class="[
            'px-2 py-1 text-xs rounded-full',
            item.transactionCount > 0
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          ]">
            {{ item.transactionCount }} transactions
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
      :title="showEditModal ? 'Edit Division' : 'Add New Division'"
      @close="handleModalClose"
      @confirm="handleSubmit"
      :confirm-loading="isSubmitting"
      :confirm-disabled="!isFormValid"
    >
      <DivisionForm
        v-model="formData"
        :errors="formErrors"
        @validate="handleFormValidation"
        @cancel="handleModalClose"
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
          Are you sure you want to delete the division "<strong>{{ divisionToDelete?.divisionName }}</strong>"?
        </p>
        
        <div v-if="divisionToDelete && (divisionToDelete.transactionCount ?? 0) > 0" class="bg-red-50 border border-red-200 rounded-lg p-3">
          <div class="flex items-start space-x-2">
            <i class="fas fa-exclamation-triangle text-red-500 mt-0.5"></i>
            <div class="text-red-700 text-sm">
              <p class="font-medium">Cannot delete this division</p>
              <p>This division has {{ divisionToDelete?.transactionCount }} associated transactions. Please move or delete these transactions first.</p>
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
import TooltipGuide from '@/components/ui/TooltipGuide.vue'
import DivisionForm from '@/components/forms/DivisionForm.vue'
import { useDivisionStore } from '@/stores/division.store'
import { useNotificationStore } from '@/stores/notification.store'
import type { 
  Division,
  DivisionWithStats,
  CreateDivisionForm,
  FormErrors,
  PaginationState,
  SortState 
} from '@/types'

// Stores
const divisionStore = useDivisionStore()
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
const formData = ref<CreateDivisionForm>({ divisionName: '' })
const formErrors = ref<FormErrors>({})
const isFormValid = ref(false)
const editingDivision = ref<Division | null>(null)
const divisionToDelete = ref<DivisionWithStats | null>(null)

// Table state
const pagination = ref<PaginationState>({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0
})

const sortState = ref<SortState>({
  field: 'divisionName',
  direction: 'asc'
})

// Computed
const filteredDivisions = computed(() => {
  let divisions = divisionStore.divisionsWithStats

  // Apply search filter
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    divisions = divisions.filter(division =>
      division.divisionName.toLowerCase().includes(term)
    )
  }

  // Apply sorting
  divisions.sort((a, b) => {
    const aVal = a[sortState.value.field as keyof typeof a]
    const bVal = b[sortState.value.field as keyof typeof b]
    
    if (aVal < bVal) return sortState.value.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortState.value.direction === 'asc' ? 1 : -1
    return 0
  })

  // Update pagination
  pagination.value.total = divisions.length
  pagination.value.totalPages = Math.ceil(divisions.length / pagination.value.pageSize)

  // Apply pagination
  const start = (pagination.value.page - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  
  return divisions.slice(start, end)
})

const totalTransactions = computed(() =>
  divisionStore.divisionsWithStats.reduce((sum, division) => sum + division.transactionCount, 0)
)

const mostActiveDivision = computed(() => {
  const divisions = divisionStore.divisionsWithStats
  if (divisions.length === 0) return 'N/A'
  
  const mostActive = divisions.reduce((prev, current) => 
    current.transactionCount > prev.transactionCount ? current : prev
  )
  
  return mostActive.transactionCount > 0 ? mostActive.divisionName : 'No activity'
})

const tableColumns = computed(() => [
  { key: 'divisionName', label: 'Division Name', sortable: true },
  { key: 'transactionCount', label: 'Transactions', sortable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
  { key: 'actions', label: 'Actions', width: '120px' }
])

// Watch for data changes
watch(() => divisionStore.divisions, () => {
  // Reset to first page when data changes
  pagination.value.page = 1
})

// Methods
const refreshData = async () => {
  isLoading.value = true
  try {
    await divisionStore.fetchDivisionsWithStats()
  } catch (error) {
    notificationStore.addNotification({
      type: 'error',
      title: 'Failed to refresh data',
      message: 'Could not load divisions. Please try again.'
    })
  } finally {
    isLoading.value = false
  }
}

const editDivision = (division: Division) => {
  editingDivision.value = division
  formData.value = {
    divisionName: division.divisionName
  }
  formErrors.value = {}
  showEditModal.value = true
}

const deleteDivision = (division: DivisionWithStats) => {
  divisionToDelete.value = division
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
    if (showEditModal.value && editingDivision.value) {
      // Update existing division
      await divisionStore.updateDivision(editingDivision.value.divisionId, formData.value)
      notificationStore.addNotification({
        type: 'success',
        title: 'Division Updated',
        message: `Division "${formData.value.divisionName}" has been updated successfully.`
      })
    } else {
      // Create new division
      await divisionStore.createDivision(formData.value)
      notificationStore.addNotification({
        type: 'success',
        title: 'Division Created',
        message: `Division "${formData.value.divisionName}" has been created successfully.`
      })
    }

    // Refresh data to show the new item in the table
    await refreshData()
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
  if (!divisionToDelete.value) return

  // Prevent deletion if division has transactions
  if (divisionToDelete.value.transactionCount > 0) {
    notificationStore.addNotification({
      type: 'warning',
      title: 'Cannot Delete Division',
      message: 'This division has associated transactions and cannot be deleted.'
    })
    return
  }

  isDeleting.value = true
  try {
    await divisionStore.deleteDivision(divisionToDelete.value.divisionId)
    notificationStore.addNotification({
      type: 'success',
      title: 'Division Deleted',
      message: `Division "${divisionToDelete.value.divisionName}" has been deleted successfully.`
    })
    showDeleteModal.value = false
    divisionToDelete.value = null
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
  formData.value = { divisionName: '' }
  formErrors.value = {}
  isFormValid.value = false
  editingDivision.value = null
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Initialize
onMounted(async () => {
  await refreshData()
})
</script>