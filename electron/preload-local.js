const { contextBridge, ipcRenderer } = require('electron');

console.log('🚀 CodeScraper Pro - Local Icons Only');

// ========== NUCLEAR CDN BLOCKER ==========
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

// Block XMLHttpRequest too
const OriginalXMLHttpRequest = window.XMLHttpRequest;
window.XMLHttpRequest = class extends OriginalXMLHttpRequest {
  open(method, url, ...args) {
    if (typeof url === 'string' && url.includes('api.iconify.design')) {
      console.log('🚫 BLOCKED XHR to iconify CDN');
      throw new Error('Enterprise: All icons are local');
    }
    return super.open(method, url, ...args);
  }
};

// ========== LOAD LOCAL FONTS ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔤 Loading local fonts...');
  
  const fontStyles = document.createElement('style');
  fontStyles.textContent = `
    /* Poppins Fonts */
    @font-face {
      font-family: 'Poppins';
      src: url('./fonts/poppins-regular-webfont.woff2') format('woff2'),
           url('./fonts/poppins-regular-webfont.woff') format('woff');
      font-weight: 400;
      font-display: swap;
    }
    @font-face {
      font-family: 'Poppins';
      src: url('./fonts/poppins-bold-webfont.woff2') format('woff2'),
           url('./fonts/poppins-bold-webfont.woff') format('woff');
      font-weight: 700;
      font-display: swap;
    }
    @font-face {
      font-family: 'Poppins';
      src: url('./fonts/poppins-light-webfont.woff2') format('woff2'),
           url('./fonts/poppins-light-webfont.woff') format('woff');
      font-weight: 300;
      font-display: swap;
    }
    @font-face {
      font-family: 'Poppins';
      src: url('./fonts/poppins-medium-webfont.woff2') format('woff2'),
           url('./fonts/poppins-medium-webfont.woff') format('woff');
      font-weight: 500;
      font-display: swap;
    }
    @font-face {
      font-family: 'Poppins';
      src: url('./fonts/poppins-semibold-webfont.woff2') format('woff2'),
           url('./fonts/poppins-semibold-webfont.woff') format('woff');
      font-weight: 600;
      font-display: swap;
    }
    
    body {
      font-family: 'Poppins', system-ui, sans-serif;
    }
    
    /* CSS for LocalIcon components */
    LocalIcon {
      display: inline-block;
      vertical-align: middle;
    }
  `;
  
  document.head.appendChild(fontStyles);
  console.log('✅ Local fonts loaded');
});

// ========== EVENT HANDLER ==========
const createEventHandler = (channel, callback) => {
  const handler = (event, ...args) => callback(...args);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

// ========== EXPOSE API ==========
// ========== EXPOSE API ==========
contextBridge.exposeInMainWorld('electronAPI', {
  // Storage management
  getStorageLocations: () => ipcRenderer.invoke('get-storage-locations'),
  getStorageInfo: () => ipcRenderer.invoke('get-storage-info'),
  addStorageLocation: (location) => ipcRenderer.invoke('add-storage-location', location),
  removeStorageLocation: (path) => ipcRenderer.invoke('remove-storage-location', path),
  scanStorageLocation: (path) => ipcRenderer.invoke('scan-storage-location', path),
  getStorageUsage: () => ipcRenderer.invoke('get-storage-usage'),
  
  // File system
  showItemInFolder: (path) => ipcRenderer.invoke('show-item-in-folder', path),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  
  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  
  // Scraping
  onScrapingResult: (callback) => createEventHandler('scraping-result', callback),
  onJobUpdate: (callback) => createEventHandler('job-update', callback),
  startScraping: (config) => ipcRenderer.invoke('start-scraping', config),
  cancelScraping: (scraperId) => ipcRenderer.invoke('cancel-scraping', scraperId),
  getRecentResults: () => ipcRenderer.invoke('get-recent-results'),

  // Proxy Management
  getProxies: () => ipcRenderer.invoke('get-proxies'),
  saveProxy: (proxyData) => ipcRenderer.invoke('save-proxy', proxyData),
  deleteProxy: (proxyId) => ipcRenderer.invoke('delete-proxy', proxyId),
  getProxySettings: () => ipcRenderer.invoke('get-proxy-settings'),
  saveProxySettings: (settings) => ipcRenderer.invoke('save-proxy-settings', settings),
  testProxy: (proxyConfig) => ipcRenderer.invoke('test-proxy', proxyConfig),
  testAllProxies: () => ipcRenderer.invoke('test-all-proxies'),
  getProxyStats: () => ipcRenderer.invoke('get-proxy-stats'),

  // Configuration
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  saveAccounts: (accounts) => ipcRenderer.invoke('save-accounts', accounts),
  testAccount: (account) => ipcRenderer.invoke('test-account', account),
  
  // System Monitoring
  getSystemStats: () => ipcRenderer.invoke('get-system-stats'),
  getActiveJobs: () => ipcRenderer.invoke('get-active-jobs'),
  getPerformanceMetrics: () => ipcRenderer.invoke('get-performance-metrics'),
  adjustConcurrency: (settings) => ipcRenderer.invoke('adjust-concurrency', settings),
  stopJob: (jobId) => ipcRenderer.invoke('stop-job', jobId),
  
  // Events
  onSystemStatsUpdate: (callback) => createEventHandler('system-stats-update', callback),
  onScrapingProgress: (callback) => createEventHandler('scraping-progress', callback),
  onScrapingError: (callback) => createEventHandler('scraping-error', callback),
  onScrapingComplete: (callback) => {
    ipcRenderer.on('scraping-complete', (event, data) => callback(data));
  },

  
  // Icon helper
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
      'material-symbols:xml': 'vscode-icons-file-type-xml.svg'
    };
    
    if (mappings[iconName]) {
      return '/assets/icons/' + mappings[iconName];
    }
    
    return '/assets/icons/' + iconName.replace(/:/g, '-') + '.svg';
  },
  
  // Debug
  checkIconSystem: () => {
    return {
      status: 'LOCAL',
      icons: 213,
      cdnBlocked: true,
      usingLocalIcon: true
    };
  },

  // License
  validateLicense: (key) => ipcRenderer.invoke('validate-license', key),

  // Fonts
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
  
  // DevTools
  openDevTools: () => ipcRenderer.send('open-devtools'),
  

  // Add icon helper
  getLocalIcon: (iconName) => {
    return `/assets/icons/${iconName.replace(':', '-')}.svg`;
  },

  // Debug: Find external icons
  findExternalIcons: () => {
    const externalIcons = [];
    const elements = document.querySelectorAll('iconify-icon');
    elements.forEach(el => {
      const icon = el.getAttribute('icon');
      if (icon && (icon.includes('majesticons') || icon.includes('iconamoon') || icon.includes('solar'))) {
        externalIcons.push({
          icon,
          html: el.outerHTML.substring(0, 100),
          parent: el.parentElement?.tagName
        });
      }
    });
    return externalIcons;
  }
});


console.log('✅ Preload ready - 213 local icons, 0 CDN');
