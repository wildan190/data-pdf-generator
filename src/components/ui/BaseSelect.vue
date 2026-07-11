<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>
    
    <div class="relative">
      <select
        :id="id"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :class="selectClasses"
        @change="handleChange"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      >
        <option v-if="placeholder" value="" disabled>
          {{ placeholder }}
        </option>
        
        <option
          v-for="option in options"
          :key="getOptionValue(option)"
          :value="getOptionValue(option)"
          :disabled="getOptionDisabled(option)"
        >
          {{ getOptionLabel(option) }}
        </option>
      </select>
      
      <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
    
    <p v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
    
    <p v-if="hint && !error" class="mt-1 text-sm text-gray-500">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface Props {
  modelValue?: string | number
  options: (SelectOption | string | number)[]
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
  id?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  size: 'md',
  options: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  blur: [event: Event]
  focus: [event: Event]
}>()

const selectClasses = computed(() => {
  const baseClasses = [
    'block',
    'w-full',
    'border',
    'rounded-lg',
    'bg-white',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-primary-500',
    'focus:border-transparent',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'disabled:bg-gray-50',
    'pr-10',
    'appearance-none'
  ]

  // Size classes
  const sizeClasses = {
    sm: ['px-3', 'py-1.5', 'text-sm'],
    md: ['px-3', 'py-2', 'text-sm'],
    lg: ['px-4', 'py-2.5', 'text-base']
  }

  // State classes
  const stateClasses = props.error
    ? ['border-red-300', 'focus:ring-red-500']
    : ['border-gray-300']

  return [
    ...baseClasses,
    ...sizeClasses[props.size],
    ...stateClasses
  ]
})

const getOptionValue = (option: SelectOption | string | number): string | number => {
  if (typeof option === 'object') return option.value
  return option
}

const getOptionLabel = (option: SelectOption | string | number): string => {
  if (typeof option === 'object') return option.label
  return String(option)
}

const getOptionDisabled = (option: SelectOption | string | number): boolean => {
  if (typeof option === 'object') return option.disabled || false
  return false
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = target.value
  emit('update:modelValue', value)
}
</script>