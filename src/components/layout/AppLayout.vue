<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <AppHeader @quick-action="handleQuickAction" />

    <!-- Main content -->
    <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>

    <!-- Quick action modals -->
    <BaseModal
      v-model="showDivisionModal"
      title="Add Division"
      size="md"
    >
      <DivisionForm
        @success="handleDivisionSuccess"
        @cancel="showDivisionModal = false"
      />
    </BaseModal>

    <BaseModal
      v-model="showMaterialTypeModal"
      title="Add Material Type"
      size="md"
    >
      <MaterialTypeForm
        @success="handleMaterialTypeSuccess"
        @cancel="showMaterialTypeModal = false"
      />
    </BaseModal>

    <BaseModal
      v-model="showAssetModal"
      title="Add Inventory Asset"
      size="lg"
    >
      <InventoryAssetForm
        @success="handleAssetSuccess"
        @cancel="showAssetModal = false"
      />
    </BaseModal>

    <!-- Global notification container -->
    <NotificationContainer />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// Components
import AppHeader from './AppHeader.vue'
import BaseModal from '../ui/BaseModal.vue'
import DivisionForm from '../forms/DivisionForm.vue'
import MaterialTypeForm from '../forms/MaterialTypeForm.vue'
import InventoryAssetForm from '../forms/InventoryAssetForm.vue'
import NotificationContainer from '../ui/NotificationContainer.vue'

const router = useRouter()

// Modal states
const showDivisionModal = ref(false)
const showMaterialTypeModal = ref(false)
const showAssetModal = ref(false)

// Quick action handlers
const handleQuickAction = (action: string) => {
  switch (action) {
    case 'add-division':
      showDivisionModal.value = true
      break
    case 'add-material-type':
      showMaterialTypeModal.value = true
      break
    case 'add-asset':
      showAssetModal.value = true
      break
  }
}

// Success handlers
const handleDivisionSuccess = () => {
  showDivisionModal.value = false
  // Optionally navigate to divisions page or refresh current view
  if (router.currentRoute.value.path !== '/divisions') {
    router.push('/divisions')
  }
}

const handleMaterialTypeSuccess = () => {
  showMaterialTypeModal.value = false
  if (router.currentRoute.value.path !== '/material-types') {
    router.push('/material-types')
  }
}

const handleAssetSuccess = () => {
  showAssetModal.value = false
  if (router.currentRoute.value.path !== '/inventory') {
    router.push('/inventory')
  }
}
</script>