<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Reports</h1>
        <p class="text-gray-600">Generate and export inventory reports</p>
      </div>
      
      <div class="flex items-center space-x-3">
        <!-- Multi-Report Export Button -->
        <BaseButton
          variant="secondary"
          @click="showMultiExportDialog = true"
        >
          <i class="fas fa-layer-group mr-2"></i>
          Multi-Report Export
        </BaseButton>

        <!-- Refresh Button -->
        <BaseButton
          variant="secondary"
          :loading="isLoading"
          @click="refreshReports"
        >
          <i class="fas fa-sync-alt mr-2"></i>
          Refresh
        </BaseButton>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Incoming</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.totalIncoming }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-arrow-down text-green-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Outgoing</p>
            <p class="text-2xl font-bold text-red-600">{{ stats.totalOutgoing }}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-arrow-up text-red-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Net Investment</p>
            <p class="text-2xl font-bold text-blue-600">{{ stats.netInvestment }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-chart-line text-blue-600"></i>
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
      :show="showMultiExportDialog"
      title="Multi-Report Export"
      size="lg"
      @close="showMultiExportDialog = false"
      @confirm="handleMultiExport"
      :confirm-loading="isExportingMulti"
      confirm-text="Export All"
    >
      <div class="space-y-4">
        <p class="text-gray-600">Select reports to include in the combined export (Excel format only):</p>
        
        <div class="space-y-3">
          <label class="flex items-center space-x-3">
            <input
              type="checkbox"
              v-model="multiExportOptions.includeIncoming"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="text-sm font-medium">Incoming Materials Report</span>
          </label>

          <label class="flex items-center space-x-3">
            <input
              type="checkbox"
              v-model="multiExportOptions.includeOutgoing"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="text-sm font-medium">Outgoing Materials Report</span>
          </label>

          <label class="flex items-center space-x-3">
            <input
              type="checkbox"
              v-model="multiExportOptions.includeInvestment"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="text-sm font-medium">Investment Report</span>
          </label>
        </div>

        <div>
          <BaseInput
            v-model="multiExportFilename"
            label="Filename"
            placeholder="combined-reports"
          />
        </div>
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
import ExportButton from '@/components/ui/ExportButton.vue'
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

  if (selectedReports.length === 0) {
    notificationStore.addNotification({
      type: 'warning',
      title: 'No Reports Selected',
      message: 'Please select at least one report to export'
    })
    return
  }

  isExportingMulti.value = true
  
  try {
    const result = await exportService.exportMultipleReports({
      reports: selectedReports,
      options: {
        format: 'excel',
        filename: `${multiExportFilename.value}.xlsx`,
        title: 'Combined Reports',
        includeHeaders: true,
        includeTimestamp: true
      }
    })

    if (result.success && result.buffer) {
      exportService.downloadFile(result)
      notificationStore.addNotification({
        type: 'success',
        title: 'Multi-Report Export Successful',
        message: 'Combined reports have been downloaded successfully'
      })
      showMultiExportDialog.value = false
    } else {
      throw new Error(result.error || 'Export failed')
    }

  } catch (error) {
    notificationStore.addNotification({
      type: 'error',
      title: 'Multi-Report Export Failed',
      message: error instanceof Error ? error.message : 'Export failed'
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