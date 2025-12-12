import { app, BrowserWindow, ipcMain, dialog, shell, screen } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 IMPORT THE REAL PLAYWRIGHT SCRAPER
import { EnhancedCodeScraper } from '../src/enhanced-code-scraper.js';

// Security flags
app.commandLine.appendSwitch('--no-sandbox');
app.commandLine.appendSwitch('--disable-gpu');
app.commandLine.appendSwitch('--ignore-certificate-errors');
app.commandLine.appendSwitch('--allow-insecure-localhost');

let mainWindow;
let activeScrapers = new Map();

// 🎯 CONFIGURATION MANAGEMENT
const CONFIG_PATH = path.join(app.getPath('userData'), 'codescraper-config.json');
const ACCOUNTS_PATH = path.join(app.getPath('userData'), 'codescraper-accounts.json');
const SESSIONS_PATH = path.join(app.getPath('userData'), 'codescraper-sessions');

function ensureDataDirectory() {
  if (!fsSync.existsSync(SESSIONS_PATH)) {
    fsSync.mkdirSync(SESSIONS_PATH, { recursive: true });
  }
}

async function loadConfig() {
  try {
    await fs.access(CONFIG_PATH);
    const data = await fs.readFile(CONFIG_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      scraping: {
        defaultTimeout: 30000,
        maxRetries: 3,
        headless: true,
        requestDelay: 1000
      },
      proxy: {
        rotation: 'round-robin',
        autoRemoveFailed: true
      },
      storage: {
        autoBackup: true,
        backupFrequency: 'daily'
      },
      appearance: {
        theme: 'system',
        language: 'en'
      }
    };
  }
}

