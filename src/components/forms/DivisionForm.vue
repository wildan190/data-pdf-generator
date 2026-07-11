<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <BaseInput
      v-model="form.divisionName"
      label="Division Name"
      placeholder="Enter division name"
      required
      :error="errors.divisionName"
      @blur="validateField('divisionName')"
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
        {{ editMode ? 'Update' : 'Create' }} Division
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useDivisionStore } from '../../stores/division.store'
import { useNotificationStore } from '../../stores/notification.store'
import type { Division, CreateDivisionForm, FormErrors } from '../../types'
import BaseInput from '../ui/BaseInput.vue'
import BaseButton from '../ui/BaseButton.vue'

interface Props {
  division?: Division
  editMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editMode: false
})

const emit = defineEmits<{
  success: [division: Division]
  cancel: []
}>()

const divisionStore = useDivisionStore()
const notificationStore = useNotificationStore()

const loading = ref(false)
const form = reactive<CreateDivisionForm>({
  divisionName: ''
})

const errors = reactive<FormErrors>({
  divisionName: null
})

const isFormValid = computed(() => {
  return form.divisionName.trim().length >= 2 && !Object.values(errors).some(Boolean)
})

// Initialize form for edit mode
if (props.editMode && props.division) {
  form.divisionName = props.division.divisionName
}

const validateField = async (field: keyof CreateDivisionForm) => {
  errors[field] = null

  switch (field) {
    case 'divisionName':
      if (!form.divisionName.trim()) {
        errors.divisionName = 'Division name is required'
        return
      }
      
      if (form.divisionName.length < 2) {
        errors.divisionName = 'Division name must be at least 2 characters'
        return
      }
      
      if (form.divisionName.length > 100) {
        errors.divisionName = 'Division name must be less than 100 characters'
        return
      }

      // Check for duplicates (only in create mode or if name changed)
      if (!props.editMode || form.divisionName !== props.division?.divisionName) {
        const validation = await divisionStore.validateDivisionName(form.divisionName)
        if (!validation.isValid) {
          errors.divisionName = validation.message
        }
      }
      break
  }
}

const validateForm = async (): Promise<boolean> => {
  await validateField('divisionName')
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
    
    if (props.editMode && props.division) {
      result = await divisionStore.updateDivision(props.division.divisionId, form)
    } else {
      result = await divisionStore.createDivision(form)
    }

    if (result.success && result.data) {
      notificationStore.success(
        `Division ${props.editMode ? 'Updated' : 'Created'}`,
        `Division "${result.data.divisionName}" has been ${props.editMode ? 'updated' : 'created'} successfully`
      )
      emit('success', result.data)
    } else {
      notificationStore.error('Operation Failed', result.error || 'Failed to save division')
    }
  } catch (error) {
    console.error('Form submission error:', error)
    notificationStore.error('Unexpected Error', 'An unexpected error occurred')
  } finally {
    loading.value = false
  }
}

// Reset form when component is used for create mode
watch(() => props.division, (newDivision) => {
  if (props.editMode && newDivision) {
    form.divisionName = newDivision.divisionName
    // Clear errors when switching divisions
    Object.keys(errors).forEach(key => {
      errors[key as keyof FormErrors] = null
    })
  }
})
</script>