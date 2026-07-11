<template>
  <BaseModal
    :show="show"
    :title="dialogTitle"
    size="lg"
    @close="handleClose"
    @confirm="handleExport"
    :confirm-loading="isExporting"
    :confirm-disabled="!isFormValid"
    confirm-text="Export"
    confirm-variant="primary"
  >
    <div class="space-y-6">
      <!-- Report Type Selection -->
      <div v-if="!reportType">
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Select Report Type
        </label>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            v-for="type in reportTypes"
            :key="type.value"
            @click="selectedReportType = type.value"
            :class="[
              'p-4 border rounded-lg text-left transition-colors',
              selectedReportType === type.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            ]"
          >
            <div class="flex items-center space-x-3">
              <i :class="type.icon" class="text-lg"></i>
              <div>
                <div class="font-medium">{{ type.label }}</div>
                <div class="text-sm text-gray-500">{{ type.description }}</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Export Format Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Export Format
        </label>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="format in availableFormats"
            :key="format.value"
            @click="exportOptions.format = format.value"
            :class="[
              'p-3 border rounded-lg text-center transition-colors',
              exportOptions.format === format.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            ]"
          >
            <i :class="format.icon" class="text-2xl mb-2 block"></i>
            <div class="text-sm font-medium">{{ format.label }}</div>
          </button>
        </div>
      </div>

      <!-- Export Options -->
      <div class="space-y-4">
        <div>
          <BaseInput
            v-model="exportOptions.title"
            label="Report Title"
            placeholder="Enter custom report title (optional)"
          />
        </div>

        <div>
          <BaseInput
            v-model="exportOptions.filename"
            label="Filename"
            :placeholder="previewFilename"
          />
        </div>

        <!-- Date Range Filter -->
        <div class="grid grid-cols-2 gap-4">
          <BaseInput
            v-model="dateFrom"
            type="date"
            label="From Date"
          />
          <BaseInput
            v-model="dateTo"
            type="date"
            label="To Date"
          />
        </div>

        <!-- Additional Filters (if applicable) -->
        <div v-if="currentReportType !== 'investment'" class="space-y-3">
          <BaseSelect
            v-model="filters.transactionType"
            label="Transaction Type"
            :options="transactionTypeOptions"
            placeholder="All transaction types"
            clearable
          />

          <BaseSelect
            v-model="filters.priorityStatus"
            label="Priority Status"
            :options="priorityStatusOptions"
            placeholder="All priorities"
            clearable
          />

          <BaseSelect
            v-model="filters.divisionId"
            label="Division"
            :options="divisionOptions"
            placeholder="All divisions"
            clearable
          />
        </div>

        <!-- Advanced Options -->
        <div class="border-t pt-4">
          <h4 class="font-medium text-gray-700 mb-3">Advanced Options</h4>
          
          <div class="space-y-3">
            <label class="flex items-center space-x-2">
              <input
                type="checkbox"
                v-model="exportOptions.includeHeaders"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">Include column headers</span>
            </label>

            <label class="flex items-center space-x-2">
              <input
                type="checkbox"
                v-model="exportOptions.includeTimestamp"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">Include generation timestamp</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Preview Information -->
      <div v-if="preview" class="bg-gray-50 p-4 rounded-lg">
        <h4 class="font-medium text-gray-700 mb-2">Export Preview</h4>
        <div class="space-y-1 text-sm text-gray-600">
          <div><strong>Filename:</strong> {{ preview.filename }}</div>
          <div><strong>Format:</strong> {{ preview.format.toUpperCase() }}</div>
          <div><strong>Records:</strong> {{ preview.recordCount }}</div>
          <div><strong>Estimated Size:</strong> {{ preview.estimatedSize }}</div>
          <div v-if="appliedFilters"><strong>Filters:</strong> {{ appliedFilters }}</div>
        </div>
      </div>

      <!-- Export Progress -->
      <div v-if="isExporting" class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span>{{ exportStatus }}</span>
          <span>{{ exportProgress }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${exportProgress}%` }"
          ></div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="exportError" class="bg-red-50 border border-red-200 rounded-lg p-3">
        <div class="flex items-center space-x-2">
          <i class="fas fa-exclamation-triangle text-red-500"></i>
          <span class="text-red-700 text-sm">{{ exportError }}</span>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { exportService } from '@/services/export.service'
import { ExportUtils } from '@/utils/export.utils'
import { useDivisionStore } from '@/stores/division.store'
import { useNotificationStore } from '@/stores/notification.store'
import type { 
  ExportFormat, 
  ExportOptions, 
  MaterialTransactionFilters 
} from '@/types'

// Props
interface Props {
  show: boolean
  reportType?: 'incoming' | 'outgoing' | 'investment'
}

const props = withDefaults(defineProps<Props>(), {
  reportType: undefined
})

// Emits
const emit = defineEmits<{
  close: []
  exported: [success: boolean]
}>()

// Stores
const divisionStore = useDivisionStore()
const notificationStore = useNotificationStore()

// Reactive state
const selectedReportType = ref<'incoming' | 'outgoing' | 'investment' | null>(null)
const exportOptions = ref<ExportOptions>({
  format: 'pdf',
  includeHeaders: true,
  includeTimestamp: true
})
const filters = ref<MaterialTransactionFilters>({})
const dateFrom = ref<string>('')
const dateTo = ref<string>('')
const isExporting = ref(false)
const exportProgress = ref(0)
const exportStatus = ref('')
const exportError = ref('')
const preview = ref<any>(null)

// Computed
const currentReportType = computed(() => props.reportType || selectedReportType.value)

const dialogTitle = computed(() => {
  if (!currentReportType.value) return 'Export Report'
  const type = currentReportType.value
  return `Export ${type.charAt(0).toUpperCase() + type.slice(1)} Report`
})

const reportTypes = computed(() => [
  {
    value: 'incoming' as const,
    label: 'Incoming Materials',
    description: 'Materials received into inventory',
    icon: 'fas fa-arrow-down text-green-500'
  },
  {
    value: 'outgoing' as const,
    label: 'Outgoing Materials',
    description: 'Materials sent from inventory',
    icon: 'fas fa-arrow-up text-red-500'
  },
  {
    value: 'investment' as const,
    label: 'Investment Report',
    description: 'Current stock levels and values',
    icon: 'fas fa-chart-line text-blue-500'
  }
])

const availableFormats = computed(() => exportService.getAvailableFormats())

const previewFilename = computed(() => {
  if (!currentReportType.value) return 'report'
  return ExportUtils.generateFilename(currentReportType.value, exportOptions.value.format)
})

const isFormValid = computed(() => {
  return !!(currentReportType.value && exportOptions.value.format)
})

const appliedFilters = computed(() => {
  if (!filters.value || Object.keys(filters.value).length === 0) return null
  return ExportUtils.createExportSummary(currentReportType.value || 'unknown', 0, filters.value)
})

// Options for select fields
const transactionTypeOptions = computed(() => [
  { value: 'INCOMING', label: 'Incoming' },
  { value: 'OUTGOING', label: 'Outgoing' }
])

const priorityStatusOptions = computed(() => [
  { value: 'LOW', label: 'Low Priority' },
  { value: 'MEDIUM', label: 'Medium Priority' },
  { value: 'HIGH', label: 'High Priority' },
  { value: 'URGENT', label: 'Urgent' }
])

const divisionOptions = computed(() => 
  divisionStore.divisions.map(division => ({
    value: division.divisionId,
    label: division.divisionName
  }))
)

// Watch for changes to update preview
watch([currentReportType, exportOptions, filters, dateFrom, dateTo], () => {
  updatePreview()
}, { deep: true })

// Methods
const handleClose = () => {
  resetForm()
  emit('close')
}

const handleExport = async () => {
  if (!currentReportType.value) {
    exportError.value = 'Please select a report type'
    return
  }

  isExporting.value = true
  exportError.value = ''
  exportProgress.value = 0
  exportStatus.value = 'Preparing export...'

  try {
    // Prepare final export options
    const finalOptions: ExportOptions = {
      ...exportOptions.value,
      filters: {
        ...filters.value,
        ...(dateFrom.value && { dateFrom: new Date(dateFrom.value) }),
        ...(dateTo.value && { dateTo: new Date(dateTo.value) })
      }
    }

    exportStatus.value = 'Generating file...'
    exportProgress.value = 50

    // Perform export
    const result = await exportService.exportAndDownload(currentReportType.value, finalOptions)

    if (result.success) {
      exportProgress.value = 100
      exportStatus.value = 'Download complete!'
      
      notificationStore.addNotification({
        type: 'success',
        title: 'Export Successful',
        message: `${currentReportType.value} report has been downloaded successfully`
      })

      emit('exported', true)
      setTimeout(() => handleClose(), 1000)
    } else {
      throw new Error(result.error || 'Export failed')
    }

  } catch (error) {
    exportError.value = ExportUtils.handleExportError(error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Export Failed',
      message: exportError.value
    })
    emit('exported', false)
  } finally {
    isExporting.value = false
    exportProgress.value = 0
    exportStatus.value = ''
  }
}

const updatePreview = async () => {
  if (!currentReportType.value) return

  try {
    const previewOptions = {
      format: exportOptions.value.format,
      title: exportOptions.value.title,
      filename: exportOptions.value.filename,
      filters: {
        ...filters.value,
        ...(dateFrom.value && { dateFrom: new Date(dateFrom.value) }),
        ...(dateTo.value && { dateTo: new Date(dateTo.value) })
      }
    }

    const result = await exportService.getExportPreview(currentReportType.value, previewOptions)
    
    if (result.success) {
      preview.value = result.preview
    }
  } catch (error) {
    console.warn('Preview update failed:', error)
  }
}

const resetForm = () => {
  selectedReportType.value = null
  exportOptions.value = {
    format: 'pdf',
    includeHeaders: true,
    includeTimestamp: true
  }
  filters.value = {}
  dateFrom.value = ''
  dateTo.value = ''
  exportError.value = ''
  preview.value = null
}

// Initialize
onMounted(async () => {
  // Load divisions for filter options
  if (divisionStore.divisions.length === 0) {
    await divisionStore.fetchDivisions()
  }

  // Set initial report type if provided
  if (props.reportType) {
    selectedReportType.value = props.reportType
  }

  // Set default date range (last 30 days)
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  
  dateTo.value = today.toISOString().split('T')[0] ?? ''
  dateFrom.value = thirtyDaysAgo.toISOString().split('T')[0] ?? ''
})
</script>