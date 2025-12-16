<!-- src/components/LocalIcon.vue - FIXED VERSION -->
<template>
  <img
    :src="iconSrc"
    :alt="icon"
    :width="size"
    :height="size"
    :style="{ display: 'inline-block', verticalAlign: 'middle', color: color }"
    class="local-icon"
    @error="handleError"
  />
</template>

<script>
export default {
  name: 'LocalIcon',
  props: {
    icon: {
      type: String,
      required: true
    },
    size: {
      type: [String, Number],
      default: '24px'
    },
    color: {
      type: String,
      default: 'currentColor'
    }
  },
  data() {
    return {
      basePath: window.location.href.includes('file://') 
        ? '.'  // Electron file protocol
        : '/'  // Web server
    };
  },
  computed: {
    iconSrc() {
      // Special mappings for problematic icons
      const mappings = {
        'material-symbols:class': 'ic--outline-class.svg',
        'material-symbols:clear': 'mdi--clear-bold.svg',
        'material-symbols:cpp': 'vscode-icons--file-type-cpp2.svg',
        'material-symbols:cpu': 'solar--cpu-bold.svg',
        'material-symbols:email': 'mdi--email-outline.svg',
        'material-symbols:format_ink_highlighter': 'material-symbols--format-ink-highlighter.svg',
        'material-symbols:format_quote': 'material-symbols--format-quote.svg',
        'material-symbols:java': 'vscode-icons--file-type-java.svg',
        'material-symbols:json': 'vscode-icons--file-type-json.svg',
        'material-symbols:method': 'ri--input-method-fill.svg',
        'material-symbols:property': 'codicon--symbol-property.svg',
        'material-symbols:proxy': 'mdi--proxy.svg',
        'material-symbols:python': 'vscode-icons--file-type-python.svg',
        'material-symbols:queue': 'material-icon-theme--folder-queue.svg',
        'material-symbols:restore': 'mdi-backup-restore.svg',
        'material-symbols:sidebar': 'codicon--layout-sidebar-left.svg',
        'material-symbols:typescript': 'vscode-icons-file-type-typescript.svg',
        'material-symbols:xml': 'vscode-icons-file-type-xml.svg',
        
        // Other replacements
        'majesticons:dashboard-line': 'clarity-dashboard-line.svg',
        'majesticons:question-mark-circle-line': 'mdi-question-mark-circle-outline.svg',
        'iconamoon:cloud-download-light': 'material-symbols-cloud-download.svg',
        'solar:folder-with-files-linear': 'material-symbols-folder-open.svg',
        'solar:sun-linear': 'material-symbols-light-mode.svg',
        'solar:moon-linear': 'material-symbols-dark-mode.svg'
      };
      
      const fileName = mappings[this.icon] || this.icon.replace(/:/g, '-') + '.svg';
      return `${this.basePath}/assets/icons/${fileName}`;
    }
  },
  methods: {
    handleError(event) {
      console.warn(`Failed to load icon: ${this.icon}`, event.target.src);
      // Show fallback emoji
      event.target.style.display = 'none';
      const fallback = document.createElement('span');
      fallback.textContent = '📦';
      fallback.style.cssText = `
        display: inline-block;
        vertical-align: middle;
        font-size: ${this.size};
        color: ${this.color};
      `;
      event.target.parentNode.insertBefore(fallback, event.target);
    }
  }
}
</script>

<style scoped>
.local-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>