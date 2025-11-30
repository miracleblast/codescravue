<template>
  <div class="proxy-management-tab">
    <!-- Header Section -->
    <div class="tab-header">
      <h1>Proxy Management</h1>
      <p>Manage and rotate proxies for optimal scraping performance</p>
    </div>

    <!-- Proxy Statistics -->
    <div class="proxy-stats-grid">
      <div class="stat-card" v-for="stat in proxyStats" :key="stat.id" :class="stat.class">
        <div class="stat-icon">
          <iconify-icon :icon="stat.icon"></iconify-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stat.value }}</h3>
          <p>{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Main Content Sections -->
    <div class="proxy-content-grid">
      <!-- Proxy List Section -->
      <div class="proxy-list-section">
        <div class="section-header">
          <h2>Proxy List</h2>
          <div class="header-actions">
            <button class="btn btn-primary" @click="showAddProxyModal = true">
              <iconify-icon icon="material-symbols:add"></iconify-icon>
              Add Proxy
            </button>
            <button class="btn btn-secondary" @click="importProxies">
              <iconify-icon icon="material-symbols:upload"></iconify-icon>
              Import
            </button>
            <button class="btn btn-outline" @click="testAllProxies" :disabled="testingAll">
              <iconify-icon icon="material-symbols:play-arrow"></iconify-icon>
              {{ testingAll ? 'Testing...' : 'Test All' }}
            </button>
          </div>
        </div>

        <!-- Proxy Table -->
        <div class="proxy-table-container">
          <div class="table-header">
            <div class="table-row">
              <div class="table-cell" style="width: 40px">
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll">
              </div>
              <div class="table-cell" style="width: 60px">Status</div>
              <div class="table-cell" style="flex: 2">Proxy</div>
              <div class="table-cell" style="flex: 1">Type</div>
              <div class="table-cell" style="flex: 1">Location</div>
              <div class="table-cell" style="flex: 1">Response Time</div>
              <div class="table-cell" style="flex: 1">Success Rate</div>
              <div class="table-cell" style="width: 120px">Actions</div>
            </div>
          </div>

          <div class="table-body">
            <div v-for="proxy in filteredProxies" :key="proxy.id" 
                 class="table-row" :class="{ 'selected': selectedProxies.has(proxy.id) }">
              
              <div class="table-cell" style="width: 40px">
                <input type="checkbox" :checked="selectedProxies.has(proxy.id)" 
                       @change="toggleProxySelection(proxy.id)">
              </div>

              <div class="table-cell" style="width: 60px">
                <div class="status-indicator" :class="getStatusClass(proxy.status)">
                  <iconify-icon :icon="getStatusIcon(proxy.status)"></iconify-icon>
                </div>
              </div>

              <div class="table-cell" style="flex: 2">
                <div class="proxy-address">
                  <strong>{{ proxy.host }}:{{ proxy.port }}</strong>
                  <span v-if="proxy.username" class="auth-badge">Auth</span>
                </div>
                <div v-if="proxy.username" class="proxy-auth">
                  {{ proxy.username }}:•••••
                </div>
              </div>

              <div class="table-cell" style="flex: 1">
                <span class="proxy-type" :class="proxy.type">{{ proxy.type }}</span>
              </div>

              <div class="table-cell" style="flex: 1">
                <span class="location-tag">{{ proxy.location || 'Unknown' }}</span>
              </div>

              <div class="table-cell" style="flex: 1">
                <span v-if="proxy.responseTime" class="response-time" 
                      :class="getResponseTimeClass(proxy.responseTime)">
                  {{ proxy.responseTime }}ms
                </span>
                <span v-else class="response-time unknown">-</span>
              </div>

              <div class="table-cell" style="flex: 1">
                <div class="success-rate">
                  <div class="rate-bar">
                    <div class="rate-fill" :style="{ width: proxy.successRate + '%' }"></div>
                  </div>
                  <span class="rate-text">{{ proxy.successRate }}%</span>
                </div>
              </div>

              <div class="table-cell" style="width: 120px">
                <div class="action-buttons">
                  <button class="btn-icon" @click="testProxy(proxy)" 
                          :disabled="proxy.testing" :title="proxy.testing ? 'Testing...' : 'Test Proxy'">
                    <iconify-icon :icon="proxy.testing ? 'eos-icons:loading' : 'material-symbols:play-arrow'"></iconify-icon>
                  </button>
                  <button class="btn-icon" @click="editProxy(proxy)" title="Edit Proxy">
                    <iconify-icon icon="material-symbols:edit"></iconify-icon>
                  </button>
                  <button class="btn-icon btn-danger" @click="removeProxy(proxy.id)" title="Delete Proxy">
                    <iconify-icon icon="material-symbols:delete"></iconify-icon>
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="filteredProxies.length === 0" class="empty-state">
              <iconify-icon icon="material-symbols:proxy" class="empty-icon"></iconify-icon>
              <h3>No proxies found</h3>
              <p>Add your first proxy to get started</p>
              <button class="btn btn-primary" @click="showAddProxyModal = true">
                <iconify-icon icon="material-symbols:add"></iconify-icon>
                Add Proxy
              </button>
            </div>
          </div>
        </div>

        <!-- Bulk Actions -->
        <div v-if="selectedProxies.size > 0" class="bulk-actions">
          <div class="bulk-info">
            <strong>{{ selectedProxies.size }}</strong> proxies selected
          </div>
          <div class="bulk-buttons">
            <button class="btn btn-outline" @click="testSelectedProxies" 
                    :disabled="testingSelected">
              <iconify-icon icon="material-symbols:play-arrow"></iconify-icon>
              {{ testingSelected ? 'Testing...' : 'Test Selected' }}
            </button>
            <button class="btn btn-outline" @click="enableSelectedProxies">
              <iconify-icon icon="material-symbols:check-circle"></iconify-icon>
              Enable
            </button>
            <button class="btn btn-outline" @click="disableSelectedProxies">
              <iconify-icon icon="material-symbols:block"></iconify-icon>
              Disable
            </button>
            <button class="btn btn-danger" @click="deleteSelectedProxies">
              <iconify-icon icon="material-symbols:delete"></iconify-icon>
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Proxy Configuration Section -->
      <div class="proxy-config-section">
        <div class="config-card">
          <div class="config-header">
            <h3>Rotation Settings</h3>
            <iconify-icon icon="material-symbols:settings"></iconify-icon>
          </div>

          <div class="config-content">
            <div class="form-group">
              <label for="rotationMode">Rotation Mode</label>
              <select id="rotationMode" v-model="rotationSettings.mode" class="form-select">
                <option value="round-robin">Round Robin</option>
                <option value="random">Random</option>
                <option value="sticky">Sticky Session</option>
                <option value="failover">Failover</option>
              </select>
            </div>

            <div class="form-group">
              <label for="requestsPerProxy">Requests per Proxy</label>
              <input type="number" id="requestsPerProxy" v-model="rotationSettings.requestsPerProxy" 
                     min="1" max="1000" class="form-input">
            </div>

            <div class="form-group">
              <label for="rotationDelay">Rotation Delay (ms)</label>
              <input type="number" id="rotationDelay" v-model="rotationSettings.delay" 
                     min="0" max="60000" class="form-input">
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="rotationSettings.autoRetryFailed">
                <span class="checkmark"></span>
                Auto-retry failed proxies
              </label>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="rotationSettings.rotateOnBan">
                <span class="checkmark"></span>
                Rotate on IP ban detection
              </label>
            </div>
          </div>

          <div class="config-footer">
            <button class="btn btn-primary" @click="saveRotationSettings">
              <iconify-icon icon="material-symbols:save"></iconify-icon>
              Save Settings
            </button>
          </div>
        </div>

        <!-- Quick Actions Card -->
        <div class="config-card">
          <div class="config-header">
            <h3>Quick Actions</h3>
            <iconify-icon icon="material-symbols:flash-on"></iconify-icon>
          </div>

          <div class="quick-actions">
            <button class="quick-action-btn" @click="testAllProxies" :disabled="testingAll">
              <iconify-icon icon="material-symbols:play-arrow"></iconify-icon>
              <span>Test All Proxies</span>
            </button>

            <button class="quick-action-btn" @click="exportProxies">
              <iconify-icon icon="material-symbols:download"></iconify-icon>
              <span>Export Proxies</span>
            </button>

            <button class="quick-action-btn" @click="clearFailedProxies">
              <iconify-icon icon="material-symbols:clear-all"></iconify-icon>
              <span>Clear Failed</span>
            </button>

            <button class="quick-action-btn" @click="optimizeProxyList">
              <iconify-icon icon="material-symbols:auto-mode"></iconify-icon>
              <span>Optimize List</span>
            </button>
          </div>
        </div>

        <!-- Real-time Testing -->
        <div class="config-card">
          <div class="config-header">
            <h3>Real-time Testing</h3>
            <iconify-icon icon="material-symbols:monitor-heart"></iconify-icon>
          </div>

          <div class="testing-controls">
            <div class="form-group">
              <label for="testUrl">Test URL</label>
              <input type="text" id="testUrl" v-model="testSettings.url" 
                     placeholder="https://httpbin.org/ip" class="form-input">
            </div>

            <div class="form-group">
              <label for="timeout">Timeout (ms)</label>
              <input type="number" id="timeout" v-model="testSettings.timeout" 
                     min="1000" max="30000" class="form-input">
            </div>

            <button class="btn btn-primary" @click="startBatchTest" :disabled="batchTesting">
              <iconify-icon :icon="batchTesting ? 'eos-icons:loading' : 'material-symbols:play-arrow'"></iconify-icon>
              {{ batchTesting ? 'Testing...' : 'Start Batch Test' }}
            </button>
          </div>

          <div v-if="batchTestResults" class="test-results">
            <h4>Batch Test Results</h4>
            <div class="result-stats">
              <span class="stat-success">Working: {{ batchTestResults.working }}</span>
              <span class="stat-failed">Failed: {{ batchTestResults.failed }}</span>
              <span class="stat-total">Total: {{ batchTestResults.total }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Proxy Modal -->
    <div v-if="showAddProxyModal || editingProxy" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content large-modal">
        <div class="modal-header">
          <h3>{{ editingProxy ? 'Edit Proxy' : 'Add New Proxy' }}</h3>
          <button class="btn-close" @click="closeModal">
            <iconify-icon icon="material-symbols:close"></iconify-icon>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label for="proxyType">Proxy Type</label>
              <select id="proxyType" v-model="proxyForm.type" class="form-select">
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="socks4">SOCKS4</option>
                <option value="socks5">SOCKS5</option>
              </select>
            </div>

            <div class="form-group">
              <label for="proxyHost">Host/IP</label>
              <input type="text" id="proxyHost" v-model="proxyForm.host" 
                     placeholder="proxy.example.com" class="form-input" required>
            </div>

            <div class="form-group">
              <label for="proxyPort">Port</label>
              <input type="number" id="proxyPort" v-model="proxyForm.port" 
                     placeholder="8080" class="form-input" required>
            </div>

            <div class="form-group">
              <label for="proxyUsername">Username (Optional)</label>
              <input type="text" id="proxyUsername" v-model="proxyForm.username" 
                     placeholder="username" class="form-input">
            </div>

            <div class="form-group">
              <label for="proxyPassword">Password (Optional)</label>
              <input type="password" id="proxyPassword" v-model="proxyForm.password" 
                     placeholder="password" class="form-input">
            </div>

            <div class="form-group">
              <label for="proxyLocation">Location</label>
              <input type="text" id="proxyLocation" v-model="proxyForm.location" 
                     placeholder="United States" class="form-input">
            </div>

            <div class="form-group full-width">
              <label class="checkbox-label">
                <input type="checkbox" v-model="proxyForm.enabled">
                <span class="checkmark"></span>
                Enable this proxy
              </label>
            </div>

            <div class="form-group full-width">
              <label for="proxyNotes">Notes (Optional)</label>
              <textarea id="proxyNotes" v-model="proxyForm.notes" 
                        placeholder="Additional notes about this proxy..." 
                        class="form-textarea" rows="3"></textarea>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button class="btn btn-primary" @click="saveProxy" 
                  :disabled="!proxyForm.host || !proxyForm.port">
            {{ editingProxy ? 'Update Proxy' : 'Add Proxy' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Test Progress Modal -->
    <div v-if="showTestProgress" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Testing Proxies</h3>
          <div class="progress-stats">
            {{ testProgress.current }}/{{ testProgress.total }}
          </div>
        </div>
        <div class="modal-body">
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: testProgress.percentage + '%' }"></div>
            </div>
            <div class="progress-text">
              Testing: {{ testProgress.currentProxy }}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="cancelTesting">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProxyManagement',
  data() {
    return {
      // Proxy statistics
      proxyStats: [
        { id: 1, label: 'Total Proxies', value: '0', icon: 'material-symbols:proxy', class: 'stat-primary' },
        { id: 2, label: 'Active', value: '0', icon: 'material-symbols:check-circle', class: 'stat-success' },
        { id: 3, label: 'Testing', value: '0', icon: 'material-symbols:schedule', class: 'stat-warning' },
        { id: 4, label: 'Failed', value: '0', icon: 'material-symbols:error', class: 'stat-error' }
      ],

      // Proxy data
      proxies: [],
      selectedProxies: new Set(),
      selectAll: false,

      // Modals and forms
      showAddProxyModal: false,
      editingProxy: null,
      showTestProgress: false,

      // Proxy form
      proxyForm: {
        type: 'http',
        host: '',
        port: '',
        username: '',
        password: '',
        location: '',
        enabled: true,
        notes: ''
      },

      // Rotation settings
      rotationSettings: {
        mode: 'round-robin',
        requestsPerProxy: 100,
        delay: 0,
        autoRetryFailed: true,
        rotateOnBan: true
      },

      // Testing settings
      testSettings: {
        url: 'https://httpbin.org/ip',
        timeout: 5000
      },

      // Testing state
      testingAll: false,
      testingSelected: false,
      batchTesting: false,
      testProgress: {
        current: 0,
        total: 0,
        percentage: 0,
        currentProxy: ''
      },

      // Test results
      batchTestResults: null,

      // Filter state
      filters: {
        status: 'all',
        type: 'all',
        search: ''
      }
    }
  },

  computed: {
    filteredProxies() {
      return this.proxies.filter(proxy => {
        const matchesStatus = this.filters.status === 'all' || proxy.status === this.filters.status
        const matchesType = this.filters.type === 'all' || proxy.type === this.filters.type
        const matchesSearch = !this.filters.search || 
          proxy.host.toLowerCase().includes(this.filters.search.toLowerCase()) ||
          (proxy.location && proxy.location.toLowerCase().includes(this.filters.search.toLowerCase()))
        
        return matchesStatus && matchesType && matchesSearch
      })
    }
  },

  async mounted() {
    await this.loadProxies()
    await this.loadSettings()
    this.updateStats()
  },

  methods: {
    async loadProxies() {
      try {
        if (window.electronAPI && window.electronAPI.getProxies) {
          const result = await window.electronAPI.getProxies()
          if (result.success) {
            this.proxies = result.proxies
          }
        } else {
          // Fallback: Load from localStorage or use sample data
          this.loadSampleProxies()
        }
      } catch (error) {
        console.error('Failed to load proxies:', error)
        this.loadSampleProxies()
      }
    },

    loadSampleProxies() {
      // Sample data for development
      this.proxies = [
        {
          id: '1',
          type: 'http',
          host: '192.168.1.100',
          port: '8080',
          username: 'user1',
          password: 'pass1',
          location: 'United States',
          status: 'active',
          responseTime: 120,
          successRate: 95,
          lastTested: new Date().toISOString(),
          enabled: true
        },
        {
          id: '2',
          type: 'https',
          host: 'proxy.example.com',
          port: '3128',
          location: 'Germany',
          status: 'active',
          responseTime: 200,
          successRate: 87,
          lastTested: new Date().toISOString(),
          enabled: true
        },
        {
          id: '3',
          type: 'socks5',
          host: 'socks.proxy.com',
          port: '1080',
          username: 'socksuser',
          password: 'sockspass',
          location: 'Japan',
          status: 'testing',
          responseTime: null,
          successRate: 0,
          lastTested: null,
          enabled: true,
          testing: true
        }
      ]
    },

    async loadSettings() {
      try {
        if (window.electronAPI && window.electronAPI.getProxySettings) {
          const result = await window.electronAPI.getProxySettings()
          if (result.success) {
            this.rotationSettings = { ...this.rotationSettings, ...result.settings }
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    },

    updateStats() {
      const total = this.proxies.length
      const active = this.proxies.filter(p => p.status === 'active').length
      const testing = this.proxies.filter(p => p.status === 'testing' || p.testing).length
      const failed = this.proxies.filter(p => p.status === 'failed').length

      this.proxyStats = [
        { id: 1, label: 'Total Proxies', value: total.toString(), icon: 'material-symbols:proxy', class: 'stat-primary' },
        { id: 2, label: 'Active', value: active.toString(), icon: 'material-symbols:check-circle', class: 'stat-success' },
        { id: 3, label: 'Testing', value: testing.toString(), icon: 'material-symbols:schedule', class: 'stat-warning' },
        { id: 4, label: 'Failed', value: failed.toString(), icon: 'material-symbols:error', class: 'stat-error' }
      ]
    },

    getStatusClass(status) {
      const statusMap = {
        active: 'status-active',
        testing: 'status-testing',
        failed: 'status-failed',
        disabled: 'status-disabled'
      }
      return statusMap[status] || 'status-unknown'
    },

    getStatusIcon(status) {
      const iconMap = {
        active: 'material-symbols:check-circle',
        testing: 'eos-icons:loading',
        failed: 'material-symbols:error',
        disabled: 'material-symbols:block'
      }
      return iconMap[status] || 'material-symbols:help'
    },

    getResponseTimeClass(responseTime) {
      if (!responseTime) return 'unknown'
      if (responseTime < 200) return 'fast'
      if (responseTime < 500) return 'medium'
      return 'slow'
    },

    toggleSelectAll() {
      if (this.selectAll) {
        this.filteredProxies.forEach(proxy => {
          this.selectedProxies.add(proxy.id)
        })
      } else {
        this.selectedProxies.clear()
      }
    },

    toggleProxySelection(proxyId) {
      if (this.selectedProxies.has(proxyId)) {
        this.selectedProxies.delete(proxyId)
      } else {
        this.selectedProxies.add(proxyId)
      }
    },

    openAddProxyModal() {
      this.proxyForm = {
        type: 'http',
        host: '',
        port: '',
        username: '',
        password: '',
        location: '',
        enabled: true,
        notes: ''
      }
      this.editingProxy = null
      this.showAddProxyModal = true
    },

    editProxy(proxy) {
      this.proxyForm = { ...proxy }
      this.editingProxy = proxy
      this.showAddProxyModal = true
    },

    closeModal() {
      this.showAddProxyModal = false
      this.editingProxy = null
    },

    async saveProxy() {
      try {
        const proxyData = { ...this.proxyForm }

        if (this.editingProxy) {
          // Update existing proxy
          const index = this.proxies.findIndex(p => p.id === this.editingProxy.id)
          if (index !== -1) {
            this.proxies[index] = { ...this.proxies[index], ...proxyData }
          }
        } else {
          // Add new proxy
          const newProxy = {
            id: Date.now().toString(),
            ...proxyData,
            status: 'testing',
            responseTime: null,
            successRate: 0,
            lastTested: null
          }
          this.proxies.push(newProxy)

          // Auto-test new proxy
          this.testProxy(newProxy)
        }

        // Save to backend
        if (window.electronAPI && window.electronAPI.saveProxy) {
          await window.electronAPI.saveProxy(proxyData)
        }

        this.closeModal()
        this.updateStats()

      } catch (error) {
        console.error('Error saving proxy:', error)
      }
    },

    async removeProxy(proxyId) {
      if (!confirm('Are you sure you want to delete this proxy?')) return

      try {
        this.proxies = this.proxies.filter(p => p.id !== proxyId)
        this.selectedProxies.delete(proxyId)

        if (window.electronAPI && window.electronAPI.deleteProxy) {
          await window.electronAPI.deleteProxy(proxyId)
        }

        this.updateStats()

      } catch (error) {
        console.error('Error deleting proxy:', error)
      }
    },

    async testProxy(proxy) {
      try {
        proxy.testing = true
        proxy.status = 'testing'

        // Simulate proxy testing
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))

        // Random result for demo
        const isSuccess = Math.random() > 0.3
        proxy.status = isSuccess ? 'active' : 'failed'
        proxy.responseTime = isSuccess ? Math.floor(50 + Math.random() * 500) : null
        proxy.successRate = isSuccess ? Math.floor(80 + Math.random() * 20) : 0
        proxy.lastTested = new Date().toISOString()
        proxy.testing = false

        this.updateStats()

      } catch (error) {
        console.error('Error testing proxy:', error)
        proxy.status = 'failed'
        proxy.testing = false
        this.updateStats()
      }
    },

    async testAllProxies() {
      this.testingAll = true
      this.showTestProgress = true

      const proxiesToTest = this.proxies.filter(p => p.enabled)
      this.testProgress.total = proxiesToTest.length
      this.testProgress.current = 0
      this.testProgress.percentage = 0

      for (const proxy of proxiesToTest) {
        if (!this.showTestProgress) break // Cancel if modal closed

        this.testProgress.current++
        this.testProgress.percentage = (this.testProgress.current / this.testProgress.total) * 100
        this.testProgress.currentProxy = `${proxy.host}:${proxy.port}`

        await this.testProxy(proxy)
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      this.testingAll = false
      this.showTestProgress = false
    },

    async testSelectedProxies() {
      this.testingSelected = true

      const selectedProxies = this.proxies.filter(p => this.selectedProxies.has(p.id))
      
      for (const proxy of selectedProxies) {
        await this.testProxy(proxy)
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      this.testingSelected = false
    },

    enableSelectedProxies() {
      this.proxies.forEach(proxy => {
        if (this.selectedProxies.has(proxy.id)) {
          proxy.enabled = true
          proxy.status = 'active'
        }
      })
      this.updateStats()
    },

    disableSelectedProxies() {
      this.proxies.forEach(proxy => {
        if (this.selectedProxies.has(proxy.id)) {
          proxy.enabled = false
          proxy.status = 'disabled'
        }
      })
      this.updateStats()
    },

    deleteSelectedProxies() {
      if (!confirm(`Are you sure you want to delete ${this.selectedProxies.size} proxies?`)) return

      this.proxies = this.proxies.filter(p => !this.selectedProxies.has(p.id))
      this.selectedProxies.clear()
      this.updateStats()
    },

    async saveRotationSettings() {
      try {
        if (window.electronAPI && window.electronAPI.saveProxySettings) {
          await window.electronAPI.saveProxySettings(this.rotationSettings)
        }
        // Show success message
        console.log('Rotation settings saved')
      } catch (error) {
        console.error('Error saving settings:', error)
      }
    },

    importProxies() {
      // Implementation for proxy import
      console.log('Import proxies functionality')
    },

    exportProxies() {
      // Implementation for proxy export
      console.log('Export proxies functionality')
    },

    clearFailedProxies() {
      this.proxies = this.proxies.filter(p => p.status !== 'failed')
      this.updateStats()
    },

    optimizeProxyList() {
      // Implementation for proxy list optimization
      console.log('Optimize proxy list functionality')
    },

    async startBatchTest() {
      this.batchTesting = true
      
      // Simulate batch testing
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      this.batchTestResults = {
        working: Math.floor(this.proxies.length * 0.7),
        failed: Math.floor(this.proxies.length * 0.3),
        total: this.proxies.length
      }
      
      this.batchTesting = false
    },

    cancelTesting() {
      this.showTestProgress = false
      this.testingAll = false
    }
  }
}
</script>

<style scoped>
.proxy-management-tab {
  padding: 2rem;
}

.tab-header {
  margin-bottom: 2rem;
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

.proxy-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid var(--border-color);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.stat-primary .stat-icon { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
.stat-success .stat-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.stat-warning .stat-icon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.stat-error .stat-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.stat-content h3 {
  font-size: 1.8rem;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.stat-content p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.proxy-content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.proxy-list-section,
.proxy-config-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.9rem;
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

.btn-danger {
  background: transparent;
  color: var(--error-color);
  border: 1px solid var(--error-color);
}

.btn-danger:hover:not(:disabled) {
  background: var(--error-color);
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-icon.btn-danger:hover:not(:disabled) {
  background: var(--error-color);
  color: white;
  border-color: var(--error-color);
}

/* Table Styles */
.proxy-table-container {
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.table-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.table-row {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-light);
}

.table-row:last-child {
  border-bottom: none;
}

.table-row.selected {
  background: rgba(99, 102, 241, 0.05);
}

.table-cell {
  padding: 0 0.5rem;
}

.table-body .table-row:hover {
  background: var(--bg-hover);
}

/* Status Indicator */
.status-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.status-active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-testing {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.status-failed {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.status-disabled {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

/* Proxy Address */
.proxy-address {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.auth-badge {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.proxy-auth {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Proxy Type */
.proxy-type {
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.proxy-type.http { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
.proxy-type.https { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.proxy-type.socks4 { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.proxy-type.socks5 { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

/* Location Tag */
.location-tag {
  padding: 0.25rem 0.75rem;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Response Time */
.response-time {
  font-weight: 600;
  font-size: 0.9rem;
}

.response-time.fast { color: #10b981; }
.response-time.medium { color: #f59e0b; }
.response-time.slow { color: #ef4444; }
.response-time.unknown { color: var(--text-secondary); }

/* Success Rate */
.success-rate {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rate-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.rate-fill {
  height: 100%;
  background: var(--success-color);
  transition: width 0.3s ease;
}

.rate-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  min-width: 35px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.25rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin-bottom: 1.5rem;
}

/* Bulk Actions */
.bulk-actions {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1rem 1.5rem;
  border: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bulk-info {
  color: var(--text-primary);
  font-weight: 500;
}

.bulk-buttons {
  display: flex;
  gap: 0.75rem;
}

/* Config Cards */
.config-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.config-header h3 {
  color: var(--text-primary);
  font-size: 1.2rem;
}

.config-header iconify-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.config-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Form Styles */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
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

/* Quick Actions */
.quick-actions {
  display: grid;
  gap: 0.75rem;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.quick-action-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
  border-color: var(--primary-color);
}

.quick-action-btn iconify-icon {
  font-size: 1.25rem;
  color: var(--primary-color);
}

.quick-action-btn span {
  flex: 1;
  font-weight: 500;
}

/* Testing Controls */
.testing-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.test-results {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.test-results h4 {
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.result-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
}

.stat-success { color: #10b981; }
.stat-failed { color: #ef4444; }
.stat-total { color: var(--text-secondary); }

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
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.large-modal {
  max-width: 800px;
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

.progress-stats {
  color: var(--text-secondary);
  font-size: 0.9rem;
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
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Progress */
.progress-container {
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.progress-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .proxy-content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .proxy-management-tab {
    padding: 1rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .header-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .table-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .table-cell {
    width: 100% !important;
  }

  .action-buttons {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>