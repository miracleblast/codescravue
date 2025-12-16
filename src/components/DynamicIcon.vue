<!-- src/components/DynamicIcon.vue -->
<script setup>
import { computed } from 'vue';

const props = defineProps({
  icon: {
    type: [String, Object],
    required: true
  },
  width: {
    type: String,
    default: '24px'
  },
  height: {
    type: String,
    default: '24px'
  },
  color: {
    type: String,
    default: 'currentColor'
  }
});

const resolvedIcon = computed(() => {
  if (typeof props.icon === 'object' && props.icon.isDynamic) {
    // Handle dynamic icon object from VueIconHelper
    const { condition, trueIcon, falseIcon } = props.icon;
    
    // Evaluate condition (you'd need to pass context)
    // For now, return trueIcon as default
    return trueIcon;
  }
  
  return props.icon;
});

const iconHtml = computed(() => {
  if (window.iconifyRegistry) {
    return window.iconifyRegistry.renderIcon(resolvedIcon.value, {
      width: props.width,
      height: props.height,
      color: props.color
    });
  }
  
  // Fallback
  return `<svg width="${props.width}" height="${props.height}" viewBox="0 0 24 24">
    <rect width="24" height="24" fill="#4a5568"/>
    <text x="12" y="16" text-anchor="middle" fill="white" font-size="10">ICO</text>
  </svg>`;
});
</script>

<template>
  <span v-html="iconHtml" />
</template>