<template>
  <teleport to="body">
    <transition name="modal" appear>
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <!-- Background overlay -->
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          @click="closeModal"
        ></div>

        <!-- Modal container -->
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <transition
            name="modal-content"
            enter-active-class="ease-out duration-300"
            enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to-class="opacity-100 translate-y-0 sm:scale-100"
            leave-active-class="ease-in duration-200"
            leave-from-class="opacity-100 translate-y-0 sm:scale-100"
            leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div
              v-if="modelValue"
              :class="modalClasses"
              @click.stop
            >
              <!-- Header -->
              <div v-if="$slots.header || title || closable" class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <slot name="header">
                      <h3 v-if="title" class="text-lg font-medium text-gray-900">
                        {{ title }}
                      </h3>
                    </slot>
                  </div>
                  
                  <button
                    v-if="closable"
                    type="button"
                    class="ml-3 inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    @click="closeModal"
                  >
                    <span class="sr-only">Close</span>
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Body -->
              <div :class="bodyClasses">
                <slot />
              </div>

              <!-- Footer -->
              <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <slot name="footer" />
              </div>
            </div>
          </transition>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  closable?: boolean
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  closeOnOverlay: true,
  closeOnEscape: true,
  persistent: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const modalClasses = computed(() => {
  const baseClasses = [
    'relative',
    'transform',
    'overflow-hidden',
    'rounded-lg',
    'bg-white',
    'text-left',
    'shadow-xl',
    'transition-all',
    'w-full'
  ]

  const sizeClasses = {
    sm: ['sm:max-w-sm'],
    md: ['sm:max-w-md'],
    lg: ['sm:max-w-lg'],
    xl: ['sm:max-w-xl'],
    '2xl': ['sm:max-w-2xl'],
    full: ['sm:max-w-full', 'sm:mx-4']
  }

  return [...baseClasses, ...sizeClasses[props.size]]
})

const bodyClasses = computed(() => {
  return ['px-6', 'py-4']
})

const closeModal = () => {
  if (!props.persistent && props.closeOnOverlay) {
    emit('update:modelValue', false)
    emit('close')
  }
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEscape && !props.persistent) {
    closeModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
  // Prevent body scrolling when modal is open
  if (props.modelValue) {
    document.body.style.overflow = 'hidden'
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>