<template>
  <img 
    :src="iconSrc" 
    :alt="name" 
    :class="['theme-icon', sizeClass]"
    :style="{ width: computedSize, height: computedSize }"
    @error="handleError"
    v-bind="$attrs"
  />
</template>

<script setup>
import { computed, ref } from 'vue';
import { useThemeAwareIcons } from '@/utils/iconLoader';

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [String, Number],
    default: '12px'
  },
  theme: {
    type: String,
    validator: (val) => ['light', 'dark', 'auto'].includes(val),
    default: 'auto'
  }
});

const { getIconPath, getIconPathForTheme } = useThemeAwareIcons();
const hasError = ref(false);

const iconSrc = computed(() => {
  if (hasError.value) {
    // Fallback to a default icon
    return '/assets/icons/common/question-mark.svg';
  }
  
  if (props.theme === 'auto') {
    return getIconPath(props.name);
  } else {
    return getIconPathForTheme(props.name, props.theme);
  }
});

const computedSize = computed(() => {
  if (typeof props.size === 'number') {
    return \`\${props.size}px\`;
  }
  return props.size;
});

const sizeClass = computed(() => {
  const numSize = parseInt(props.size);
  if (!isNaN(numSize)) {
    if (numSize <= 12) return 'icon-xs';
    if (numSize <= 16) return 'icon-sm';
    if (numSize <= 20) return 'icon-md';
    if (numSize <= 24) return 'icon-lg';
    return 'icon-xl';
  }
  return 'icon-sm';
});

function handleError() {
  console.warn(\`[ThemeIcon] Failed to load icon: \${props.name}\`);
  hasError.value = true;
}
</script>

<style scoped>
.theme-icon {
  display: inline-block;
  vertical-align: middle;
  user-select: none;
  flex-shrink: 0;
  transition: opacity 0.2s ease;
}

.theme-icon:hover {
  opacity: 0.8;
}

.icon-xs { min-width: 12px; min-height: 12px; }
.icon-sm { min-width: 16px; min-height: 16px; }
.icon-md { min-width: 20px; min-height: 20px; }
.icon-lg { min-width: 24px; min-height: 24px; }
.icon-xl { min-width: 32px; min-height: 32px; }
</style>
