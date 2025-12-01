<template>
  <div class="settings-tab">
    <!-- Header Section -->
    <div class="tab-header">
      <h1>Settings</h1>
      <p>Configure CodeScraper Pro to match your workflow and preferences</p>
    </div>

    <!-- Settings Navigation & Content -->
    <div class="settings-layout">
      <!-- Settings Sidebar -->
      <div class="settings-sidebar">
        <nav class="settings-nav">
          <button v-for="section in settingsSections" 
                  :key="section.id"
                  class="nav-item" 
                  :class="{ active: activeSection === section.id }"
                  @click="activeSection = section.id">
            <iconify-icon :icon="section.icon" class="nav-icon"></iconify-icon>
            <span class="nav-label">{{ section.name }}</span>
            <iconify-icon v-if="hasUnsavedChanges(section.id)" 
                         icon="material-symbols:circle" 
                         class="unsaved-dot"></iconify-icon>
          </button>
        </nav>

        <!-- Settings Actions -->
        <div class="settings-actions">
          <button class="btn btn-secondary" @click="resetToDefaults" :disabled="applyingDefaults">
            <iconify-icon icon="material-symbols:restart-alt"></iconify-icon>
            Reset to Defaults
          </button>
          <button class="btn btn-primary" @click="saveAllSettings" :disabled="saving">
            <iconify-icon :icon="saving ? 'eos-icons:loading' : 'material-symbols:save'"></iconify-icon>
            {{ saving ? 'Saving...' : 'Save All Changes' }}
          </button>
        </div>
      </div>

      <!-- Settings Content -->
      <div class="settings-content">
        <!-- General Settings -->
        <div v-if="activeSection === 'general'" class="settings-section">
          <div class="section-header">
            <h2>General Settings</h2>
            <p>Basic application behavior and startup options</p>
          </div>

          <div class="settings-grid">
            <div class="setting-card">
              <div class="setting-header">
                <h3>Application Behavior</h3>
                <iconify-icon icon="material-symbols:settings"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.general.startMinimized">
                    <span class="checkmark"></span>
                    Start minimized to system tray
                  </label>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.general.autoStart">
                    <span class="checkmark"></span>
                    Launch on system startup
                  </label>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.general.checkUpdates">
                    <span class="checkmark"></span>
                    Automatically check for updates
                  </label>
                </div>
                <!-- REMOVED: Send anonymous usage statistics -->
              </div>
            </div>

            <div class="setting-card">
              <div class="setting-header">
                <h3>File Handling</h3>
                <iconify-icon icon="material-symbols:folder"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="form-group">
                  <label for="defaultLocation">Default Save Location</label>
                  <div class="path-input-group">
                    <input type="text" id="defaultLocation" v-model="settings.general.defaultLocation" 
                           class="form-input" readonly>
                    <button class="btn btn-outline" @click="browseLocation">
                      <iconify-icon icon="material-symbols:folder-open"></iconify-icon>
                      Browse
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label for="autoSave">Auto-save Interval</label>
                  <select id="autoSave" v-model="settings.general.autoSaveInterval" class="form-select">
                    <option value="0">Never</option>
                    <option value="30000">Every 30 seconds</option>
                    <option value="60000">Every minute</option>
                    <option value="300000">Every 5 minutes</option>
                    <option value="900000">Every 15 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="setting-card">
              <div class="setting-header">
                <h3>Language & Region</h3>
                <iconify-icon icon="material-symbols:language"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="form-group">
                  <label for="language">Language</label>
                  <select id="language" v-model="settings.general.language" class="form-select">
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="ja">日本語</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="timezone">Timezone</label>
                  <select id="timezone" v-model="settings.general.timezone" class="form-select">
                    <option value="auto">Auto-detect</option>
                    <option value="utc">UTC</option>
                    <option value="est">Eastern Time</option>
                    <option value="cst">Central Time</option>
                    <option value="pst">Pacific Time</option>
                    <option value="gmt">GMT</option>
                    <option value="cet">Central European Time</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="dateFormat">Date Format</label>
                  <select id="dateFormat" v-model="settings.general.dateFormat" class="form-select">
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Appearance Settings -->
        <div v-if="activeSection === 'appearance'" class="settings-section">
          <div class="section-header">
            <h2>Appearance</h2>
            <p>Customize the look and feel of the application</p>
          </div>

          <div class="settings-grid">
            <div class="setting-card">
              <div class="setting-header">
                <h3>Theme & Colors</h3>
                <iconify-icon icon="material-symbols:palette"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="form-group">
                  <label for="theme">Theme</label>
                  <div class="theme-selector">
                    <div v-for="theme in themes" :key="theme.id" 
                         class="theme-option" :class="{ active: settings.appearance.theme === theme.id }"
                         @click="settings.appearance.theme = theme.id">
                      <div class="theme-preview" :style="theme.previewStyle"></div>
                      <span class="theme-name">{{ theme.name }}</span>
                    </div>
                    <div class="form-group">
  <label for="themeSelect" class="form-label">Theme</label>
  <select id="themeSelect" v-model="selectedTheme" @change="changeTheme" class="form-control">
    <option value="light">Light</option>
    <option value="dark">Dark</option>
  </select>
