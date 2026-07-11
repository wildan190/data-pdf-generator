<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="min-w-0 flex-1">
        <div class="flex items-center space-x-3">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Dashboard
          </h2>
          <TooltipGuide
            title="Dashboard Overview"
            content="Monitor your inventory at a glance with key metrics, recent activities, and system alerts."
            :steps="[
              'Check notification bell for important alerts',
              'Use Quick Add to create new entries',
              'Review recent activities for updates',
              'Monitor low stock and urgent transactions'
            ]"
            position="bottom-right"
          />
        </div>
        <p class="mt-1 text-sm text-gray-500">
          Inventory management overview and key metrics
        </p>
      </div>
      
      <div class="mt-4 flex md:ml-4 md:mt-0">
        <BaseButton @click="refreshDashboard" :loading="isLoading('fetchDashboardStats')">
          <template #icon>
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </template>
          Refresh
        </BaseButton>
      </div>
    </div>

    <!-- Stats grid -->
    <div v-if="stats" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Total Assets -->
      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Total Assets</dt>
              <dd class="text-lg font-medium text-gray-900">{{ stats.totalAssets }}</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- Total Transactions -->
      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center h-8 w-8 rounded-md bg-green-500 text-white">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
              <dd class="text-lg font-medium text-gray-900">{{ stats.totalTransactions }}</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- Low Stock Alerts -->
      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center h-8 w-8 rounded-md bg-yellow-500 text-white">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Low Stock Alerts</dt>
              <dd class="text-lg font-medium text-gray-900">{{ stats.lowStockAlerts }}</dd>
            </dl>
          </div>
        </div>
      </div>

      <!-- Urgent Transactions -->
      <div class="card">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center h-8 w-8 rounded-md bg-red-500 text-white">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Urgent Transactions</dt>
              <dd class="text-lg font-medium text-gray-900">{{ stats.urgentTransactions }}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>

    <!-- Content grid -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Recent Transactions -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Recent Transactions</h3>
          <router-link
            to="/transactions"
            class="text-sm text-primary-600 hover:text-primary-500"
          >
            View all
          </router-link>
        </div>
        
        <div v-if="recentTransactions.length > 0" class="flow-root">
          <ul class="-my-5 divide-y divide-gray-200">
            <li
              v-for="transaction in recentTransactions"
              :key="transaction.transactionId"
              class="py-4"
            >
              <div class="flex items-center space-x-4">
                <div class="flex-shrink-0">
                  <div :class="[
                    'h-8 w-8 rounded-full flex items-center justify-center text-white text-sm',
                    transaction.transactionType === 'masuk' ? 'bg-green-500' : 'bg-red-500'
                  ]">
                    {{ transaction.transactionType === 'masuk' ? '+' : '-' }}
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ transaction.asset.materialName }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ transaction.division.divisionName }} • {{ transaction.quantity }} {{ transaction.asset.unitMeasure }}
                  </p>
                </div>
                <div class="flex-shrink-0 text-right">
                  <p class="text-sm text-gray-500">
                    {{ formatDate(transaction.createdAt) }}
                  </p>
                  <p :class="[
                    'text-xs px-2 py-1 rounded-full',
                    getPriorityColor(transaction.priorityStatus)
                  ]">
                    {{ transaction.priorityStatus }}
                  </p>
                </div>
              </div>
            </li>
          </ul>
        </div>
        
        <div v-else class="text-center py-6 text-gray-500">
          <p>No recent transactions</p>
        </div>
      </div>

      <!-- Low Stock Assets -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Low Stock Assets</h3>
          <router-link
            to="/inventory?filter=low-stock"
            class="text-sm text-primary-600 hover:text-primary-500"
          >
            View all
          </router-link>
        </div>
        
        <div v-if="lowStockAssets.length > 0" class="flow-root">
          <ul class="-my-5 divide-y divide-gray-200">
            <li
              v-for="asset in lowStockAssets"
              :key="asset.assetId"
              class="py-4"
            >
              <div class="flex items-center space-x-4">
                <div class="flex-shrink-0">
                  <div :class="[
                    'h-8 w-8 rounded-full flex items-center justify-center text-white text-xs',
                    asset.currentQuantity === 0 ? 'bg-red-500' : 'bg-yellow-500'
                  ]">
                    {{ asset.currentQuantity }}
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ asset.materialName }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ asset.category?.categoryName || 'Uncategorized' }}
                  </p>
                </div>
                <div class="flex-shrink-0 text-right">
                  <p :class="[
                    'text-sm font-medium',
                    asset.currentQuantity === 0 ? 'text-red-600' : 'text-yellow-600'
                  ]">
                    {{ asset.currentQuantity }} {{ asset.unitMeasure }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ asset.currentQuantity === 0 ? 'Out of stock' : 'Low stock' }}
                  </p>
                </div>
              </div>
            </li>
          </ul>
        </div>
        
        <div v-else class="text-center py-6 text-gray-500">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="mt-2 text-sm">All assets have healthy stock levels</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '../stores/dashboard.store'
import BaseButton from '../components/ui/BaseButton.vue'
import TooltipGuide from '../components/ui/TooltipGuide.vue'

const dashboardStore = useDashboardStore()
const {
  stats,
  recentTransactions,
  lowStockAssets,
  isLoading
} = storeToRefs(dashboardStore)

const refreshDashboard = async () => {
  await dashboardStore.refreshDashboard()
}

const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getPriorityColor = (priority: string): string => {
  const colors = {
    'prioritas': 'bg-red-100 text-red-800',
    'urgen': 'bg-orange-100 text-orange-800',
    'trivial': 'bg-green-100 text-green-800'
  }
  return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

onMounted(async () => {
  await dashboardStore.initialize()
})
</script>