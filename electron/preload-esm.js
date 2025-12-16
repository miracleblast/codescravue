// electron/preload-esm.js - OPTIMIZED VERSION
const { contextBridge, ipcRenderer } = require('electron');

console.log('🚀 CodeScraper Pro - Icon System (CommonJS)');

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

 // Icon system
  iconify: {
    ready: () => new Promise((resolve) => {
      if (iconRenderer.ready) {
        resolve();
      } else {
        window.addEventListener('iconify-ready', () => resolve(), { once: true });
      }
    }),
    renderIcon: (icon, options) => iconRenderer.renderIcon(icon, options),
    getRenderer: () => iconRenderer
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



console.log('✅ Preload script loaded successfully (CommonJS)');