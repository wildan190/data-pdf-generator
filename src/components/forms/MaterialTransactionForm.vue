<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <BaseSelect
      v-model.number="form.assetId"
      label="Material/Asset"
      placeholder="Select material"
      required
      :options="assetOptions"
      :error="errors.assetId ?? undefined"
      @change="onAssetChange"
      @blur="validateField('assetId')"
    />

    <div v-if="selectedAsset" class="p-4 bg-gray-50 rounded-lg">
      <div class="text-sm text-gray-600">
        <p><strong>Current Stock:</strong> {{ selectedAsset.currentQuantity }} {{ selectedAsset.unitMeasure }}</p>
        <p><strong>Category:</strong> {{ selectedAsset.category?.categoryName || 'Uncategorized' }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <BaseSelect
        v-model="form.transactionType"
        label="Transaction Type"
        required
        :options="transactionTypeOptions"
        :error="errors.transactionType ?? undefined"
        @change="onTransactionTypeChange"
        @blur="validateField('transactionType')"
      />

      <BaseInput
        v-model.number="form.quantity"
        type="number"
        label="Quantity"
        placeholder="Enter quantity"
        required
        :error="errors.quantity"
        :hint="quantityHint"
        @blur="validateField('quantity')"
      />
    </div>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <BaseSelect
        v-model="form.divisionId"
        label="Division"
        placeholder="Select division"
        required
        :options="divisionOptions"
        :error="errors.divisionId ?? undefined"
        @blur="validateField('divisionId')"
      />

      <BaseSelect
        v-model="form.priorityStatus"
        label="Priority"
        required
        :options="priorityOptions"
        :error="errors.priorityStatus ?? undefined"
        @blur="validateField('priorityStatus')"
      />
    </div>

    <BaseInput
      v-model="form.notes"
      label="Notes"
      placeholder="Enter additional notes (optional)"
      :error="errors.notes"
      hint="Optional description or comments about this transaction"
      @blur="validateField('notes')"
    />

    <!-- Stock warning -->
    <div v-if="stockWarning" class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-yellow-700">{{ stockWarning }}</p>
        </div>
      </div>
    </div>

    <div class="flex justify-end space-x-3">
      <BaseButton
        type="button"
        variant="ghost"
        @click="$emit('cancel')"
      >
        Cancel
      </BaseButton>
      
      <BaseButton
        type="submit"
        :loading="loading"
        :disabled="!isFormValid"
      >
        {{ editMode ? 'Update' : 'Create' }} Transaction
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMaterialTransactionStore } from '../../stores/material-transaction.store'
import { useInventoryAssetStore } from '../../stores/inventory-asset.store'
import { useDivisionStore } from '../../stores/division.store'
import { useNotificationStore } from '../../stores/notification.store'
import type { 
  MaterialTransaction, 
  CreateMaterialTransactionForm, 
  FormErrors,
  InventoryAssetWithCategory 
} from '../../types'
import { TRANSACTION_TYPES, PRIORITY_STATUSES } from '../../types'
import BaseInput from '../ui/BaseInput.vue'
import BaseSelect from '../ui/BaseSelect.vue'
import BaseButton from '../ui/BaseButton.vue'

interface Props {
  transaction?: MaterialTransaction
  editMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editMode: false
})

const emit = defineEmits<{
  success: [transaction: MaterialTransaction]
  cancel: []
}>()

const materialTransactionStore = useMaterialTransactionStore()
const inventoryAssetStore = useInventoryAssetStore()
const divisionStore = useDivisionStore()
const notificationStore = useNotificationStore()

const { assetOptions } = storeToRefs(inventoryAssetStore)
const { divisionOptions } = storeToRefs(divisionStore)

const loading = ref(false)
const selectedAsset = ref<InventoryAssetWithCategory | null>(null)
const stockWarning = ref<string>('')

const form = reactive<CreateMaterialTransactionForm>({
  assetId: 0,
  divisionId: 0,
  quantity: 1,
  transactionType: 'masuk',
  priorityStatus: 'trivial',
  notes: ''
})

const errors = reactive<FormErrors>({
  assetId: null,
  divisionId: null,
  quantity: null,
  transactionType: null,
  priorityStatus: null,
  notes: null
})

const transactionTypeOptions = computed(() => [...TRANSACTION_TYPES])
const priorityOptions = computed(() => [...PRIORITY_STATUSES])

const quantityHint = computed(() => {
  if (selectedAsset.value && form.transactionType === 'keluar') {
    return `Available: ${selectedAsset.value.currentQuantity} ${selectedAsset.value.unitMeasure}`
  }
  return 'Enter the quantity for this transaction'
})

const isFormValid = computed(() => {
  return form.assetId > 0 && 
         form.divisionId > 0 && 
         form.quantity > 0 && 
         form.transactionType && 
         form.priorityStatus &&
         !Object.values(errors).some(Boolean)
})

// Initialize form for edit mode
if (props.editMode && props.transaction) {
  form.assetId = props.transaction.assetId
  form.divisionId = props.transaction.divisionId
  form.quantity = props.transaction.quantity
  form.transactionType = props.transaction.transactionType
  form.priorityStatus = props.transaction.priorityStatus
  form.notes = props.transaction.notes || ''
}