</div>
                  </div>
                </div>
                <div class="form-group">
                  <label for="accentColor">Accent Color</label>
                  <div class="color-picker-group">
                    <input type="color" id="accentColor" v-model="settings.appearance.accentColor" 
                           class="color-picker">
                    <span class="color-value">{{ settings.appearance.accentColor }}</span>
                  </div>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.appearance.syncWithSystem">
                    <span class="checkmark"></span>
                    Sync with system theme
                  </label>
                </div>
              </div>
            </div>

            <div class="setting-card">
              <div class="setting-header">
                <h3>Layout & Display</h3>
                <iconify-icon icon="material-symbols:dashboard"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="form-group">
                  <label for="fontSize">Font Size</label>
                  <div class="slider-group">
                    <input type="range" id="fontSize" v-model="settings.appearance.fontSize" 
                           min="12" max="18" step="1" class="slider">
                    <span class="slider-value">{{ settings.appearance.fontSize }}px</span>
                  </div>
                </div>
                <div class="form-group">
                  <label for="uiDensity">UI Density</label>
                  <select id="uiDensity" v-model="settings.appearance.uiDensity" class="form-select">
                    <option value="compact">Compact</option>
                    <option value="comfortable">Comfortable</option>
                    <option value="spacious">Spacious</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.appearance.showLineNumbers">
                    <span class="checkmark"></span>
                    Show line numbers in editor
                  </label>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.appearance.wordWrap">
                    <span class="checkmark"></span>
                    Enable word wrap in editor
                  </label>
                </div>
              </div>
            </div>

            <div class="setting-card">
              <div class="setting-header">
                <h3>Animations & Effects</h3>
                <iconify-icon icon="material-symbols:animation"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.appearance.animations">
                    <span class="checkmark"></span>
                    Enable animations
                  </label>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.appearance.smoothScrolling">
                    <span class="checkmark"></span>
                    Smooth scrolling
                  </label>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.appearance.reduceMotion">
                    <span class="checkmark"></span>
                    Reduce motion (accessibility)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Scraping Settings -->
        <div v-if="activeSection === 'scraping'" class="settings-section">
          <div class="section-header">
            <h2>Scraping Configuration</h2>
            <p>Configure how CodeScraper Pro handles web scraping operations</p>
          </div>

          <div class="settings-grid">
            <div class="setting-card">
              <div class="setting-header">
                <h3>File Types & Filters</h3>
                <iconify-icon icon="material-symbols:filter-list"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="form-group">
                  <label>Supported File Types</label>
                  <div class="file-types-grid">
                    <label v-for="fileType in fileTypes" :key="fileType.ext" class="checkbox-label file-type-label">
                      <input type="checkbox" v-model="settings.scraping.fileTypes" :value="fileType.ext">
                      <span class="checkmark"></span>
                      <iconify-icon :icon="fileType.icon" class="file-type-icon"></iconify-icon>
                      <span class="file-type-name">{{ fileType.name }}</span>
                      <code class="file-type-ext">.{{ fileType.ext }}</code>
                    </label>
                  </div>
                </div>
                <div class="form-group">
                  <label for="maxFileSize">Maximum File Size</label>
                  <div class="slider-group">
                    <input type="range" id="maxFileSize" v-model="settings.scraping.maxFileSize" 
                           min="1" max="50" step="1" class="slider">
                    <span class="slider-value">{{ settings.scraping.maxFileSize }} MB</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="setting-card">
              <div class="setting-header">
                <h3>Performance</h3>
                <iconify-icon icon="material-symbols:speed"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="form-group">
                  <label for="concurrentScrapers">Concurrent Scrapers</label>
                  <div class="slider-group">
                    <input type="range" id="concurrentScrapers" v-model="settings.scraping.concurrentScrapers" 
                           min="1" max="10" step="1" class="slider">
                    <span class="slider-value">{{ settings.scraping.concurrentScrapers }}</span>
                  </div>
                </div>
                <div class="form-group">
                  <label for="requestDelay">Request Delay</label>
                  <div class="slider-group">
                    <input type="range" id="requestDelay" v-model="settings.scraping.requestDelay" 
                           min="0" max="5000" step="100" class="slider">
                    <span class="slider-value">{{ settings.scraping.requestDelay }}ms</span>
                  </div>
                </div>
                <div class="form-group">
                  <label for="timeout">Request Timeout</label>
                  <div class="slider-group">
                    <input type="range" id="timeout" v-model="settings.scraping.timeout" 
                           min="5000" max="60000" step="5000" class="slider">
                    <span class="slider-value">{{ settings.scraping.timeout / 1000 }}s</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="setting-card">
              <div class="setting-header">
                <h3>Advanced Scraping</h3>
                <iconify-icon icon="material-symbols:tune"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.scraping.ignoreRobotsTxt">
                    <span class="checkmark"></span>
                    Ignore robots.txt
                  </label>
                  <small class="setting-description">Respect website crawling policies by keeping this disabled</small>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.scraping.followRedirects">
                    <span class="checkmark"></span>
                    Follow redirects
                  </label>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.scraping.retryFailed">
                    <span class="checkmark"></span>
                    Auto-retry failed requests
                  </label>
                </div>
                <div class="form-group">
                  <label for="userAgent">Custom User Agent</label>
                  <input type="text" id="userAgent" v-model="settings.scraping.userAgent" 
                         placeholder="Mozilla/5.0 (compatible; CodeScraper Pro/1.0)" class="form-input">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Proxy Settings -->
        <div v-if="activeSection === 'proxy'" class="settings-section">
          <div class="section-header">
            <h2>Proxy Configuration</h2>
            <p>Configure proxy settings for enhanced privacy and access</p>
          </div>

          <div class="settings-grid">
            <div class="setting-card">
              <div class="setting-header">
                <h3>Proxy Mode</h3>
                <iconify-icon icon="material-symbols:security"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="form-group">
                  <label>Proxy Usage</label>
                  <div class="radio-group">
                    <label class="radio-label">
                      <input type="radio" v-model="settings.proxy.mode" value="none">
                      <span class="radiomark"></span>
                      No proxy
                    </label>
                    <label class="radio-label">
                      <input type="radio" v-model="settings.proxy.mode" value="system">
                      <span class="radiomark"></span>
                      Use system proxy
                    </label>
                    <label class="radio-label">
                      <input type="radio" v-model="settings.proxy.mode" value="custom">
                      <span class="radiomark"></span>
                      Custom proxy
                    </label>
                  </div>
                </div>

                <div v-if="settings.proxy.mode === 'custom'" class="proxy-details">
                  <div class="form-group">
                    <label for="proxyHost">Proxy Server</label>
                    <input type="text" id="proxyHost" v-model="settings.proxy.host" 
                           placeholder="proxy.example.com" class="form-input">
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="proxyPort">Port</label>
                      <input type="number" id="proxyPort" v-model="settings.proxy.port" 
                             placeholder="8080" class="form-input">
                    </div>
                    <div class="form-group">
                      <label for="proxyType">Type</label>
                      <select id="proxyType" v-model="settings.proxy.type" class="form-select">
                        <option value="http">HTTP</option>
                        <option value="https">HTTPS</option>
                        <option value="socks4">SOCKS4</option>
                        <option value="socks5">SOCKS5</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="proxyUsername">Username</label>
                      <input type="text" id="proxyUsername" v-model="settings.proxy.username" 
                             class="form-input">
                    </div>
                    <div class="form-group">
                      <label for="proxyPassword">Password</label>
                      <input type="password" id="proxyPassword" v-model="settings.proxy.password" 
                             class="form-input">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="setting-card">
              <div class="setting-header">
                <h3>Proxy Rotation</h3>
                <iconify-icon icon="material-symbols:autorenew"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.proxy.autoRotate">
                    <span class="checkmark"></span>
                    Auto-rotate proxies
                  </label>
                </div>
                <div class="form-group">
                  <label for="rotationInterval">Rotation Interval</label>
                  <select id="rotationInterval" v-model="settings.proxy.rotationInterval" class="form-select">
                    <option value="0">Never</option>
                    <option value="300000">Every 5 minutes</option>
                    <option value="900000">Every 15 minutes</option>
                    <option value="1800000">Every 30 minutes</option>
                    <option value="3600000">Every hour</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="rotationStrategy">Rotation Strategy</label>
                  <select id="rotationStrategy" v-model="settings.proxy.rotationStrategy" class="form-select">
                    <option value="round-robin">Round Robin</option>
                    <option value="random">Random</option>
                    <option value="failover">Failover</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="setting-card">
              <div class="setting-header">
                <h3>Proxy Testing</h3>
                <iconify-icon icon="material-symbols:monitor-heart"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.proxy.testBeforeUse">
                    <span class="checkmark"></span>
                    Test proxies before use
                  </label>
                </div>
                <div class="form-group">
                  <label for="testUrl">Test URL</label>
                  <input type="text" id="testUrl" v-model="settings.proxy.testUrl" 
                         placeholder="https://httpbin.org/ip" class="form-input">
                </div>
                <div class="form-group">
                  <label for="testTimeout">Test Timeout</label>
                  <div class="slider-group">
                    <input type="range" id="testTimeout" v-model="settings.proxy.testTimeout" 
                           min="1000" max="30000" step="1000" class="slider">
                    <span class="slider-value">{{ settings.proxy.testTimeout / 1000 }}s</span>
                  </div>
                </div>
                <button class="btn btn-outline" @click="testProxySettings">
                  <iconify-icon icon="material-symbols:play-arrow"></iconify-icon>
                  Test Proxy Configuration
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Backup Settings -->
        <div v-if="activeSection === 'backup'" class="settings-section">
          <div class="section-header">
            <h2>Backup & Recovery</h2>
            <p>Configure automatic backups and data protection</p>
          </div>

          <div class="settings-grid">
            <div class="setting-card">
              <div class="setting-header">
                <h3>Auto Backup</h3>
                <iconify-icon icon="material-symbols:backup"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.backup.autoBackup">
                    <span class="checkmark"></span>
                    Enable automatic backups
                  </label>
                </div>
                <div class="form-group">
                  <label for="backupInterval">Backup Interval</label>
                  <select id="backupInterval" v-model="settings.backup.backupInterval" class="form-select">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="maxBackups">Maximum Backup Count</label>
                  <input type="number" id="maxBackups" v-model="settings.backup.maxBackups" 
                         min="1" max="100" class="form-input">
                </div>
                <div class="form-group">
                  <label for="backupLocation">Backup Location</label>
                  <div class="path-input-group">
                    <input type="text" id="backupLocation" v-model="settings.backup.location" 
                           class="form-input" readonly>
                    <button class="btn btn-outline" @click="browseBackupLocation">
                      <iconify-icon icon="material-symbols:folder-open"></iconify-icon>
                      Browse
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="setting-card">
              <div class="setting-header">
                <h3>Backup Content</h3>
                <iconify-icon icon="material-symbols:content-copy"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="form-group">
                  <label>Include in Backups</label>
                  <div class="checkbox-group">
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="settings.backup.includeSettings">
                      <span class="checkmark"></span>
                      Application settings
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="settings.backup.includeProxyList">
                      <span class="checkmark"></span>
                      Proxy configurations
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="settings.backup.includeScrapingData">
                      <span class="checkmark"></span>
                      Scraping results
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="settings.backup.includeCodeSnippets">
                      <span class="checkmark"></span>
                      Code snippets and templates
                    </label>
                  </div>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.backup.compressBackups">
                    <span class="checkmark"></span>
                    Compress backup files
                  </label>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.backup.encryptBackups">
                    <span class="checkmark"></span>
                    Encrypt backup files
                  </label>
                </div>
              </div>
            </div>

            <div class="setting-card">
              <div class="setting-header">
                <h3>Manual Backup</h3>
                <iconify-icon icon="material-symbols:settings-backup-restore"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="backup-actions">
                  <button class="btn btn-primary" @click="createBackup">
                    <iconify-icon icon="material-symbols:backup"></iconify-icon>
                    Create Backup Now
                  </button>
                  <button class="btn btn-outline" @click="restoreBackup">
                    <iconify-icon icon="material-symbols:restore"></iconify-icon>
                    Restore from Backup
                  </button>
                </div>
                <div class="backup-info">
                  <h4>Last Backup</h4>
                  <p v-if="lastBackup" class="backup-details">
                    <strong>Date:</strong> {{ formatDate(lastBackup.date) }}<br>
                    <strong>Size:</strong> {{ formatFileSize(lastBackup.size) }}<br>
                    <strong>Files:</strong> {{ lastBackup.fileCount }}
                  </p>
                  <p v-else class="no-backup">No backups created yet</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Advanced Settings -->
        <div v-if="activeSection === 'advanced'" class="settings-section">
          <div class="section-header">
            <h2>Advanced Settings</h2>
            <p>Advanced configuration options for power users</p>
          </div>

          <div class="settings-grid">
            <div class="setting-card">
              <div class="setting-header">
                <h3>Performance</h3>
                <iconify-icon icon="material-symbols:timer"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="form-group">
                  <label for="cacheSize">Cache Size Limit</label>
                  <div class="slider-group">
                    <input type="range" id="cacheSize" v-model="settings.advanced.cacheSize" 
                           min="50" max="1000" step="50" class="slider">
                    <span class="slider-value">{{ settings.advanced.cacheSize }} MB</span>
                  </div>
                </div>
                <div class="form-group">
                  <label for="maxMemory">Maximum Memory Usage</label>
                  <select id="maxMemory" v-model="settings.advanced.maxMemory" class="form-select">
                    <option value="512">512 MB</option>
                    <option value="1024">1 GB</option>
                    <option value="2048">2 GB</option>
                    <option value="4096">4 GB</option>
                    <option value="8192">8 GB</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.advanced.hardwareAcceleration">
                    <span class="checkmark"></span>
                    Enable hardware acceleration
                  </label>
                </div>
              </div>
            </div>

            <div class="setting-card">
              <div class="setting-header">
                <h3>Privacy & Security</h3>
                <iconify-icon icon="material-symbols:lock"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="privacy-features">
                  <div class="privacy-item">
                    <iconify-icon icon="material-symbols:check-circle" class="privacy-icon"></iconify-icon>
                    <div class="privacy-info">
                      <strong>No Data Collection</strong>
                      <p>We don't track anything - your usage is completely private</p>
                    </div>
                  </div>
                  <div class="privacy-item">
                    <iconify-icon icon="material-symbols:check-circle" class="privacy-icon"></iconify-icon>
                    <div class="privacy-info">
                      <strong>No Analytics</strong>
                      <p>No usage analytics or tracking of any kind</p>
                    </div>
                  </div>
                  <div class="privacy-item">
                    <iconify-icon icon="material-symbols:check-circle" class="privacy-icon"></iconify-icon>
                    <div class="privacy-info">
                      <strong>No Crash Reporting</strong>
                      <p>If it breaks, contact us directly - no automatic reports</p>
                    </div>
                  </div>
                  <div class="privacy-item">
                    <iconify-icon icon="material-symbols:check-circle" class="privacy-icon"></iconify-icon>
                    <div class="privacy-info">
                      <strong>Local Processing</strong>
                      <p>All scraping happens on YOUR computer</p>
                    </div>
                  </div>
                  <div class="privacy-item">
                    <iconify-icon icon="material-symbols:check-circle" class="privacy-icon"></iconify-icon>
                    <div class="privacy-info">
                      <strong>Data Stays Local</strong>
                      <p>All data stays on YOUR machine - we never see it</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="setting-card">
              <div class="setting-header">
                <h3>Experimental Features</h3>
                <iconify-icon icon="material-symbols:science"></iconify-icon>
              </div>
              <div class="setting-content">
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.advanced.experimentalUI">
                    <span class="checkmark"></span>
                    Experimental UI features
                  </label>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.advanced.aiAssistance">
                    <span class="checkmark"></span>
                    AI-powered code suggestions
                  </label>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="settings.advanced.parallelProcessing">
                    <span class="checkmark"></span>
                    Parallel processing (beta)
                  </label>
                </div>
                <div class="warning-message">
                  <iconify-icon icon="material-symbols:warning"></iconify-icon>
                  <span>Experimental features may be unstable</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- About Section -->
        <div v-if="activeSection === 'about'" class="settings-section">
          <div class="section-header">
            <h2>About CodeScraper Pro</h2>
            <p>Application information and humanitarian mission</p>
          </div>

          <div class="about-content">
            <!-- Mission Card -->
            <div class="about-card mission-card">
              <div class="mission-header">
                <iconify-icon icon="material-symbols:volunteer-activism" class="mission-icon"></iconify-icon>
                <h3>Our Mission - Solar Energy for Chad</h3>
              </div>
              
              <div class="mission-content">
                <div class="mission-section">
                  <h4>Privacy-First Design:</h4>
                  <ul class="mission-list">
                    <li>✅ No data collection - we don't track anything</li>
                    <li>✅ No analytics - your usage is private</li>
                    <li>✅ No crash reporting - if it breaks, contact us directly</li>
                    <li>✅ All scraping happens on YOUR computer</li>
                    <li>✅ All data stays on YOUR machine</li>
                  </ul>
                </div>

                <div class="mission-section">
                  <h4>Humanitarian Focus:</h4>
                  <ul class="mission-list">
                    <li>🌞🇹🇩 100% of profits fund solar panels in our country: Chad</li>
                    <li>🇹🇩🇸🇩 Supporting Sudanese refugee communities</li>
                    <li>💡🛖 Bringing electricity to remote villages</li>
                    <li>🫱🏿‍🫲🏾🫶🏿 Sustainable development, not surveillance</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- App Info Card -->
            <div class="about-card">
              <div class="app-info">
                <div class="app-icon">
                  <iconify-icon icon="material-symbols:code" class="icon-large"></iconify-icon>
                </div>
                <div class="app-details">
                  <h3>CodeScraper Pro</h3>
                  <p class="version">Version {{ appInfo.version }}</p>
                  <p class="build">Build {{ appInfo.build }}</p>
                </div>
              </div>

              <div class="app-description">
                <p>A privacy-first desktop application for web scraping and code extraction. 
                Built with Electron and Vue.js, providing a modern interface for managing your scraping projects.</p>
              </div>

              <div class="app-links">
                <button class="btn btn-primary" @click="checkForUpdates">
                  <iconify-icon icon="material-symbols:update"></iconify-icon>
                  Check for Updates
                </button>
                <button class="btn btn-outline" @click="viewLicense">
                  <iconify-icon icon="material-symbols:description"></iconify-icon>
                  View License
                </button>
              </div>
            </div>

            <!-- License System Card -->
            <div class="about-card">
              <div class="setting-header">
                <h3>License System</h3>
                <iconify-icon icon="material-symbols:key"></iconify-icon>
              </div>
              <div class="license-content">
                <div class="license-section">
                  <h4>Privacy-First Approach:</h4>
                  <ul>
                    <li>We only store your license key on our server for validation</li>
                    <li>No personal data is collected or stored</li>
                    <li>All scraping data remains on your computer</li>
                    <li>No usage analytics or tracking</li>
                  </ul>
                </div>
                <div class="license-section">
                  <h4>Crypto Payments:</h4>
                  <ul>
                    <li>We accept various cryptocurrencies for privacy</li>
                    <li>No banking information required</li>
                    <li>Instant license activation</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Desktop App Information -->
            <div class="about-card">
              <div class="setting-header">
                <h3>Desktop App Information</h3>
                <iconify-icon icon="material-symbols:desktop-windows"></iconify-icon>
              </div>
              <div class="desktop-info">
                <p>This web version demonstrates the interface. For full functionality:</p>
                <ol>
                  <li>Download the desktop app from <strong>harambee.sbs</strong></li>
                  <li>Available for Windows (.exe), macOS (.dmg), and Linux (.AppImage/.tar)</li>
                  <li>Your license key works across all platforms</li>
                  <li>All data remains locally on your computer</li>
                </ol>
              </div>
            </div>

            <!-- Contact & Support -->
            <div class="about-card">
              <div class="setting-header">
                <h3>Contact & Support</h3>
                <iconify-icon icon="material-symbols:contact-support"></iconify-icon>
              </div>
              <div class="contact-content">
                <p><strong>Need help? Contact us through any of these private methods:</strong></p>
                
                <div class="contact-methods">
                  <div class="contact-method">
                    <iconify-icon icon="material-symbols:mail" class="contact-icon"></iconify-icon>
                    <div class="contact-info">
                      <strong>Email</strong>
                      <p>support@harambee.sbs</p>
                    </div>
                  </div>
                  
                  <div class="contact-method">
                    <iconify-icon icon="material-symbols:chat" class="contact-icon"></iconify-icon>
                    <div class="contact-info">
                      <strong>Jabber/XMPP</strong>
                      <p>support@harambee.sbs</p>
                    </div>
                  </div>
                  
                  <div class="contact-method">
                    <iconify-icon icon="material-symbols:forum" class="contact-icon"></iconify-icon>
                    <div class="contact-info">
                      <strong>Session Messenger</strong>
                      <p>Download Session and contact us via our public key</p>
                    </div>
                  </div>
                  
                  <div class="contact-method">
                    <iconify-icon icon="material-symbols:send" class="contact-icon"></iconify-icon>
                    <div class="contact-info">
                      <strong>Telegram</strong>
                      <p>@harambeesupport</p>
                    </div>
                  </div>
                </div>

                <div class="support-note">
                  <iconify-icon icon="material-symbols:info"></iconify-icon>
                  <p>We are not a corporation - we're a small team focused on privacy and humanitarian work. 
                  Choose the contact method that feels most comfortable for you.</p>
                </div>
              </div>
            </div>

            <!-- System Information -->
            <div class="about-card">
              <div class="setting-header">
                <h3>System Information</h3>
                <iconify-icon icon="material-symbols:computer"></iconify-icon>
              </div>
              <div class="system-info">
                <div class="info-grid">
                  <div class="info-item">
                    <label>Platform:</label>
                    <span>{{ systemInfo.platform }}</span>
                  </div>
                  <div class="info-item">
                    <label>Architecture:</label>
                    <span>{{ systemInfo.arch }}</span>
                  </div>
                  <div class="info-item">
                    <label>Electron Version:</label>
                    <span>{{ systemInfo.electronVersion }}</span>
                  </div>
                  <div class="info-item">
                    <label>Chrome Version:</label>
                    <span>{{ systemInfo.chromeVersion }}</span>
                  </div>
                  <div class="info-item">
                    <label>Node.js Version:</label>
                    <span>{{ systemInfo.nodeVersion }}</span>
                  </div>
                  <div class="info-item">
                    <label>V8 Version:</label>
                    <span>{{ systemInfo.v8Version }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Legal Information -->
            <div class="about-card">
              <div class="setting-header">
                <h3>Legal Information</h3>
                <iconify-icon icon="material-symbols:gavel"></iconify-icon>
              </div>
              <div class="legal-info">
                <p>CodeScraper Pro &copy; 2024. All rights reserved.</p>
                <p>This software is provided as-is without any warranty. Use at your own risk.</p>
                <p><strong>Privacy Guarantee:</strong> We collect absolutely no data from our users. Your privacy is our priority.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Unsaved Changes Modal -->
    <div v-if="showUnsavedModal" class="modal-overlay" @click.self="showUnsavedModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Unsaved Changes</h3>
          <button class="btn-close" @click="showUnsavedModal = false">
            <iconify-icon icon="material-symbols:close"></iconify-icon>
          </button>
        </div>
        <div class="modal-body">
          <p>You have unsaved changes. Would you like to save them before proceeding?</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="discardChanges">Discard Changes</button>
          <button class="btn btn-primary" @click="saveAndContinue">Save and Continue</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Settings',
  data() {
    return {
      // Active settings section
      activeSection: 'general',
      
      // Loading states
      saving: false,
      applyingDefaults: false,

      // Modals
      showUnsavedModal: false,

      // Settings sections
      settingsSections: [
        { id: 'general', name: 'General', icon: 'material-symbols:settings' },
        { id: 'appearance', name: 'Appearance', icon: 'material-symbols:palette' },
        { id: 'scraping', name: 'Scraping', icon: 'material-symbols:cloud-download' },
        { id: 'proxy', name: 'Proxy', icon: 'material-symbols:security' },
        { id: 'backup', name: 'Backup', icon: 'material-symbols:backup' },
        { id: 'advanced', name: 'Advanced', icon: 'material-symbols:tune' },
        { id: 'about', name: 'About', icon: 'material-symbols:info' }
      ],

      // Original settings for comparison
      originalSettings: {},

      // Current settings
      settings: {
        general: {
          startMinimized: false,
          autoStart: false,
          checkUpdates: true,
          // REMOVED: sendStats: false,
          defaultLocation: '',
          autoSaveInterval: '300000',
          language: 'en',
          timezone: 'auto',
          dateFormat: 'MM/DD/YYYY'
        },
        appearance: {
          theme: 'dark',
          accentColor: '#6366f1',
          syncWithSystem: true,
          fontSize: 14,
          uiDensity: 'comfortable',
          showLineNumbers: true,
          wordWrap: true,
          animations: true,
          smoothScrolling: true,
          reduceMotion: false
        },
        scraping: {
          fileTypes: ['.js', '.html', '.css', '.py', '.java', '.json'],
          maxFileSize: 10,
          concurrentScrapers: 3,
          requestDelay: 1000,
          timeout: 30000,
          ignoreRobotsTxt: false,
          followRedirects: true,
          retryFailed: true,
          userAgent: ''
        },
        proxy: {
          mode: 'none',
          host: '',
          port: '',
          type: 'http',
          username: '',
          password: '',
          autoRotate: false,
          rotationInterval: '900000',
          rotationStrategy: 'round-robin',
          testBeforeUse: true,
          testUrl: 'https://httpbin.org/ip',
          testTimeout: 10000
        },
        backup: {
          autoBackup: true,
          backupInterval: 'weekly',
          maxBackups: 10,
          location: '',
          includeSettings: true,
          includeProxyList: true,
          includeScrapingData: true,
          includeCodeSnippets: true,
          compressBackups: true,
          encryptBackups: false
        },
        advanced: {
          cacheSize: 200,
          maxMemory: '2048',
          hardwareAcceleration: true,
          // REMOVED: debugMode: false,
          // REMOVED: verboseLogging: false,
          // REMOVED: logLevel: 'info',
          experimentalUI: false,
          aiAssistance: false,
          parallelProcessing: false
        }
      },

      // Themes for appearance settings
      themes: [
        { 
          id: 'dark', 
          name: 'Dark', 
          previewStyle: 'background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 2px solid #334155;' 
        },
        { 
          id: 'light', 
          name: 'Light', 
          previewStyle: 'background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border: 2px solid #cbd5e1;' 
        },
        { 
          id: 'blue', 
          name: 'Blue', 
          previewStyle: 'background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); border: 2px solid #3b82f6;' 
        },
        { 
          id: 'green', 
          name: 'Green', 
          previewStyle: 'background: linear-gradient(135deg, #065f46 0%, #047857 100%); border: 2px solid #10b981;' 
        }
      ],

      // File types for scraping settings
      fileTypes: [
        { ext: 'js', name: 'JavaScript', icon: 'material-symbols:javascript' },
        { ext: 'html', name: 'HTML', icon: 'material-symbols:html' },
        { ext: 'css', name: 'CSS', icon: 'material-symbols:css' },
        { ext: 'py', name: 'Python', icon: 'material-symbols:python' },
        { ext: 'java', name: 'Java', icon: 'material-symbols:java' },
        { ext: 'cpp', name: 'C++', icon: 'material-symbols:cpp' },
        { ext: 'php', name: 'PHP', icon: 'material-symbols:php' },
        { ext: 'json', name: 'JSON', icon: 'material-symbols:json' },
        { ext: 'xml', name: 'XML', icon: 'material-symbols:xml' },
        { ext: 'md', name: 'Markdown', icon: 'material-symbols:markdown' },
        { ext: 'txt', name: 'Text', icon: 'material-symbols:description' },
        { ext: 'csv', name: 'CSV', icon: 'material-symbols:table' }
      ],

      // App and system info
      appInfo: {
        version: '1.0.0',
        build: '2024.1.0'
      },
      systemInfo: {
        platform: 'Unknown',
        arch: 'Unknown',
        electronVersion: 'Unknown',
        chromeVersion: 'Unknown',
        nodeVersion: 'Unknown',
        v8Version: 'Unknown'
      },

      // Backup info
      lastBackup: null
    }
  },

  computed: {
    hasUnsavedChanges() {
      return (sectionId) => {
        if (!this.originalSettings[sectionId]) return false
        return JSON.stringify(this.settings[sectionId]) !== JSON.stringify(this.originalSettings[sectionId])
      }
    },

    totalUnsavedChanges() {
      return this.settingsSections.filter(section => this.hasUnsavedChanges(section.id)).length
    }
  },

  watch: {
    activeSection(newSection, oldSection) {
      if (oldSection && this.hasUnsavedChanges(oldSection)) {
        this.showUnsavedModal = true
        this.pendingSection = newSection
      }
    }
  },

  async mounted() {
    await this.loadSettings()
    await this.loadSystemInfo()
    await this.loadBackupInfo()
    
    // Save original settings for comparison
    this.originalSettings = JSON.parse(JSON.stringify(this.settings))
  },

  methods: {
    // Settings management
    async loadSettings() {
      try {
        if (window.electronAPI && window.electronAPI.getSettings) {
          const result = await window.electronAPI.getSettings()
          if (result.success) {
            this.settings = { ...this.settings, ...result.settings }
          }
        } else {
          // Fallback: Load from localStorage
          this.loadFromLocalStorage()
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
        this.loadFromLocalStorage()
      }
    },

    loadFromLocalStorage() {
      Object.keys(this.settings).forEach(section => {
        const stored = localStorage.getItem(`settings_${section}`)
        if (stored) {
          this.settings[section] = { ...this.settings[section], ...JSON.parse(stored) }
        }
      })
    },

    async saveAllSettings() {
      this.saving = true
      try {
        if (window.electronAPI && window.electronAPI.saveSettings) {
          const result = await window.electronAPI.saveSettings(this.settings)
          if (result.success) {
            this.originalSettings = JSON.parse(JSON.stringify(this.settings))
            this.showSuccess('Settings saved successfully')
          }
        } else {
          // Fallback: Save to localStorage
          this.saveToLocalStorage()
          this.originalSettings = JSON.parse(JSON.stringify(this.settings))
          this.showSuccess('Settings saved successfully (local)')
        }
      } catch (error) {
        console.error('Failed to save settings:', error)
        this.showError('Failed to save settings')
      } finally {
        this.saving = false
      }
    },

    saveToLocalStorage() {
      Object.keys(this.settings).forEach(section => {
        localStorage.setItem(`settings_${section}`, JSON.stringify(this.settings[section]))
      })
    },

    async resetToDefaults() {
      this.applyingDefaults = true
      try {
        const defaultSettings = this.getDefaultSettings()
        this.settings = JSON.parse(JSON.stringify(defaultSettings))
        
        if (window.electronAPI && window.electronAPI.resetSettings) {
          await window.electronAPI.resetSettings()
        } else {
          this.saveToLocalStorage()
        }
        
        this.originalSettings = JSON.parse(JSON.stringify(this.settings))
        this.showSuccess('Settings reset to defaults')
      } catch (error) {
        console.error('Failed to reset settings:', error)
        this.showError('Failed to reset settings')
      } finally {
        this.applyingDefaults = false
      }
    },

    getDefaultSettings() {
      // Return a fresh copy of default settings
      return {
        general: {
          startMinimized: false,
          autoStart: false,
          checkUpdates: true,
          // REMOVED: sendStats: false,
          defaultLocation: '',
          autoSaveInterval: '300000',
          language: 'en',
          timezone: 'auto',
          dateFormat: 'MM/DD/YYYY'
        },
        appearance: {
          theme: 'dark',
          accentColor: '#6366f1',
          syncWithSystem: true,
          fontSize: 14,
          uiDensity: 'comfortable',
          showLineNumbers: true,
          wordWrap: true,
          animations: true,
          smoothScrolling: true,
          reduceMotion: false
        },
        scraping: {
          fileTypes: ['.js', '.html', '.css', '.py', '.java', '.json'],
          maxFileSize: 10,
          concurrentScrapers: 3,
          requestDelay: 1000,
          timeout: 30000,
          ignoreRobotsTxt: false,
          followRedirects: true,
          retryFailed: true,
          userAgent: ''
        },
        proxy: {
          mode: 'none',
          host: '',
          port: '',
          type: 'http',
          username: '',
          password: '',
          autoRotate: false,
          rotationInterval: '900000',
          rotationStrategy: 'round-robin',
          testBeforeUse: true,
          testUrl: 'https://httpbin.org/ip',
          testTimeout: 10000
        },
        backup: {
          autoBackup: true,
          backupInterval: 'weekly',
          maxBackups: 10,
          location: '',
          includeSettings: true,
          includeProxyList: true,
          includeScrapingData: true,
          includeCodeSnippets: true,
          compressBackups: true,
          encryptBackups: false
        },
        advanced: {
          cacheSize: 200,
          maxMemory: '2048',
          hardwareAcceleration: true,
          // REMOVED: debugMode: false,
          // REMOVED: verboseLogging: false,
          // REMOVED: logLevel: 'info',
          experimentalUI: false,
          aiAssistance: false,
          parallelProcessing: false
        }
      }
    },

    // File browsing
    browseLocation() {
      if (window.electronAPI && window.electronAPI.showOpenDialog) {
        // This would open a folder dialog in Electron
        console.log('Open folder dialog for default location')
        // For demo purposes, set a sample path
        this.settings.general.defaultLocation = '/home/user/Documents/CodeScraper'
      }
    },

    browseBackupLocation() {
      if (window.electronAPI && window.electronAPI.showOpenDialog) {
        console.log('Open folder dialog for backup location')
        this.settings.backup.location = '/home/user/Backups/CodeScraper'
      }
    },

    // Proxy testing
    async testProxySettings() {
      try {
        if (window.electronAPI && window.electronAPI.testProxy) {
          const result = await window.electronAPI.testProxy(this.settings.proxy)
          if (result.success) {
            this.showSuccess('Proxy configuration test passed')
          } else {
            this.showError('Proxy configuration test failed: ' + result.error)
          }
        } else {
          // Simulate proxy test
          await new Promise(resolve => setTimeout(resolve, 2000))
          this.showSuccess('Proxy configuration test passed (simulated)')
        }
      } catch (error) {
        console.error('Proxy test failed:', error)
        this.showError('Proxy test failed: ' + error.message)
      }
    },

    // Backup operations
    async createBackup() {
      try {
        if (window.electronAPI && window.electronAPI.createBackup) {
          const result = await window.electronAPI.createBackup(this.settings.backup)
          if (result.success) {
            this.showSuccess('Backup created successfully')
            await this.loadBackupInfo()
          }
        } else {
          // Simulate backup creation
          await new Promise(resolve => setTimeout(resolve, 3000))
          this.showSuccess('Backup created successfully (simulated)')
          this.lastBackup = {
            date: new Date(),
            size: 1024 * 1024 * 5, // 5MB
            fileCount: 42
          }
        }
      } catch (error) {
        console.error('Backup creation failed:', error)
        this.showError('Backup creation failed')
      }
    },

    async restoreBackup() {
      try {
        if (window.electronAPI && window.electronAPI.restoreBackup) {
          const result = await window.electronAPI.restoreBackup()
          if (result.success) {
            this.showSuccess('Backup restored successfully')
          }
        } else {
          // Simulate backup restoration
          this.showSuccess('Backup restored successfully (simulated)')
        }
      } catch (error) {
        console.error('Backup restoration failed:', error)
        this.showError('Backup restoration failed')
      }
    },

    async loadBackupInfo() {
      try {
        if (window.electronAPI && window.electronAPI.getBackupInfo) {
          const result = await window.electronAPI.getBackupInfo()
          if (result.success) {
            this.lastBackup = result.lastBackup
          }
        } else {
          // Sample backup info
          this.lastBackup = {
            date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            size: 1024 * 1024 * 3, // 3MB
            fileCount: 28
          }
        }
      } catch (error) {
        console.error('Failed to load backup info:', error)
      }
    },

    // System information
    async loadSystemInfo() {
      try {
        if (window.electronAPI && window.electronAPI.getSystemInfo) {
          const result = await window.electronAPI.getSystemInfo()
          if (result.success) {
            this.systemInfo = result.info
          }
        } else {
          // Sample system info
          this.systemInfo = {
            platform: process.platform || 'Unknown',
            arch: process.arch || 'Unknown',
            electronVersion: '28.0.0',
            chromeVersion: '120.0.0.0',
            nodeVersion: process.version || 'Unknown',
            v8Version: process.versions?.v8 || 'Unknown'
          }
        }
      } catch (error) {
        console.error('Failed to load system info:', error)
      }
    },

    // About section actions
    async checkForUpdates() {
      try {
        if (window.electronAPI && window.electronAPI.checkForUpdates) {
          const result = await window.electronAPI.checkForUpdates()
          if (result.updateAvailable) {
            this.showSuccess(`Update available: ${result.version}`)
          } else {
            this.showSuccess('You are using the latest version')
          }
        } else {
          this.showSuccess('You are using the latest version (simulated)')
        }
      } catch (error) {
        console.error('Update check failed:', error)
        this.showError('Update check failed')
      }
    },

    viewLicense() {
      if (window.electronAPI && window.electronAPI.openLicense) {
        window.electronAPI.openLicense()
      } else {
        this.showInfo('License information would be displayed here')
      }
    },

    // Modal handling
    discardChanges() {
      this.showUnsavedModal = false
      this.activeSection = this.pendingSection
      this.pendingSection = null
    },

    async saveAndContinue() {
      await this.saveAllSettings()
      this.showUnsavedModal = false
      this.activeSection = this.pendingSection
      this.pendingSection = null
    },

    // Utility methods
    formatDate(date) {
      return new Date(date).toLocaleString()
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    showSuccess(message) {
      // In a real app, you'd use a toast notification system
      console.log('Success:', message)
      alert(message) // Simple alert for demo
    },

    showError(message) {
      console.error('Error:', message)
      alert('Error: ' + message) // Simple alert for demo
    },

    showInfo(message) {
      console.log('Info:', message)
      alert(message) // Simple alert for demo
    }
  }
}
</script>

<style scoped>
.settings-tab {
  padding: 1rem;
  height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
}

.tab-header {
  margin-bottom: 1.5rem;
}

.tab-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.tab-header p {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

/* Settings Layout */
.settings-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  flex: 1;
  min-height: 0;
}

/* Settings Sidebar */
.settings-sidebar {
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.nav-icon {
  font-size: 1.25rem;
}

.nav-label {
  flex: 1;
  font-weight: 500;
}

.unsaved-dot {
  color: var(--warning-color);
  font-size: 0.5rem;
}

.settings-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Settings Content */
.settings-content {
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow-y: auto;
  padding: 2rem;
}

.settings-section {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-header {
  margin-bottom: 2rem;
}

.section-header h2 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.section-header p {
  color: var(--text-secondary);
  font-size: 1rem;
}

/* Settings Grid */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.setting-card {
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.setting-header h3 {
  color: var(--text-primary);
  font-size: 1.1rem;
  margin: 0;
}

.setting-header iconify-icon {
  color: var(--primary-color);
  font-size: 1.25rem;
}

.setting-content {
  padding: 1.5rem;
}

/* Form Styles */
.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.path-input-group {
  display: flex;
  gap: 0.5rem;
}

.path-input-group .form-input {
  flex: 1;
}

/* Checkbox & Radio */
.checkbox-label,
.radio-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: normal;
  margin-bottom: 0.5rem;
}

.checkbox-label:last-child,
.radio-label:last-child {
  margin-bottom: 0;
}

.checkbox-label input[type="checkbox"],
.radio-label input[type="radio"] {
  display: none;
}

.checkmark,
.radiomark {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.radiomark {
  border-radius: 50%;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.checkbox-label input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.radio-label input[type="radio"]:checked + .radiomark {
  border-color: var(--primary-color);
}

.radio-label input[type="radio"]:checked + .radiomark::after {
  content: '';
  width: 8px;
  height: 8px;
  background: var(--primary-color);
  border-radius: 50%;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.setting-description {
  display: block;
  margin-top: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-style: italic;
}

/* Theme Selector */
.theme-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.75rem;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-option:hover {
  background: var(--bg-hover);
}

.theme-option.active {
  border-color: var(--primary-color);
  background: var(--bg-hover);
}

.theme-preview {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  border: 2px solid var(--border-color);
}

.theme-name {
  font-size: 0.8rem;
  color: var(--text-primary);
  text-align: center;
}

/* Color Picker */
.color-picker-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-picker {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
}

.color-value {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-family: monospace;
}

/* Slider */
.slider-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--bg-tertiary);
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-value {
  color: var(--text-secondary);
  font-size: 0.9rem;
  min-width: 60px;
  text-align: right;
}

/* File Types */
.file-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  background: var(--bg-primary);
}

.file-type-label {
  margin: 0;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.file-type-label:hover {
  background: var(--bg-hover);
}

.file-type-icon {
  font-size: 1rem;
  color: var(--primary-color);
}

.file-type-name {
  flex: 1;
  font-size: 0.8rem;
}

.file-type-ext {
  font-size: 0.7rem;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: monospace;
}

/* Proxy Details */
.proxy-details {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 6px;
  border: 1px solid var(--border-light);
}

/* Backup Actions */
.backup-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.backup-info {
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 6px;
  border: 1px solid var(--border-light);
}

.backup-info h4 {
  margin: 0 0 0.75rem 0;
  color: var(--text-primary);
  font-size: 1rem;
}

.backup-details {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.no-backup {
  margin: 0;
  color: var(--text-muted);
  font-style: italic;
}

/* Warning Message */
.warning-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 6px;
  color: var(--warning-color);
  font-size: 0.9rem;
}

.warning-message iconify-icon {
  font-size: 1.1rem;
}

/* About Section */
.about-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.about-card {
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  padding: 2rem;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.app-icon {
  width: 80px;
  height: 80px;
  background: var(--primary-color);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-large {
  font-size: 3rem;
  color: white;
}

.app-details h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  font-size: 1.5rem;
}

.version {
  margin: 0 0 0.25rem 0;
  color: var(--text-primary);
  font-weight: 600;
}

.build {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.app-description {
  margin-bottom: 1.5rem;
}

.app-description p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.app-links {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.system-info,
.legal-info {
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  padding: 1.5rem;
}

.system-info h3,
.legal-info h3 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: 1.2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-light);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

.info-item span {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-family: monospace;
}

.legal-info p {
  margin: 0 0 1rem 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.legal-links {
  display: flex;
  gap: 1.5rem;
}

.legal-links a {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.legal-links a:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

/* Button Styles */
.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.9rem;
  text-decoration: none;
  justify-content: center;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-secondary);
}

.btn-outline {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-outline:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--card-bg);
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  color: var(--text-primary);
  margin: 0;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
  
  .settings-sidebar {
    order: 2;
  }
  
  .settings-content {
    order: 1;
  }
}

@media (max-width: 768px) {
  .settings-tab {
    padding: 0.5rem;
  }
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .app-links {
    flex-direction: column;
  }
  
  .legal-links {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .settings-nav {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }
  
  .nav-item {
    white-space: nowrap;
    flex-shrink: 0;
  }
  
  .nav-label {
    display: none;
  }
  
  .unsaved-dot {
    position: absolute;
    top: 8px;
    right: 8px;
  }
}
.mission-card {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: white;
  border: none;
}

.mission-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.mission-icon {
  font-size: 2.5rem;
}

.mission-header h3 {
  color: white;
  margin: 0;
  font-size: 1.5rem;
}

.mission-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.mission-section h4 {
  color: white;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
}

.mission-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.mission-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.mission-list li:last-child {
  border-bottom: none;
}

/* License Content */
.license-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.license-section h4 {
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
}

.license-section ul {
  margin: 0;
  padding-left: 1.5rem;
  color: var(--text-secondary);
}

.license-section li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

/* Desktop Info */
.desktop-info {
  color: var(--text-secondary);
  line-height: 1.6;
}

.desktop-info ol {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.desktop-info li {
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.desktop-info strong {
  color: var(--text-primary);
}

/* Contact Content */
.contact-content {
  color: var(--text-secondary);
  line-height: 1.6;
}

.contact-methods {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1.5rem 0;
}

.contact-method {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.contact-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
  flex-shrink: 0;
}

.contact-info {
  flex: 1;
}

.contact-info strong {
  display: block;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.contact-info p {
  margin: 0;
  color: var(--text-secondary);
}

.support-note {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  color: var(--text-secondary);
}

.support-note iconify-icon {
  color: var(--primary-color);
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.support-note p {
  margin: 0;
  line-height: 1.5;
}

/* Privacy Features */
.privacy-features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.privacy-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-primary);
  border-radius: 6px;
  border: 1px solid var(--border-light);
}

.privacy-icon {
  color: var(--success-color);
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.privacy-info {
  flex: 1;
}

.privacy-info strong {
  display: block;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.privacy-info p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
}
/* Enhanced setting cards */
.setting-card.advanced {
  border-left: 4px solid var(--warning-color);
}

.setting-card.experimental {
  border-left: 4px solid var(--accent-color);
}

.setting-card.privacy {
  border-left: 4px solid var(--success-color);
}

/* Enhanced theme selector */
.theme-option {
  position: relative;
  overflow: hidden;
}

.theme-option::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.theme-option:hover::before {
  opacity: 1;
}

.theme-option.active::after {
  content: '✓';
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: var(--primary-color);
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

/* Enhanced backup section */
.backup-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: var(--radius);
  margin-bottom: 1rem;
}

.backup-status.success {
  border-left: 4px solid var(--success-color);
}

.backup-status.warning {
  border-left: 4px solid var(--warning-color);
}

.backup-status.error {
  border-left: 4px solid var(--error-color);
}

/* Enhanced privacy features */
.privacy-feature {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: var(--radius);
  margin-bottom: 0.5rem;
  border: 1px solid var(--border-color);
}

.privacy-feature.guaranteed {
  background: linear-gradient(135deg, var(--success-light) 0%, transparent 100%);
  border-color: var(--success-color);
}

/* Enhanced mission section */
.mission-highlight {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: white;
  padding: 2rem;
  border-radius: var(--radius);
  margin: 2rem 0;
  text-align: center;
}

.mission-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.mission-stat {
  text-align: center;
}

.mission-stat-value {
  font-size: 2rem;
  font-weight: bold;
  display: block;
}

.mission-stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
}
/* In Settings.vue scoped styles */
.about-section {
  background: var(--card-bg) !important;
  color: var(--text-primary) !important;
}

.about-section p,
.about-section li {
  color: var(--text-primary) !important;
}

.about-section h3 {
  color: var(--text-primary) !important;
}
</style>