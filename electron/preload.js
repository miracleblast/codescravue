// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Storage management
  getStorageLocations: () => ipcRenderer.invoke('get-storage-locations'),
  addStorageLocation: (location) => ipcRenderer.invoke('add-storage-location', location),
  removeStorageLocation: (path) => ipcRenderer.invoke('remove-storage-location', path),
  scanStorageLocation: (path) => ipcRenderer.invoke('scan-storage-location', path),
  getStorageUsage: () => ipcRenderer.invoke('get-storage-usage'),
  
  // File system
  showItemInFolder: (path) => ipcRenderer.invoke('show-item-in-folder', path),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  
  // Existing APIs
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  getAccounts: () => ipcRenderer.invoke('get-accounts'),
  saveAccounts: (accounts) => ipcRenderer.invoke('save-accounts', accounts),
  testAccount: (account) => ipcRenderer.invoke('test-account', account),
  startScraping: (config) => ipcRenderer.invoke('start-scraping', config),
  cancelScraping: (scraperId) => ipcRenderer.invoke('cancel-scraping', scraperId),
  getRecentResults: () => ipcRenderer.invoke('get-recent-results'),
  
  // Events
  onScrapingProgress: (callback) => ipcRenderer.on('scraping-progress', callback),
  onScrapingError: (callback) => ipcRenderer.on('scraping-error', callback),
  
  // License
  validateLicense: (key) => ipcRenderer.invoke('validate-license', key)
});

// Remove listeners to prevent memory leaks
window.addEventListener('beforeunload', () => {
  ipcRenderer.removeAllListeners('scraping-progress');
  ipcRenderer.removeAllListeners('scraping-error');
});

console.log('✅ Production preload.js with real-time events loaded!');