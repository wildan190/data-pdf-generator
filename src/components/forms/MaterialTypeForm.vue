<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <BaseInput
      v-model="form.categoryName"
      label="Category Name"
      placeholder="Enter category name"
      required
      :error="errors.categoryName"
      @blur="validateField('categoryName')"
    />

    <BaseInput
      v-model="form.description"
      label="Description"
      placeholder="Enter description (optional)"
      :error="errors.description"
      hint="Optional description of the material category"
      @blur="validateField('description')"
    />

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
        {{ editMode ? 'Update' : 'Create' }} Category
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useMaterialTypeStore } from '../../stores/material-type.store'
import { useNotificationStore } from '../../stores/notification.store'
import type { MaterialType, CreateMaterialTypeForm, FormErrors } from '../../types'
import BaseInput from '../ui/BaseInput.vue'
import BaseButton from '../ui/BaseButton.vue'

interface Props {
  materialType?: MaterialType
  editMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editMode: false
})

const emit = defineEmits<{
  success: [materialType: MaterialType]
  cancel: []
}>()

const materialTypeStore = useMaterialTypeStore()
const notificationStore = useNotificationStore()

const loading = ref(false)
const form = reactive<CreateMaterialTypeForm>({
  categoryName: '',
  description: ''
})

const errors = reactive<FormErrors>({
  categoryName: null,
  description: null
})

const isFormValid = computed(() => {
  return form.categoryName.trim().length >= 2 && !Object.values(errors).some(Boolean)
})

// Initialize form for edit mode
if (props.editMode && props.materialType) {
  form.categoryName = props.materialType.categoryName
  form.description = props.materialType.description || ''
}

const validateField = async (field: keyof CreateMaterialTypeForm) => {
  errors[field] = null

  switch (field) {
    case 'categoryName':
      if (!form.categoryName.trim()) {
        errors.categoryName = 'Category name is required'
        return
      }
      
      if (form.categoryName.length < 2) {
        errors.categoryName = 'Category name must be at least 2 characters'
        return
      }
      
      if (form.categoryName.length > 100) {
        errors.categoryName = 'Category name must be less than 100 characters'
        return
      }

      // Pattern validation
      const namePattern = /^[a-zA-Z0-9\s\-&().]+$/
      if (!namePattern.test(form.categoryName)) {
        errors.categoryName = 'Category name can only contain letters, numbers, spaces, hyphens, ampersands, and parentheses'
        return
      }

      // Check for duplicates
      if (!props.editMode || form.categoryName !== props.materialType?.categoryName) {
        const validation = await materialTypeStore.validateMaterialType(
          form,
          props.editMode ? props.materialType?.categoryId : undefined
        )
        if (validation.errors.categoryName) {
          errors.categoryName = validation.errors.categoryName
        }
      }
      break

    case 'description':
      if (form.description && form.description.length > 500) {
        errors.description = 'Description must be less than 500 characters'
      }
      break
  }
}

const validateForm = async (): Promise<boolean> => {
  await Promise.all([
    validateField('categoryName'),
    validateField('description')
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
    
    if (props.editMode && props.materialType) {
      result = await materialTypeStore.updateMaterialType(props.materialType.categoryId, form)
    } else {
      result = await materialTypeStore.createMaterialType(form)
    }

    if (result.success && result.data) {
      notificationStore.success(
        `Category ${props.editMode ? 'Updated' : 'Created'}`,
        `Category "${result.data.categoryName}" has been ${props.editMode ? 'updated' : 'created'} successfully`
      )
      emit('success', result.data)
    } else {
      notificationStore.error('Operation Failed', result.error || 'Failed to save category')
    }
  } catch (error) {
    console.error('Form submission error:', error)
    notificationStore.error('Unexpected Error', 'An unexpected error occurred')
  } finally {
    loading.value = false
  }
}

// Reset form when component is used for edit mode
watch(() => props.materialType, (newMaterialType) => {
  if (props.editMode && newMaterialType) {
    form.categoryName = newMaterialType.categoryName
    form.description = newMaterialType.description || ''
    // Clear errors when switching material types
    Object.keys(errors).forEach(key => {
      errors[key as keyof FormErrors] = null
    })
  }
})
</script>