const onAssetChange = () => {
  if (form.assetId > 0) {
    selectedAsset.value = inventoryAssetStore.findAssetById(form.assetId) || null
    checkStockWarning()
  } else {
    selectedAsset.value = null
    stockWarning.value = ''
  }
  validateField('assetId')
}

const onTransactionTypeChange = () => {
  checkStockWarning()
  validateField('transactionType')
}

const checkStockWarning = () => {
  stockWarning.value = ''
  
  if (!selectedAsset.value || form.transactionType !== 'keluar' || !form.quantity) {
    return
  }

  if (form.quantity > selectedAsset.value.currentQuantity) {
    stockWarning.value = `Insufficient stock! Available: ${selectedAsset.value.currentQuantity}, Requested: ${form.quantity}`
  } else if (selectedAsset.value.currentQuantity - form.quantity <= 5) {
    stockWarning.value = `This transaction will result in low stock: ${selectedAsset.value.currentQuantity - form.quantity} remaining`
  }
}

const validateField = async (field: keyof CreateMaterialTransactionForm) => {
  errors[field] = null

  switch (field) {
    case 'assetId':
      if (!form.assetId || form.assetId <= 0) {
        errors.assetId = 'Material/Asset is required'
      }
      break

    case 'divisionId':
      if (!form.divisionId || form.divisionId <= 0) {
        errors.divisionId = 'Division is required'
      }
      break

    case 'quantity':
      if (!form.quantity || form.quantity <= 0) {
        errors.quantity = 'Quantity must be greater than 0'
      } else if (form.quantity > 1000000) {
        errors.quantity = 'Quantity cannot exceed 1,000,000'
      } else if (form.transactionType === 'keluar' && selectedAsset.value) {
        if (form.quantity > selectedAsset.value.currentQuantity) {
          errors.quantity = `Insufficient stock. Available: ${selectedAsset.value.currentQuantity}`
        }
      }
      checkStockWarning()
      break

    case 'transactionType':
      if (!form.transactionType) {
        errors.transactionType = 'Transaction type is required'
      }
      break

    case 'priorityStatus':
      if (!form.priorityStatus) {
        errors.priorityStatus = 'Priority status is required'
      }
      break

    case 'notes':
      if (form.notes && form.notes.length > 1000) {
        errors.notes = 'Notes must be less than 1000 characters'
      }
      break
  }
}

const validateForm = async (): Promise<boolean> => {
  await Promise.all([
    validateField('assetId'),
    validateField('divisionId'),
    validateField('quantity'),
    validateField('transactionType'),
    validateField('priorityStatus'),
    validateField('notes')
  ])
  return isFormValid.value
}

const handleSubmit = async () => {
  if (loading.value) return

  const isValid = await validateForm()
  if (!isValid) {
    notificationStore.error('Validation Error', 'Please fix the form errors before submitting')
    return
  }

  loading.value = true

  try {
    let result
    
    if (props.editMode && props.transaction) {
      // For edit mode, only allow updating notes and priority
      const updateData = {
        notes: form.notes,
        priorityStatus: form.priorityStatus
      }
      result = await materialTransactionStore.updateTransaction(props.transaction.transactionId, updateData)
    } else {
      result = await materialTransactionStore.createTransaction(form)
    }

    if (result.success && result.data) {
      const transactionType = form.transactionType === 'masuk' ? 'incoming' : 'outgoing'
      notificationStore.success(
        `Transaction ${props.editMode ? 'Updated' : 'Created'}`,
        `${transactionType} transaction has been ${props.editMode ? 'updated' : 'created'} successfully`
      )
      emit('success', result.data)
    } else {
      notificationStore.error('Operation Failed', result.error || 'Failed to save transaction')
    }
  } catch (error) {
    console.error('Form submission error:', error)
    notificationStore.error('Unexpected Error', 'An unexpected error occurred')
  } finally {
    loading.value = false
  }
}

// Load required data on mount
onMounted(async () => {
  await Promise.all([
    assetOptions.value.length === 0 && inventoryAssetStore.fetchAssets(),
    divisionOptions.value.length === 0 && divisionStore.fetchDivisions()
  ])

  // Set selected asset if editing or if assetId is set
  if (form.assetId > 0) {
    onAssetChange()
  }
})

// Watch quantity changes to update warnings
watch(() => form.quantity, checkStockWarning)

// Reset form when component is used for edit mode
watch(() => props.transaction, (newTransaction) => {
  if (props.editMode && newTransaction) {
    form.assetId = newTransaction.assetId
    form.divisionId = newTransaction.divisionId
    form.quantity = newTransaction.quantity
    form.transactionType = newTransaction.transactionType
    form.priorityStatus = newTransaction.priorityStatus
    form.notes = newTransaction.notes || ''
    onAssetChange()
    
    // Clear errors when switching transactions
    Object.keys(errors).forEach(key => {
      errors[key as keyof FormErrors] = null
    })
  }
})
</script>