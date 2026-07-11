<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center space-x-3">
          <h1 class="text-2xl font-bold text-gray-900">Reports</h1>
          <TooltipGuide
            title="Inventory Reports"
            content="Generate comprehensive reports for incoming, outgoing, and investment analysis."
            :steps="[
              'Filter reports by date range and division',
              'Export individual reports or use Multi-Report Export',
              'Review transaction history and investment summaries',
              'Download reports in Excel or PDF format'
            ]"
            position="bottom-right"
          />
        </div>
        <p class="text-gray-600">Generate and export inventory reports</p>
      </div>
      
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <!-- Multi-Report Export Button -->
        <BaseButton
          variant="secondary"
          @click="showMultiExportDialog = true"
          class="w-full sm:w-auto"
        >
          <i class="fas fa-layer-group mr-2"></i>
          <span class="hidden sm:inline">Multi-Report Export</span>
          <span class="sm:hidden">Multi Export</span>
        </BaseButton>

        <!-- Refresh Button -->
        <BaseButton
          variant="secondary"
          :loading="isLoading"
          @click="refreshReports"
          class="w-full sm:w-auto"
        >
          <i class="fas fa-sync-alt mr-2"></i>
          Refresh
        </BaseButton>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div class="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Incoming</p>
            <p class="text-xl sm:text-2xl font-bold text-green-600">{{ stats.totalIncoming }}</p>
          </div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-arrow-down text-green-600 text-sm sm:text-base"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Outgoing</p>
            <p class="text-xl sm:text-2xl font-bold text-red-600">{{ stats.totalOutgoing }}</p>
          </div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-arrow-up text-red-600 text-sm sm:text-base"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Net Investment</p>
            <p class="text-xl sm:text-2xl font-bold text-blue-600">{{ stats.netInvestment }}</p>
          </div>
          <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-chart-line text-blue-600 text-sm sm:text-base"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Report Sections -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Incoming Materials Report -->
      <div class="bg-white rounded-lg shadow border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-arrow-down text-green-600"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Incoming Materials</h3>
                <p class="text-sm text-gray-600">Materials received into inventory</p>
              </div>
            </div>
            <ExportButton
              report-type="incoming"
              size="sm"
              :filters="incomingFilters"
              @exported="handleReportExported"
            />
          </div>
        </div>

        <div class="p-6">
          <!-- Filters -->
          <div class="space-y-4 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BaseInput
                v-model="incomingDateFrom"
                type="date"
                label="From Date"
                size="sm"
              />
              <BaseInput
                v-model="incomingDateTo"
                type="date"
                label="To Date"
                size="sm"
              />
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BaseSelect
                v-model="incomingFilters.divisionId"
                label="Division"
                :options="divisionOptions"
                placeholder="All divisions"
                size="sm"
                clearable
              />
              <BaseSelect
                v-model="incomingFilters.priorityStatus"
                label="Priority"
                :options="priorityOptions"
                placeholder="All priorities"
                size="sm"
                clearable
              />
            </div>
          </div>

          <!-- Recent Transactions Preview -->
          <div class="space-y-3">
            <h4 class="font-medium text-gray-900">Recent Incoming Transactions</h4>
            
            <div v-if="isLoadingIncoming" class="space-y-2">
              <div v-for="i in 3" :key="i" class="animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>

            <div v-else-if="incomingTransactions.length === 0" class="text-center py-8 text-gray-500">
              <i class="fas fa-inbox text-4xl mb-3"></i>
              <p>No incoming transactions found</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="transaction in incomingTransactions.slice(0, 5)"
                :key="transaction.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex-1">
                  <div class="flex items-center space-x-2">
                    <span class="font-medium text-gray-900">{{ transaction.jenisMaterial }}</span>
                    <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      +{{ transaction.kuantitas }}
                    </span>
                  </div>
                  <div class="text-sm text-gray-600">
                    {{ transaction.divisi }} • {{ formatDate(transaction.tanggalMasuk) }}
                  </div>
                </div>
                <div class="text-right">
                  <span :class="[
                    'px-2 py-1 text-xs rounded-full',
                    getPriorityClass(transaction.status)
                  ]">
                    {{ transaction.status }}
                  </span>
                </div>
              </div>

              <div v-if="incomingTransactions.length > 5" class="text-center">
                <button
                  @click="showAllIncoming = !showAllIncoming"
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {{ showAllIncoming ? 'Show Less' : `Show ${incomingTransactions.length - 5} More` }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Outgoing Materials Report -->
      <div class="bg-white rounded-lg shadow border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-arrow-up text-red-600"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Outgoing Materials</h3>
                <p class="text-sm text-gray-600">Materials sent from inventory</p>
              </div>
            </div>
            <ExportButton
              report-type="outgoing"
              size="sm"
              :filters="outgoingFilters"
              @exported="handleReportExported"
            />
          </div>
        </div>

        <div class="p-6">
          <!-- Filters -->
          <div class="space-y-4 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BaseInput
                v-model="outgoingDateFrom"
                type="date"
                label="From Date"
                size="sm"
              />
              <BaseInput
                v-model="outgoingDateTo"
                type="date"
                label="To Date"
                size="sm"
              />
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BaseSelect
                v-model="outgoingFilters.divisionId"
                label="Division"
                :options="divisionOptions"
                placeholder="All divisions"
                size="sm"
                clearable
              />
              <BaseSelect
                v-model="outgoingFilters.priorityStatus"
                label="Priority"
                :options="priorityOptions"
                placeholder="All priorities"
                size="sm"
                clearable
              />
            </div>
          </div>

          <!-- Recent Transactions Preview -->
          <div class="space-y-3">
            <h4 class="font-medium text-gray-900">Recent Outgoing Transactions</h4>
            
            <div v-if="isLoadingOutgoing" class="space-y-2">
              <div v-for="i in 3" :key="i" class="animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>

            <div v-else-if="outgoingTransactions.length === 0" class="text-center py-8 text-gray-500">
              <i class="fas fa-inbox text-4xl mb-3"></i>
              <p>No outgoing transactions found</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="transaction in outgoingTransactions.slice(0, 5)"
                :key="transaction.id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex-1">
                  <div class="flex items-center space-x-2">
                    <span class="font-medium text-gray-900">{{ transaction.jenisMaterial }}</span>
                    <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      -{{ transaction.kuantitas }}
                    </span>
                  </div>
                  <div class="text-sm text-gray-600">
                    {{ transaction.divisi }} • {{ formatDate(transaction.tanggalKeluar) }}
                  </div>
                </div>
                <div class="text-right">
                  <span :class="[
                    'px-2 py-1 text-xs rounded-full',
                    getPriorityClass(transaction.status)
                  ]">
                    {{ transaction.status }}
                  </span>
                </div>
              </div>

              <div v-if="outgoingTransactions.length > 5" class="text-center">
                <button
                  @click="showAllOutgoing = !showAllOutgoing"
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {{ showAllOutgoing ? 'Show Less' : `Show ${outgoingTransactions.length - 5} More` }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Investment Report -->
    <div class="bg-white rounded-lg shadow border border-gray-200">
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-chart-line text-blue-600"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Investment Report</h3>
              <p class="text-sm text-gray-600">Current stock levels and investment values</p>
            </div>
          </div>
          <ExportButton
            report-type="investment"
            size="sm"
            @exported="handleReportExported"
          />
        </div>
      </div>

      <div class="p-6">
        <!-- Investment Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{{ investmentStats.totalAssets }}</div>
            <div class="text-sm text-gray-600">Total Assets</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{{ investmentStats.totalIncoming }}</div>
            <div class="text-sm text-gray-600">Total Incoming</div>
          </div>
          <div class="text-center p-4 bg-red-50 rounded-lg">
            <div class="text-2xl font-bold text-red-600">{{ investmentStats.totalOutgoing }}</div>
            <div class="text-sm text-gray-600">Total Outgoing</div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-gray-800">{{ investmentStats.netStock }}</div>
            <div class="text-sm text-gray-600">Net Stock</div>
          </div>
        </div>

        <!-- Investment Table -->
        <BaseTable
          :columns="investmentColumns"
          :data="investmentData"
          :loading="isLoadingInvestment"
          :pagination="investmentPagination"
          @page-change="handleInvestmentPageChange"
        />
      </div>
    </div>

    <!-- Multi-Report Export Dialog -->
    <BaseModal
      v-model="showMultiExportDialog"
      title="Multi-Report Export"
      size="lg"
    >
      <div class="space-y-6">
        <!-- Report Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Select Reports to Export
          </label>
          <div class="space-y-3">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="multiExportOptions.includeIncoming"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="ml-3 text-sm font-medium text-gray-700">Incoming Materials Report</span>
              <span class="ml-2 text-xs text-gray-500">({{ reportStore.incomingReport?.length || 0 }} records)</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="multiExportOptions.includeOutgoing"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="ml-3 text-sm font-medium text-gray-700">Outgoing Materials Report</span>
              <span class="ml-2 text-xs text-gray-500">({{ reportStore.outgoingReport?.length || 0 }} records)</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="multiExportOptions.includeInvestment"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span class="ml-3 text-sm font-medium text-gray-700">Investment Report</span>
              <span class="ml-2 text-xs text-gray-500">({{ reportStore.investmentReport?.length || 0 }} records)</span>
            </label>
          </div>
        </div>

        <!-- Export Format -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Export Format
          </label>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="multiExportFormat = 'excel'"
              :class="[
                'p-3 border rounded-lg text-center transition-colors',
                multiExportFormat === 'excel'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <i class="fas fa-file-excel text-2xl mb-2 block text-green-600"></i>
              <div class="text-sm font-medium">Excel</div>
            </button>
            <button
              @click="multiExportFormat = 'pdf'"
              :class="[
                'p-3 border rounded-lg text-center transition-colors',
                multiExportFormat === 'pdf'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <i class="fas fa-file-pdf text-2xl mb-2 block text-red-600"></i>
              <div class="text-sm font-medium">PDF</div>
            </button>
          </div>
        </div>

        <!-- Filename -->
        <div>
          <BaseInput
            v-model="multiExportFilename"
            label="Filename"
            placeholder="combined-reports"
          />
        </div>

        <!-- Export Progress -->
        <div v-if="isExportingMulti" class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span>{{ exportStatus }}</span>
            <span>{{ Math.round(exportProgress) }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${exportProgress}%` }"
            ></div>
          </div>
        </div>

        <!-- Export Error -->
        <div v-if="exportError" class="bg-red-50 border border-red-200 rounded-lg p-3">
          <div class="flex items-center space-x-2">
            <i class="fas fa-exclamation-triangle text-red-500"></i>
            <span class="text-red-700 text-sm">{{ exportError }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <BaseButton
            variant="secondary"
            @click="showMultiExportDialog = false"
            :disabled="isExportingMulti"
          >
            Cancel
          </BaseButton>
          <BaseButton
            variant="primary"
            @click="handleMultiExport"
            :loading="isExportingMulti"
            :disabled="!isMultiExportValid"
          >
            <i class="fas fa-download mr-2"></i>
            Export Reports
          </BaseButton>
        </div>
      </template>
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
import ExportButton from '@/components/ui/ExportButton.vue'
import TooltipGuide from '@/components/ui/TooltipGuide.vue'
import { useReportStore } from '@/stores/report.store'
import { useDivisionStore } from '@/stores/division.store'
import { useNotificationStore } from '@/stores/notification.store'
import { exportService } from '@/services/export.service'
import type { 
  ReportAlartMasuk, 
  ReportAlartKeluar, 
  ReportInvestment,
  MaterialTransactionFilters 
} from '@/types'

// Stores
const reportStore = useReportStore()
const divisionStore = useDivisionStore()
const notificationStore = useNotificationStore()

// Reactive state
const isLoading = ref(false)
const isLoadingIncoming = ref(false)
const isLoadingOutgoing = ref(false)
const isLoadingInvestment = ref(false)
const isExportingMulti = ref(false)

const showAllIncoming = ref(false)
const showAllOutgoing = ref(false)
const showMultiExportDialog = ref(false)

// Date filters
const incomingDateFrom = ref('')
const incomingDateTo = ref('')
const outgoingDateFrom = ref('')
const outgoingDateTo = ref('')

// Transaction filters
const incomingFilters = ref<MaterialTransactionFilters>({})
const outgoingFilters = ref<MaterialTransactionFilters>({})

// Multi-export options
const multiExportOptions = ref({
  includeIncoming: true,
  includeOutgoing: true,
  includeInvestment: true
})
const multiExportFilename = ref('combined-reports')
const multiExportFormat = ref<'excel' | 'pdf'>('excel')
const exportProgress = ref(0)
const exportStatus = ref('')
const exportError = ref('')

// Investment pagination
const investmentPagination = ref({
  page: 1,
  limit: 10,
  total: 0
})

// Computed
const stats = computed(() => ({
  totalIncoming: reportStore.incomingReport?.reduce((sum, item) => sum + item.kuantitas, 0) || 0,
  totalOutgoing: reportStore.outgoingReport?.reduce((sum, item) => sum + item.kuantitas, 0) || 0,
  netInvestment: reportStore.investmentReport?.reduce((sum, item) => sum + item.netInvestmentStok, 0) || 0
}))

const investmentStats = computed(() => {
  const data = reportStore.investmentReport || []
  return {
    totalAssets: data.length,
    totalIncoming: data.reduce((sum, item) => sum + item.totalAlatMasuk, 0),
    totalOutgoing: data.reduce((sum, item) => sum + item.totalAlatKeluar, 0),
    netStock: data.reduce((sum, item) => sum + item.netInvestmentStok, 0)
  }
})

const incomingTransactions = computed(() => {
  const data = reportStore.incomingReport || []
  return showAllIncoming.value ? data : data.slice(0, 5)
})

const outgoingTransactions = computed(() => {
  const data = reportStore.outgoingReport || []
  return showAllOutgoing.value ? data : data.slice(0, 5)
})

const investmentData = computed(() => {
  return reportStore.investmentReport?.map(item => ({
    assetId: item.assetId,
    categoryName: item.categoryName || 'Uncategorized',
    materialName: item.materialName,
    totalIncoming: item.totalAlatMasuk,
    totalOutgoing: item.totalAlatKeluar,
    netStock: item.netInvestmentStok,
    lastUpdated: formatDate(item.pembaruanTerakhir)
  })) || []
})

const investmentColumns = computed(() => [
  { key: 'assetId', label: 'Asset ID', sortable: true },
  { key: 'categoryName', label: 'Category', sortable: true },
  { key: 'materialName', label: 'Material Name', sortable: true },
  { key: 'totalIncoming', label: 'Total Incoming', sortable: true },
  { key: 'totalOutgoing', label: 'Total Outgoing', sortable: true },
  { key: 'netStock', label: 'Net Stock', sortable: true },
  { key: 'lastUpdated', label: 'Last Updated', sortable: true }
])

const divisionOptions = computed(() =>
  divisionStore.divisions.map(division => ({
    value: division.id,
    label: division.name
  }))
)

const priorityOptions = computed(() => [
  { value: 'LOW', label: 'Low Priority' },
  { value: 'MEDIUM', label: 'Medium Priority' },
  { value: 'HIGH', label: 'High Priority' },
  { value: 'URGENT', label: 'Urgent' }
])

const isMultiExportValid = computed(() => {
  return (
    (multiExportOptions.value.includeIncoming || 
     multiExportOptions.value.includeOutgoing || 
     multiExportOptions.value.includeInvestment) &&
    multiExportFilename.value.trim().length > 0
  )
})

// Watchers for filters
watch([incomingDateFrom, incomingDateTo, incomingFilters], () => {
  fetchIncomingReport()
}, { deep: true })

watch([outgoingDateFrom, outgoingDateTo, outgoingFilters], () => {
  fetchOutgoingReport()
}, { deep: true })

// Methods
const refreshReports = async () => {
  isLoading.value = true
  try {
    await Promise.all([
      fetchIncomingReport(),
      fetchOutgoingReport(),
      fetchInvestmentReport()
    ])
  } finally {
    isLoading.value = false
  }
}

const fetchIncomingReport = async () => {
  isLoadingIncoming.value = true
  try {
    const filters = {
      ...incomingFilters.value,
      transactionType: 'INCOMING' as const,
      ...(incomingDateFrom.value && { dateFrom: new Date(incomingDateFrom.value) }),
      ...(incomingDateTo.value && { dateTo: new Date(incomingDateTo.value) })
    }
    await reportStore.fetchIncomingReport(filters)
  } finally {
    isLoadingIncoming.value = false
  }
}

const fetchOutgoingReport = async () => {
  isLoadingOutgoing.value = true
  try {
    const filters = {
      ...outgoingFilters.value,
      transactionType: 'OUTGOING' as const,
      ...(outgoingDateFrom.value && { dateFrom: new Date(outgoingDateFrom.value) }),
      ...(outgoingDateTo.value && { dateTo: new Date(outgoingDateTo.value) })
    }
    await reportStore.fetchOutgoingReport(filters)
  } finally {
    isLoadingOutgoing.value = false
  }
}

const fetchInvestmentReport = async () => {
  isLoadingInvestment.value = true
  try {
    await reportStore.fetchInvestmentReport()
  } finally {
    isLoadingInvestment.value = false
  }
}

const handleInvestmentPageChange = (page: number) => {
  investmentPagination.value.page = page
  // In a real app, you would refetch data with pagination
}

const handleReportExported = (success: boolean, format: string) => {
  if (success) {
    notificationStore.addNotification({
      type: 'success',
      title: 'Export Successful',
      message: `Report exported to ${format.toUpperCase()} successfully`
    })
  }
}

const handleMultiExport = async () => {
  // Validation
  if (!isMultiExportValid.value) {
    notificationStore.addNotification({
      type: 'warning',
      title: 'Invalid Export Configuration',
      message: 'Please select at least one report and provide a filename'
    })
    return
  }

  const selectedReports = []
  
  if (multiExportOptions.value.includeIncoming) {
    selectedReports.push({ type: 'incoming' as const, title: 'Incoming Materials' })
  }
  if (multiExportOptions.value.includeOutgoing) {
    selectedReports.push({ type: 'outgoing' as const, title: 'Outgoing Materials' })
  }
  if (multiExportOptions.value.includeInvestment) {
    selectedReports.push({ type: 'investment' as const, title: 'Investment Report' })
  }

  isExportingMulti.value = true
  exportError.value = ''
  exportProgress.value = 0
  
  try {
    exportStatus.value = 'Preparing reports...'
    exportProgress.value = 10

    // Simulate multi-export process
    for (let i = 0; i < selectedReports.length; i++) {
      const report = selectedReports[i]
      exportStatus.value = `Processing ${report.title}...`
      exportProgress.value = 10 + ((i + 1) / selectedReports.length) * 80
      
      // Add delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    exportStatus.value = 'Generating combined file...'
    exportProgress.value = 95

    // Create download based on format
    if (multiExportFormat.value === 'excel') {
      // For now, simulate Excel export
      const filename = `${multiExportFilename.value}.xlsx`
      const data = new Blob(['Multi-report data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      window.URL.revokeObjectURL(url)
    } else {
      // For now, simulate PDF export
      const filename = `${multiExportFilename.value}.pdf`
      const data = new Blob(['Multi-report PDF data'], { type: 'application/pdf' })
      
      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      window.URL.revokeObjectURL(url)
    }

    exportProgress.value = 100
    exportStatus.value = 'Export complete!'

    notificationStore.addNotification({
      type: 'success',
      title: 'Multi-Export Successful',
      message: `Combined report exported as ${multiExportFormat.value.toUpperCase()} successfully`
    })

    // Close dialog after short delay
    setTimeout(() => {
      showMultiExportDialog.value = false
      exportProgress.value = 0
      exportStatus.value = ''
    }, 1000)

  } catch (error) {
    exportError.value = error instanceof Error ? error.message : 'Export failed'
    notificationStore.addNotification({
      type: 'error',
      title: 'Export Failed',
      message: exportError.value
    })
  } finally {
    isExportingMulti.value = false
  }
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getPriorityClass = (priority: string) => {
  const classes = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800'
  }
  return classes[priority as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

// Initialize
onMounted(async () => {
  // Set default date range (last 30 days)
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  
  const todayStr = today.toISOString().split('T')[0]
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
  
  incomingDateFrom.value = thirtyDaysAgoStr
  incomingDateTo.value = todayStr
  outgoingDateFrom.value = thirtyDaysAgoStr
  outgoingDateTo.value = todayStr

  // Load initial data
  await Promise.all([
    divisionStore.fetchDivisions(),
    refreshReports()
  ])
})
</script>