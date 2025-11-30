<template>
  <div class="tab-content active" id="download">
    <div class="tab-header">
      <h2><iconify-icon icon="material-symbols:system-update"></iconify-icon> Update Center</h2>
      <p>Keep your CodeScraper Pro updated with the latest features and improvements</p>
    </div>

    <!-- Update Status Card -->
    <div class="update-status-card" :class="updateStatus.class">
      <div class="status-header">
        <div class="status-icon">
          <iconify-icon :icon="updateStatus.icon"></iconify-icon>
        </div>
        <div class="status-content">
          <h3>{{ updateStatus.title }}</h3>
          <p>{{ updateStatus.message }}</p>
        </div>
        <div class="status-badge" v-if="updateStatus.badge">
          {{ updateStatus.badge }}
        </div>
      </div>
      
      <div class="status-details" v-if="updateStatus.details">
        <div class="detail-item">
          <strong>Current Version:</strong> {{ currentVersion }}
        </div>
        <div class="detail-item" v-if="latestVersion">
          <strong>Latest Version:</strong> {{ latestVersion }}
        </div>
        <div class="detail-item" v-if="updateStatus.releaseDate">
          <strong>Release Date:</strong> {{ updateStatus.releaseDate }}
        </div>
      </div>

      <div class="status-actions" v-if="updateStatus.actions">
        <button 
          v-for="action in updateStatus.actions" 
          :key="action.label"
          :class="action.class"
          @click="action.handler"
        >
          <iconify-icon :icon="action.icon"></iconify-icon>
          {{ action.label }}
        </button>
      </div>
    </div>

    <!-- Manual Check & Settings -->
    <div class="update-controls">
      <div class="control-group">
        <h3>Update Settings</h3>
        <div class="settings-grid">
          <label class="checkbox-label">
            <input type="checkbox" v-model="updateSettings.autoCheck">
            Check for updates automatically
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="updateSettings.showNotifications">
            Show update notifications
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="updateSettings.includeBeta">
            Include beta releases
          </label>
        </div>
      </div>

      <div class="control-actions">
        <button class="btn btn-primary" @click="checkForUpdates" :disabled="checkingUpdate">
          <iconify-icon v-if="checkingUpdate" icon="svg-spinners:bars-rotate-fade"></iconify-icon>
          <iconify-icon v-else icon="material-symbols:refresh"></iconify-icon>
          {{ checkingUpdate ? 'Checking...' : 'Check for Updates' }}
        </button>
        
        <button class="btn btn-outline" @click="viewAllReleases">
          <iconify-icon icon="material-symbols:history"></iconify-icon>
          Version History
        </button>

        <button class="btn btn-outline" @click="openDownloadsPage">
          <iconify-icon icon="material-symbols:download"></iconify-icon>
          Download Previous Versions
        </button>
      </div>
    </div>

    <!-- What's New Section -->
    <div v-if="latestRelease" class="whats-new-section">
      <h3>What's New in v{{ latestRelease.version }}</h3>
      <div class="release-card">
        <div class="release-header">
          <div class="release-badge" :class="latestRelease.type">
            {{ latestRelease.type.toUpperCase() }}
          </div>
          <div class="release-date">{{ formatDate(latestRelease.date) }}</div>
        </div>
        
        <div class="release-content">
          <h4>{{ latestRelease.title }}</h4>
          <p class="release-description">{{ latestRelease.description }}</p>
          
          <div class="changelog">
            <h5>Changelog:</h5>
            <ul>
              <li v-for="(change, index) in latestRelease.changes" :key="index">
                <iconify-icon :icon="getChangeTypeIcon(change.type)"></iconify-icon>
                <span :class="`change-${change.type}`">{{ change.description }}</span>
              </li>
            </ul>
          </div>

          <div class="release-actions">
            <button class="btn btn-primary" @click="downloadUpdate(latestRelease)">
              <iconify-icon icon="material-symbols:download"></iconify-icon>
              Download v{{ latestRelease.version }}
            </button>
            <button class="btn btn-outline" @click="viewReleaseNotes(latestRelease)">
              <iconify-icon icon="material-symbols:description"></iconify-icon>
              Release Notes
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Version History -->
    <div class="version-history">
      <div class="section-header">
        <h3>Version History</h3>
        <div class="history-filters">
          <select v-model="versionFilter" class="form-control">
            <option value="all">All Versions</option>
            <option value="major">Major Releases</option>
            <option value="minor">Minor Updates</option>
            <option value="patch">Patch Updates</option>
            <option value="beta">Beta Releases</option>
          </select>
        </div>
      </div>

      <div class="version-timeline">
        <div 
          v-for="release in filteredReleases" 
          :key="release.version"
          class="version-item"
          :class="{ current: release.version === currentVersion, latest: release.version === latestVersion }"
        >
          <div class="version-marker">
            <div class="marker-dot" :class="release.type"></div>
            <div class="version-line" v-if="!release.isLast"></div>
          </div>
          
          <div class="version-content">
            <div class="version-header">
              <h4>v{{ release.version }}</h4>
              <div class="version-badges">
                <span class="version-badge type" :class="release.type">
                  {{ release.type.toUpperCase() }}
                </span>
                <span v-if="release.version === currentVersion" class="version-badge current">
                  Current
                </span>
                <span v-if="release.version === latestVersion" class="version-badge latest">
                  Latest
                </span>
              </div>
            </div>
            
            <p class="version-description">{{ release.title }}</p>
            
            <div class="version-meta">
              <span class="meta-item">
                <iconify-icon icon="material-symbols:calendar-today"></iconify-icon>
                {{ formatDate(release.date) }}
              </span>
              <span class="meta-item" v-if="release.downloads">
                <iconify-icon icon="material-symbols:download"></iconify-icon>
                {{ release.downloads.toLocaleString() }} downloads
              </span>
              <span class="meta-item" v-if="release.size">
                <iconify-icon icon="material-symbols:data-usage"></iconify-icon>
                {{ release.size }}
              </span>
            </div>

            <div class="version-actions">
              <button class="btn btn-sm btn-outline" @click="viewReleaseDetails(release)">
                <iconify-icon icon="material-symbols:visibility"></iconify-icon>
                Details
              </button>
              <button class="btn btn-sm btn-outline" @click="downloadVersion(release)">
                <iconify-icon icon="material-symbols:download"></iconify-icon>
                Download
              </button>
              <button 
                v-if="release.version !== currentVersion" 
                class="btn btn-sm btn-primary"
                @click="installVersion(release)"
              >
                <iconify-icon icon="material-symbols:system-update"></iconify-icon>
                Install
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- System Requirements -->
    <div class="system-requirements">
      <h3>System Requirements</h3>
      <div class="requirements-grid">
        <div class="requirement-card">
          <div class="req-icon windows">
            <iconify-icon icon="mdi:microsoft-windows"></iconify-icon>
          </div>
          <h4>Windows</h4>
          <ul>
            <li>Windows 10 or later</li>
            <li>4GB RAM minimum</li>
            <li>500MB free disk space</li>
            <li>Internet connection</li>
          </ul>
        </div>
        
        <div class="requirement-card">
          <div class="req-icon macos">
            <iconify-icon icon="mdi:apple"></iconify-icon>
          </div>
          <h4>macOS</h4>
          <ul>
            <li>macOS 10.14 or later</li>
            <li>4GB RAM minimum</li>
            <li>500MB free disk space</li>
            <li>Internet connection</li>
          </ul>
        </div>
        
        <div class="requirement-card">
          <div class="req-icon linux">
            <iconify-icon icon="mdi:linux"></iconify-icon>
          </div>
          <h4>Linux</h4>
          <ul>
            <li>Ubuntu 18.04+ / CentOS 7+</li>
            <li>4GB RAM minimum</li>
            <li>500MB free disk space</li>
            <li>Internet connection</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Support Links -->
    <div class="support-links">
      <h3>Need Help?</h3>
      <div class="links-grid">
        <a href="https://harambee.sbs/docs" target="_blank" class="support-card">
          <iconify-icon icon="material-symbols:menu-book"></iconify-icon>
          <div class="support-content">
            <h4>Documentation</h4>
            <p>Complete user guide and tutorials</p>
          </div>
        </a>
        
        <a href="https://harambee.sbs/changelog" target="_blank" class="support-card">
          <iconify-icon icon="material-symbols:history"></iconify-icon>
          <div class="support-content">
            <h4>Changelog</h4>
            <p>Full version history and changes</p>
          </div>
        </a>
        
        <a href="https://harambee.sbs/support" target="_blank" class="support-card">
          <iconify-icon icon="material-symbols:help"></iconify-icon>
          <div class="support-content">
            <h4>Support</h4>
            <p>Get help and report issues</p>
          </div>
        </a>
        
        <a href="https://harambee.sbs/community" target="_blank" class="support-card">
          <iconify-icon icon="material-symbols:forum"></iconify-icon>
          <div class="support-content">
            <h4>Community</h4>
            <p>Join other CodeScraper users</p>
          </div>
        </a>
      </div>
    </div>

    <!-- Release Details Modal -->
    <div v-if="selectedRelease" class="modal-overlay" @click="selectedRelease = null">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h3>v{{ selectedRelease.version }} - {{ selectedRelease.title }}</h3>
          <button class="btn-icon" @click="selectedRelease = null">
            <iconify-icon icon="material-symbols:close"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="release-details">
            <div class="detail-grid">
              <div class="detail-item">
                <strong>Version:</strong> v{{ selectedRelease.version }}
              </div>
              <div class="detail-item">
                <strong>Release Type:</strong> 
                <span class="version-badge type" :class="selectedRelease.type">
                  {{ selectedRelease.type.toUpperCase() }}
                </span>
              </div>
              <div class="detail-item">
                <strong>Release Date:</strong> {{ formatDate(selectedRelease.date) }}
              </div>
              <div class="detail-item" v-if="selectedRelease.downloads">
                <strong>Downloads:</strong> {{ selectedRelease.downloads.toLocaleString() }}
              </div>
              <div class="detail-item" v-if="selectedRelease.size">
                <strong>Size:</strong> {{ selectedRelease.size }}
              </div>
            </div>

            <div class="release-description">
              <h4>Description</h4>
              <p>{{ selectedRelease.description }}</p>
            </div>

            <div class="changelog-detailed">
              <h4>What's Changed</h4>
              <div class="change-category" v-for="category in changeCategories" :key="category">
                <h5>{{ category }}</h5>
                <ul>
                  <li 
                    v-for="change in getChangesByCategory(selectedRelease.changes, category)" 
                    :key="change.description"
                    :class="`change-${change.type}`"
                  >
                    <iconify-icon :icon="getChangeTypeIcon(change.type)"></iconify-icon>
                    {{ change.description }}
                  </li>
                </ul>
              </div>
            </div>

            <div class="download-options" v-if="selectedRelease.downloadUrls">
              <h4>Download Options</h4>
              <div class="download-buttons">
                <a 
                  v-for="download in selectedRelease.downloadUrls" 
                  :key="download.platform"
                  :href="download.url" 
                  target="_blank"
                  class="btn btn-outline download-btn"
                >
                  <iconify-icon :icon="getPlatformIcon(download.platform)"></iconify-icon>
                  Download for {{ download.platform }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Update Notification (Global) -->
    <div v-if="showUpdateNotification" class="update-notification">
      <div class="notification-content">
        <iconify-icon icon="material-symbols:system-update" class="notification-icon"></iconify-icon>
        <div class="notification-text">
          <strong>Update Available!</strong>
          <span>CodeScraper Pro v{{ latestVersion }} is now available.</span>
        </div>
        <div class="notification-actions">
          <button class="btn btn-sm btn-primary" @click="downloadUpdate(latestRelease)">
            Download Now
          </button>
          <button class="btn btn-sm btn-outline" @click="showUpdateNotification = false">
            Later
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DownloadApp',
  data() {
    return {
      currentVersion: '1.0.0',
      latestVersion: null,
      latestRelease: null,
      checkingUpdate: false,
      showUpdateNotification: false,
      selectedRelease: null,
      versionFilter: 'all',
      updateSettings: {
        autoCheck: true,
        showNotifications: true,
        includeBeta: false
      },
      // Mock data - in real app, this would come from your API
      releases: [
        {
          version: '1.2.0',
          title: 'Multi-Platform Scraping & Enhanced UI',
          description: 'Major update with GitLab, Bitbucket, and CodePen support plus completely redesigned interface.',
          type: 'major',
          date: '2024-01-15',
          downloads: 15420,
          size: '85.2 MB',
          changes: [
            { type: 'feature', description: 'Added GitLab scraping support' },
            { type: 'feature', description: 'Added Bitbucket scraping support' },
            { type: 'feature', description: 'Added CodePen scraping support' },
            { type: 'feature', description: 'Multi-platform simultaneous scraping' },
            { type: 'enhancement', description: 'Completely redesigned user interface' },
            { type: 'enhancement', description: 'Advanced file type filtering' },
            { type: 'performance', description: 'Improved scraping speed by 40%' },
            { type: 'fix', description: 'Fixed proxy rotation issues' }
          ],
          downloadUrls: [
            { platform: 'Windows', url: 'https://harambee.sbs/download/windows' },
            { platform: 'macOS', url: 'https://harambee.sbs/download/macos' },
            { platform: 'Linux', url: 'https://harambee.sbs/download/linux' }
          ]
        },
        {
          version: '1.1.2',
          title: 'Performance Improvements & Bug Fixes',
          description: 'Critical performance improvements and bug fixes for better stability.',
          type: 'patch',
          date: '2024-01-08',
          downloads: 8920,
          size: '78.5 MB',
          changes: [
            { type: 'performance', description: 'Reduced memory usage by 25%' },
            { type: 'performance', description: 'Faster startup time' },
            { type: 'fix', description: 'Fixed GitHub API rate limiting handling' },
            { type: 'fix', description: 'Resolved session saving issues' },
            { type: 'security', description: 'Security patches and updates' }
          ]
        },
        {
          version: '1.1.0',
          title: 'Advanced Proxy Management & Session Recovery',
          description: 'Added advanced proxy rotation and session recovery features.',
          type: 'minor',
          date: '2024-01-01',
          downloads: 12350,
          size: '76.8 MB',
          changes: [
            { type: 'feature', description: 'Advanced proxy rotation algorithms' },
            { type: 'feature', description: 'Session recovery and auto-save' },
            { type: 'feature', description: 'Bulk proxy testing' },
            { type: 'enhancement', description: 'Improved error handling' },
            { type: 'enhancement', description: 'Better captcha solving integration' }
          ]
        },
        {
          version: '1.0.0',
          title: 'Initial Release',
          description: 'First stable release of CodeScraper Pro with GitHub and Stack Overflow support.',
          type: 'major',
          date: '2023-12-15',
          downloads: 21500,
          size: '72.3 MB',
          changes: [
            { type: 'feature', description: 'GitHub code scraping' },
            { type: 'feature', description: 'Stack Overflow answer scraping' },
            { type: 'feature', description: 'Basic proxy support' },
            { type: 'feature', description: 'Code export functionality' },
            { type: 'feature', description: 'User session management' }
          ]
        }
      ]
    }
  },
  computed: {
    updateStatus() {
      if (!this.latestVersion) {
        return {
          class: 'checking',
          icon: 'svg-spinners:bars-rotate-fade',
          title: 'Checking for Updates',
          message: 'Please wait while we check for the latest version...'
        }
      }

      const isUpdateAvailable = this.compareVersions(this.latestVersion, this.currentVersion) > 0
      
      if (isUpdateAvailable) {
        return {
          class: 'update-available',
          icon: 'material-symbols:system-update',
          title: 'Update Available!',
          message: `Version ${this.latestVersion} is ready to download.`,
          badge: 'NEW',
          releaseDate: this.formatDate(this.latestRelease?.date),
          actions: [
            {
              label: 'Download Update',
              icon: 'material-symbols:download',
              class: 'btn btn-primary',
              handler: () => this.downloadUpdate(this.latestRelease)
            },
            {
              label: 'View Changes',
              icon: 'material-symbols:description',
              class: 'btn btn-outline',
              handler: () => this.viewReleaseDetails(this.latestRelease)
            }
          ]
        }
      } else {
        return {
          class: 'up-to-date',
          icon: 'material-symbols:check-circle',
          title: 'You\'re up to date!',
          message: `CodeScraper Pro ${this.currentVersion} is the latest version.`,
          details: true
        }
      }
    },

    filteredReleases() {
      let filtered = this.releases
      
      if (this.versionFilter !== 'all') {
        filtered = filtered.filter(release => release.type === this.versionFilter)
      }
      
      if (!this.updateSettings.includeBeta) {
        filtered = filtered.filter(release => release.type !== 'beta')
      }
      
      // Add isLast property for timeline
      return filtered.map((release, index) => ({
        ...release,
        isLast: index === filtered.length - 1
      }))
    },

    changeCategories() {
      const categories = ['Features', 'Enhancements', 'Performance', 'Fixes', 'Security']
      return categories
    }
  },
  async mounted() {
    // Load saved settings
    this.loadSettings()
    
    // Check for updates on mount if auto-check is enabled
    if (this.updateSettings.autoCheck) {
      await this.checkForUpdates()
    }

    // Set up periodic update checking
    this.setupUpdateChecking()
  },
  methods: {
    async checkForUpdates() {
      this.checkingUpdate = true
      
      try {
        // Simulate API call to your update server
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // In real app, this would be:
        // const response = await fetch('https://api.harambee.sbs/updates/latest')
        // const data = await response.json()
        
        // Mock response
        const mockResponse = {
          latestVersion: '1.2.0',
          release: this.releases[0]
        }
        
        this.latestVersion = mockResponse.latestVersion
        this.latestRelease = mockResponse.release
        
        // Show notification if update is available and notifications are enabled
        if (this.updateSettings.showNotifications && 
            this.compareVersions(this.latestVersion, this.currentVersion) > 0) {
          this.showUpdateNotification = true
        }
        
        console.log('Update check completed:', mockResponse)
        
      } catch (error) {
        console.error('Failed to check for updates:', error)
        // You could show an error notification here
      } finally {
        this.checkingUpdate = false
      }
    },

    setupUpdateChecking() {
      // Check for updates every 24 hours if auto-check is enabled
      if (this.updateSettings.autoCheck) {
        setInterval(() => {
          this.checkForUpdates()
        }, 24 * 60 * 60 * 1000) // 24 hours
      }
    },

    downloadUpdate(release) {
      console.log('Downloading update:', release.version)
      
      // Open download page in default browser
      this.openExternalUrl('https://harambee.sbs/download')
      
      // Track download attempt
      this.trackDownload(release.version)
    },

    downloadVersion(release) {
      console.log('Downloading version:', release.version)
      this.openExternalUrl('https://harambee.sbs/download/archive/' + release.version)
      this.trackDownload(release.version)
    },

    installVersion(release) {
      console.log('Installing version:', release.version)
      // In a real Electron app, you would:
      // 1. Download the update
      // 2. Verify integrity
      // 3. Install automatically
      // 4. Restart the app
      
      // For now, just open download page
      this.downloadUpdate(release)
    },

    viewReleaseDetails(release) {
      this.selectedRelease = release
    },

    viewReleaseNotes(release) {
      this.openExternalUrl(`https://harambee.sbs/changelog#v${release.version.replace(/\./g, '-')}`)
    },

    viewAllReleases() {
      this.openExternalUrl('https://harambee.sbs/changelog')
    },

    openDownloadsPage() {
      this.openExternalUrl('https://harambee.sbs/downloads')
    },

    openExternalUrl(url) {
      if (window.electronAPI && window.electronAPI.openExternal) {
        window.electronAPI.openExternal(url)
      } else {
        window.open(url, '_blank')
      }
    },

    trackDownload(version) {
      // In real app, you might want to track downloads (anonymously)
      console.log('Download tracked for version:', version)
      
      // Example: Send to your analytics (optional)
      // fetch('https://api.harambee.sbs/analytics/download', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ version, timestamp: new Date().toISOString() })
      // })
    },

    compareVersions(versionA, versionB) {
      const partsA = versionA.split('.').map(Number)
      const partsB = versionB.split('.').map(Number)
      
      for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const partA = partsA[i] || 0
        const partB = partsB[i] || 0
        
        if (partA > partB) return 1
        if (partA < partB) return -1
      }
      
      return 0
    },

    getChangeTypeIcon(changeType) {
      const icons = {
        feature: 'material-symbols:rocket-launch',
        enhancement: 'material-symbols:trending-up',
        performance: 'material-symbols:speed',
        fix: 'material-symbols:bug-report',
        security: 'material-symbols:shield'
      }
      return icons[changeType] || 'material-symbols:info'
    },

    getPlatformIcon(platform) {
      const icons = {
        Windows: 'mdi:microsoft-windows',
        macOS: 'mdi:apple',
        Linux: 'mdi:linux'
      }
      return icons[platform] || 'material-symbols:computer'
    },

    getChangesByCategory(changes, category) {
      const categoryMap = {
        'Features': 'feature',
        'Enhancements': 'enhancement', 
        'Performance': 'performance',
        'Fixes': 'fix',
        'Security': 'security'
      }
      
      return changes.filter(change => change.type === categoryMap[category])
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    loadSettings() {
      const saved = localStorage.getItem('codeScraperUpdateSettings')
      if (saved) {
        this.updateSettings = { ...this.updateSettings, ...JSON.parse(saved) }
      }
    },

    saveSettings() {
      localStorage.setItem('codeScraperUpdateSettings', JSON.stringify(this.updateSettings))
    }
  },

  watch: {
    updateSettings: {
      handler() {
        this.saveSettings()
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.update-status-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 2rem;
  margin-bottom: 2rem;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.update-status-card.checking {
  border-color: var(--warning);
  background: linear-gradient(135deg, var(--card-bg) 0%, var(--warning-light) 100%);
}

.update-status-card.up-to-date {
  border-color: var(--success);
  background: linear-gradient(135deg, var(--card-bg) 0%, var(--success-light) 100%);
}

.update-status-card.update-available {
  border-color: var(--primary);
  background: linear-gradient(135deg, var(--card-bg) 0%, var(--primary-light) 100%);
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.1); }
  50% { box-shadow: 0 0 30px rgba(var(--primary-rgb), 0.2); }
}

.status-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.status-icon {
  font-size: 2.5rem;
  color: var(--primary);
}

.status-icon .checking { color: var(--warning); }
.status-icon .up-to-date { color: var(--success); }
.status-icon .update-available { color: var(--primary); }

.status-content {
  flex: 1;
}

.status-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.status-content p {
  margin: 0;
  color: var(--text-secondary);
}

.status-badge {
  background: var(--primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.875rem;
}

.status-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: var(--radius);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.detail-item:last-child {
  border-bottom: none;
}

.status-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.update-controls {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
}

.control-group {
  margin-bottom: 1.5rem;
}

.control-group h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.control-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.whats-new-section {
  margin-bottom: 2rem;
}

.whats-new-section h3 {
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.release-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.release-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.release-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
}

.release-badge.major { background: var(--primary); color: white; }
.release-badge.minor { background: var(--secondary); color: white; }
.release-badge.patch { background: var(--success); color: white; }
.release-badge.beta { background: var(--warning); color: black; }

.release-date {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.release-content {
  padding: 1.5rem;
}

.release-content h4 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
}

.release-description {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.changelog h5 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.changelog ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.changelog li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.changelog li:last-child {
  border-bottom: none;
}

.change-feature { color: var(--success); }
.change-enhancement { color: var(--primary); }
.change-performance { color: var(--secondary); }
.change-fix { color: var(--warning); }
.change-security { color: var(--error); }

.release-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.version-history {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  margin: 0;
  font-size: 1.3rem;
}

.history-filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.version-timeline {
  position: relative;
}

.version-item {
  display: flex;
  margin-bottom: 2rem;
  position: relative;
}

.version-item:last-child {
  margin-bottom: 0;
}

.version-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 1.5rem;
  position: relative;
}

.marker-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid var(--card-bg);
  z-index: 2;
  position: relative;
}

.marker-dot.major { background: var(--primary); }
.marker-dot.minor { background: var(--secondary); }
.marker-dot.patch { background: var(--success); }
.marker-dot.beta { background: var(--warning); }

.version-item.current .marker-dot {
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.3);
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.version-line {
  flex: 1;
  width: 2px;
  background: var(--border-color);
  margin: 0.5rem 0;
}

.version-content {
  flex: 1;
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.version-item.current .version-content {
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.1);
}

.version-item.latest .version-content {
  border-color: var(--secondary);
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.version-header h4 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-primary);
}

.version-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.version-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: bold;
}

