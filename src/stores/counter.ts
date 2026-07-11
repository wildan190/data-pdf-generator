// Import all stores
import { useDivisionStore } from './division.store'
import { useMaterialTypeStore } from './material-type.store'
import { useInventoryAssetStore } from './inventory-asset.store'
import { useMaterialTransactionStore } from './material-transaction.store'
import { useReportStore } from './report.store'
import { useDashboardStore } from './dashboard.store'
import { useNotificationStore } from './notification.store'

// Export all stores
export {
  useDivisionStore,
  useMaterialTypeStore,
  useInventoryAssetStore,
  useMaterialTransactionStore,
  useReportStore,
  useDashboardStore,
  useNotificationStore
}

// Export base store utilities
export * from './base.store'

// Store initialization helper
export function initializeStores() {
  const divisionStore = useDivisionStore()
  const materialTypeStore = useMaterialTypeStore()
  const inventoryAssetStore = useInventoryAssetStore()
  const materialTransactionStore = useMaterialTransactionStore()
  const reportStore = useReportStore()
  const dashboardStore = useDashboardStore()
  const notificationStore = useNotificationStore()

  return {
    divisionStore,
    materialTypeStore,
    inventoryAssetStore,
    materialTransactionStore,
    reportStore,
    dashboardStore,
    notificationStore,
    
    // Initialize all stores
    async initialize() {
      await Promise.all([
        divisionStore.initialize(),
        materialTypeStore.initialize(),
        inventoryAssetStore.initialize(),
        materialTransactionStore.initialize(),
        dashboardStore.initialize()
      ])
    },

    // Reset all stores
    resetAll() {
      divisionStore.resetStore()
      materialTypeStore.resetStore()
      inventoryAssetStore.resetStore()
      materialTransactionStore.resetStore()
      reportStore.resetStore()
      dashboardStore.resetStore()
      notificationStore.clearAllNotifications()
    },

    // Cleanup resources
    cleanup() {
      dashboardStore.cleanup()
    }
  }
}
