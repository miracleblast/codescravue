import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function debugBuild() {
  console.log('🔍 Debugging Vue build issue...\n');
  
  // 1. Check main.js
  console.log('1. Checking main.js structure...');
  const mainJsPath = join('src', 'main.js');
  const mainContent = await readFile(mainJsPath, 'utf8');
  
  // Check for correct order
  const hasCreateAppFirst = mainContent.includes('const app = createApp(App)');
  const hasComponentRegistration = mainContent.includes("app.component('LocalIcon'");
  
  console.log(`   createApp found: ${hasCreateAppFirst ? '✅' : '❌'}`);
  console.log(`   component registration found: ${hasComponentRegistration ? '✅' : '❌'}`);
  
  if (!hasCreateAppFirst || !hasComponentRegistration) {
    console.log('\n⚠️  Fixing main.js structure...');
    const fixedContent = `import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import LocalIcon from './components/LocalIcon.vue'
import './main.css'
import { clickOutside } from './directives/clickOutside'

console.log('🚀 Vue app starting...')

const app = createApp(App)
console.log('✅ Vue app created')

app.component('LocalIcon', LocalIcon)
console.log('✅ LocalIcon component registered')

app.use(router)
console.log('✅ Router installed')

app.directive('click-outside', clickOutside)
app.mount('#app')
console.log('✅ Vue app mounted to #app')`;
    
    await writeFile(mainJsPath, fixedContent);
    console.log('✅ Fixed main.js structure');
  }
  
  // 2. Check LocalIcon component
  console.log('\n2. Checking LocalIcon.vue...');
  const localIconPath = join('src', 'components', 'LocalIcon.vue');
  
  try {
    const localIconContent = await readFile(localIconPath, 'utf8');
    
    // Check for problematic patterns
    const checks = {
      hasConsoleLog: localIconContent.includes('console.log'),
      hasComplexLogic: localIconContent.includes('async') || localIconContent.includes('await'),
      hasWatch: localIconContent.includes('watch('),
      hasOnMounted: localIconContent.includes('onMounted')
    };
    
    console.log(`   Has console.log: ${checks.hasConsoleLog ? '⚠️' : '✅'}`);
    console.log(`   Has async/await: ${checks.hasComplexLogic ? '⚠️' : '✅'}`);
    console.log(`   Has watch: ${checks.hasWatch ? '⚠️' : '✅'}`);
    console.log(`   Has onMounted: ${checks.hasOnMounted ? '⚠️' : '✅'}`);
    
    if (checks.hasConsoleLog || checks.hasComplexLogic) {
      console.log('\n⚠️  LocalIcon might be too complex. Using minimal version...');
      await writeFile(localIconPath, minimalLocalIcon);
    }
  } catch (error) {
    console.log('❌ LocalIcon.vue not found, creating it...');
    await writeFile(localIconPath, minimalLocalIcon);
  }
  
  // 3. Check for circular dependencies
  console.log('\n3. Checking for circular dependencies...');
  
  try {
    const { stdout } = await execAsync('npx madge --circular src/');
    console.log('✅ No circular dependencies found');
  } catch (error) {
    if (error.stdout) {
      console.log('⚠️  Possible circular dependencies:');
      console.log(error.stdout.substring(0, 500));
    }
  }
  
  // 4. Try a clean build
  console.log('\n4. Attempting clean build...');
  
  // Clear dist
  await execAsync('rm -rf dist').catch(() => {});
  
  // Build
  try {
    const { stdout, stderr } = await execAsync('npm run build', { timeout: 60000 });
    console.log('✅ Build successful!');
    
    // Check built file for errors
    const distIndex = join('dist', 'assets', 'index-*.js');
    const { stdout: jsFiles } = await execAsync(`ls ${distIndex}`);
    const builtFile = jsFiles.trim().split('\n')[0];
    
    if (builtFile) {
      const builtContent = await readFile(builtFile, 'utf8');
      if (builtContent.includes('Cannot access')) {
        console.log('⚠️  Built file contains "Cannot access" error');
      }
    }
    
  } catch (error) {
    console.log('❌ Build failed:', error.message);
    if (error.stderr) {
      console.log('Error output:');
      console.log(error.stderr.substring(0, 500));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🔧 DEBUG COMPLETE');
  console.log('='.repeat(60));
  console.log('\nTry: npm run electron');
}

const minimalLocalIcon = `<template>
  <img
    :src="iconSrc"
    :alt="icon"
    :width="size"
    :height="size"
    style="display: inline-block; vertical-align: middle"
    class="local-icon"
  />
</template>

<script>
export default {
  name: 'LocalIcon',
  props: {
    icon: String,
    size: { default: '24px' },
    color: { default: 'currentColor' }
  },
  computed: {
    iconSrc() {
      const map = {
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
        'material-symbols:xml': 'vscode-icons-file-type-xml.svg'
      };
      return '/assets/icons/' + (map[this.icon] || this.icon.replace(/:/g, '-') + '.svg');
    }
  }
}
</script>

<style scoped>
.local-icon { display: inline-block; vertical-align: middle; }
</style>`;

debugBuild().catch(console.error);