.version-badge.type.major { background: var(--primary-light); color: var(--primary); }
.version-badge.type.minor { background: var(--secondary-light); color: var(--secondary); }
.version-badge.type.patch { background: var(--success-light); color: var(--success); }
.version-badge.type.beta { background: var(--warning-light); color: var(--warning); }

.version-badge.current { background: var(--primary); color: white; }
.version-badge.latest { background: var(--secondary); color: white; }

.version-description {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  line-height: 1.4;
}

.version-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.version-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.system-requirements {
  margin-bottom: 2rem;
}

.system-requirements h3 {
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.requirements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.requirement-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  text-align: center;
}

.req-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.req-icon.windows { color: #0078D4; }
.req-icon.macos { color: #000000; }
.req-icon.linux { color: #FCC624; }

.requirement-card h4 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.requirement-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.requirement-card li {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.requirement-card li:last-child {
  border-bottom: none;
}

.support-links {
  margin-bottom: 2rem;
}

.support-links h3 {
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.support-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  text-decoration: none;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.support-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary);
  box-shadow: var(--shadow-lg);
  text-decoration: none;
  color: var(--text-primary);
}

.support-card iconify-icon {
  font-size: 2rem;
  color: var(--primary);
  flex-shrink: 0;
}

.support-content h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.support-content p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
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
  z-index: 10000;
  padding: 2rem;
}

.modal-content {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid var(--border-color);
}

.modal-content.large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.release-description h4,
.changelog-detailed h4,
.download-options h4 {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.change-category {
  margin-bottom: 1.5rem;
}

.change-category h5 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.change-category ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.change-category li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.change-category li:last-child {
  border-bottom: none;
}

.download-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Update Notification */
.update-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 1rem;
  border: 2px solid var(--primary);
  box-shadow: var(--shadow-lg);
  z-index: 10001;
  max-width: 400px;
  animation: slideInRight 0.3s ease;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.notification-icon {
  font-size: 1.5rem;
  color: var(--primary);
  flex-shrink: 0;
}

.notification-text {
  flex: 1;
}

.notification-text strong {
  display: block;
  margin-bottom: 0.25rem;
}

.notification-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .status-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .status-actions {
    justify-content: center;
  }
  
  .control-actions {
    flex-direction: column;
  }
  
  .version-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .version-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .requirements-grid {
    grid-template-columns: 1fr;
  }
  
  .links-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    padding: 1rem;
  }
  
  .download-buttons {
    flex-direction: column;
  }
  
  .update-notification {
    left: 20px;
    right: 20px;
    max-width: none;
  }
  
  .notification-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .notification-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>