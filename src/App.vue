<script setup lang="ts">
import AppLayout from './components/layout/AppLayout.vue'
import NotificationContainer from './components/ui/NotificationContainer.vue'
</script>

<template>
  <AppLayout>
    <router-view />
  </AppLayout>
  <NotificationContainer />
</template>

<style scoped></style>
