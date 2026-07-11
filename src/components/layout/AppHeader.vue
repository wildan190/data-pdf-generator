<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 justify-between items-center">
        <!-- Mobile menu button -->
        <div class="flex items-center md:hidden">
          <button
            type="button"
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            aria-expanded="false"
          >
            <span class="sr-only">Open main menu</span>
            <Menu v-if="!mobileMenuOpen" class="block h-6 w-6" />
            <svg v-else class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Logo and title -->
        <div class="flex items-center flex-1 md:flex-none justify-center md:justify-start">
          <div class="flex-shrink-0 flex items-center">
            <Package class="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
            <h1 class="ml-2 sm:ml-3 text-lg sm:text-xl font-semibold text-gray-900 truncate">
              <span class="hidden sm:inline">Inventory Manager</span>
              <span class="sm:hidden">Inventory</span>
            </h1>
          </div>
        </div>

        <!-- Desktop Navigation -->
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

        <!-- Right side actions -->
        <div class="flex items-center space-x-2 sm:space-x-4">
          <!-- Notifications -->
          <div class="relative" ref="notificationsRef">
            <button
              type="button"
              class="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              @click="showNotifications = !showNotifications"
            >
              <span class="sr-only">View notifications</span>
              <Bell class="h-5 w-5 sm:h-6 sm:w-6" />
              <span v-if="totalAlerts > 0" class="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                <span class="hidden sm:inline">{{ totalAlerts > 9 ? '9+' : totalAlerts }}</span>
                <span class="sm:hidden"></span>
              </span>
            </button>

            <!-- Notification dropdown -->
            <div
              v-if="showNotifications"
              class="absolute right-0 z-10 mt-2 w-72 sm:w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              <div class="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <p class="text-sm font-medium text-gray-900">Notifications</p>
                <button
                  v-if="totalAlerts > 0"
                  type="button"
                  @click="handleMarkAllAsRead"
                  class="text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors"
                >
                  Mark all as read
                </button>
              </div>

              <div v-if="dashboardStats" class="px-4 py-3 space-y-2">
                <div v-if="dashboardStats.lowStockAlerts > 0" class="flex items-center text-sm text-yellow-600">
                  <AlertTriangle class="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{{ dashboardStats.lowStockAlerts }} low stock alerts</span>
                </div>

                <div v-if="dashboardStats.urgentTransactions > 0" class="flex items-center text-sm text-red-600">
                  <AlertCircle class="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{{ dashboardStats.urgentTransactions }} urgent transactions</span>
                </div>

                <div v-if="totalAlerts === 0" class="text-sm text-gray-500 text-center py-4">
                  No alerts at this time
                </div>
              </div>
            </div>
          </div>

          <!-- Quick actions -->
          <div class="relative" ref="quickActionsRef">
            <button
              type="button"
              class="inline-flex items-center px-2 sm:px-3 py-2 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              @click="showQuickActions = !showQuickActions"
            >
              <Plus class="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
              <span class="hidden sm:inline">Quick Add</span>
              <span class="sm:hidden ml-1">Add</span>
            </button>

            <!-- Quick actions dropdown -->
            <div
              v-if="showQuickActions"
              class="absolute right-0 z-10 mt-2 w-44 sm:w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              <button
                v-for="action in quickActions"
                :key="action.name"
                type="button"
                class="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                @click="handleQuickAction(action.action)"
              >
                <component :is="action.icon" class="h-4 w-4 mr-3 flex-shrink-0" />
                {{ action.name }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Navigation Menu -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div v-if="mobileMenuOpen" class="md:hidden">
          <div class="px-2 pt-2 pb-3 space-y-1 bg-gray-50 border-t border-gray-200">
            <router-link
              v-for="item in navigation"
              :key="item.name"
              :to="item.to"
              @click="mobileMenuOpen = false"
              :class="[
                'flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors',
                $route.path === item.to
                  ? 'text-primary-700 bg-primary-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              ]"
            >
              <component :is="item.icon" class="h-5 w-5 mr-3" />
              {{ item.name }}
            </router-link>
          </div>
        </div>
      </Transition>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '../../stores/dashboard.store'
import {
  Home,
  Building2,
  Tag,
  Box,
  ArrowRightLeft,
  BarChart3,
  AlertCircle,
  Plus,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Package
} from '@lucide/vue'

const dashboardStore = useDashboardStore()
const { stats: dashboardStats } = storeToRefs(dashboardStore)

const showNotifications = ref(false)
const showQuickActions = ref(false)
const mobileMenuOpen = ref(false)
const notificationsRef = ref<HTMLElement | null>(null)
const quickActionsRef = ref<HTMLElement | null>(null)

const emit = defineEmits<{
  'quick-action': [action: string]
}>()

const handleMarkAllAsRead = () => {
  if (dashboardStore.stats) {
    dashboardStore.stats.lowStockAlerts = 0
    dashboardStore.stats.urgentTransactions = 0
  }
}

const navigation = [
  {
    name: 'Dashboard',
    to: '/',
    icon: Home
  },
  {
    name: 'Divisions',
    to: '/divisions',
    icon: Building2
  },
  {
    name: 'Material Types',
    to: '/material-types',
    icon: Tag
  },
  {
    name: 'Inventory',
    to: '/inventory',
    icon: Box
  },
  {
    name: 'Reports',
    to: '/reports',
    icon: BarChart3
  }
]

const quickActions = [
  {
    name: 'Add Division',
    action: 'add-division',
    icon: Building2
  },
  {
    name: 'Add Material Type',
    action: 'add-material-type',
    icon: Tag
  },
  {
    name: 'Add Asset',
    action: 'add-asset',
    icon: Box
  },
  {
    name: 'New Transaction',
    action: 'add-transaction',
    icon: ArrowRightLeft
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
const handleClickOutside = (event: MouseEvent) => {
  if (notificationsRef.value && !notificationsRef.value.contains(event.target as Node)) {
    showNotifications.value = false
  }
  if (quickActionsRef.value && !quickActionsRef.value.contains(event.target as Node)) {
    showQuickActions.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

onMounted(async () => {
  // Load dashboard stats for notifications
  await dashboardStore.fetchDashboardStats()
})
</script>