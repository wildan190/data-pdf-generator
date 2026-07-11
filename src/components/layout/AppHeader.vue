<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 justify-between items-center">
        <!-- Logo and title -->
        <div class="flex items-center">
          <div class="flex-shrink-0 flex items-center">
            <svg class="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h1 class="ml-3 text-xl font-semibold text-gray-900">
              Inventory Manager
            </h1>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="hidden md:flex space-x-8">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.to"
            :class="[
              'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors',
              $route.path === item.to
                ? 'border-primary-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <component :is="item.icon" class="h-4 w-4 mr-2" />
            {{ item.name }}
          </router-link>
        </nav>

        <!-- Right side -->
        <div class="flex items-center space-x-4">
          <!-- Notifications -->
          <div class="relative">
            <button
              type="button"
              class="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              @click="showNotifications = !showNotifications"
            >
              <span class="sr-only">View notifications</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span v-if="totalAlerts > 0" class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                {{ totalAlerts > 9 ? '9+' : totalAlerts }}
              </span>
            </button>

            <!-- Notification dropdown -->
            <div
              v-if="showNotifications"
              class="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              <div class="px-4 py-3 border-b border-gray-200">
                <p class="text-sm font-medium text-gray-900">Notifications</p>
              </div>
              
              <div v-if="dashboardStats" class="px-4 py-3 space-y-2">
                <div v-if="dashboardStats.lowStockAlerts > 0" class="flex items-center text-sm text-yellow-600">
                  <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {{ dashboardStats.lowStockAlerts }} low stock alerts
                </div>
                
                <div v-if="dashboardStats.urgentTransactions > 0" class="flex items-center text-sm text-red-600">
                  <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ dashboardStats.urgentTransactions }} urgent transactions
                </div>
                
                <div v-if="totalAlerts === 0" class="text-sm text-gray-500 text-center py-4">
                  No alerts at this time
                </div>
              </div>
            </div>
          </div>

          <!-- Quick actions -->
          <div class="relative">
            <button
              type="button"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              @click="showQuickActions = !showQuickActions"
            >
              <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Quick Add
            </button>

            <!-- Quick actions dropdown -->
            <div
              v-if="showQuickActions"
              class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              <button
                v-for="action in quickActions"
                :key="action.name"
                type="button"
                class="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                @click="handleQuickAction(action.action)"
              >
                <component :is="action.icon" class="h-4 w-4 mr-3" />
                {{ action.name }}
              </button>
            </div>
          </div>

          <!-- Mobile menu button -->
          <button
            type="button"
            class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <span class="sr-only">Open main menu</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile navigation -->
      <div v-if="mobileMenuOpen" class="md:hidden">
        <div class="pt-2 pb-3 space-y-1">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.to"
            :class="[
              'block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors',
              $route.path === item.to
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300'
            ]"
            @click="mobileMenuOpen = false"
          >
            {{ item.name }}
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onClickOutside } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '../../stores/dashboard.store'

const dashboardStore = useDashboardStore()
const { stats: dashboardStats } = storeToRefs(dashboardStore)

const showNotifications = ref(false)
const showQuickActions = ref(false)
const mobileMenuOpen = ref(false)

const emit = defineEmits<{
  'quick-action': [action: string]
}>()

const navigation = [
  {
    name: 'Dashboard',
    to: '/',
    icon: 'HomeIcon'
  },
  {
    name: 'Divisions',
    to: '/divisions',
    icon: 'BuildingOfficeIcon'
  },
  {
    name: 'Material Types',
    to: '/material-types',
    icon: 'TagIcon'
  },
  {
    name: 'Inventory',
    to: '/inventory',
    icon: 'CubeIcon'
  },
  {
    name: 'Transactions',
    to: '/transactions',
    icon: 'ArrowsRightLeftIcon'
  },
  {
    name: 'Reports',
    to: '/reports',
    icon: 'DocumentChartBarIcon'
  }
]

const quickActions = [
  {
    name: 'Add Division',
    action: 'add-division',
    icon: 'BuildingOfficeIcon'
  },
  {
    name: 'Add Material Type',
    action: 'add-material-type',
    icon: 'TagIcon'
  },
  {
    name: 'Add Asset',
    action: 'add-asset',
    icon: 'CubeIcon'
  },
  {
    name: 'New Transaction',
    action: 'add-transaction',
    icon: 'ArrowsRightLeftIcon'
  }
]

const totalAlerts = computed(() => {
  if (!dashboardStats.value) return 0
  return (dashboardStats.value.lowStockAlerts || 0) + (dashboardStats.value.urgentTransactions || 0)
})

const handleQuickAction = (action: string) => {
  showQuickActions.value = false
  emit('quick-action', action)
}

// Close dropdowns when clicking outside
onClickOutside(showNotifications, () => {
  showNotifications.value = false
})

onClickOutside(showQuickActions, () => {
  showQuickActions.value = false
})

onMounted(async () => {
  // Load dashboard stats for notifications
  await dashboardStore.fetchDashboardStats()
})
</script>