<template>
  <transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="show"
      class="pointer-events-auto w-full sm:w-[384px] overflow-hidden rounded-xl border bg-white/90 backdrop-blur-md shadow-2xl relative transition-all duration-300 hover:shadow-indigo-100/30"
      :class="{
        'border-green-200/80 shadow-green-100/40': type === 'success',
        'border-red-200/80 shadow-red-100/40': type === 'error',
        'border-yellow-200/80 shadow-yellow-100/40': type === 'warning',
        'border-blue-200/80 shadow-blue-100/40': type === 'info'
      }"
    >
      <!-- Gradient accent on the left side -->
      <div 
        class="absolute left-0 top-0 bottom-0 w-1.5"
        :class="{
          'bg-gradient-to-b from-green-400 to-emerald-500': type === 'success',
          'bg-gradient-to-b from-red-400 to-rose-500': type === 'error',
          'bg-gradient-to-b from-yellow-400 to-amber-500': type === 'warning',
          'bg-gradient-to-b from-blue-400 to-indigo-500': type === 'info'
        }"
      ></div>

      <div class="p-4 pl-6">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <!-- Icon with soft background circle -->
            <div 
              class="w-8 h-8 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
              :class="{
                'bg-green-50/80 text-green-600': type === 'success',
                'bg-red-50/80 text-red-600': type === 'error',
                'bg-yellow-50/80 text-yellow-600': type === 'warning',
                'bg-blue-50/80 text-blue-600': type === 'info'
              }"
            >
              <!-- Success -->
              <svg
                v-if="type === 'success'"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              
              <!-- Error -->
              <svg
                v-else-if="type === 'error'"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              
              <!-- Warning -->
              <svg
                v-else-if="type === 'warning'"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              
              <!-- Info -->
              <svg
                v-else
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <div class="ml-3.5 w-0 flex-1 pt-0.5">
            <p class="text-sm font-semibold text-gray-900 leading-5">
              {{ title }}
            </p>
            <p v-if="message" class="mt-1 text-xs text-gray-500 font-medium leading-4 whitespace-pre-line">
              {{ message }}
            </p>
          </div>
          
          <div class="ml-4 flex flex-shrink-0">
            <button
              type="button"
              class="inline-flex rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 focus:outline-none transition-all"
              @click="close"
            >
              <span class="sr-only">Close</span>
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Animated timer line at the bottom -->
      <div v-if="!persistent && duration > 0" class="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-100/60 overflow-hidden">
        <div 
          class="h-full progress-bar-fill" 
          :style="{ 
            animationDuration: `${duration}ms`,
            animationPlayState: show ? 'running' : 'paused'
          }"
          :class="{
            'bg-green-500': type === 'success',
            'bg-red-500': type === 'error',
            'bg-yellow-500': type === 'warning',
            'bg-blue-500': type === 'info'
          }"
        ></div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Notification } from '../../types'

interface Props {
  notification: Notification
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: [id: string]
}>()

const show = ref(false)

const { id, type, title, message, duration = 5000, persistent = false } = props.notification

const close = () => {
  show.value = false
  setTimeout(() => {
    emit('close', id)
  }, 150)
}

onMounted(() => {
  show.value = true
  
  if (!persistent && duration > 0) {
    setTimeout(close, duration)
  }
})
</script>

<style scoped>
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}
.progress-bar-fill {
  animation-name: shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
</style>