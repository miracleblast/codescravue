
// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 🎯 PRODUCTION-READY ELECTRON API WITH REAL-TIME EVENTS
contextBridge.exposeInMainWorld('electronAPI', {
  // 🔧 CONFIGURATION
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // 👤 ACCOUNTS MANAGEMENT
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  saveAccounts: (accounts) => ipcRenderer.invoke('save-accounts', accounts),
  testAccount: (account) => ipcRenderer.invoke('test-account', account),
  
  // 🚀 REAL SCRAPING OPERATIONS
  startScraping: (options) => ipcRenderer.invoke('start-scraping', options),
  cancelScraping: (scraperId) => ipcRenderer.invoke('cancel-scraping', scraperId),
  
  // 💾 STORAGE MANAGEMENT
  getStorageInfo: () => ipcRenderer.invoke('get-storage-info'),
  getRecentResults: () => ipcRenderer.invoke('get-recent-results'),
  
  // 📁 FILE SYSTEM
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showItemInFolder: (path) => ipcRenderer.invoke('show-item-in-folder', path),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // 🔐 LICENSE
  validateLicense: (licenseKey) => ipcRenderer.invoke('validate-license', licenseKey),
  
  // 🔔 REAL-TIME EVENT LISTENERS FOR SCRAPING PROGRESS
  onScrapingProgress: (callback) => {
    ipcRenderer.on('scraping-progress', callback);
    return () => ipcRenderer.removeListener('scraping-progress', callback);
  },
  
  onScrapingError: (callback) => {
    ipcRenderer.on('scraping-error', callback);
    return () => ipcRenderer.removeListener('scraping-error', callback);
  },
  
  onScrapingComplete: (callback) => {
    ipcRenderer.on('scraping-complete', callback);
    return () => ipcRenderer.removeListener('scraping-complete', callback);
  },
  
  // 🧹 CLEANUP
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

console.log('✅ Production preload.js with real-time events loaded!');