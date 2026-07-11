<template>
  <div class="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-300">
        <!-- Header -->
        <thead class="bg-gray-50">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="getHeaderClasses(column)"
              @click="handleSort(column)"
            >
              <div class="flex items-center">
                <span>{{ column.label }}</span>
                
                <!-- Sort icons -->
                <span v-if="column.sortable" class="ml-2 flex-none rounded text-gray-400">
                  <svg
                    v-if="sortField === column.key"
                    class="h-4 w-4"
                    :class="sortDirection === 'asc' ? '' : 'rotate-180'"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                  <svg
                    v-else
                    class="h-4 w-4 opacity-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </span>
              </div>
            </th>
            
            <!-- Actions column -->
            <th v-if="$slots.actions" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        <!-- Body -->
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr v-if="loading" v-for="n in 5" :key="n">
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-4 text-sm text-gray-500"
            >
              <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
            </td>
            <td v-if="$slots.actions" class="px-6 py-4">
              <div class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            </td>
          </tr>

          <tr v-else-if="data.length === 0">
            <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="px-6 py-12 text-center">
              <div class="text-gray-500">
                <slot name="empty">
                  <div class="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 class="mt-2 text-sm font-medium text-gray-900">No data</h3>
                  <p class="mt-1 text-sm text-gray-500">No records found.</p>
                </slot>
              </div>
            </td>
          </tr>

          <tr
            v-else
            v-for="(item, index) in data"
            :key="getItemKey(item, index)"
            :class="getRowClasses(item, index)"
            @click="$emit('row-click', item, index)"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="getCellClasses(column)"
            >
              <slot
                :name="`cell-${column.key}`"
                :item="item"
                :value="getItemValue(item, column.key)"
                :index="index"
              >
                {{ formatCellValue(item, column) }}
              </slot>
            </td>
            
            <!-- Actions -->
            <td v-if="$slots.actions" class="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
              <slot name="actions" :item="item" :index="index" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination" class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center text-sm text-gray-700">
          <span>
            Showing {{ (pagination.page - 1) * pagination.pageSize + 1 }} to 
            {{ Math.min(pagination.page * pagination.pageSize, pagination.total) }} of 
            {{ pagination.total }} results
          </span>
        </div>
        
        <div class="flex items-center space-x-2">
          <BaseButton
            size="sm"
            variant="ghost"
            :disabled="pagination.page <= 1"
            @click="$emit('page-change', pagination.page - 1)"
          >
            Previous
          </BaseButton>
          
          <BaseButton
            size="sm"
            variant="ghost"
            :disabled="pagination.page >= pagination.totalPages"
            @click="$emit('page-change', pagination.page + 1)"
          >
            Next
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TableColumn, PaginationState } from '../../types'
import BaseButton from './BaseButton.vue'

interface Props {
  columns: TableColumn[]
  data: any[]
  loading?: boolean
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  pagination?: PaginationState
  rowKey?: string
  selectable?: boolean
  selectedItems?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  sortDirection: 'asc',
  rowKey: 'id',
  selectable: false,
  selectedItems: () => []
})

const emit = defineEmits<{
  'sort-change': [field: string, direction: 'asc' | 'desc']
  'page-change': [page: number]
  'row-click': [item: any, index: number]
  'selection-change': [items: any[]]
}>()

const getHeaderClasses = (column: TableColumn) => {
  const baseClasses = ['px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 'text-gray-500', 'uppercase', 'tracking-wider']
  
  if (column.sortable) {
    baseClasses.push('cursor-pointer', 'hover:bg-gray-100', 'user-select-none')
  }
  
  if (column.align === 'center') {
    baseClasses.push('text-center')
  } else if (column.align === 'right') {
    baseClasses.push('text-right')
  }
  
  return baseClasses
}

const getCellClasses = (column: TableColumn) => {
  const baseClasses = ['px-6', 'py-4', 'text-sm', 'text-gray-900']
  
  if (column.align === 'center') {
    baseClasses.push('text-center')
  } else if (column.align === 'right') {
    baseClasses.push('text-right')
  }
  
  return baseClasses
}

const getRowClasses = (item: any, index: number) => {
  const baseClasses = ['hover:bg-gray-50']
  
  if (props.selectable && props.selectedItems?.some(selected => selected[props.rowKey] === item[props.rowKey])) {
    baseClasses.push('bg-blue-50')
  }
  
  return baseClasses
}

const getItemKey = (item: any, index: number): string => {
  return item[props.rowKey] || index.toString()
}

const getItemValue = (item: any, key: string): any => {
  return key.split('.').reduce((obj, k) => obj?.[k], item)
}

const formatCellValue = (item: any, column: TableColumn): string => {
  const value = getItemValue(item, column.key)
  
  if (value === null || value === undefined) {
    return '-'
  }
  
  if (value instanceof Date) {
    return value.toLocaleDateString()
  }
  
  return String(value)
}

const handleSort = (column: TableColumn) => {
  if (!column.sortable) return
  
  const newDirection = props.sortField === column.key && props.sortDirection === 'asc' ? 'desc' : 'asc'
  emit('sort-change', column.key, newDirection)
}
</script>