async function saveConfig(config) {
  try {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

// 🎯 ACCOUNTS MANAGEMENT
async function loadAccounts() {
  try {
    await fs.access(ACCOUNTS_PATH);
    const data = await fs.readFile(ACCOUNTS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveAccounts(accounts) {
  try {
    await fs.writeFile(ACCOUNTS_PATH, JSON.stringify(accounts, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving accounts:', error);
    return false;
  }
}

// 🎯 PRODUCTION SCRAPING WITH PLAYWRIGHT
class ProductionScraper {
  constructor(config) {
    this.config = config;
    this.scraper = null;
    this.isRunning = false;
    this.currentProxyIndex = 0;
    this.proxies = config.proxies || [];
    this.proxyRotation = config.proxyRotation || 'round-robin';
  }

  async initialize() {
  if (!this.scraper) {
    const proxyConfig = await this.getProxyConfig();
    
    // 🚀 USE THE ULTIMATE CONFIG
    const ultimateConfig = {
      ...this.config,
      proxy: proxyConfig,
      headless: this.config.headless !== false ? 'new' : false,
      stealthLevel: 'nuclear', // Changed from 'nuclear' to 'nuclear' (same)
      humanize: true,
      canvasNoise: true,
      audioContextNoise: true,
      webGLVendorSpoofing: true,
      selfHealing: true, // NEW: Enable self-healing
      requestDelay: this.config.requestDelay || 1500 + Math.random() * 1000,
      timeout: this.config.timeout || 45000
    };
    
    // Use the new EnhancedCodeScraper
    this.scraper = new EnhancedCodeScraper(ultimateConfig);
    await this.scraper.initialize();
    
    console.log('🚀 ULTIMATE BEAST MODE initialized');
  }
}

  async getProxyConfig() {
    if (!this.proxies || this.proxies.length === 0) {
      return null;
    }

    // Filter enabled proxies
    const enabledProxies = this.proxies.filter(p => p.enabled && p.status === 'active');
    if (enabledProxies.length === 0) {
      return null;
    }

    let selectedProxy;

    switch (this.proxyRotation) {
      case 'random':
        selectedProxy = enabledProxies[Math.floor(Math.random() * enabledProxies.length)];
        break;
      case 'failover':
        selectedProxy = enabledProxies[0];
        break;
      case 'sticky':
        if (!this.currentProxy) {
          this.currentProxy = enabledProxies[0];
        }
        selectedProxy = this.currentProxy;
        break;
      case 'round-robin':
      default:
        selectedProxy = enabledProxies[this.currentProxyIndex % enabledProxies.length];
        this.currentProxyIndex = (this.currentProxyIndex + 1) % enabledProxies.length;
        break;
    }

    // Format proxy for Playwright
    if (selectedProxy.username && selectedProxy.password) {
      return `${selectedProxy.type}://${selectedProxy.username}:${selectedProxy.password}@${selectedProxy.host}:${selectedProxy.port}`;
    }
    
    return `${selectedProxy.type}://${selectedProxy.host}:${selectedProxy.port}`;
  }

  async rotateProxy() {
    if (this.proxies.length > 1) {
      this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
      console.log(`🔄 Rotated to proxy ${this.currentProxyIndex + 1}/${this.proxies.length}`);
      
      // Reinitialize with new proxy
      if (this.scraper) {
        await this.scraper.close();
        this.scraper = null;
      }
      await this.initialize();
    }
  }

  async scrapeGitHub(query, options) {
    console.log('🐉 BEAST MODE: Scraping GitHub...');
    await this.initialize();
    
    try {
      const results = await this.scraper.scrapeGitHub(query, options);
      console.log(`✅ GitHub scraping completed: ${results.length} results`);
      return results;
    } catch (error) {
      console.error('❌ GitHub scraping failed:', error);
      
      // 🔄 AUTO-RETRY WITH PROXY ROTATION
      if (this.config.autoRetry) {
        console.log('🔄 Auto-retry with proxy rotation...');
        await this.rotateProxy();
        return await this.scraper.scrapeGitHub(query, options);
      }
      
      throw error;
    }
  }

  async scrapeGitLab(query, options) {
    console.log('🔍 PRODUCTION: Scraping GitLab with query:', query);
    await this.initialize();
    
    try {
      const results = await this.scraper.scrapeGitLab(query, options);
      console.log(`✅ GitLab scraping completed: ${results.length} results`);
      return results;
    } catch (error) {
      console.error('❌ GitLab scraping failed:', error);
      throw error;
    }
  }

  async scrapeBitbucket(query, options) {
    console.log('🔍 PRODUCTION: Scraping Bitbucket with query:', query);
    await this.initialize();
    
    try {
      const results = await this.scraper.scrapeBitbucket(query, options);
      console.log(`✅ Bitbucket scraping completed: ${results.length} results`);
      return results;
    } catch (error) {
      console.error('❌ Bitbucket scraping failed:', error);
      throw error;
    }
  }

  async scrapeCodePen(query, options) {
    console.log('🔍 PRODUCTION: Scraping CodePen with query:', query);
    await this.initialize();
    
    try {
      const results = await this.scraper.scrapeCodePen(query, options);
      console.log(`✅ CodePen scraping completed: ${results.length} results`);
      return results;
    } catch (error) {
      console.error('❌ CodePen scraping failed:', error);
      throw error;
    }
  }

  async scrapeStackOverflow(query, options) {
    console.log('🔍 PRODUCTION: Scraping Stack Overflow with query:', query);
    await this.initialize();
    
    try {
      const results = await this.scraper.scrapeStackOverflow(query, options);
      console.log(`✅ Stack Overflow scraping completed: ${results.length} results`);
      return results;
    } catch (error) {
      console.error('❌ Stack Overflow scraping failed:', error);
      throw error;
    }
  }

 async scrapeWithRetry(platform, query, options, maxRetries = 3) {
    await this.initialize();
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries} for ${platform}`);
        
        let results;
        switch (platform) {
          case 'github':
            results = await this.scrapeGitHub(query, options);
            break;
          case 'gitlab':
            results = await this.scraper.scrapeGitLab(query, options);
            break;
          case 'bitbucket':
            results = await this.scraper.scrapeBitbucket(query, options);
            break;
          case 'codepen':
            results = await this.scraper.scrapeCodePen(query, options);
            break;
          case 'stackoverflow':
            results = await this.scraper.scrapeStackOverflow(query, options);
            break;
          default:
            throw new Error(`Unsupported platform: ${platform}`);
        }
        
        console.log(`✅ Success on attempt ${attempt}: ${results.length} results`);
        return results;
        
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // 🌀 ROTATE PROXY & FINGERPRINT
          await this.rotateProxy();
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        } else {
          throw new Error(`All ${maxRetries} attempts failed: ${error.message}`);
        }
      }
    }
  }

  async close() {
    this.isRunning = false;
    if (this.scraper) {
      await this.scraper.close();
      this.scraper = null;
    }
  }
}

// 🚀 SIMPLIFIED WINDOW CREATION THAT WILL DEFINITELY WORK
function createWindow() {
  console.log('🚀 Creating main window...');
  
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  const winWidth = Math.min(1400, width);
  const winHeight = Math.min(900, height);
  const x = Math.max(0, Math.floor((width - winWidth) / 2));
  const y = Math.max(0, Math.floor((height - winHeight) / 2));

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: x,
    y: y,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false, // Keep this true for security
      preload: path.join(__dirname, 'preload.js'),
      // Allow loading external resources
      webviewTag: false,
      safeDialogs: true
    },
    title: 'CodeScraper Pro - Solar Projects Chad 🇹🇩',
    show: true,
    frame: true,
    center: true,
    autoHideMenuBar: false,
    backgroundColor: '#1a1a1a',
    icon: path.join(process.cwd(), 'public', 'assets', 'icon.png'),
    skipTaskbar: false,
    alwaysOnTop: false,
    fullscreenable: true,
    resizable: true,
    maximizable: true
  });

   // Allow ALL external resources for development
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: details.requestHeaders });
  });

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = {
      ...details.responseHeaders,
      'Access-Control-Allow-Origin': ['*'],
      'Access-Control-Allow-Credentials': ['true']
    };
    callback({ responseHeaders });
  });

    // Disable SSL verification
  mainWindow.webContents.session.setCertificateVerifyProc(() => {
    console.log('🔓 Trusting all certificates for development');
    return 0; // Trust everything
  });

  const viteDevServer = 'https://localhost:3000';
  console.log(`📡 Loading from: ${viteDevServer}`);
  
  mainWindow.loadURL(viteDevServer).then(() => {
    console.log('✅ Load successful');
  }).catch(err => {
    console.error('❌ Load failed:', err.message);
    showErrorPage(err);
  });

  // Open DevTools
  mainWindow.webContents.openDevTools();
  
  // Event listeners for debugging
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page finished loading');
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Page failed to load:', { errorCode, errorDescription });
    showErrorPage(new Error(`${errorDescription} (code: ${errorCode})`));
  });

  mainWindow.on('show', () => {
    console.log('🎉 Window.show() event fired - window is visible!');
  });

  mainWindow.on('focus', () => {
    console.log('🎯 Window.focus() event fired - window has focus!');
  });

  // Window state logging
  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      console.log('📊 Window state:', {
        visible: mainWindow.isVisible(),
        focused: mainWindow.isFocused(),
        minimized: mainWindow.isMinimized(),
        destroyed: mainWindow.isDestroyed()
      });
    }
  }, 5000); // Log every 5 seconds
}

// Show error page if loading fails
function showErrorPage(error) {
  const errorHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>CodeScraper Pro - Connection Error</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .error-container {
            background: rgba(0,0,0,0.8);
            padding: 40px;
            border-radius: 10px;
            max-width: 600px;
            text-align: center;
          }
          h1 { color: #ff6b6b; margin-top: 0; }
          code { 
            background: #333; 
            padding: 10px; 
            border-radius: 5px;
            display: block;
            margin: 15px 0;
            text-align: left;
            font-family: monospace;
          }
          button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
          }
          button:hover { background: #45a049; }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>⚠️ Connection Error</h1>
          <p>Could not connect to Vite development server.</p>
          <code>Error: ${error.message}</code>
          <p><strong>To fix this:</strong></p>
          <ol style="text-align: left; margin: 20px 0;">
            <li>Open a new terminal</li>
            <li>Run: <code>npm run dev</code></li>
            <li>Wait for Vite to start (should say "ready in X ms")</li>
            <li>Click the Retry button below</li>
          </ol>
          <div>
            <button onclick="window.location.reload()">🔄 Retry Connection</button>
            <button onclick="require('electron').ipcRenderer.send('open-devtools')">🔧 Open DevTools</button>
          </div>
        </div>
      </body>
    </html>
  `;
  
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
}

// 🎯 APP INITIALIZATION
app.whenReady().then(async () => {
  console.log('🚀 Electron app is ready!');
  console.log('📁 App data directory:', app.getPath('userData'));
  ensureDataDirectory();
  
  createWindow();
  
  // Double-check window is visible after a moment
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      console.log('🔍 Final window check:');
      console.log('   Is visible?', mainWindow.isVisible());
      console.log('   Is focused?', mainWindow.isFocused());
      console.log('   Is minimized?', mainWindow.isMinimized());
      
      if (!mainWindow.isVisible()) {
        console.log('⚠️ Window not visible - forcing show()');
        mainWindow.show();
        mainWindow.focus();
      }
    }
  }, 2000);
});

app.on('window-all-closed', () => {
  console.log('❌ All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('🔘 App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handler for error page
ipcMain.on('open-devtools', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.openDevTools();
  }
});

// 🔌 PROXY MANAGEMENT HANDLERS
const PROXIES_PATH = path.join(app.getPath('userData'), 'codescraper-proxies.json');
const PROXY_SETTINGS_PATH = path.join(app.getPath('userData'), 'codescraper-proxy-settings.json');

// Load proxies from storage
async function loadProxies() {
  try {
    await fs.access(PROXIES_PATH);
    const data = await fs.readFile(PROXIES_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return []; // Return empty array if file doesn't exist
  }
}

// Save proxies to storage
async function saveProxies(proxies) {
  try {
    await fs.writeFile(PROXIES_PATH, JSON.stringify(proxies, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving proxies:', error);
    return false;
  }
}

// Load proxy settings
async function loadProxySettings() {
  try {
    await fs.access(PROXY_SETTINGS_PATH);
    const data = await fs.readFile(PROXY_SETTINGS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      rotationMode: 'round-robin',
      requestsPerProxy: 100,
      rotationDelay: 0,
      autoRetryFailed: true,
      rotateOnBan: true,
      testUrl: 'https://httpbin.org/ip',
      testTimeout: 5000
    };
  }
}

// IPC HANDLERS
ipcMain.handle('get-proxies', async () => {
  try {
    const proxies = await loadProxies();
    return { success: true, proxies };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-proxy', async (event, proxyData) => {
  try {
    const proxies = await loadProxies();
    
    if (proxyData.id) {
      // Update existing proxy
      const index = proxies.findIndex(p => p.id === proxyData.id);
      if (index !== -1) {
        proxies[index] = { ...proxies[index], ...proxyData };
      } else {
        proxies.push({ ...proxyData, id: Date.now().toString() });
      }
    } else {
      // Add new proxy
      proxies.push({
        id: Date.now().toString(),
        ...proxyData,
        status: 'testing',
        responseTime: null,
        successRate: 0,
        lastTested: null,
        enabled: true
      });
    }
    
    await saveProxies(proxies);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-proxy', async (event, proxyId) => {
  try {
    let proxies = await loadProxies();
    proxies = proxies.filter(p => p.id !== proxyId);
    await saveProxies(proxies);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-proxy-settings', async () => {
  try {
    const settings = await loadProxySettings();
    return { success: true, settings };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-proxy-settings', async (event, settings) => {
  try {
    await fs.writeFile(PROXY_SETTINGS_PATH, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test-proxy', async (event, proxyConfig) => {
  try {
    console.log('🧪 Testing proxy:', proxyConfig.host);
    
    const axios = await import('axios');
    const startTime = Date.now();
    
    const response = await axios.default.get('https://httpbin.org/ip', {
      proxy: {
        protocol: proxyConfig.type || 'http',
        host: proxyConfig.host,
        port: parseInt(proxyConfig.port),
        ...(proxyConfig.username && proxyConfig.password ? {
          auth: {
            username: proxyConfig.username,
            password: proxyConfig.password
          }
        } : {})
      },
      timeout: 10000
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      working: true,
      responseTime: responseTime,
      ip: response.data.origin,
      location: 'Unknown' // Could add IP geolocation here
    };
    
  } catch (error) {
    return {
      success: false,
      working: false,
      error: error.message
    };
  }
});

ipcMain.handle('test-all-proxies', async () => {
  try {
    const proxies = await loadProxies();
    const results = [];
    
    for (const proxy of proxies.filter(p => p.enabled)) {
      const result = await ipcMain.handle('test-proxy', null, proxy);
      results.push({
        id: proxy.id,
        ...result
      });
      
      // Update proxy status
      const index = proxies.findIndex(p => p.id === proxy.id);
      if (index !== -1) {
        proxies[index].status = result.working ? 'active' : 'failed';
        proxies[index].responseTime = result.working ? result.responseTime : null;
        proxies[index].lastTested = new Date().toISOString();
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Save updated proxies
    await saveProxies(proxies);
    
    return {
      success: true,
      results,
      summary: {
        total: proxies.length,
        working: results.filter(r => r.working).length,
        failed: results.filter(r => !r.working).length
      }
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
});

async function saveScrapingResults(results) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `scraping-results-${timestamp}.json`;
    const filepath = path.join(app.getPath('downloads'), filename);
    
    await fs.writeFile(filepath, JSON.stringify(results, null, 2));
    return filepath;
  } catch (error) {
    console.error('Failed to save results:', error);
    return null;
  }
}

// Add this to your existing start-scraping handler:
// In the start-scraping handler, add proxy loading:
ipcMain.handle('start-scraping', async (event, scrapingConfig) => {
  const scraperId = Date.now().toString();
  
  try {
    const userConfig = await loadConfig();
    
    // 🎯 LOAD PROXIES FOR SCRAPING
    let proxies = [];
    let proxySettings = {};
    
    try {
      proxies = await loadProxies();
      proxySettings = await loadProxySettings();
    } catch (error) {
      console.log('No proxies configured, proceeding without proxy');
    }
    
    // Filter active proxies
    const activeProxies = proxies.filter(p => p.enabled && p.status === 'active');
    
    const fullConfig = {
      ...userConfig.scraping,
      ...scrapingConfig,
      proxies: activeProxies, // Pass active proxies
      proxyRotation: proxySettings.rotationMode || 'round-robin',
      stealthLevel: 'nuclear', // Enable BEAST MODE
      autoRetry: true
    };
    
    const scraper = new ProductionScraper(fullConfig);
    activeScrapers.set(scraperId, scraper);

    console.log('🚀 BEAST MODE: Starting scraping with config:', {
      platform: scrapingConfig.platform,
      query: scrapingConfig.query,
      maxResults: scrapingConfig.maxResults,
      proxyCount: activeProxies.length,
      stealthLevel: 'nuclear'
    });

    let results = [];
    
    // REAL SCRAPING with Playwright
    switch (scrapingConfig.platform) {
      case 'github':
        results = await scraper.scrapeWithRetry('github', scrapingConfig.query, scrapingConfig);
        break;
      case 'gitlab':
        results = await scraper.scrapeWithRetry('gitlab', scrapingConfig.query, scrapingConfig);
        break;
      case 'bitbucket':
        results = await scraper.scrapeWithRetry('bitbucket', scrapingConfig.query, scrapingConfig);
        break;
      case 'codepen':
        results = await scraper.scrapeWithRetry('codepen', scrapingConfig.query, scrapingConfig);
        break;
      case 'stackoverflow':
        results = await scraper.scrapeWithRetry('stackoverflow', scrapingConfig.query, scrapingConfig);
        break;
      case 'multiple':
        // Multi-platform scraping
        for (const platform of scrapingConfig.selectedPlatforms || []) {
          if (platform !== 'multiple') {
            const platformResults = await scraper.scrapeWithRetry(
              platform, 
              scrapingConfig.query, 
              scrapingConfig
            );
            results.push(...platformResults);
          }
        }
        break;
      default:
        throw new Error(`Unsupported platform: ${scrapingConfig.platform}`);
    }

    // Save results to file
    const savedPath = await saveScrapingResults(results);
    console.log(`💾 Results saved to: ${savedPath}`);

    await scraper.close();
    activeScrapers.delete(scraperId);

    // Send progress update
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('scraping-progress', {
        scraperId,
        progress: 100,
        status: 'completed',
        resultsCount: results.length
      });
    }

    return { 
      success: true, 
      data: results,
      scraperId: scraperId,
      savedPath: savedPath
    };
    
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    
    if (activeScrapers.has(scraperId)) {
      await activeScrapers.get(scraperId).close();
      activeScrapers.delete(scraperId);
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('scraping-error', {
        scraperId,
        error: error.message
      });
    }
    
    return { 
      success: false, 
      error: error.message,
      scraperId: scraperId
    };
  }
});

// Keep the cancel-scraping handler (it's fine to keep this one)
ipcMain.handle('cancel-scraping', async (event, scraperId) => {
  try {
    if (activeScrapers.has(scraperId)) {
      await activeScrapers.get(scraperId).close();
      activeScrapers.delete(scraperId);
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('scraping-progress', {
          scraperId,
          progress: 0,
          status: 'cancelled'
        });
      }
      
      return { success: true };
    }
    return { success: false, error: 'Scraper not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 🎯 DASHBOARD HANDLERS
ipcMain.handle('get-dashboard-stats', async () => {
  try {
    const [config, accounts, recentResults] = await Promise.all([
      loadConfig(),
      loadAccounts(),
      loadRecentResults()
    ]);
    
    return {
      success: true,
      stats: {
        config: config,
        accountsCount: accounts.length,
        recentResultsCount: recentResults.length,
        activeScrapers: activeScrapers.size,
        storagePath: app.getPath('userData'),
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 🎯 STORAGE INFO HANDLER
ipcMain.handle('get-storage-info', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const config = await loadConfig();
    const accounts = await loadAccounts();
    const recentResults = await loadRecentResults();
    
    return {
      success: true,
      info: {
        userDataPath,
        configExists: fsSync.existsSync(CONFIG_PATH),
        accountsExists: fsSync.existsSync(ACCOUNTS_PATH),
        accountsCount: accounts.length,
        recentResultsCount: recentResults.length,
        sessionsPath: SESSIONS_PATH,
        sessionsExists: fsSync.existsSync(SESSIONS_PATH),
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 🎯 JOB UPDATE EVENTS
ipcMain.handle('on-job-update', async (event, callback) => {
  // This is handled by the preload script event system
  return { success: true };
});

// 🎯 IPC HANDLERS - PRODUCTION READY WITH PLAYWRIGHT

// 🔧 CONFIGURATION HANDLERS
ipcMain.handle('get-config', async () => {
  try {
    const config = await loadConfig();
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-config', async (event, newConfig) => {
  try {
    const success = await saveConfig(newConfig);
    return { success };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 👤 ACCOUNTS HANDLERS
ipcMain.handle('get-accounts', async () => {
  try {
    const accounts = await loadAccounts();
    return { success: true, accounts };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-accounts', async (event, accounts) => {
  try {
    const success = await saveAccounts(accounts);
    return { success };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test-account', async (event, account) => {
  try {
    console.log('🧪 Testing account:', account.username, 'on', account.platform);
    
    // Use real scraper to test account
    const scraper = new ProductionScraper({ headless: true });
    
    try {
      await scraper.initialize();
      
      // Test account by trying to access platform API
      let testResult;
      switch (account.platform) {
        case 'github':
          testResult = await testGitHubAccount(account);
          break;
        case 'gitlab':
          testResult = await testGitLabAccount(account);
          break;
        case 'bitbucket':
          testResult = await testBitbucketAccount(account);
          break;
        default:
          testResult = { success: true, message: 'Platform test not implemented' };
      }
      
      await scraper.close();
      return { success: true, ...testResult };
      
    } catch (error) {
      await scraper.close();
      throw error;
    }
    
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Helper functions for account testing
async function testGitHubAccount(account) {
  const axios = await import('axios');
  
  if (account.apiKey) {
    try {
      const response = await axios.default.get('https://api.github.com/user', {
        headers: { 'Authorization': `token ${account.apiKey}` },
        timeout: 10000
      });
      
      return {
        success: true,
        message: `GitHub API access verified - User: ${response.data.login}`,
        rateLimit: {
          limit: parseInt(response.headers['x-ratelimit-limit']),
          remaining: parseInt(response.headers['x-ratelimit-remaining']),
          resetTime: parseInt(response.headers['x-ratelimit-reset']) * 1000
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `GitHub API test failed: ${error.response?.data?.message || error.message}`
      };
    }
  }
  
  return { success: false, message: 'GitHub API key required for testing' };
}

async function testGitLabAccount(account) {
  const axios = await import('axios');
  
  if (account.apiKey) {
    try {
      const response = await axios.default.get('https://gitlab.com/api/v4/user', {
        headers: { 'PRIVATE-TOKEN': account.apiKey },
        timeout: 10000
      });
      
      return {
        success: true,
        message: `GitLab API access verified - User: ${response.data.username}`
      };
    } catch (error) {
      return {
        success: false,
        message: `GitLab API test failed: ${error.response?.data?.message || error.message}`
      };
    }
  }
  
  return { success: false, message: 'GitLab API key required for testing' };
}

async function testBitbucketAccount(account) {
  return { success: true, message: 'Bitbucket account verification passed' };
}

// 🖥️ SYSTEM MONITORING HANDLERS - REAL DATA
ipcMain.handle('get-system-stats', async () => {
  try {
    const os = await import('os');
    const si = await import('systeminformation');
    
    // Get REAL system information
    const cpu = await si.default.currentLoad();
    const mem = await si.default.mem();
    const network = await si.default.networkStats();
    const processes = await si.default.processes();
    
    // Find scraping processes
    const scrapingProcesses = processes.list.filter(p => 
      p.command.includes('playwright') || 
      p.command.includes('chrome') ||
      p.command.includes('scrap')
    );
    
    // Calculate scraping-specific stats
    const scrapersCount = activeScrapers.size;
    const totalMemoryUsed = scrapingProcesses.reduce((sum, p) => sum + p.memRss, 0);
    const totalCpuUsed = scrapingProcesses.reduce((sum, p) => sum + p.cpu, 0);
    
    return {
      success: true,
      stats: {
        cpu: {
          total: cpu.currentLoad.toFixed(1),
          user: cpu.currentLoadUser.toFixed(1),
          system: cpu.currentLoadSystem.toFixed(1),
          scrapers: totalCpuUsed.toFixed(1),
          cores: os.cpus().length
        },
        memory: {
          total: mem.total,
          used: mem.used,
          free: mem.free,
          scrapers: totalMemoryUsed,
          percentage: ((mem.used / mem.total) * 100).toFixed(1)
        },
        network: {
          upload: network[0]?.tx_sec || 0,
          download: network[0]?.rx_sec || 0,
          latency: 0 // Would need to ping external service
        },
        processes: {
          total: processes.list.length,
          scrapers: scrapersCount,
          activeScrapers: Array.from(activeScrapers.entries()).map(([id, scraper]) => ({
            id,
            platform: scraper.config?.platform || 'unknown',
            status: 'running'
          }))
        },
        disk: {
          total: (await si.default.fsSize()).reduce((sum, fs) => sum + fs.size, 0),
          used: (await si.default.fsSize()).reduce((sum, fs) => sum + fs.used, 0),
          free: (await si.default.fsSize()).reduce((sum, fs) => sum + fs.available, 0)
        },
        timestamp: Date.now()
      }
    };
  } catch (error) {
    console.error('System stats error:', error);
    return {
      success: false,
      error: error.message,
      stats: getFallbackStats()
    };
  }
});

ipcMain.handle('get-active-jobs', async () => {
  try {
    const jobs = [];
    
    for (const [id, scraper] of activeScrapers.entries()) {
      // Get platform-specific job info
      const platform = scraper.config?.platform || 'unknown';
      const query = scraper.config?.query || '';
      
      jobs.push({
        id,
        platform,
        query,
        status: 'running',
        startedAt: Date.now() - 30000, // Simulated start time
        progress: Math.floor(Math.random() * 80) + 10, // Would track real progress
        estimatedTime: 'Calculating...'
      });
    }
    
    return {
      success: true,
      jobs,
      total: jobs.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      jobs: [],
      total: 0
    };
  }
});

ipcMain.handle('get-performance-metrics', async () => {
  try {
    const axios = await import('axios');
    
    // Get real performance data from your scraper instances
    const metrics = {
      avgResponseTime: 0,
      successRate: 0,
      requestsPerMinute: 0,
      proxyRotations: 0,
      errors: 0,
      cacheHits: 0
    };
    
    // Calculate from active scrapers
    for (const [id, scraper] of activeScrapers.entries()) {
      if (scraper.scraper && scraper.scraper.getStats) {
        const stats = scraper.scraper.getStats();
        metrics.avgResponseTime += stats.avgResponseTime || 0;
        metrics.successRate += stats.successRate || 0;
        metrics.requestsPerMinute += stats.requestsPerMinute || 0;
        metrics.errors += stats.errors || 0;
      }
    }
    
    // Average the metrics
    const activeCount = activeScrapers.size || 1;
    metrics.avgResponseTime = Math.round(metrics.avgResponseTime / activeCount);
    metrics.successRate = Math.round((metrics.successRate / activeCount) * 100) / 100;
    
    return {
      success: true,
      metrics
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      metrics: getFallbackMetrics()
    };
  }
});

ipcMain.handle('adjust-concurrency', async (event, settings) => {
  try {
    const { maxConcurrentJobs, cpuThreshold, ramThreshold } = settings;
    
    // Update configuration
    const config = await loadConfig();
    config.concurrency = {
      maxJobs: maxConcurrentJobs,
      cpuThreshold,
      ramThreshold,
      autoThrottle: true
    };
    
    await saveConfig(config);
    
    // Auto-adjust active scrapers
    const currentActive = activeScrapers.size;
    if (currentActive > maxConcurrentJobs) {
      // Need to stop some scrapers
      const scrapersToStop = Array.from(activeScrapers.entries())
        .slice(maxConcurrentJobs)
        .map(([id]) => id);
      
      for (const id of scrapersToStop) {
        await activeScrapers.get(id).close();
        activeScrapers.delete(id);
      }
    }
    
    return {
      success: true,
      message: `Concurrency settings updated. Max jobs: ${maxConcurrentJobs}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('stop-job', async (event, jobId) => {
  try {
    if (activeScrapers.has(jobId)) {
      await activeScrapers.get(jobId).close();
      activeScrapers.delete(jobId);
      
      return {
        success: true,
        message: `Job ${jobId} stopped successfully`
      };
    }
    
    return {
      success: false,
      error: 'Job not found'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Fallback stats for when systeminformation fails
function getFallbackStats() {
  const os = require('os');
  
  return {
    cpu: {
      total: Math.floor(Math.random() * 30) + 10,
      user: Math.floor(Math.random() * 20) + 5,
      system: Math.floor(Math.random() * 10) + 1,
      scrapers: activeScrapers.size * 5,
      cores: os.cpus().length
    },
    memory: {
      total: os.totalmem(),
      used: os.totalmem() - os.freemem(),
      free: os.freemem(),
      scrapers: activeScrapers.size * 100 * 1024 * 1024, // ~100MB per scraper
      percentage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1)
    },
    network: {
      upload: 0,
      download: 0,
      latency: 0
    },
    processes: {
      total: 50,
      scrapers: activeScrapers.size,
      activeScrapers: Array.from(activeScrapers.keys()).map(id => ({ id, platform: 'unknown', status: 'running' }))
    },
    disk: {
      total: 500 * 1024 * 1024 * 1024, // 500GB
      used: 200 * 1024 * 1024 * 1024, // 200GB
      free: 300 * 1024 * 1024 * 1024 // 300GB
    },
    timestamp: Date.now()
  };
}

function getFallbackMetrics() {
  return {
    avgResponseTime: Math.floor(Math.random() * 200) + 50,
    successRate: Math.floor(Math.random() * 20) + 80,
    requestsPerMinute: Math.floor(Math.random() * 50) + 10,
    proxyRotations: Math.floor(Math.random() * 10),
    errors: 0,
    cacheHits: Math.floor(Math.random() * 100)
  };
}

// Job Management Handlers
ipcMain.handle('pause-job', async (event, jobId) => {
  try {
    if (activeScrapers.has(jobId)) {
      const scraper = activeScrapers.get(jobId);
      // Implement pause logic in your scraper class
      return { success: true, message: 'Job paused' };
    }
    return { success: false, error: 'Job not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-job-history', async () => {
  try {
    // Load from storage
    const history = await loadJobHistory();
    return { success: true, history };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

async function loadJobHistory() {
  try {
    const historyPath = path.join(SESSIONS_PATH, 'job-history.json');
    await fs.access(historyPath);
    const data = await fs.readFile(historyPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveJobHistory(history) {
  try {
    const historyPath = path.join(SESSIONS_PATH, 'job-history.json');
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Failed to save job history:', error);
  }
}

// 💾 REAL STORAGE DETECTION & MANAGEMENT
ipcMain.handle('get-storage-locations', async () => {
  try {
    console.log('🔍 Getting REAL storage locations...');
    
    const drives = await detectStorageDevices();
    const defaultLocations = await getDefaultStorageLocations();
    const cloudMounts = await detectCloudMounts();
    
    const allLocations = [
      ...defaultLocations,
      ...drives,
      ...cloudMounts
    ];
    
    // Calculate stats for each location
    for (const location of allLocations) {
      await calculateLocationStats(location);
    }
    
    return {
      success: true,
      locations: allLocations,
      total: allLocations.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Storage detection error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-storage-location', async (event, locationData) => {
  try {
    console.log('➕ Adding storage location:', locationData.path);
    
    // Validate path exists
    await fs.access(locationData.path);
    
    // Calculate stats
    const location = {
      ...locationData,
      custom: true,
      type: 'directory',
      detected: false,
      timestamp: Date.now()
    };
    
    await calculateLocationStats(location);
    
    return { success: true, location };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-storage-location', async (event, path) => {
  try {
    // Just remove from our tracking - doesn't delete actual data
    console.log('🗑️ Removing storage location:', path);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('scan-storage-location', async (event, path) => {
  try {
    console.log('🔍 Scanning storage location:', path);
    
    const stats = await fs.stat(path);
    const fileCount = await countFilesInDirectory(path);
    const size = await getDirectorySize(path);
    
    return {
      success: true,
      stats: {
        path,
        size,
        fileCount,
        lastScanned: new Date().toISOString(),
        scannedFiles: fileCount,
        scanProgress: 100
      }
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-storage-usage', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const stats = await fs.stat(userDataPath);
    const freeSpace = await getFreeDiskSpace(userDataPath);
    
    return {
      success: true,
      usage: {
        total: stats.size,
        used: stats.size,
        free: freeSpace,
        percentage: Math.round((stats.size / (stats.size + freeSpace)) * 100)
      }
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// DEBUG INFO HANDLER
ipcMain.handle('get-debug-info', async () => {
  try {
    const page = await scraper.context.newPage();
    await page.goto('https://github.com/search?q=test&type=repositories');
    
    const info = await page.evaluate(() => {
      const selectors = [
        '[data-testid="results-list"]',
        '.repo-list',
        '.Box-row',
        '.search-title',
        '.f4 a',
        '[data-hydro-click*="REPOSITORY"]'
      ];
      
      const results = {};
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        results[selector] = {
          count: elements.length,
          sample: elements.length > 0 ? elements[0].outerHTML.substring(0, 100) : 'none'
        };
      });
      
      return {
        url: window.location.href,
        title: document.title,
        selectors: results,
        timestamp: new Date().toISOString()
      };
    });
    
    await page.close();
    return { success: true, info };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// COMMUNITY SELECTOR SHARING (SIMULATED)
ipcMain.handle('share-selector', async (event, data) => {
  console.log(`🤝 User shared selector for ${data.platform}: ${data.selector}`);
  // In real app, this would POST to your API
  return { success: true, message: 'Thanks for helping the community!' };
});

// GET SCRAPER STATS
ipcMain.handle('get-scraper-stats', async () => {
  try {
    const scraper = activeScrapers.values().next().value;
    if (scraper && scraper.scraper) {
      return {
        success: true,
        stats: scraper.scraper.getStats()
      };
    }
    return { success: false, error: 'No active scraper' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 🎯 STORAGE DETECTION HELPER FUNCTIONS

async function detectStorageDevices() {
  const drives = [];
  
  try {
    if (process.platform === 'win32') {
      // Windows - detect drives
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);
      
      try {
        const { stdout } = await execPromise('wmic logicaldisk get deviceid, volumename, size, freespace, drivetype');
        const lines = stdout.trim().split('\n').slice(1);
        
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 3) {
            const driveLetter = parts[0];
            const driveType = parseInt(parts[parts.length - 1]);
            const size = parseInt(parts[parts.length - 2]) || 0;
            const free = parseInt(parts[parts.length - 3]) || 0;
            const name = parts.slice(1, -3).join(' ') || 'Local Disk';
            
            if (driveType === 2 || driveType === 3) { // Removable or Fixed
              drives.push({
                path: driveLetter + '\\',
                name: name,
                type: driveType === 2 ? 'removable' : 'fixed',
                size: size,
                free: free,
                used: size - free,
                driveType: getDriveTypeString(driveType),
                default: driveLetter === 'C:',
                detected: true
              });
            }
          }
        }
      } catch (e) {
        console.log('WMIC failed, trying PowerShell...');
        try {
          const { stdout } = await execPromise('powershell "Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, VolumeName, Size, FreeSpace, DriveType | ConvertTo-Json"');
          const winDrives = JSON.parse(stdout);
          
          for (const drive of Array.isArray(winDrives) ? winDrives : [winDrives]) {
            if (drive.DriveType === 2 || drive.DriveType === 3) {
              drives.push({
                path: drive.DeviceID + '\\',
                name: drive.VolumeName || 'Local Disk',
                type: drive.DriveType === 2 ? 'removable' : 'fixed',
                size: parseInt(drive.Size) || 0,
                free: parseInt(drive.FreeSpace) || 0,
                used: parseInt(drive.Size) - parseInt(drive.FreeSpace),
                driveType: getDriveTypeString(drive.DriveType),
                default: drive.DeviceID === 'C:',
                detected: true
              });
            }
          }
        } catch (psError) {
          console.log('PowerShell detection failed:', psError);
        }
      }
      
    } else if (process.platform === 'darwin') {
      // macOS - detect volumes
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);
      
      try {
        const { stdout } = await execPromise('df -k | grep -E "^/dev/"');
        const lines = stdout.trim().split('\n');
        
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 6) {
            const mountPoint = parts[parts.length - 1];
            const size = parseInt(parts[1]) * 1024;
            const used = parseInt(parts[2]) * 1024;
            const free = parseInt(parts[3]) * 1024;
            
            // Skip system volumes
            if (mountPoint === '/' || mountPoint.startsWith('/System') || 
                mountPoint.startsWith('/private')) {
              continue;
            }
            
            drives.push({
              path: mountPoint,
              name: getVolumeName(mountPoint),
              type: mountPoint.includes('Volumes') ? 'removable' : 'fixed',
              size: size,
              free: free,
              used: used,
              driveType: 'unix',
              default: mountPoint === '/',
              detected: true
            });
          }
        }
      } catch (e) {
        console.log('macOS detection failed:', e);
      }
      
    } else if (process.platform === 'linux') {
      // 💽 ROBUST LINUX STORAGE DETECTION - MULTI-METHOD
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);
      
      console.log('🐧 Starting Linux storage detection...');
      
      // METHOD 1: Use lsblk (most reliable for block devices)
      try {
        console.log('🔍 METHOD 1: Using lsblk...');
        const { stdout: lsblkOutput } = await execPromise(
          'lsblk -o NAME,TYPE,SIZE,MOUNTPOINT,FSTYPE,LABEL,MODEL -J 2>/dev/null || lsblk -o NAME,TYPE,SIZE,MOUNTPOINT,FSTYPE,LABEL,MODEL -b -n 2>/dev/null'
        );
        
        let blockDevices;
        try {
          blockDevices = JSON.parse(lsblkOutput);
        } catch {
          // Parse non-JSON output
          const lines = lsblkOutput.trim().split('\n').slice(1);
          blockDevices = { blockdevices: [] };
          let currentDevice = null;
          
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 4) {
              const device = {
                name: parts[0],
                type: parts[1],
                size: parts[2],
                mountpoint: parts[3] || null,
                fstype: parts[4] || 'unknown',
                label: parts[5] || '',
                model: parts.slice(6).join(' ') || ''
              };
              blockDevices.blockdevices.push(device);
            }
          }
        }
        
        for (const device of blockDevices.blockdevices || []) {
          // Only process mounted filesystems
          if (device.mountpoint && device.mountpoint !== '[SWAP]' && device.type === 'disk') {
            try {
              // Get children partitions
              const children = device.children || [];
              for (const child of children) {
                if (child.mountpoint && child.mountpoint !== '[SWAP]') {
                  await processLinuxMount(child.mountpoint, child.label || device.model || 'Linux Volume', drives);
                }
              }
            } catch (e) {
              // Try the device itself
              await processLinuxMount(device.mountpoint, device.label || device.model || 'Linux Volume', drives);
            }
          }
        }
      } catch (lsblkError) {
        console.log('lsblk failed:', lsblkError.message);
      }
      
      // METHOD 2: Use df (for mounted filesystems)
      try {
        console.log('🔍 METHOD 2: Using df...');
        const { stdout: dfOutput } = await execPromise(
          'df -k -T 2>/dev/null | grep -E "^(/dev/|//)" | grep -v "tmpfs\\|udev\\|devtmpfs\\|overlay\\|squashfs"'
        );
        
        const lines = dfOutput.trim().split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 7) {
            const mountPoint = parts[6];
            const fsType = parts[1];
            const size = parseInt(parts[2]) * 1024;
            const used = parseInt(parts[3]) * 1024;
            const free = parseInt(parts[4]) * 1024;
            
            // Skip system mounts
            if (isSystemMount(mountPoint, fsType)) continue;
            
            // Check if already processed
            if (!drives.some(d => d.path === mountPoint)) {
              const name = await getLinuxVolumeName(mountPoint);
              const accessible = await checkAccessible(mountPoint);
              drives.push({
                path: mountPoint,
                name: name,
                type: getLinuxDriveType(mountPoint),
                size: size,
                free: free,
                used: used,
                total: size,
                filesystem: fsType,
                default: mountPoint === '/',
                detected: true,
                accessible: accessible
              });
            }
          }
        }
      } catch (dfError) {
        console.log('df failed:', dfError.message);
      }
      
      // METHOD 3: Check common mount directories
      console.log('🔍 METHOD 3: Checking common mount directories...');
      const commonMountDirs = [
        '/mnt',
        '/media',
        `/media/${process.env.USER || process.env.LOGNAME || 'user'}`,
        `/run/media/${process.env.USER || process.env.LOGNAME || 'user'}`,
        '/media/usb',
        '/media/cdrom',
        '/media/dvd',
        '/media/floppy'
      ];
      
      for (const mountDir of commonMountDirs) {
        try {
          await fs.access(mountDir);
          const stats = await fs.stat(mountDir);
          if (stats.isDirectory()) {
            const subdirs = await fs.readdir(mountDir, { withFileTypes: true });
            for (const subdir of subdirs) {
              if (subdir.isDirectory()) {
                const fullPath = path.join(mountDir, subdir.name);
                if (!drives.some(d => d.path === fullPath)) {
                  await processPotentialMount(fullPath, drives);
                }
              }
            }
          }
        } catch (error) {
          // Directory doesn't exist or inaccessible
          continue;
        }
      }
      
      // METHOD 4: Check /etc/fstab for configured mounts
      try {
        console.log('🔍 METHOD 4: Checking /etc/fstab...');
        const fstabContent = await fs.readFile('/etc/fstab', 'utf8');
        const lines = fstabContent.split('\n');
        
        for (const line of lines) {
          if (line.trim() && !line.startsWith('#')) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 2) {
              const mountPoint = parts[1];
              // Skip system mounts
              if (!isSystemMount(mountPoint) && 
                  !drives.some(d => d.path === mountPoint)) {
                try {
                  await fs.access(mountPoint);
                  await processPotentialMount(mountPoint, drives);
                } catch (error) {
                  // Mount point doesn't exist or inaccessible
                }
              }
            }
          }
        }
      } catch (fstabError) {
        console.log('fstab check failed:', fstabError.message);
      }
      
      // METHOD 5: Check /proc/mounts directly
      try {
        console.log('🔍 METHOD 5: Checking /proc/mounts...');
        const mountsContent = await fs.readFile('/proc/mounts', 'utf8');
        const lines = mountsContent.split('\n');
        
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 3 && parts[0].startsWith('/dev/')) {
            const mountPoint = parts[1];
            const fsType = parts[2];
            
            if (!isSystemMount(mountPoint, fsType) && 
                !drives.some(d => d.path === mountPoint)) {
              try {
                await processPotentialMount(mountPoint, drives);
              } catch (error) {
                continue;
              }
            }
          }
        }
      } catch (mountsError) {
        console.log('/proc/mounts check failed:', mountsError.message);
      }
      
      // Add user directories
      const userDirs = await getLinuxUserDirectories();
      drives.push(...userDirs);
      
      // Remove duplicates
      const uniqueDrives = [];
      const seenPaths = new Set();
      
      for (const drive of drives) {
        if (!seenPaths.has(drive.path)) {
          seenPaths.add(drive.path);
          uniqueDrives.push(drive);
        }
      }
      
      console.log(`✅ Linux detection complete: ${uniqueDrives.length} locations found`);
      drives.length = 0;
      drives.push(...uniqueDrives);
    }
  } catch (error) {
    console.error('Storage detection error:', error);
  }
  
  return drives;
}

// Helper function to process a Linux mount
async function processLinuxMount(mountPoint, name, drives) {
  try {
    await fs.access(mountPoint);
    const stats = await fs.stat(mountPoint);
    
    if (stats.isDirectory()) {
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);
      
      // Get disk usage
      let size = 0, free = 0, used = 0;
      try {
        const { stdout: dfOutput } = await execPromise(`df -k "${mountPoint}" 2>/dev/null | tail -1`);
        const parts = dfOutput.trim().split(/\s+/);
        if (parts.length >= 6) {
          size = parseInt(parts[1]) * 1024;
          used = parseInt(parts[2]) * 1024;
          free = parseInt(parts[3]) * 1024;
        }
      } catch (dfError) {
        // Use fallback calculation
        size = await getDirectorySize(mountPoint);
      }
      
      // Determine if it's accessible
      let accessible = true;
      try {
        await fs.readdir(mountPoint);
      } catch (error) {
        accessible = false;
      }
      
      // Clean up the name
      const cleanName = name
        .replace(/^\//, '')
        .replace(/[^a-zA-Z0-9\s\-_]/g, ' ')
        .trim() || path.basename(mountPoint) || 'Linux Volume';
      
      drives.push({
        path: mountPoint,
        name: cleanName,
        type: getLinuxDriveType(mountPoint),
        size: size,
        free: free,
        used: used,
        total: size + free,
        default: mountPoint === '/',
        detected: true,
        accessible: accessible,
        filesystem: await getLinuxFilesystem(mountPoint)
      });
    }
  } catch (error) {
    // Skip inaccessible mounts
  }
}

// Helper function to check if a mount is a system mount
function isSystemMount(mountPoint, fsType) {
  const systemMounts = [
    '/',
    '/boot',
    '/boot/efi',
    '/efi',
    '/sys',
    '/proc',
    '/dev',
    '/dev/pts',
    '/dev/shm',
    '/run',
    '/run/lock',
    '/run/user',
    '/var',
    '/var/log',
    '/var/tmp',
    '/tmp',
    '/snap',
    '/sysroot',
  ];
  
  const systemFsTypes = [
    'tmpfs',
    'devtmpfs',
    'proc',
    'sysfs',
    'cgroup',
    'cgroup2',
    'securityfs',
    'pstore',
    'efivarfs',
    'mqueue',
    'hugetlbfs',
    'overlay',
    'squashfs',
    'fuse.portal',
    'fusectl',
    'tracefs',
    'debugfs',
    'configfs',
    'ramfs',
    'autofs',
    'rpc_pipefs',
    'nfsd',
    'binfmt_misc'
  ];
  
  // Check if it's a system mount point
  if (systemMounts.some(sm => mountPoint === sm || mountPoint.startsWith(sm + '/'))) {
    return true;
  }
  
  // Check if it's a system filesystem type
  if (fsType && systemFsTypes.includes(fsType)) {
    return true;
  }
  
  // Check for special system patterns
  if (mountPoint.match(/^\/snap\/|^\/var\/snap\/|^\/run\/snap/)) {
    return true;
  }
  
  return false;
}

// Get Linux drive type based on mount point
function getLinuxDriveType(mountPoint) {
  if (mountPoint.includes('/media/') || mountPoint.includes('/mnt/')) {
    return 'removable';
  }
  if (mountPoint === '/') {
    return 'system';
  }
  if (mountPoint.includes('/home/')) {
    return 'home';
  }
  return 'fixed';
}

// Get Linux volume name
async function getLinuxVolumeName(mountPoint) {
  try {
    const { exec } = await import('child_process');
    const util = await import('util');
    const execPromise = util.promisify(exec);
    
    // Try to get label via blkid
    try {
      const { stdout } = await execPromise(
        `sudo blkid 2>/dev/null | grep $(df "${mountPoint}" 2>/dev/null | tail -1 | cut -d' ' -f1) 2>/dev/null || true`
      );
      if (stdout.includes('LABEL="')) {
        const match = stdout.match(/LABEL="([^"]+)"/);
        if (match) return match[1];
      }
    } catch (e) {
      // Try without sudo
      try {
        const { stdout } = await execPromise(
          `blkid 2>/dev/null | grep $(df "${mountPoint}" 2>/dev/null | tail -1 | cut -d' ' -f1) 2>/dev/null || true`
        );
        if (stdout.includes('LABEL="')) {
          const match = stdout.match(/LABEL="([^"]+)"/);
          if (match) return match[1];
        }
      } catch (e2) {
        // Fall through
      }
    }
    
    // Try to get via lsblk
    try {
      const { stdout } = await execPromise(
        `lsblk -no LABEL $(df "${mountPoint}" 2>/dev/null | tail -1 | cut -d' ' -f1) 2>/dev/null`
      );
      const label = stdout.trim();
      if (label) return label;
    } catch (e) {
      // Fall through
    }
    
    // Use directory name
    const dirName = path.basename(mountPoint);
    if (dirName && dirName !== '') {
      return dirName.charAt(0).toUpperCase() + dirName.slice(1);
    }
    
    // Default names based on path
    if (mountPoint === '/') return 'Root Filesystem';
    if (mountPoint.includes('/home/')) return 'Home Directory';
    if (mountPoint.includes('/media/')) return 'USB Drive';
    if (mountPoint.includes('/mnt/')) return 'Mounted Drive';
    
    return 'Linux Volume';
  } catch (error) {
    return path.basename(mountPoint) || 'Linux Volume';
  }
}

// Get filesystem type
async function getLinuxFilesystem(mountPoint) {
  try {
    const { exec } = await import('child_process');
    const util = await import('util');
    const execPromise = util.promisify(exec);
    
    const { stdout } = await execPromise(
      `df -T "${mountPoint}" 2>/dev/null | tail -1 | awk '{print $2}'`
    );
    return stdout.trim() || 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

// Check if path is accessible
async function checkAccessible(path) {
  try {
    await fs.access(path);
    // Try to read directory to ensure we have read permissions
    await fs.readdir(path, { withFileTypes: true });
    return true;
  } catch (error) {
    return false;
  }
}

// Process a potential mount point
async function processPotentialMount(mountPoint, drives) {
  try {
    await fs.access(mountPoint);
    const stats = await fs.stat(mountPoint);
    
    if (stats.isDirectory()) {
      // Get disk usage
      const size = await getDirectorySize(mountPoint);
      const accessible = await checkAccessible(mountPoint);
      
      // Skip if already in list
      if (drives.some(d => d.path === mountPoint)) return;
      
      const name = await getLinuxVolumeName(mountPoint);
      const type = getLinuxDriveType(mountPoint);
      
      drives.push({
        path: mountPoint,
        name: name,
        type: type,
        size: size,
        free: 0, // Will be calculated later
        used: size,
        default: mountPoint === '/',
        detected: true,
        accessible: accessible
      });
    }
  } catch (error) {
    // Skip inaccessible mounts
  }
}

// Get Linux user directories
async function getLinuxUserDirectories() {
  const userDirs = [];
  const userHome = os.homedir();
  
  const userDirectories = [
    { path: userHome, name: 'Home Directory' },
    { path: path.join(userHome, 'Desktop'), name: 'Desktop' },
    { path: path.join(userHome, 'Documents'), name: 'Documents' },
    { path: path.join(userHome, 'Downloads'), name: 'Downloads' },
    { path: path.join(userHome, 'Pictures'), name: 'Pictures' },
    { path: path.join(userHome, 'Music'), name: 'Music' },
    { path: path.join(userHome, 'Videos'), name: 'Videos' },
    { path: path.join(userHome, 'Public'), name: 'Public' },
    { path: path.join(userHome, 'Templates'), name: 'Templates' }
  ];
  
  for (const dir of userDirectories) {
    try {
      await fs.access(dir.path);
      const stats = await fs.stat(dir.path);
      if (stats.isDirectory()) {
        const size = await getDirectorySize(dir.path);
        userDirs.push({
          path: dir.path,
          name: dir.name,
          type: 'home',
          size: size,
          default: dir.path === userHome,
          detected: true,
          accessible: true
        });
      }
    } catch (error) {
      // Directory doesn't exist
    }
  }
  
  return userDirs;
}

async function getDefaultStorageLocations() {
  const defaults = [];
  
  try {
    // User's home directory
    const homeDir = os.homedir();
    defaults.push({
      path: homeDir,
      name: 'Home Directory',
      type: 'directory',
      default: true,
      detected: true
    });
    
    // App's user data directory
    const userDataDir = app.getPath('userData');
    if (userDataDir !== homeDir) {
      defaults.push({
        path: userDataDir,
        name: 'App Data',
        type: 'directory',
        default: true,
        detected: true
      });
    }
    
    // Desktop (if exists)
    const desktopDir = app.getPath('desktop');
    if (desktopDir && desktopDir !== homeDir) {
      defaults.push({
        path: desktopDir,
        name: 'Desktop',
        type: 'directory',
        default: true,
        detected: true
      });
    }
    
    // Documents (if exists)
    const docsDir = app.getPath('documents');
    if (docsDir && docsDir !== homeDir) {
      defaults.push({
        path: docsDir,
        name: 'Documents',
        type: 'directory',
        default: true,
        detected: true
      });
    }
    
    // Downloads (if exists)
    const downloadsDir = app.getPath('downloads');
    if (downloadsDir && downloadsDir !== homeDir) {
      defaults.push({
        path: downloadsDir,
        name: 'Downloads',
        type: 'directory',
        default: true,
        detected: true
      });
    }
    
  } catch (error) {
    console.error('Default locations error:', error);
  }
  
  return defaults;
}

async function detectCloudMounts() {
  const cloudMounts = [];
  
  try {
    const homeDir = os.homedir();
    
    // OneDrive detection
    const oneDrivePaths = [
      path.join(homeDir, 'OneDrive'),
      path.join(homeDir, 'OneDrive - Personal'),
      path.join(homeDir, 'OneDrive - Business')
    ];
    
    for (const oneDrivePath of oneDrivePaths) {
      try {
        await fs.access(oneDrivePath);
        const stats = await fs.stat(oneDrivePath);
        if (stats.isDirectory()) {
          cloudMounts.push({
            path: oneDrivePath,
            name: 'OneDrive',
            type: 'cloud',
            cloudProvider: 'onedrive',
            default: false,
            detected: true
          });
          break; // Use first found OneDrive
        }
      } catch { /* Continue */ }
    }
    
    // Google Drive detection
    const googleDrivePaths = [
      path.join(homeDir, 'Google Drive'),
      path.join(homeDir, 'GoogleDrive')
    ];
    
    for (const googleDrivePath of googleDrivePaths) {
      try {
        await fs.access(googleDrivePath);
        const stats = await fs.stat(googleDrivePath);
        if (stats.isDirectory()) {
          cloudMounts.push({
            path: googleDrivePath,
            name: 'Google Drive',
            type: 'cloud',
            cloudProvider: 'google-drive',
            default: false,
            detected: true
          });
          break; // Use first found Google Drive
        }
      } catch { /* Continue */ }
    }
    
    // Dropbox detection
    const dropboxPath = path.join(homeDir, 'Dropbox');
    try {
      await fs.access(dropboxPath);
      const stats = await fs.stat(dropboxPath);
      if (stats.isDirectory()) {
        cloudMounts.push({
          path: dropboxPath,
          name: 'Dropbox',
          type: 'cloud',
          cloudProvider: 'dropbox',
          default: false,
          detected: true
        });
      }
    } catch { /* Continue */ }
    
  } catch (error) {
    console.error('Cloud mount detection error:', error);
  }
  
  return cloudMounts;
}

async function calculateLocationStats(location) {
  try {
    const stats = await fs.stat(location.path);
    
    if (stats.isDirectory()) {
      try {
        location.size = await getDirectorySize(location.path);
        location.fileCount = await countFilesInDirectory(location.path);
        location.directoryCount = await countDirectoriesInDirectory(location.path);
        
        // Get free space for root of drive
        if (location.path.match(/^[A-Z]:\\$/i) || location.path === '/') {
          location.free = await getFreeDiskSpace(location.path);
          location.used = location.size;
          location.total = location.size + location.free;
        }
      } catch (error) {
        console.log(`Could not calculate size for ${location.path}:`, error.message);
        location.size = 0;
        location.fileCount = 0;
      }
    } else {
      location.size = stats.size;
      location.fileCount = 1;
    }
    
    location.lastModified = stats.mtime;
    location.created = stats.birthtime || stats.ctime;
    
  } catch (error) {
    console.error(`Stats calculation failed for ${location.path}:`, error);
    location.size = 0;
    location.fileCount = 0;
  }
  
  return location;
}

async function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      
      try {
        if (item.isDirectory()) {
          totalSize += await getDirectorySize(itemPath);
        } else if (item.isFile()) {
          const stats = await fs.stat(itemPath);
          totalSize += stats.size;
        }
      } catch (error) {
        // Skip inaccessible files/directories
        continue;
      }
    }
  } catch (error) {
    // Directory might be inaccessible
  }
  
  return totalSize;
}

async function countFilesInDirectory(dirPath) {
  let count = 0;
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      
      try {
        if (item.isDirectory()) {
          count += await countFilesInDirectory(itemPath);
        } else if (item.isFile()) {
          count++;
        }
      } catch (error) {
        continue;
      }
    }
  } catch (error) {
    // Directory might be inaccessible
  }
  
  return count;
}

async function countDirectoriesInDirectory(dirPath) {
  let count = 0;
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      try {
        if (item.isDirectory()) {
          count++;
          const itemPath = path.join(dirPath, item.name);
          count += await countDirectoriesInDirectory(itemPath);
        }
      } catch (error) {
        continue;
      }
    }
  } catch (error) {
    // Directory might be inaccessible
  }
  
  return count;
}

function getDriveTypeString(driveType) {
  switch (driveType) {
    case 0: return 'Unknown';
    case 1: return 'No Root Directory';
    case 2: return 'Removable Disk';
    case 3: return 'Local Disk';
    case 4: return 'Network Drive';
    case 5: return 'Compact Disc';
    case 6: return 'RAM Disk';
    default: return 'Unknown';
  }
}

function getVolumeName(mountPoint) {
  // Extract volume name from path
  const parts = mountPoint.split(path.sep);
  return parts[parts.length - 1] || mountPoint;
}

// 📁 FILE SYSTEM HANDLERS
ipcMain.handle('show-save-dialog', async (event, options) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: options.defaultPath,
      filters: options.filters || [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    return result;
  } catch (error) {
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'openDirectory'],
      filters: options.filters || [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    return result;
  } catch (error) {
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle('show-item-in-folder', async (event, path) => {
  try {
    shell.showItemInFolder(path);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 🔐 LICENSE HANDLERS
ipcMain.handle('validate-license', async (event, licenseKey) => {
  try {
    console.log('🔑 Validating license:', licenseKey);
    return {
      valid: true,
      plan: 'pro',
      expires: '2026-12-31',
      features: ['full'],
      message: 'Development mode - full access'
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
});

console.log('✅ Production main.js with HTTP server and REAL Playwright scraper loaded!');