const { contextBridge, ipcRenderer } = require('electron');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Preload script: DOM loaded');
  
  // Fix for Iconify in Electron
  if (!window.iconify) {
    console.log('🔧 Loading Iconify dynamically...');
    const script = document.createElement('script');
    script.src = 'https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js';
    script.onload = () => {
      console.log('✅ Iconify loaded successfully');
      window.dispatchEvent(new Event('iconify-ready'));
    };
    script.onerror = (err) => {
      console.error('❌ Failed to load Iconify:', err);
    };
    document.head.appendChild(script);
  }
  
  // Fix for local fonts in Electron
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Poppins';
      src: url('file://${__dirname}/../public/fonts/poppins-regular-webfont.woff2') format('woff2'),
           url('file://${__dirname}/../public/fonts/poppins-regular-webfont.woff') format('woff');
      font-weight: 400;
    }
    
    body {
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    }
  `;
  document.head.appendChild(style);
});

// Simple event handler wrapper
const createEventHandler = (channel, callback) => {
  const handler = (event, ...args) => callback(...args);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

contextBridge.exposeInMainWorld('electronAPI', {
  // Storage management
  getStorageLocations: () => ipcRenderer.invoke('get-storage-locations'),
  getStorageInfo: () => ipcRenderer.invoke('get-storage-info'), // Added
  addStorageLocation: (location) => ipcRenderer.invoke('add-storage-location', location),
  removeStorageLocation: (path) => ipcRenderer.invoke('remove-storage-location', path),
  scanStorageLocation: (path) => ipcRenderer.invoke('scan-storage-location', path),
  getStorageUsage: () => ipcRenderer.invoke('get-storage-usage'),
  
  // File system
  showItemInFolder: (path) => ipcRenderer.invoke('show-item-in-folder', path),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  
  // Dashboard specific
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  
  // Scraping events
  onScrapingResult: (callback) => createEventHandler('scraping-result', callback), // Added
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

  // Existing APIs
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
  onScrapingComplete: (callback) => {ipcRenderer.on('scraping-complete', (event, data) => callback(data));
  },

  // License
  validateLicense: (key) => ipcRenderer.invoke('validate-license', key),


 // Add font loading helper
  loadFonts: () => {
    return new Promise((resolve) => {
      const checkFonts = () => {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => {
            console.log('✅ All fonts loaded');
            resolve(true);
          });
        } else {
          setTimeout(checkFonts, 100);
        }
      };
      checkFonts();
    });
  }
});

console.log('✅ Preload script loaded with font fixes!');