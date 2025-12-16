// scripts/download-all-icons-nuclear.mjs
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { createWriteStream } from 'fs';
import https from 'https';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

console.log('🚀 NUCLEAR DOWNLOAD STARTING - Getting ALL your icons as SVG!\n');

// ALL your icons organized by collection
const ALL_ICONS = {
  // Problematic ones first
  'majesticons': ['dashboard-line', 'question-mark-circle-line'],
  'iconamoon': ['cloud-download-light'],
  'solar': ['folder-with-files-linear', 'sun-linear', 'moon-linear'],
  'material-symbols': [
    'add', 'analytics', 'animation', 'api', 'arrow-back', 'arrow-downward',
    'arrow-forward', 'arrow-upward', 'auto-mode', 'autorenew', 'backup',
    'block', 'bookmark', 'bookmark-outline', 'bug-report', 'calendar-today',
    'chat', 'check-circle', 'circle', 'class', 'clear', 'clear-all',
    'close', 'cloud', 'cloud-download', 'cloud-sync', 'code', 'code-blocks',
    'code-off', 'computer', 'contact-support', 'content-copy', 'cpp',
    'cpu', 'create-new-folder', 'css', 'currency-bitcoin', 'dark-mode',
    'dashboard', 'data-usage', 'delete', 'description', 'desktop-windows',
    'download', 'drag-handle', 'edit', 'email', 'error', 'expand-less',
    'expand-more', 'favorite', 'favorite-outline', 'file-open', 'filter-list',
    'flag', 'flash-on', 'folder', 'folder-open', 'format-list-numbered',
    'format_ink_highlighter', 'format_quote', 'forum', 'function', 'gavel',
    'grid-view', 'handshake', 'help', 'help-center', 'history', 'html',
    'info', 'java', 'javascript', 'json', 'key', 'language', 'library-books',
    'light-mode', 'lightbulb', 'list', 'list-alt', 'lock', 'markdown',
    'memory', 'menu-book', 'method', 'monitor-heart', 'network-wifi',
    'open-in-new', 'palette', 'pause', 'person', 'person-off', 'php',
    'play-arrow', 'play-circle', 'property', 'proxy', 'public', 'python',
    'queue', 'refresh', 'restart-alt', 'restore', 'rocket-launch',
    'rocket-launch-rounded', 'save', 'schedule', 'science', 'search',
    'security', 'send', 'settings', 'settings-backup-restore', 'shield',
    'sidebar', 'solar-power', 'speed', 'star', 'stop', 'storage',
    'system-update', 'table', 'timer', 'translate', 'trending-up',
    'tune', 'typescript', 'unfold-more', 'update', 'upload',
    'vertical-align-bottom', 'visibility', 'visibility-off', 'volunteer-activism',
    'warning', 'widgets', 'work-history', 'work-outline', 'xml',
    'zoom-in', 'zoom-out'
  ],
  'mdi': [
    'alert-circle', 'apple', 'backup-restore', 'bitbucket', 'check-circle',
    'file-multiple', 'folder', 'folder-multiple', 'folder-off', 'github',
    'gitlab', 'harddisk', 'harddisk-plus', 'home', 'linux', 'microsoft-windows',
    'server', 'tag', 'usb', 'question-mark-circle-outline'
  ],
  'eos-icons': ['loading'],
  'ion': ['code-slash'],
  'logos': ['google-drive'],
  'proicons': ['code'],
  'simple-icons': ['bootstrap', 'codepen', 'microsoftonedrive', 'session', 'stackoverflow'],
  'svg-spinners': ['bars-rotate-fade'],
  'vscode-icons': [
    'file-type-cpp', 'file-type-csharp', 'file-type-css', 'file-type-go',
    'file-type-html', 'file-type-java', 'file-type-js', 'file-type-json',
    'file-type-markdown', 'file-type-php', 'file-type-python',
    'file-type-ruby', 'file-type-rust', 'file-type-typescript',
    'file-type-xml', 'file-type-yaml'
  ],
  'clarity': ['dashboard-line']
};

async function downloadSVG(url, filePath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = createWriteStream(filePath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(true);
        });
      } else if (response.statusCode === 404) {
        console.log(`  ❌ 404 Not Found: ${url}`);
        resolve(false);
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
      }
    }).on('error', reject);
  });
}

