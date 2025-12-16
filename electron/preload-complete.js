// electron/preload-complete.js
const { contextBridge, ipcRenderer } = require('electron');

console.log('🚀 CodeScraper Pro - Complete Local Icons');

// ========== BLOCK ALL CDN CALLS ==========
const nativeFetch = window.fetch;
window.fetch = function(url, ...args) {
  if (typeof url === 'string' && (
    url.includes('api.iconify.design') ||
    url.includes('api.simplesvg.com') ||
    url.includes('api.unisvg.com')
  )) {
    console.log('🚫 BLOCKED CDN fetch:', url.substring(0, 50));
    return Promise.reject(new Error('Enterprise: All icons are local'));
  }
  return nativeFetch.call(this, url, ...args);
};

// ========== EVENT HANDLER ==========
const createEventHandler = (channel, callback) => {
  const handler = (event, ...args) => callback(...args);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

// ========== EXPOSE COMPLETE API ==========
contextBridge.exposeInMainWorld('electronAPI', {
  // ✅ Add platform detection FIRST
  getPlatform: () => process.platform,
  
  
  // ✅ Storage management
  getStorageLocations: () => ipcRenderer.invoke('get-storage-locations'),
  getStorageInfo: () => ipcRenderer.invoke('get-storage-info'),
  addStorageLocation: (location) => {
    // Create a clean, serializable object before sending
    const cleanLocation = {
      path: String(location.path || ''),
      name: String(location.name || ''),
      autoBackup: Boolean(location.autoBackup),
      limitGB: location.limitGB ? Number(location.limitGB) : null
    };
    
    console.log('Sending to main process:', cleanLocation);
    return ipcRenderer.invoke('add-storage-location', cleanLocation);
  },
  removeStorageLocation: (path) => ipcRenderer.invoke('remove-storage-location', path),
  scanStorageLocation: (path) => ipcRenderer.invoke('scan-storage-location', path),
  getStorageUsage: () => ipcRenderer.invoke('get-storage-usage'),
  
  // ✅ Cloud Storage
  detectCloudStorage: () => ipcRenderer.invoke('detect-cloud-storage'),
  getCloudStatus: () => ipcRenderer.invoke('get-cloud-status'),
  saveCloudConfig: (config) => ipcRenderer.invoke('save-cloud-config', config),
  loadCloudConfig: () => ipcRenderer.invoke('load-cloud-config'),

  // ✅ File system
  showItemInFolder: (path) => ipcRenderer.invoke('show-item-in-folder', path),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  
  // ✅ Dashboard & Stats
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  getAccountStats: () => ipcRenderer.invoke('get-account-stats'), // ← MISSING FUNCTION
  
  // ✅ Scraping
  onScrapingResult: (callback) => createEventHandler('scraping-result', callback),
  onJobUpdate: (callback) => createEventHandler('job-update', callback),
  startScraping: (config) => ipcRenderer.invoke('start-scraping', config),
  cancelScraping: (scraperId) => ipcRenderer.invoke('cancel-scraping', scraperId),
  getRecentResults: () => ipcRenderer.invoke('get-recent-results'),

  // ✅ Proxy Management
  getProxies: () => ipcRenderer.invoke('get-proxies'),
  saveProxy: (proxyData) => ipcRenderer.invoke('save-proxy', proxyData),
  deleteProxy: (proxyId) => ipcRenderer.invoke('delete-proxy', proxyId),
  getProxySettings: () => ipcRenderer.invoke('get-proxy-settings'),
  saveProxySettings: (settings) => ipcRenderer.invoke('save-proxy-settings', settings),
  testProxy: (proxyConfig) => ipcRenderer.invoke('test-proxy', proxyConfig),
  testAllProxies: () => ipcRenderer.invoke('test-all-proxies'),
  getProxyStats: () => ipcRenderer.invoke('get-proxy-stats'),

  // ✅ Configuration
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  saveAccounts: (accounts) => ipcRenderer.invoke('save-accounts', accounts),
  testAccount: (account) => ipcRenderer.invoke('test-account', account),
  
  // ✅ System Monitoring
  getSystemStats: () => ipcRenderer.invoke('get-system-stats'),
  getActiveJobs: () => ipcRenderer.invoke('get-active-jobs'),
  getPerformanceMetrics: () => ipcRenderer.invoke('get-performance-metrics'),
  adjustConcurrency: (settings) => ipcRenderer.invoke('adjust-concurrency', settings),
  stopJob: (jobId) => ipcRenderer.invoke('stop-job', jobId),
  
  // ✅ Events
  onSystemStatsUpdate: (callback) => createEventHandler('system-stats-update', callback),
  onScrapingProgress: (callback) => createEventHandler('scraping-progress', callback),
  onScrapingError: (callback) => createEventHandler('scraping-error', callback),
  onScrapingComplete: (callback) => {
    ipcRenderer.on('scraping-complete', (event, data) => callback(data));
  },

    // License functions
  getLicenseInfo: () => ipcRenderer.invoke('get-license-info'),
  validateLicense: (key) => ipcRenderer.invoke('validate-license', key),

  // ✅ Fonts
  loadFonts: () => {
    return new Promise((resolve) => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          console.log('✅ All fonts loaded');
          resolve(true);
        });
      } else {
        setTimeout(() => resolve(true), 100);
      }
    });
  },
  
  // ✅ DevTools
  openDevTools: () => ipcRenderer.send('open-devtools'),
  
  // ✅ Icon helper
  getIconPath: (iconName) => {
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
    
    if (mappings[iconName]) {
      return './assets/icons/' + mappings[iconName];
    }
    
    return './assets/icons/' + iconName.replace(/:/g, '-') + '.svg';
  },
  
  // ✅ Debug
  checkIconSystem: () => {
    return {
      status: 'LOCAL',
      icons: 213,
      cdnBlocked: true,
      usingLocalIcon: true
    };
  }
});

console.log('✅ Complete API exposed - All functions available');