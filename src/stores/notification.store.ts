import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Notification } from '../types'

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref<Notification[]>([])
  const maxNotifications = ref(10)
  const defaultDuration = ref(5000)

  // Computed
  const activeNotifications = computed(() => notifications.value)
  const errorNotifications = computed(() => notifications.value.filter(n => n.type === 'error'))
  const warningNotifications = computed(() => notifications.value.filter(n => n.type === 'warning'))
  const successNotifications = computed(() => notifications.value.filter(n => n.type === 'success'))
  const infoNotifications = computed(() => notifications.value.filter(n => n.type === 'info'))
  const totalCount = computed(() => notifications.value.length)
  const hasNotifications = computed(() => notifications.value.length > 0)

  // Actions
  const addNotification = (notification: Omit<Notification, 'id'>): string => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    
    const newNotification: Notification = {
      id,
      ...notification
    }
    
    // Add to the beginning of the array (newest first)
    notifications.value.unshift(newNotification)
    
    // Limit the number of notifications
    if (notifications.value.length > maxNotifications.value) {
      const removed = notifications.value.splice(maxNotifications.value)
      // Clear timeouts for removed notifications
      removed.forEach(n => clearNotificationTimeout(n.id))
    }
    
    // Auto-remove non-persistent notifications
    if (!notification.persistent) {
      const duration = notification.duration ?? defaultDuration.value
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
    
    return id
  }

  const removeNotification = (id: string): boolean => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
      clearNotificationTimeout(id)
      return true
    }
    return false
  }

  const clearAllNotifications = () => {
    notifications.value.forEach(n => clearNotificationTimeout(n.id))
    notifications.value = []
  }

  const clearByType = (type: Notification['type']) => {
    notifications.value = notifications.value.filter(n => {
      if (n.type === type) {
        clearNotificationTimeout(n.id)
        return false
      }
      return true
    })
  }

  const clearNotificationTimeout = (id: string) => {
    // In a real implementation, we'd track timeouts
    // For now, this is a placeholder
  }

  // Convenience methods for different notification types
  const success = (title: string, message?: string, options?: Partial<Notification>): string => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options
    })
  }

  const error = (title: string, message?: string, options?: Partial<Notification>): string => {
    return addNotification({
      type: 'error',
      title,
      message,
      persistent: true, // Errors should be persistent by default
      ...options
    })
  }

  const warning = (title: string, message?: string, options?: Partial<Notification>): string => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration: 8000, // Warnings should stay longer
      ...options
    })
  }

  const info = (title: string, message?: string, options?: Partial<Notification>): string => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options
    })
  }

  // API response handlers
  const handleApiSuccess = (message: string, data?: any) => {
    success('Success', message)
  }

  const handleApiError = (error: string | Error, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : error
    const title = context ? `${context} Failed` : 'Operation Failed'
    error(title, errorMessage)
  }

  const handleApiWarning = (message: string, context?: string) => {
    const title = context ? `${context} Warning` : 'Warning'
    warning(title, message)
  }

  // Form validation helpers
  const showValidationErrors = (errors: { [field: string]: string }) => {
    const errorMessages = Object.entries(errors).map(([field, message]) => `${field}: ${message}`)
    error('Validation Failed', errorMessages.join('; '))
  }

  const showFormSuccess = (action: string, item?: string) => {
    const message = item ? `${item} ${action} successfully` : `${action} completed successfully`
    success('Success', message)
  }

  // Bulk operations
  const showBulkOperationResult = (
    action: string, 
    successCount: number, 
    errorCount: number, 
    total: number
  ) => {
    if (errorCount === 0) {
      success(`${action} Completed`, `Successfully ${action.toLowerCase()} ${successCount} items`)
    } else if (successCount === 0) {
      error(`${action} Failed`, `Failed to ${action.toLowerCase()} ${errorCount} items`)
    } else {
      warning(
        `${action} Partially Completed`, 
        `${successCount} items successful, ${errorCount} items failed`
      )
    }
  }

  // Settings
  const setMaxNotifications = (max: number) => {
    maxNotifications.value = Math.max(1, Math.min(max, 50))
    
    // Remove excess notifications if needed
    if (notifications.value.length > maxNotifications.value) {
      const removed = notifications.value.splice(maxNotifications.value)
      removed.forEach(n => clearNotificationTimeout(n.id))
    }
  }

  const setDefaultDuration = (duration: number) => {
    defaultDuration.value = Math.max(1000, Math.min(duration, 30000))
  }

  return {
    // State
    notifications: activeNotifications,
    maxNotifications: computed(() => maxNotifications.value),
    defaultDuration: computed(() => defaultDuration.value),

    // Computed
    errorNotifications,
    warningNotifications,
    successNotifications,
    infoNotifications,
    totalCount,
    hasNotifications,

    // Actions
    addNotification,
    removeNotification,
    clearAllNotifications,
    clearByType,

    // Convenience methods
    success,
    error,
    warning,
    info,

    // API handlers
    handleApiSuccess,
    handleApiError,
    handleApiWarning,

    // Form helpers
    showValidationErrors,
    showFormSuccess,
    showBulkOperationResult,

    // Settings
    setMaxNotifications,
    setDefaultDuration
  }
})