async function downloadAllIcons() {
  console.log(`📥 Preparing to download icons from ${Object.keys(ALL_ICONS).length} collections...\n`);
  
  // Create directories
  await mkdir(join(process.cwd(), 'public', 'assets', 'icons'), { recursive: true });
  await mkdir(join(process.cwd(), 'src', 'components', 'icons', 'local'), { recursive: true });
  
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    missing: []
  };
  
  // Download each icon
  for (const [collection, icons] of Object.entries(ALL_ICONS)) {
    console.log(`📁 Collection: ${collection} (${icons.length} icons)`);
    
    for (const iconName of icons) {
      results.total++;
      const url = `https://api.iconify.design/${collection}/${iconName}.svg`;
      const fileName = `${collection}-${iconName}.svg`;
      const svgPath = join(process.cwd(), 'public', 'assets', 'icons', fileName);
      
      try {
        const success = await downloadSVG(url, svgPath);
        if (success) {
          results.success++;
          console.log(`  ✅ ${iconName}`);
        } else {
          results.failed++;
          results.missing.push(`${collection}:${iconName}`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.log(`  ❌ ${iconName}: ${error.message}`);
        results.failed++;
        results.missing.push(`${collection}:${iconName}`);
      }
    }
    console.log('');
  }
  
  // Create an index file for all downloaded icons
  await createIconIndex();
  
  // Create a simple Vue component loader
  await createIconLoaderComponent();
  
  // Generate a manifest
  const manifest = {
    generated: new Date().toISOString(),
    totalIcons: results.total,
    downloaded: results.success,
    failed: results.failed,
    missingIcons: results.missing,
    path: '/assets/icons/'
  };
  
  await writeFile(
    join(process.cwd(), 'public', 'assets', 'icons', 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 NUCLEAR DOWNLOAD COMPLETE!');
  console.log('='.repeat(60));
  console.log(`📊 Total icons: ${results.total}`);
  console.log(`✅ Successfully downloaded: ${results.success}`);
  console.log(`❌ Failed to download: ${results.failed}`);
  
  if (results.missing.length > 0) {
    console.log('\n⚠️  Missing icons (need alternatives):');
    results.missing.slice(0, 10).forEach(icon => console.log(`   - ${icon}`));
    if (results.missing.length > 10) {
      console.log(`   ... and ${results.missing.length - 10} more`);
    }
    
    // Save missing icons to file for manual handling
    await writeFile(
      join(process.cwd(), 'missing-icons.json'),
      JSON.stringify({ missing: results.missing }, null, 2)
    );
    console.log(`\n📄 Missing icons saved to: missing-icons.json`);
  }
  
  console.log('\n📁 All SVGs saved to: public/assets/icons/');
  console.log('🚀 Next step: Replace iconify with LocalIcon component!');
  
  return results;
}

async function createIconIndex() {
  console.log('📝 Creating icon index...');
  
  const fs = await import('fs');
  const iconsDir = join(process.cwd(), 'public', 'assets', 'icons');
  
  try {
    const files = fs.readdirSync(iconsDir)
      .filter(file => file.endsWith('.svg'))
      .map(file => file.replace('.svg', ''));
    
    const index = {
      icons: files,
      total: files.length,
      generated: new Date().toISOString()
    };
    
    await writeFile(
      join(iconsDir, 'index.json'),
      JSON.stringify(index, null, 2)
    );
    
    console.log(`  ✅ Index created with ${files.length} icons`);
  } catch (error) {
    console.log(`  ⚠️ Could not create index: ${error.message}`);
  }
}

async function createIconLoaderComponent() {
  console.log('🔧 Creating LocalIcon component...');
  
  const componentContent = `
<template>
  <img
    v-if="useImg"
    :src="iconSrc"
    :alt="icon"
    :width="size"
    :height="size"
    :style="computedStyle"
    class="local-icon"
  />
  <div
    v-else
    v-html="svgContent"
    :style="{...computedStyle, display: 'inline-block'}"
    class="local-icon"
  />
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';

const props = defineProps({
  icon: {
    type: String,
    required: true
  },
  size: {
    type: [String, Number],
    default: 24
  },
  color: {
    type: String,
    default: 'currentColor'
  },
  useImg: {
    type: Boolean,
    default: true
  }
});

// Convert icon name to file name
const iconFileName = computed(() => {
  return props.icon.replace(':', '-') + '.svg';
});

const iconSrc = computed(() => {
  return '/assets/icons/' + iconFileName.value;
});

const computedStyle = computed(() => ({
  width: typeof props.size === 'number' ? props.size + 'px' : props.size,
  height: typeof props.size === 'number' ? props.size + 'px' : props.size,
  color: props.color,
  fill: props.color,
  display: 'inline-block',
  verticalAlign: 'middle'
}));

// For inline SVG mode
const svgContent = ref('');

async function loadInlineSVG() {
  try {
    const response = await fetch(iconSrc.value);
    if (!response.ok) throw new Error('SVG not found');
    
    const svgText = await response.text();
    // Inject color into SVG
    svgContent.value = svgText
      .replace(/<svg/, \`<svg style="color: \${props.color}"\`)
      .replace(/fill="[^"]*"/g, \`fill="\${props.color}"\`);
  } catch (error) {
    console.warn('Failed to load SVG:', props.icon, error);
    // Fallback rectangle
    svgContent.value = \`
      <svg width="\${props.size}" height="\${props.size}" viewBox="0 0 24 24">
        <rect width="24" height="24" fill="#4a5568" rx="4"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="10">
          \${props.icon.split(':')[1]?.substring(0, 3) || 'ICO'}
        </text>
      </svg>
    \`;
  }
}

onMounted(() => {
  if (!props.useImg) {
    loadInlineSVG();
  }
});

watch(() => props.icon, () => {
  if (!props.useImg) {
    loadInlineSVG();
  }
});
</script>

<style scoped>
.local-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
`;

  await writeFile(
    join(process.cwd(), 'src', 'components', 'LocalIcon.vue'),
    componentContent
  );
  
  console.log('  ✅ LocalIcon.vue component created');
}

// Run the download
downloadAllIcons().catch(console.error);