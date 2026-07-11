<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <BaseInput
      v-model="form.materialName"
      label="Material Name"
      placeholder="Enter material name"
      required
      :error="errors.materialName"
      @blur="validateField('materialName')"
    />

    <BaseSelect
      v-model="form.categoryId"
      label="Category"
      placeholder="Select a category"
      :options="categoryOptions"
      :error="errors.categoryId"
      hint="Select the material category"
      @blur="validateField('categoryId')"
    />

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <BaseInput
        v-model.number="form.initialQuantity"
        type="number"
        label="Initial Quantity"
        placeholder="0"
        :error="errors.initialQuantity"
        hint="Starting inventory quantity"
        @blur="validateField('initialQuantity')"
      />

      <BaseSelect
        v-model="form.unitMeasure"
        label="Unit of Measure"
        :options="unitOptions"
        :error="errors.unitMeasure"
        @blur="validateField('unitMeasure')"
      />
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
        {{ editMode ? 'Update' : 'Create' }} Asset
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useInventoryAssetStore } from '../../stores/inventory-asset.store'
import { useMaterialTypeStore } from '../../stores/material-type.store'
import { useNotificationStore } from '../../stores/notification.store'
import type { InventoryAsset, CreateInventoryAssetForm, FormErrors } from '../../types'
import { UNIT_MEASURES } from '../../types'
import BaseInput from '../ui/BaseInput.vue'
import BaseSelect from '../ui/BaseSelect.vue'
import BaseButton from '../ui/BaseButton.vue'

interface Props {
  asset?: InventoryAsset
  editMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editMode: false
})

const emit = defineEmits<{
  success: [asset: InventoryAsset]
  cancel: []
}>()

const inventoryAssetStore = useInventoryAssetStore()
const materialTypeStore = useMaterialTypeStore()
const notificationStore = useNotificationStore()

const { materialTypeOptions } = storeToRefs(materialTypeStore)

const loading = ref(false)
const form = reactive<CreateInventoryAssetForm>({
  materialName: '',
  categoryId: undefined,
  unitMeasure: 'pcs',
  initialQuantity: 0
})

const errors = reactive<FormErrors>({
  materialName: null,
  categoryId: null,
  unitMeasure: null,
  initialQuantity: null
})

const categoryOptions = computed(() => {
  return [
    { value: '', label: 'Select Category', disabled: true },
    ...materialTypeOptions.value
  ]
})

const unitOptions = computed(() => {
  return UNIT_MEASURES.map(unit => ({
    value: unit,
    label: unit.toUpperCase()
  }))
})

const isFormValid = computed(() => {
  return form.materialName.trim().length >= 3 && 
         form.unitMeasure && 
         (form.initialQuantity === undefined || form.initialQuantity >= 0) &&
         !Object.values(errors).some(Boolean)
})

// Initialize form for edit mode
if (props.editMode && props.asset) {
  form.materialName = props.asset.materialName
  form.categoryId = props.asset.categoryId
  form.unitMeasure = props.asset.unitMeasure
  form.initialQuantity = props.asset.currentQuantity
}

const validateField = async (field: keyof CreateInventoryAssetForm) => {
  errors[field] = null

  switch (field) {
    case 'materialName':
      if (!form.materialName.trim()) {
        errors.materialName = 'Material name is required'
        return
      }
      
      if (form.materialName.length < 3) {
        errors.materialName = 'Material name must be at least 3 characters'
        return
      }
      
      if (form.materialName.length > 255) {
        errors.materialName = 'Material name must be less than 255 characters'
        return
      }

      // Pattern validation
      const namePattern = /^[a-zA-Z0-9\s\-().&/]+$/
      if (!namePattern.test(form.materialName)) {
        errors.materialName = 'Material name can only contain letters, numbers, spaces, hyphens, parentheses, ampersands, and forward slashes'
        return
      }

      // Check for duplicates
      if (!props.editMode || form.materialName !== props.asset?.materialName) {
        const validation = await inventoryAssetStore.validateAsset(
          form,
          props.editMode ? props.asset?.assetId : undefined
        )
        if (validation.errors.materialName) {
          errors.materialName = validation.errors.materialName
        }
      }
      break

    case 'unitMeasure':
      if (!form.unitMeasure) {
        errors.unitMeasure = 'Unit of measure is required'
        return
      }
      
      if (!UNIT_MEASURES.includes(form.unitMeasure as any)) {
        errors.unitMeasure = 'Invalid unit of measure'
      }
      break

    case 'initialQuantity':
      if (form.initialQuantity !== undefined) {
        if (form.initialQuantity < 0) {
          errors.initialQuantity = 'Quantity cannot be negative'
        } else if (form.initialQuantity > 1000000) {
          errors.initialQuantity = 'Quantity cannot exceed 1,000,000'
        }
      }
      break
  }
}

const validateForm = async (): Promise<boolean> => {
  await Promise.all([
    validateField('materialName'),
    validateField('unitMeasure'),
    validateField('initialQuantity')
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
    
    if (props.editMode && props.asset) {
      // For edit mode, exclude initialQuantity as it's handled separately
      const updateData = {
        materialName: form.materialName,
        categoryId: form.categoryId,
        unitMeasure: form.unitMeasure
      }
      result = await inventoryAssetStore.updateAsset(props.asset.assetId, updateData)
    } else {
      result = await inventoryAssetStore.createAsset(form)
    }

    if (result.success && result.data) {
      notificationStore.success(
        `Asset ${props.editMode ? 'Updated' : 'Created'}`,
        `Asset "${result.data.materialName}" has been ${props.editMode ? 'updated' : 'created'} successfully`
      )
      emit('success', result.data)
    } else {
      notificationStore.error('Operation Failed', result.error || 'Failed to save asset')
    }
  } catch (error) {
    console.error('Form submission error:', error)
    notificationStore.error('Unexpected Error', 'An unexpected error occurred')
  } finally {
    loading.value = false
  }
}

// Load material types on mount
onMounted(async () => {
  if (materialTypeOptions.value.length === 0) {
    await materialTypeStore.fetchMaterialTypes()
  }
})

// Reset form when component is used for edit mode
watch(() => props.asset, (newAsset) => {
  if (props.editMode && newAsset) {
    form.materialName = newAsset.materialName
    form.categoryId = newAsset.categoryId
    form.unitMeasure = newAsset.unitMeasure
    form.initialQuantity = newAsset.currentQuantity
    // Clear errors when switching assets
    Object.keys(errors).forEach(key => {
      errors[key as keyof FormErrors] = null
    })
  }
})
</script>