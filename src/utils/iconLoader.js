import { ref, watch } from 'vue';

// Simple theme detector (adjust based on your setup)
function detectTheme() {
  if (typeof window !== 'undefined') {
    const isDark = localStorage.getItem('theme') === 'dark' || 
                   window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? 'dark' : 'light';
  }
  return 'light';
}

export function useThemeAwareIcons() {
  const iconTheme = ref(detectTheme());
  
  // Watch for theme changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      iconTheme.value = e.matches ? 'dark' : 'light';
    });
    
    // Also listen to localStorage changes if you have a theme switcher
    window.addEventListener('storage', (e) => {
      if (e.key === 'theme') {
        iconTheme.value = e.newValue === 'dark' ? 'dark' : 'light';
      }
    });
  }
  
  function getIconPath(iconName) {
    const filename = iconName.endsWith('.svg') ? iconName : \`\${iconName}.svg\`;
    return \`/assets/icons/\${iconTheme.value}/\${filename}\`;
  }
  
  function getIconPathForTheme(iconName, forceTheme = null) {
    const themeToUse = forceTheme || iconTheme.value;
    const filename = iconName.endsWith('.svg') ? iconName : \`\${iconName}.svg\`;
    return \`/assets/icons/\${themeToUse}/\${filename}\`;
  }
  
  return {
    iconTheme,
    getIconPath,
    getIconPathForTheme,
    isDarkTheme: () => iconTheme.value === 'dark'
  };
}
