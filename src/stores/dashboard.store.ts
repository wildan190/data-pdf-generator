import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useBaseStore, apiClient } from './base.store'
import type { 
  DashboardStats,
  InventoryAssetWithCategory,
  MaterialTransactionWithRelations,
  Notification
} from '../types'

export const useDashboardStore = defineStore('dashboard', () => {
  // Base store functionality
  const baseStore = useBaseStore('dashboard')

  // State
  const stats = ref<DashboardStats | null>(null)
  const recentTransactions = ref<MaterialTransactionWithRelations[]>([])
  const lowStockAssets = ref<InventoryAssetWithCategory[]>([])
  const urgentTransactions = ref<MaterialTransactionWithRelations[]>([])
  const notifications = ref<Notification[]>([])
  const refreshInterval = ref<number | null>(null)
  const autoRefreshEnabled = ref(false)
  const refreshIntervalMs = ref(30000) // 30 seconds

  // Computed
  const totalAlerts = computed(() => 
    (stats.value?.lowStockAlerts || 0) + (stats.value?.urgentTransactions || 0)
  )

  const recentActivity = computed(() => 
    stats.value?.recentActivityCount || 0
  )

  const stockHealth = computed(() => {
    if (!stats.value) return { status: 'unknown', percentage: 0 }
    
    const { totalAssets, lowStockAlerts } = stats.value
    if (totalAssets === 0) return { status: 'unknown', percentage: 0 }
    
    const healthyAssets = totalAssets - lowStockAlerts
    const percentage = Math.round((healthyAssets / totalAssets) * 100)
    
    let status: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent'
    if (percentage < 50) status = 'critical'
    else if (percentage < 70) status = 'warning'
    else if (percentage < 90) status = 'good'
    
    return { status, percentage }
  })

  const activityTrend = computed(() => {
    if (!stats.value) return 'stable'
    
    const { totalIncoming, totalOutgoing } = stats.value
    const difference = totalIncoming - totalOutgoing
    
    if (difference > totalIncoming * 0.1) return 'increasing'
    if (difference < -totalOutgoing * 0.1) return 'decreasing'
    return 'stable'
  })

  const criticalAlerts = computed(() => 
    notifications.value.filter(n => n.type === 'error' || n.type === 'warning')
  )

  const unreadNotifications = computed(() => 
    notifications.value.length
  )

  // Actions
  const fetchDashboardStats = async () => {
    return baseStore.handleApiCall(
      'fetchDashboardStats',
      () => apiClient.get<DashboardStats>('/dashboard/stats'),
      (data) => {
        stats.value = data
      }
    )
  }

  const fetchRecentTransactions = async (limit = 5) => {
    return baseStore.handleApiCall(
      'fetchRecentTransactions',
      () => apiClient.get<MaterialTransactionWithRelations[]>(`/dashboard/recent-transactions?limit=${limit}`),
      (data) => {
        recentTransactions.value = data
      }
    )
  }

  const fetchLowStockAssets = async (limit = 5) => {
    return baseStore.handleApiCall(
      'fetchLowStockAssets',
      () => apiClient.get<InventoryAssetWithCategory[]>(`/dashboard/low-stock?limit=${limit}`),
      (data) => {
        lowStockAssets.value = data
        
        // Generate notifications for critically low stock
        const criticalAssets = data.filter(asset => asset.currentQuantity === 0)
        criticalAssets.forEach(asset => {
          addNotification({
            type: 'error',
            title: 'Out of Stock',
            message: `${asset.materialName} is out of stock`,
            persistent: true
          })
        })
      }
    )
  }

  const fetchUrgentTransactions = async (limit = 5) => {
    return baseStore.handleApiCall(
      'fetchUrgentTransactions',
      () => apiClient.get<MaterialTransactionWithRelations[]>(`/dashboard/urgent-transactions?limit=${limit}`),
      (data) => {
        urgentTransactions.value = data
      }
    )
  }

  const refreshDashboard = async () => {
    await Promise.all([
      fetchDashboardStats(),
      fetchRecentTransactions(),
      fetchLowStockAssets(),
      fetchUrgentTransactions()
    ])
  }

  const startAutoRefresh = (intervalMs = 30000) => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
    }
    
    refreshIntervalMs.value = intervalMs
    autoRefreshEnabled.value = true
    
    refreshInterval.value = setInterval(async () => {
      await refreshDashboard()
    }, intervalMs)
  }

  const stopAutoRefresh = () => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
    autoRefreshEnabled.value = false
  }

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...notification
    }
    
    notifications.value.unshift(newNotification)
    
    // Auto-remove non-persistent notifications after duration
    if (!notification.persistent) {
      const duration = notification.duration || 5000
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, duration)
    }
    
    // Limit total notifications
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50)
    }
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAllNotifications = () => {
    notifications.value = []
  }

  const markNotificationAsRead = (id: string) => {
    // For future implementation when we add read/unread status
    console.log('Marking notification as read:', id)
  }

  const clearAlerts = () => {
    if (stats.value) {
      stats.value.lowStockAlerts = 0
      stats.value.urgentTransactions = 0
    }
  }

  // System health check
  const performHealthCheck = async () => {
    return baseStore.handleApiCall(
      'performHealthCheck',
      () => apiClient.get<{ healthy: boolean, message: string }>('/dashboard/health-check'),
      (data) => {
        if (!data.healthy) {
          addNotification({
            type: 'error',
            title: 'System Health Warning',
            message: data.message || 'System health check failed',
            persistent: true
          })
        }
      }
    )
  }

  // Quick actions
  const getQuickStats = () => {
    if (!stats.value) return null
    
    return {
      totalAssets: stats.value.totalAssets,
      totalTransactions: stats.value.totalTransactions,
      alertCount: totalAlerts.value,
      recentActivityCount: recentActivity.value,
      stockHealthPercentage: stockHealth.value.percentage,
      stockHealthStatus: stockHealth.value.status
    }
  }

  const getAlertSummary = () => {
    return {
      lowStock: stats.value?.lowStockAlerts || 0,
      urgent: stats.value?.urgentTransactions || 0,
      total: totalAlerts.value,
      critical: criticalAlerts.value.length
    }
  }

  const generateActivityInsights = () => {
    if (!stats.value) return []
    
    const insights: string[] = []
    
    // Stock insights
    if (stats.value.lowStockAlerts > 0) {
      insights.push(`${stats.value.lowStockAlerts} assets have low stock levels`)
    }
    
    // Transaction insights
    if (stats.value.urgentTransactions > 0) {
      insights.push(`${stats.value.urgentTransactions} urgent transactions require attention`)
    }
    
    // Activity insights
    if (stats.value.recentActivityCount > 10) {
      insights.push('High activity detected in the last week')
    } else if (stats.value.recentActivityCount === 0) {
      insights.push('No recent activity detected')
    }
    
    // Balance insights
    const trend = activityTrend.value
    if (trend === 'increasing') {
      insights.push('Inventory levels are increasing')
    } else if (trend === 'decreasing') {
      insights.push('Inventory levels are decreasing')
    }
    
    return insights
  }

  const resetStore = () => {
    stats.value = null
    recentTransactions.value = []
    lowStockAssets.value = []
    urgentTransactions.value = []
    notifications.value = []
    
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
    
    autoRefreshEnabled.value = false
    refreshIntervalMs.value = 30000
    baseStore.resetState()
  }

  // Initialize dashboard
  const initialize = async () => {
    await refreshDashboard()
    await performHealthCheck()
    
    // Start auto-refresh by default
    startAutoRefresh()
  }

  // Cleanup on store destruction
  const cleanup = () => {
    stopAutoRefresh()
  }

  return {
    // State
    stats: computed(() => stats.value),
    recentTransactions: computed(() => recentTransactions.value),
    lowStockAssets: computed(() => lowStockAssets.value),
    urgentTransactions: computed(() => urgentTransactions.value),
    notifications: computed(() => notifications.value),
    autoRefreshEnabled: computed(() => autoRefreshEnabled.value),
    refreshIntervalMs: computed(() => refreshIntervalMs.value),

    // Computed
    totalAlerts,
    recentActivity,
    stockHealth,
    activityTrend,
    criticalAlerts,
    unreadNotifications,

    // Loading & Error states from base store
    isLoading: baseStore.isLoading,
    hasError: baseStore.hasError,
    getError: baseStore.getError,
    lastUpdated: baseStore.lastUpdated,

    // Actions
    fetchDashboardStats,
    fetchRecentTransactions,
    fetchLowStockAssets,
    fetchUrgentTransactions,
    refreshDashboard,
    startAutoRefresh,
    stopAutoRefresh,
    addNotification,
    removeNotification,
    clearAllNotifications,
    markNotificationAsRead,
    clearAlerts,
    performHealthCheck,

    // Utility methods
    getQuickStats,
    getAlertSummary,
    generateActivityInsights,
    resetStore,
    initialize,
    cleanup
  }
})