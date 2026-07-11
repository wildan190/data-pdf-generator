<template>
  <div class="relative inline-block">
    <!-- Main Export Button -->
    <BaseButton
      :variant="variant"
      :size="size"
      :loading="isExporting"
      @click="handleExport"
      :class="['relative', { 'pr-8': showDropdown }]"
    >
      <i class="fas fa-download mr-2"></i>
      {{ buttonText }}
      
      <!-- Dropdown Arrow -->
      <i 
        v-if="showDropdown"
        class="fas fa-chevron-down ml-2 absolute right-2 top-1/2 transform -translate-y-1/2"
      ></i>
    </BaseButton>

    <!-- Export Options Dropdown -->
    <div
      v-if="showDropdown && dropdownOpen"
      class="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
    >
      <!-- Quick Export Options -->
      <div class="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
        Quick Export
      </div>
      
      <button
        v-for="format in quickFormats"
        :key="format.value"
        @click="quickExport(format.value)"
        class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center space-x-2"
        :disabled="isExporting"
      >
        <i :class="format.icon" class="w-4"></i>
        <span class="text-sm">{{ format.label }}</span>
      </button>

      <div class="border-t border-gray-100 my-1"></div>
      
      <!-- Custom Export Option -->
      <button
        @click="openCustomDialog"
        class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center space-x-2"
        :disabled="isExporting"
      >
        <i class="fas fa-cog w-4"></i>
        <span class="text-sm">Custom Export...</span>
      </button>
    </div>

    <!-- Custom Export Dialog -->
    <ExportDialog
      :show="showCustomDialog"
      :report-type="reportType"
      @close="showCustomDialog = false"
      @exported="handleExported"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ExportDialog from '@/components/dialogs/ExportDialog.vue'
import { exportService } from '@/services/export.service'
import { ExportPresets, ExportUtils } from '@/utils/export.utils'
import { useNotificationStore } from '@/stores/notification.store'
import type { ExportFormat } from '@/types'

// Props
interface Props {
  reportType: 'incoming' | 'outgoing' | 'investment'
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  mode?: 'button' | 'dropdown'
  defaultFormat?: ExportFormat
  buttonText?: string
  filters?: any
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  mode: 'dropdown',
  defaultFormat: 'pdf',
  buttonText: 'Export'
})

// Emits
const emit = defineEmits<{
  exported: [success: boolean, format: ExportFormat]
  exportStart: []
  exportEnd: []
}>()

// Stores
const notificationStore = useNotificationStore()

// Reactive state
const isExporting = ref(false)
const dropdownOpen = ref(false)
const showCustomDialog = ref(false)

// Computed
const showDropdown = computed(() => props.mode === 'dropdown')

const quickFormats = computed(() => [
  {
    value: 'pdf' as ExportFormat,
    label: 'PDF Document',
    icon: 'fas fa-file-pdf text-red-500'
  },
  {
    value: 'excel' as ExportFormat,
    label: 'Excel Spreadsheet',
    icon: 'fas fa-file-excel text-green-500'
  },
  {
    value: 'word' as ExportFormat,
    label: 'Word Document',
    icon: 'fas fa-file-word text-blue-500'
  }
])

// Methods
const handleExport = () => {
  if (props.mode === 'button') {
    // Direct export with default format
    quickExport(props.defaultFormat)
  } else {
    // Toggle dropdown
    dropdownOpen.value = !dropdownOpen.value
  }
}

const quickExport = async (format: ExportFormat) => {
  dropdownOpen.value = false
  
  if (isExporting.value) return

  isExporting.value = true
  emit('exportStart')

  try {
    // Use quick preset for the format
    const options = {
      ...ExportPresets.quick[format],
      filters: props.filters,
      title: `${props.reportType.charAt(0).toUpperCase() + props.reportType.slice(1)} Report`
    }

    const result = await exportService.exportAndDownload(props.reportType, options)

    if (result.success) {
      notificationStore.addNotification({
        type: 'success',
        title: 'Export Successful',
        message: `${ExportUtils.getFormatDisplayName(format)} export completed successfully`
      })
      emit('exported', true, format)
    } else {
      throw new Error(result.error || 'Export failed')
    }

  } catch (error) {
    const errorMessage = ExportUtils.handleExportError(error)
    notificationStore.addNotification({
      type: 'error',
      title: 'Export Failed',
      message: errorMessage
    })
    emit('exported', false, format)
  } finally {
    isExporting.value = false
    emit('exportEnd')
  }
}

const openCustomDialog = () => {
  dropdownOpen.value = false
  showCustomDialog.value = true
}

const handleExported = (success: boolean) => {
  showCustomDialog.value = false
  emit('exported', success, 'pdf') // Default format for custom exports
}

const closeDropdown = (event: MouseEvent) => {
  if (!dropdownOpen.value) return
  
  const target = event.target as HTMLElement
  const button = document.querySelector('.relative.inline-block')
  
  if (button && !button.contains(target)) {
    dropdownOpen.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>