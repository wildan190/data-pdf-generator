<template>
  <!-- Render FontAwesome icon -->
  <font-awesome-icon 
    v-if="type === 'fa'" 
    :icon="icon" 
    :class="iconClass" 
  />
  
  <!-- Render Lucide icon -->
  <component 
    v-else-if="type === 'lucide'" 
    :is="icon" 
    :class="iconClass" 
  />
  
  <!-- Fallback for regular i tag -->
  <i v-else :class="`${type} ${icon} ${iconClass}`"></i>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type: 'fa' | 'lucide' | 'fas' | 'far' | 'fab'
  icon: string | any
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  class: ''
})

const iconClass = computed(() => props.class)
</script>