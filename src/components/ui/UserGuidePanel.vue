<template>
  <div class="fixed bottom-6 right-6 z-50">
    <!-- Guide toggle button -->
    <button
      v-if="!showPanel"
      @click="showPanel = true"
      class="group relative inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover:scale-105"
      aria-label="Show user guide"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      
      <!-- Pulse animation for first-time users -->
      <div class="absolute -inset-1 bg-blue-400 rounded-full animate-ping opacity-75"></div>
    </button>

    <!-- Guide panel -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 transform translate-y-4 scale-95"
      enter-to-class="opacity-100 transform translate-y-0 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 transform translate-y-0 scale-100"
      leave-to-class="opacity-0 transform translate-y-4 scale-95"
    >
      <div
        v-if="showPanel"
        class="mb-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 class="text-white font-semibold">User Guide</h3>
          </div>
          <button
            @click="showPanel = false"
            class="text-white hover:text-gray-200 transition-colors"
            aria-label="Close guide"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-4 max-h-96 overflow-y-auto">
          <!-- Page-specific guide -->
          <div v-if="currentPageGuide" class="mb-4">
            <h4 class="text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <svg class="w-4 h-4 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
              </svg>
              {{ currentPageGuide.title }}
            </h4>
            <p class="text-sm text-gray-600 mb-3">{{ currentPageGuide.description }}</p>
            
            <div v-if="currentPageGuide.quickTips && currentPageGuide.quickTips.length > 0" class="space-y-2">
              <div class="text-xs font-medium text-gray-700 uppercase tracking-wide">Quick Tips:</div>
              <ul class="space-y-1">
                <li v-for="tip in currentPageGuide.quickTips" :key="tip" class="text-sm text-gray-600 flex items-start">
                  <svg class="w-3 h-3 mt-1 mr-2 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  {{ tip }}
                </li>
              </ul>
            </div>
          </div>

          <!-- General guides -->
          <div class="space-y-3">
            <h4 class="text-sm font-semibold text-gray-800 flex items-center">
              <svg class="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Actions
            </h4>
            <div class="text-sm text-gray-600 space-y-2">
              <div class="flex items-center">
                <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Quick Add</kbd>
                <span class="ml-2">Add new items from any page</span>
              </div>
              <div class="flex items-center">
                <kbd class="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">🔔</kbd>
                <span class="ml-2">Check notifications for alerts</span>
              </div>
            </div>
            
            <h4 class="text-sm font-semibold text-gray-800 flex items-center pt-2">
              <svg class="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Navigation Tips
            </h4>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>• Use the sidebar to navigate between sections</li>
              <li>• Dashboard shows overview and statistics</li>
              <li>• Reports section for generating exports</li>
              <li>• Search and filter data easily</li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>Need help? Hover over ? icons</span>
            <button
              @click="showPanel = false"
              class="text-blue-600 hover:text-blue-700 font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const showPanel = ref(false)

interface PageGuide {
  title: string
  description: string
  quickTips: string[]
}

const pageGuides: Record<string, PageGuide> = {
  '/': {
    title: 'Dashboard',
    description: 'Your inventory overview with key metrics and recent activities.',
    quickTips: [
      'Check notification bell for alerts',
      'Use Quick Add for fast data entry',
      'View recent transactions in activity feed'
    ]
  },
  '/divisions': {
    title: 'Divisions Management',
    description: 'Manage organizational divisions and their transaction statistics.',
    quickTips: [
      'Use Quick Add instead of the Add Division button',
      'Click on division names to view details',
      'Sort columns by clicking headers'
    ]
  },
  '/material-types': {
    title: 'Material Types',
    description: 'Define and organize different types of materials in your inventory.',
    quickTips: [
      'Use Quick Add for new material types',
      'Group similar materials under same type',
      'Edit existing types by clicking on them'
    ]
  },
  '/inventory': {
    title: 'Inventory Assets',
    description: 'Track all your inventory items, quantities, and stock levels.',
    quickTips: [
      'Use filters to find specific items quickly',
      'Red indicators show low stock items',
      'Use Quick Add for new assets',
      'Click quantity to see transaction history'
    ]
  },
  '/transactions': {
    title: 'Transactions',
    description: 'Record and monitor all incoming and outgoing inventory movements.',
    quickTips: [
      'Use priority levels for urgent items',
      'Filter by date range for reports',
      'Track which division made transactions'
    ]
  },
  '/reports': {
    title: 'Reports & Analytics',
    description: 'Generate detailed reports and export data for analysis.',
    quickTips: [
      'Use date filters to narrow down data',
      'Export multiple reports at once',
      'Check investment reports for stock analysis',
      'Download in PDF or Excel format'
    ]
  }
}

const currentPageGuide = computed(() => {
  return pageGuides[route.path] || null
})
</script>