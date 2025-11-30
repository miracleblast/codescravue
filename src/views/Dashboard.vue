<template>
  <div class="tab-content active" id="dashboard">
    <!-- Header Section -->
    <header class="header">
      <h1 class="page-title">Code Discovery Dashboard</h1>
      <div class="header-actions">
        <button class="btn btn-outline" @click="showHelp = true">
          <iconify-icon class="btn-icon" icon="majesticons:question-mark-circle-line"></iconify-icon>
          Help
        </button>
        <button class="btn btn-primary" @click="startScraping">
          <iconify-icon class="btn-icon" icon="material-symbols:rocket-launch-rounded"></iconify-icon>
          Start Scraping
        </button>
      </div>
    </header>
    
    <!-- License Info -->
    <section class="license-info-section">
      <h2 class="section-title">
        <iconify-icon class="section-title-icon" icon="material-symbols:key"></iconify-icon>
        License Information
      </h2>
      
      <div class="license-status">
        <iconify-icon class="license-status-icon" icon="material-symbols:check-circle"></iconify-icon>
        <div class="license-details">
          <div class="license-type">{{ licenseInfo.type }}</div>
          <div class="license-expiry">{{ licenseInfo.expiry }}</div>
        </div>
      </div>
      
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">License Key</label>
          <input type="text" class="form-control" :value="licenseInfo.key" readonly>
        </div>
        
        <div class="form-group">
          <label class="form-label">Plan Type</label>
          <input type="text" class="form-control" :value="licenseInfo.plan" readonly>
        </div>
        
        <div class="form-group">
          <label class="form-label">Expiration Date</label>
          <input type="text" class="form-control" :value="licenseInfo.expiry" readonly>
        </div>
        
        <div class="form-group">
          <label class="form-label">Scrapers Included</label>
          <input type="text" class="form-control" :value="licenseInfo.scrapers" readonly>
        </div>
      </div>
      
      <button class="btn btn-outline" @click="changeLicense">
        <iconify-icon class="btn-icon" icon="material-symbols:key"></iconify-icon>
        Change License Key
      </button>
    </section>
    
    <!-- Dashboard Cards -->
    <section class="dashboard-cards">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Scraping Status</h3>
          <div class="card-icon icon-scraper">
            <iconify-icon icon="iconamoon:cloud-download-light"></iconify-icon>
          </div>
        </div>
        <div class="card-value">{{ formatNumber(stats.totalScrapes) }}</div>
        <p class="card-description">Code snippets collected</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: stats.successRate + '%' }"></div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Storage Usage</h3>
          <div class="card-icon icon-storage">
            <iconify-icon icon="solar:folder-with-files-linear"></iconify-icon>
          </div>
        </div>
        <div class="card-value">{{ storageUsage.percentage }}%</div>
        <p class="card-description">Used of {{ storageUsage.total }} Local Storage</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: storageUsage.percentage + '%' }"></div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Proxy Status</h3>
          <div class="card-icon icon-proxy">
            <iconify-icon icon="material-symbols:security"></iconify-icon>
          </div>
        </div>
        <div class="card-value">{{ proxyStats.active }}/{{ proxyStats.total }}</div>
        <p class="card-description">Active Proxy Connections</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: proxyStats.percentage + '%' }"></div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Account Status</h3>
          <div class="card-icon icon-account">
            <iconify-icon icon="material-symbols:person"></iconify-icon>
          </div>
        </div>
        <div class="card-value">{{ accountStats.active }}/{{ accountStats.total }}</div>
        <p class="card-description">Platform Accounts Active</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: accountStats.percentage + '%' }"></div>
        </div>
      </div>
    </section>
    
    <!-- Quick Scraper Configuration -->
    <section class="scraper-config">
      <h2 class="section-title">
        <iconify-icon class="section-title-icon" icon="iconamoon:cloud-download-light"></iconify-icon>
        Quick Code Search
      </h2>
      
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Search Query</label>
          <input 
            type="text" 
            class="form-control" 
            v-model="quickSearch.query"
            placeholder="e.g. React shopping cart, Python data analysis"
          >
        </div>
        
        <div class="form-group">
          <label class="form-label">Platforms</label>
          <select class="form-control" v-model="quickSearch.platform">
            <option value="all">All Platforms</option>
            <option value="github">GitHub</option>
            <option value="stackoverflow">Stack Overflow</option>
            <option value="gitlab">GitLab</option>
            <option value="bitbucket">Bitbucket</option>
            <option value="codepen">CodePen</option>
            <option value="global">Global Web Search</option>
          </select>
        </div>
      </div>
      
      <button class="btn btn-primary" @click="startQuickSearch" style="margin-top: 1rem;">
        <iconify-icon class="btn-icon" icon="iconamoon:cloud-download-light"></iconify-icon>
        Start Quick Search
      </button>
    </section>
    
    <!-- Results Section -->
    <section class="results-section">
      <div class="results-header">
        <h2 class="section-title">
          <iconify-icon class="section-title-icon" icon="material-symbols:code"></iconify-icon>
          Recently Scraped Code
        </h2>
        <div class="filter-controls">
          <select class="form-control" v-model="resultsFilter.platform" style="width: 150px;">
            <option value="all">All Platforms</option>
            <option value="github">GitHub</option>
            <option value="stackoverflow">Stack Overflow</option>
            <option value="gitlab">GitLab</option>
            <option value="codepen">CodePen</option>
          </select>
          <select class="form-control" v-model="resultsFilter.days" style="width: 120px;">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>
      
      <div class="results-grid">
        <!-- Real Results from Storage -->
        <div 
          v-for="result in filteredResults" 
          :key="result.id"
          class="result-card"
          @click="viewResult(result)"
        >
          <div class="result-preview" :class="result.platform">
            <iconify-icon :icon="getPlatformIcon(result.platform)" style="font-size: 3rem;"></iconify-icon>
          </div>
          <div class="result-content">
            <h4 class="result-title">{{ result.title }}</h4>
            <div class="result-meta">
              <div class="result-source">
                <iconify-icon class="source-icon" :icon="getPlatformIcon(result.platform)"></iconify-icon>
                {{ formatPlatform(result.platform) }}
              </div>
              <div>{{ formatDate(result.date) }}</div>
            </div>
            <div class="result-stats">
              <span class="result-stat">
                <iconify-icon icon="material-symbols:code"></iconify-icon>
                {{ result.language || 'Multiple' }}
              </span>
              <span class="result-stat" v-if="result.lines">
                <iconify-icon icon="material-symbols:format-list-numbered"></iconify-icon>
                {{ result.lines }} lines
              </span>
            </div>
          </div>
        </div>
        
        <!-- Empty State -->
        <div 
          v-if="filteredResults.length === 0" 
          class="empty-state"
        >
          <iconify-icon icon="material-symbols:code-off" style="font-size: 3rem; margin-bottom: 1rem;"></iconify-icon>
          <h3>No Code Scraped Yet</h3>
          <p>Start your first scraping session to see results here.</p>
          <button class="btn btn-primary" @click="$router.push('/scraper')">
            Start Scraping
          </button>
        </div>
      </div>
    </section>

    <!-- Help Modal -->
    <div v-if="showHelp" class="help-modal" id="helpModal">
      <div class="help-content">
        <button class="help-close" @click="showHelp = false">
          <iconify-icon icon="material-symbols:close"></iconify-icon>
        </button>
        <h2>Dashboard Help Guide</h2>
        
        <div class="help-section">
          <h3>Real-Time Monitoring</h3>
          <p>Your dashboard shows live data from your scraping activities:</p>
          <ul>
            <li><strong>Scraping Status:</strong> Total code snippets collected and success rate</li>
            <li><strong>Storage Usage:</strong> How much local storage you're using</li>
            <li><strong>Proxy Status:</strong> Active proxy connections and health</li>
            <li><strong>Account Status:</strong> Available platform accounts for scraping</li>
          </ul>
        </div>
        
        <div class="help-section">
          <h3>Quick Search</h3>
          <p>Use the quick search to start scraping immediately without complex configuration:</p>
          <ol>
            <li>Enter your search query (e.g., "React shopping cart")</li>
            <li>Select target platforms</li>
            <li>Click "Start Quick Search" to begin</li>
          </ol>
        </div>
        
        <div class="help-section">
          <h3>Recent Results</h3>
          <p>View and filter your recently scraped code:</p>
          <ul>
            <li>Filter by platform and time period</li>
            <li>Click any result to view details</li>
            <li>All data stays on your computer - we don't track anything</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Dashboard',
  data() {
    return {
      showHelp: false,
      licenseInfo: {
        type: 'Pro Plan - Active',
        expiry: 'Expires: December 31, 2025',
        key: 'XXXX-XXXX-XXXX-XXXX',
        plan: 'Pro Plan',
        scrapers: 'All Platforms'
      },
      stats: {
        totalScrapes: 0,
        successRate: 0
      },
      storageUsage: {
        percentage: 0,
        total: '0GB',
        used: '0GB'
      },
      proxyStats: {
        active: 0,
        total: 0,
        percentage: 0
      },
      accountStats: {
        active: 0,
        total: 0,
        percentage: 0
      },
      quickSearch: {
        query: '',
        platform: 'all'
      },
      resultsFilter: {
        platform: 'all',
        days: '7'
      },
      recentResults: []
    }
  },
  computed: {
    filteredResults() {
      let results = this.recentResults;
      
      // Platform filter
      if (this.resultsFilter.platform !== 'all') {
        results = results.filter(result => result.platform === this.resultsFilter.platform);
      }
      
      // Date filter
      if (this.resultsFilter.days !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(this.resultsFilter.days));
        results = results.filter(result => new Date(result.date) >= daysAgo);
      }
      
      return results;
    }
  },
  async mounted() {
    await this.loadRealData();
    this.initializeDashboard();
  },
  methods: {
    async loadRealData() {
      try {
        // Load real data from Electron API
        if (window.electronAPI) {
          const stats = await window.electronAPI.getDashboardStats();
          if (stats) {
            this.stats.totalScrapes = stats.totalScrapes || 0;
            this.stats.successRate = stats.successRate || 0;
          }

          const storage = await window.electronAPI.getStorageInfo();
          if (storage) {
            this.storageUsage = storage;
          }

          const proxies = await window.electronAPI.getProxyStats();
          if (proxies) {
            this.proxyStats = proxies;
          }

          const accounts = await window.electronAPI.getAccountStats();
          if (accounts) {
            this.accountStats = accounts;
          }

          const results = await window.electronAPI.getRecentResults();
          if (results) {
            this.recentResults = results;
          }

          const license = await window.electronAPI.getLicenseInfo();
          if (license) {
            this.licenseInfo = license;
          }
        } else {
          // Fallback to localStorage for browser testing
          this.loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        this.loadFromLocalStorage();
      }
    },

    loadFromLocalStorage() {
      // Fallback to localStorage for development
      const storedStats = localStorage.getItem('codeScraperStats');
      if (storedStats) {
        const stats = JSON.parse(storedStats);
        this.stats = stats;
      }

      const storedResults = localStorage.getItem('scrapingResults');
      if (storedResults) {
        this.recentResults = JSON.parse(storedResults);
      }

      // Calculate proxy stats from stored data
      const proxyGroups = JSON.parse(localStorage.getItem('codeScraperProxyGroups') || '[]');
      this.proxyStats.total = proxyGroups.reduce((total, group) => total + group[1].length, 0);
      this.proxyStats.active = Math.floor(this.proxyStats.total * 0.8); // Assume 80% active
      this.proxyStats.percentage = this.proxyStats.total > 0 ? (this.proxyStats.active / this.proxyStats.total) * 100 : 0;

      // Calculate account stats from stored data
      const accounts = JSON.parse(localStorage.getItem('codeScraperAccounts') || '[]');
      this.accountStats.total = accounts.length;
      this.accountStats.active = accounts.filter(acc => acc.status === 'active').length;
      this.accountStats.percentage = this.accountStats.total > 0 ? (this.accountStats.active / this.accountStats.total) * 100 : 0;
    },

    initializeDashboard() {
      // Initialize any dashboard-specific functionality
      this.updateStorageUsage();
    },

    updateStorageUsage() {
      // Calculate storage usage from real data
      const totalStorage = 500 * 1024 * 1024 * 1024; // 500GB in bytes
      const usedStorage = this.recentResults.reduce((total, result) => total + (result.size || 0), 0);
      const percentage = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0;
      
      this.storageUsage = {
        percentage: Math.round(percentage),
        total: '500GB',
        used: this.formatBytes(usedStorage)
      };
    },

    async startScraping() {
      this.$router.push('/scraper');
    },

    async startQuickSearch() {
      if (!this.quickSearch.query.trim()) {
        this.showNotification('Please enter a search query', 'error');
        return;
      }

      try {
        if (window.electronAPI) {
          await window.electronAPI.startQuickSearch({
            query: this.quickSearch.query,
            platform: this.quickSearch.platform
          });
          this.showNotification('Quick search started!', 'success');
        } else {
          // Demo mode - add placeholder result
          const newResult = {
            id: Date.now(),
            title: this.quickSearch.query,
            platform: this.quickSearch.platform === 'all' ? 'github' : this.quickSearch.platform,
            date: new Date().toISOString(),
            language: 'JavaScript',
            lines: 150
          };
          this.recentResults.unshift(newResult);
          this.showNotification('Demo: Quick search completed', 'success');
        }
      } catch (error) {
        console.error('Error starting quick search:', error);
        this.showNotification('Failed to start search', 'error');
      }
    },

    viewResult(result) {
      // Navigate to storage with this result selected
      this.$router.push({
        name: 'Storage',
        query: { resultId: result.id }
      });
    },

    changeLicense() {
      // Show license change dialog
      this.showNotification('License change feature coming soon', 'info');
    },

    formatNumber(num) {
      return new Intl.NumberFormat().format(num);
    },

    formatBytes(bytes) {
      if (!bytes) return '0 B';
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString();
    },

    formatPlatform(platform) {
      const platforms = {
        github: 'GitHub',
        stackoverflow: 'Stack Overflow',
        gitlab: 'GitLab',
        bitbucket: 'Bitbucket',
        codepen: 'CodePen',
        global: 'Web Search'
      };
      return platforms[platform] || platform;
    },

    getPlatformIcon(platform) {
      const icons = {
        github: 'mdi:github',
        stackoverflow: 'simple-icons:stackoverflow',
        gitlab: 'mdi:gitlab',
        bitbucket: 'mdi:bitbucket',
        codepen: 'simple-icons:codepen',
        global: 'material-symbols:public'
      };
      return icons[platform] || 'material-symbols:code';
    },

    showNotification(message, type = 'info') {
      // You can integrate with a notification system here
      console.log(`${type.toUpperCase()}: ${message}`);
      // For now, we'll use a simple alert
      alert(message);
    }
  }
}
</script>

<style scoped>
/* All styles are inherited from the main.css file - no additional styles needed */
/* The component uses the same CSS classes as your original HTML structure */

.filter-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.result-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.result-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.result-preview {
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.result-preview.github {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
}

.result-preview.stackoverflow {
  background: linear-gradient(135deg, #F48024 0%, #BCBBBB 100%);
}

.result-preview.gitlab {
  background: linear-gradient(135deg, #FC6D26 0%, #E24329 100%);
}

.result-preview.codepen {
  background: linear-gradient(135deg, #000000 0%, #333333 100%);
}

.result-preview.global {
  background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);
}

.result-stats {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.result-stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
</style>