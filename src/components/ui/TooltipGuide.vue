<template>
  <div class="relative inline-block">
    <!-- Trigger element -->
    <div @mouseenter="showTooltip = true" @mouseleave="showTooltip = false">
      <slot name="trigger">
        <button
          type="button"
          class="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
          aria-label="Help"
        >
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
        </button>
      </slot>
    </div>

    <!-- Tooltip content -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="showTooltip"
        :class="[
          'absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm',
          'max-w-xs break-words',
          positionClasses
        ]"
        role="tooltip"
      >
        <div class="relative">
          <!-- Tooltip content -->
          <div class="space-y-2">
            <div v-if="title" class="font-semibold text-blue-200">{{ title }}</div>
            <div class="text-gray-100">{{ content }}</div>
            <div v-if="steps && steps.length > 0" class="space-y-1">
              <div class="text-xs font-medium text-blue-200 uppercase tracking-wide">Steps:</div>
              <ol class="text-xs space-y-1">
                <li v-for="(step, index) in steps" :key="index" class="flex">
                  <span class="text-blue-300 mr-2">{{ index + 1 }}.</span>
                  <span>{{ step }}</span>
                </li>
              </ol>
            </div>
          </div>

          <!-- Arrow -->
          <div
            :class="[
              'absolute w-2 h-2 bg-gray-900 transform rotate-45',
              arrowClasses
            ]"
          ></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  title?: string
  content: string
  steps?: string[]
  position?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top'
})

const showTooltip = ref(false)

const positionClasses = computed(() => {
  const positions = {
    'top': 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    'bottom': 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    'left': 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    'right': 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    'top-left': 'bottom-full right-0 mb-2',
    'top-right': 'bottom-full left-0 mb-2',
    'bottom-left': 'top-full right-0 mt-2',
    'bottom-right': 'top-full left-0 mt-2'
  }
  return positions[props.position]
})

const arrowClasses = computed(() => {
  const arrows = {
    'top': 'top-full left-1/2 transform -translate-x-1/2 -mt-1',
    'bottom': 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1',
    'left': 'left-full top-1/2 transform -translate-y-1/2 -ml-1',
    'right': 'right-full top-1/2 transform -translate-y-1/2 -mr-1',
    'top-left': 'top-full right-3 -mt-1',
    'top-right': 'top-full left-3 -mt-1',
    'bottom-left': 'bottom-full right-3 -mb-1',
    'bottom-right': 'bottom-full left-3 -mb-1'
  }
  return arrows[props.position]
})
</script>