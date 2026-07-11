<template>
  <div class="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:items-start sm:justify-end sm:p-6 z-50">
    <div class="flex flex-col items-center space-y-4 sm:items-end">
      <NotificationToast
        v-for="notification in notifications"
        :key="notification.id"
        :notification="notification"
        @close="removeNotification"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '../../stores/notification.store'
import NotificationToast from './NotificationToast.vue'

const notificationStore = useNotificationStore()
const { notifications } = storeToRefs(notificationStore)

const removeNotification = (id: string) => {
  notificationStore.removeNotification(id)
}
</script>