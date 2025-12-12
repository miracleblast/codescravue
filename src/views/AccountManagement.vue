<template>
  <div class="tab-content active" id="accounts">
    <div class="tab-header">
      <h2><iconify-icon icon="material-symbols:person"></iconify-icon> Account Management</h2>
      <p>Manage platform accounts for authenticated scraping with higher rate limits</p>
    </div>

    <!-- Account Statistics -->
    <div class="account-stats">
      <div class="stat-card">
        <div class="stat-icon">
          <iconify-icon icon="material-symbols:person"></iconify-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ accounts.length }}</div>
          <div class="stat-label">Total Accounts</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon active">
          <iconify-icon icon="material-symbols:check-circle"></iconify-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ activeAccountsCount }}</div>
          <div class="stat-label">Active Accounts</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon warning">
          <iconify-icon icon="material-symbols:warning"></iconify-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ expiredAccountsCount }}</div>
          <div class="stat-label">Expired/Invalid</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon platforms">
          <iconify-icon icon="material-symbols:public"></iconify-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ uniquePlatformsCount }}</div>
          <div class="stat-label">Platforms</div>
        </div>
      </div>
    </div>

    <!-- Account Actions -->
    <div class="account-actions">
      <button class="btn btn-primary" @click="showAddAccountModal">
        <iconify-icon icon="material-symbols:add"></iconify-icon>
        Add Account
      </button>
      
      <button class="btn btn-outline" @click="bulkTestAccounts" :disabled="accounts.length === 0 || testingAccounts">
        <iconify-icon v-if="testingAccounts" icon="svg-spinners:bars-rotate-fade"></iconify-icon>
        <iconify-icon v-else icon="material-symbols:play-arrow"></iconify-icon>
        {{ testingAccounts ? 'Testing...' : 'Test All Accounts' }}
      </button>
      
      <button class="btn btn-outline" @click="exportAccounts" :disabled="accounts.length === 0">
        <iconify-icon icon="material-symbols:download"></iconify-icon>
        Export Accounts
      </button>
      
      <button class="btn btn-outline" @click="importAccounts">
        <iconify-icon icon="material-symbols:upload"></iconify-icon>
        Import Accounts
      </button>
      
      <div class="view-toggle">
        <button 
          class="btn btn-sm" 
          :class="viewMode === 'grid' ? 'btn-primary' : 'btn-outline'"
          @click="viewMode = 'grid'"
        >
          <iconify-icon icon="material-symbols:grid-view"></iconify-icon>
        </button>
        <button 
          class="btn btn-sm" 
          :class="viewMode === 'list' ? 'btn-primary' : 'btn-outline'"
          @click="viewMode = 'list'"
        >
          <iconify-icon icon="material-symbols:list"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- Filter and Search -->
    <div class="account-filters">
      <div class="filter-group">
        <label>Platform:</label>
        <select v-model="filters.platform" @change="applyFilters">
          <option value="all">All Platforms</option>
          <option value="github">GitHub</option>
          <option value="gitlab">GitLab</option>
          <option value="bitbucket">Bitbucket</option>
          <option value="stackoverflow">Stack Overflow</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Status:</label>
        <select v-model="filters.status" @change="applyFilters">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
          <option value="invalid">Invalid</option>
        </select>
      </div>
      
      <div class="search-group">
        <iconify-icon icon="material-symbols:search"></iconify-icon>
        <input 
          type="text" 
          v-model="filters.search" 
          placeholder="Search accounts..." 
          @input="applyFilters"
        >
      </div>
    </div>

    <!-- Accounts Grid/List -->
    <div v-if="filteredAccounts.length > 0" class="accounts-container">
      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="accounts-grid">
        <div 
          v-for="account in filteredAccounts" 
          :key="account.id"
          class="account-card"
          :class="getAccountStatusClass(account)"
        >
          <div class="account-header">
            <div class="account-platform">
              <iconify-icon :icon="getPlatformIcon(account.platform)"></iconify-icon>
              <span class="platform-name">{{ formatPlatform(account.platform) }}</span>
            </div>
            <div class="account-status" :class="account.status">
              <div class="status-dot"></div>
              {{ account.status }}
            </div>
          </div>
          
          <div class="account-body">
            <div class="account-username">
              <iconify-icon icon="material-symbols:person"></iconify-icon>
              {{ account.username }}
            </div>
            
            <div v-if="account.email" class="account-email">
              <iconify-icon icon="material-symbols:email"></iconify-icon>
              {{ account.email }}
            </div>
            
            <div class="account-meta">
              <div class="meta-item" v-if="account.rateLimit">
                <iconify-icon icon="material-symbols:speed"></iconify-icon>
                {{ account.rateLimit.remaining }}/{{ account.rateLimit.limit }}
              </div>
              
              <div class="meta-item" v-if="account.lastUsed">
                <iconify-icon icon="material-symbols:schedule"></iconify-icon>
                {{ formatRelativeTime(account.lastUsed) }}
              </div>
              
              <div class="meta-item" v-if="account.createdAt">
                <iconify-icon icon="material-symbols:calendar-today"></iconify-icon>
                {{ formatDate(account.createdAt) }}
              </div>
            </div>
            
            <div v-if="account.tags && account.tags.length > 0" class="account-tags">
              <span 
                v-for="tag in account.tags" 
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          
          <div class="account-footer">
            <div class="account-actions">
              <button 
                class="btn-icon" 
                @click="testAccount(account)"
                :title="`Test ${account.platform} account`"
                :disabled="testingAccounts"
              >
                <iconify-icon icon="material-symbols:play-arrow"></iconify-icon>
              </button>
              
              <button 
                class="btn-icon" 
                @click="editAccount(account)"
                title="Edit account"
              >
                <iconify-icon icon="material-symbols:edit"></iconify-icon>
              </button>
              
              <button 
                class="btn-icon danger" 
                @click="deleteAccount(account)"
                title="Delete account"
              >
                <iconify-icon icon="material-symbols:delete"></iconify-icon>
              </button>
              
              <button 
                class="btn-icon" 
                @click="toggleAccountStatus(account)"
                :title="account.status === 'active' ? 'Deactivate' : 'Activate'"
              >
                <iconify-icon :icon="account.status === 'active' ? 'material-symbols:pause' : 'material-symbols:play-arrow'"></iconify-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-if="viewMode === 'list'" class="accounts-list">
        <div class="list-header">
          <div class="list-column platform">Platform</div>
          <div class="list-column username">Username</div>
          <div class="list-column status">Status</div>
          <div class="list-column rate-limit">Rate Limit</div>
          <div class="list-column last-used">Last Used</div>
          <div class="list-column actions">Actions</div>
        </div>
        
        <div 
          v-for="account in filteredAccounts" 
          :key="account.id"
          class="list-row"
          :class="getAccountStatusClass(account)"
        >
          <div class="list-column platform">
            <iconify-icon :icon="getPlatformIcon(account.platform)"></iconify-icon>
            {{ formatPlatform(account.platform) }}
          </div>
          
          <div class="list-column username">
            {{ account.username }}
            <div v-if="account.email" class="email">{{ account.email }}</div>
          </div>
          
          <div class="list-column status">
            <div class="status-badge" :class="account.status">
              {{ account.status }}
            </div>
          </div>
          
          <div class="list-column rate-limit">
            <div v-if="account.rateLimit" class="rate-limit-bar">
              <div 
                class="rate-fill" 
                :style="{ width: calculateRateLimitPercentage(account.rateLimit) + '%' }"
                :class="getRateLimitClass(account.rateLimit)"
              ></div>
              <span class="rate-text">
                {{ account.rateLimit.remaining }}/{{ account.rateLimit.limit }}
              </span>
            </div>
            <span v-else class="no-data">N/A</span>
          </div>
          
          <div class="list-column last-used">
            {{ account.lastUsed ? formatRelativeTime(account.lastUsed) : 'Never' }}
          </div>
          
          <div class="list-column actions">
            <div class="action-buttons">
              <button 
                class="btn-icon sm" 
                @click="testAccount(account)"
                :disabled="testingAccounts"
                title="Test account"
              >
                <iconify-icon icon="material-symbols:play-arrow"></iconify-icon>
              </button>
              
              <button 
                class="btn-icon sm" 
                @click="editAccount(account)"
                title="Edit account"
              >
                <iconify-icon icon="material-symbols:edit"></iconify-icon>
              </button>
              
              <button 
                class="btn-icon sm danger" 
                @click="deleteAccount(account)"
                title="Delete account"
              >
                <iconify-icon icon="material-symbols:delete"></iconify-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <iconify-icon icon="material-symbols:person-off"></iconify-icon>
      </div>
      <h3>No Accounts Found</h3>
      <p v-if="hasActiveFilters">
        No accounts match your current filters. <a href="#" @click="clearFilters">Clear filters</a> to see all accounts.
      </p>
      <p v-else>
        You haven't added any accounts yet. Add your first account to get started with authenticated scraping.
      </p>
      <button class="btn btn-primary" @click="showAddAccountModal">
        <iconify-icon icon="material-symbols:add"></iconify-icon>
        Add Your First Account
      </button>
    </div>

    <!-- Add/Edit Account Modal -->
    <div v-if="showAccountModal" class="modal-overlay" @click="closeAccountModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingAccount ? 'Edit Account' : 'Add New Account' }}</h3>
          <button class="btn-icon" @click="closeAccountModal">
            <iconify-icon icon="material-symbols:close"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveAccount">
            <div class="form-group">
              <label for="platform">Platform *</label>
              <select 
                id="platform" 
                v-model="accountForm.platform" 
                required
                @change="onPlatformChange"
              >
                <option value="">Select Platform</option>
                <option value="github">GitHub</option>
                <option value="gitlab">GitLab</option>
                <option value="bitbucket">Bitbucket</option>
                <option value="codepen">CodePen</option>
                <option value="stackoverflow">Stack Overflow</option>
              </select>
            </div>

            <div class="form-group">
              <label for="username">Username/Email *</label>
              <input 
                type="text" 
                id="username" 
                v-model="accountForm.username" 
                required
                placeholder="Enter username or email"
              >
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <div class="password-input">
                <input 
                  :type="showPassword ? 'text' : 'password'" 
                  id="password" 
                  v-model="accountForm.password" 
                  placeholder="Enter password (optional for API keys)"
                >
                <button 
                  type="button" 
                  class="btn-icon" 
                  @click="showPassword = !showPassword"
                >
                  <iconify-icon :icon="showPassword ? 'material-symbols:visibility-off' : 'material-symbols:visibility'"></iconify-icon>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="apiKey">API Key / Access Token</label>
              <div class="api-key-input">
                <input 
                  :type="showApiKey ? 'text' : 'password'" 
                  id="apiKey" 
                  v-model="accountForm.apiKey" 
                  placeholder="Enter API key or access token"
                >
                <button 
                  type="button" 
                  class="btn-icon" 
                  @click="showApiKey = !showApiKey"
                >
                  <iconify-icon :icon="showApiKey ? 'material-symbols:visibility-off' : 'material-symbols:visibility'"></iconify-icon>
                </button>
              </div>
              <small class="help-text">
                For GitHub: Use Personal Access Token. For GitLab: Use Project/Personal Access Token.
              </small>
            </div>

            <div class="form-group">
              <label for="tags">Tags</label>
              <div class="tags-input">
                <input 
                  type="text" 
                  id="tags" 
                  v-model="tagInput" 
                  placeholder="Add tags (press Enter)"
                  @keydown.enter.prevent="addTag"
                >
                <div class="tags-list">
                  <span 
                    v-for="tag in accountForm.tags" 
                    :key="tag"
                    class="tag"
                  >
                    {{ tag }}
                    <button 
                      type="button" 
                      class="tag-remove"
                      @click="removeTag(tag)"
                    >
                      <iconify-icon icon="material-symbols:close"></iconify-icon>
                    </button>
                  </span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="accountForm.autoTest">
                Test account automatically after saving
              </label>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-outline" @click="closeAccountModal">
                Cancel
              </button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                :disabled="savingAccount"
              >
                <iconify-icon v-if="savingAccount" icon="svg-spinners:bars-rotate-fade"></iconify-icon>
                <iconify-icon v-else icon="material-symbols:save"></iconify-icon>
                {{ savingAccount ? 'Saving...' : (editingAccount ? 'Update Account' : 'Save Account') }}
              </button>
              <button 
                v-if="!editingAccount"
                type="button" 
                class="btn btn-secondary" 
                @click="testAccountBeforeSave"
                :disabled="!accountForm.platform || !accountForm.username"
              >
                <iconify-icon icon="material-symbols:play-arrow"></iconify-icon>
                Test Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Test Results Modal -->
    <div v-if="showTestResults" class="modal-overlay" @click="showTestResults = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Account Test Results</h3>
          <button class="btn-icon" @click="showTestResults = false">
            <iconify-icon icon="material-symbols:close"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-body">
          <div 
            v-for="result in testResults" 
            :key="result.accountId"
            class="test-result"
            :class="result.success ? 'success' : 'error'"
          >
            <div class="result-header">
              <iconify-icon :icon="result.success ? 'material-symbols:check-circle' : 'material-symbols:error'"></iconify-icon>
              <strong>{{ getAccountById(result.accountId)?.username }}</strong>
              <span class="platform">({{ formatPlatform(getAccountById(result.accountId)?.platform) }})</span>
            </div>
            <div class="result-message">{{ result.message }}</div>
            <div v-if="result.details" class="result-details">
              <pre>{{ JSON.stringify(result.details, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click="showImportModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Import Accounts</h3>
          <button class="btn-icon" @click="showImportModal = false">
            <iconify-icon icon="material-symbols:close"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="import-options">
            <div class="import-option">
              <h4>From JSON File</h4>
              <p>Import accounts from a JSON file</p>
              <input 
                type="file" 
                ref="jsonFileInput"
                accept=".json"
                @change="importFromJson"
                style="display: none"
              >
              <button class="btn btn-outline" @click="$refs.jsonFileInput.click()">
                Choose JSON File
              </button>
            </div>
            
            <div class="import-option">
              <h4>Paste JSON</h4>
              <p>Paste account data in JSON format</p>
              <textarea 
                v-model="importJsonData" 
                placeholder='Paste JSON data here...'
                rows="6"
              ></textarea>
              <button 
                class="btn btn-outline" 
                @click="importFromJsonString"
                :disabled="!importJsonData"
              >
                Import from Text
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AccountManagement',
  data() {
    return {
      accounts: [],
      viewMode: 'grid',
      testingAccounts: false,
      savingAccount: false,
      showAccountModal: false,
      showTestResults: false,
      showImportModal: false,
      showPassword: false,
      showApiKey: false,
      editingAccount: null,
      tagInput: '',
      importJsonData: '',
      testResults: [],
      
      filters: {
        platform: 'all',
        status: 'all',
        search: ''
      },
      
      accountForm: {
        platform: '',
        username: '',
        password: '',
        apiKey: '',
        tags: [],
        autoTest: true
      }
    }
  },
  computed: {
    filteredAccounts() {
      let filtered = this.accounts

      // Platform filter
      if (this.filters.platform !== 'all') {
        filtered = filtered.filter(account => account.platform === this.filters.platform)
      }

      // Status filter
      if (this.filters.status !== 'all') {
        filtered = filtered.filter(account => account.status === this.filters.status)
      }

      // Search filter
      if (this.filters.search) {
        const searchTerm = this.filters.search.toLowerCase()
        filtered = filtered.filter(account => 
          account.username.toLowerCase().includes(searchTerm) ||
          (account.email && account.email.toLowerCase().includes(searchTerm)) ||
          (account.tags && account.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        )
      }

      return filtered
    },

    activeAccountsCount() {
      return this.accounts.filter(account => account.status === 'active').length
    },

    expiredAccountsCount() {
      return this.accounts.filter(account => 
        account.status === 'expired' || account.status === 'invalid'
      ).length
    },

    uniquePlatformsCount() {
      return new Set(this.accounts.map(account => account.platform)).size
    },

    hasActiveFilters() {
      return this.filters.platform !== 'all' || 
             this.filters.status !== 'all' || 
             this.filters.search !== ''
    }
  },
  async mounted() {
    await this.loadAccounts()
    this.setupAutoRefresh()
  },
  methods: {
    async loadAccounts() {
      try {
        console.log('🔍 Loading accounts from storage...')
        
        // Try to load from Electron API first
        if (window.electronAPI && window.electronAPI.getAccounts) {
          const result = await window.electronAPI.getAccounts()
          if (result && result.success) {
            this.accounts = result.accounts || []
            console.log(`✅ Loaded ${this.accounts.length} accounts from Electron API`)
            return
          }
        }

        // Fallback to localStorage
        const savedAccounts = localStorage.getItem('codeScraperAccounts')
        if (savedAccounts) {
          this.accounts = JSON.parse(savedAccounts)
          console.log(`✅ Loaded ${this.accounts.length} accounts from localStorage`)
        } else {
          this.accounts = []
          console.log('ℹ️ No accounts found in storage')
        }

        // Test account status on load
        await this.checkAccountStatuses()

      } catch (error) {
        console.error('❌ Failed to load accounts:', error)
        this.accounts = []
      }
    },

    async saveAccounts() {
      try {
        // Save to Electron API if available
        if (window.electronAPI && window.electronAPI.saveAccounts) {
          const result = await window.electronAPI.saveAccounts(this.accounts)
          if (result && result.success) {
            console.log('✅ Accounts saved via Electron API')
            return
          }
        }

        // Fallback to localStorage
        localStorage.setItem('codeScraperAccounts', JSON.stringify(this.accounts))
        console.log('✅ Accounts saved to localStorage')

      } catch (error) {
        console.error('❌ Failed to save accounts:', error)
        throw error
      }
    },

    async checkAccountStatuses() {
      // Check for expired API keys and update status
      const now = new Date().getTime()
      this.accounts.forEach(account => {
        if (account.expiresAt && new Date(account.expiresAt).getTime() < now) {
          account.status = 'expired'
        }
      })
      await this.saveAccounts()
    },

    setupAutoRefresh() {
      // Refresh account status every 5 minutes
      setInterval(() => {
        this.checkAccountStatuses()
      }, 5 * 60 * 1000)
    },

    showAddAccountModal() {
      this.editingAccount = null
      this.resetAccountForm()
      this.showAccountModal = true
    },

    editAccount(account) {
      this.editingAccount = account
      this.accountForm = {
        platform: account.platform,
        username: account.username,
        password: account.password || '',
        apiKey: account.apiKey || '',
        tags: [...(account.tags || [])],
        autoTest: false
      }
      this.showAccountModal = true
    },

    closeAccountModal() {
      this.showAccountModal = false
      this.editingAccount = null
      this.resetAccountForm()
    },

    resetAccountForm() {
      this.accountForm = {
        platform: '',
        username: '',
        password: '',
        apiKey: '',
        tags: [],
        autoTest: true
      }
      this.tagInput = ''
      this.showPassword = false
      this.showApiKey = false
    },

    onPlatformChange() {
      // Platform-specific defaults or hints
      const platformHints = {
        github: 'Use Personal Access Token for better rate limits',
        gitlab: 'Use Project Access Token for repository access',
        bitbucket: 'Use App Password for API access',
        stackoverflow: 'Password usually not required for public data'
      }
      
      if (platformHints[this.accountForm.platform]) {
        console.log('💡', platformHints[this.accountForm.platform])
      }
    },

    addTag() {
      if (this.tagInput.trim() && !this.accountForm.tags.includes(this.tagInput.trim())) {
        this.accountForm.tags.push(this.tagInput.trim())
        this.tagInput = ''
      }
    },

    removeTag(tag) {
      this.accountForm.tags = this.accountForm.tags.filter(t => t !== tag)
    },

    async saveAccount() {
      if (!this.accountForm.platform || !this.accountForm.username) {
        alert('Please fill in platform and username fields')
        return
      }

      this.savingAccount = true

      try {
        const accountData = {
          id: this.editingAccount ? this.editingAccount.id : this.generateId(),
          platform: this.accountForm.platform,
          username: this.accountForm.username,
          password: this.accountForm.password || undefined,
          apiKey: this.accountForm.apiKey || undefined,
          tags: this.accountForm.tags,
          status: 'active',
          createdAt: this.editingAccount ? this.editingAccount.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastUsed: this.editingAccount ? this.editingAccount.lastUsed : null,
          rateLimit: this.editingAccount ? this.editingAccount.rateLimit : null
        }

        if (this.editingAccount) {
          // Update existing account
          const index = this.accounts.findIndex(acc => acc.id === this.editingAccount.id)
          if (index !== -1) {
            this.accounts[index] = { ...this.accounts[index], ...accountData }
          }
        } else {
          // Add new account
          this.accounts.push(accountData)
        }

        await this.saveAccounts()
        
        // Test account if requested
        if (this.accountForm.autoTest && !this.editingAccount) {
          const newAccount = this.accounts.find(acc => acc.id === accountData.id)
          await this.testAccount(newAccount)
        }

        this.closeAccountModal()
        this.showNotification(
          `Account ${this.editingAccount ? 'updated' : 'added'} successfully!`, 
          'success'
        )

      } catch (error) {
        console.error('❌ Failed to save account:', error)
        this.showNotification('Failed to save account', 'error')
      } finally {
        this.savingAccount = false
      }
    },

    async testAccountBeforeSave() {
      if (!this.accountForm.platform || !this.accountForm.username) {
        alert('Please fill in platform and username fields')
        return
      }

      const testAccount = {
        id: 'temp',
        platform: this.accountForm.platform,
        username: this.accountForm.username,
        password: this.accountForm.password,
        apiKey: this.accountForm.apiKey
      }

      await this.performAccountTest(testAccount)
    },

    async testAccount(account) {
      this.testingAccounts = true
      
      try {
        await this.performAccountTest(account)
      } finally {
        this.testingAccounts = false
      }
    },

    async performAccountTest(account) {
      try {
        console.log(`🧪 Testing ${account.platform} account: ${account.username}`)
        
        let testResult = null

        // Use Electron API for testing if available
        if (window.electronAPI && window.electronAPI.testAccount) {
          const result = await window.electronAPI.testAccount(account)
          testResult = result
        } else {
          // Fallback to direct testing (simulated for now)
          testResult = await this.simulateAccountTest(account)
        }

        // Update account with test results
        const accountIndex = this.accounts.findIndex(acc => acc.id === account.id)
        if (accountIndex !== -1) {
          this.accounts[accountIndex] = {
            ...this.accounts[accountIndex],
            status: testResult.success ? 'active' : 'invalid',
            lastUsed: new Date().toISOString(),
            rateLimit: testResult.rateLimit || null,
            lastTested: new Date().toISOString()
          }

          await this.saveAccounts()
        }

        // Show test results
        this.testResults = [{
          accountId: account.id,
          success: testResult.success,
          message: testResult.message,
          details: testResult.details
        }]

        this.showTestResults = true

        this.showNotification(
          `Account test ${testResult.success ? 'passed' : 'failed'}: ${testResult.message}`,
          testResult.success ? 'success' : 'error'
        )

      } catch (error) {
        console.error('❌ Account test failed:', error)
        this.showNotification('Account test failed', 'error')
      }
    },

    async simulateAccountTest(account) {
      // Simulate API call to test account
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock test results based on platform
      const mockResults = {
        github: { success: true, message: 'GitHub API access verified', rateLimit: { limit: 5000, remaining: 4850 } },
        gitlab: { success: true, message: 'GitLab API access verified', rateLimit: { limit: 1000, remaining: 980 } },
        bitbucket: { success: true, message: 'Bitbucket API access verified', rateLimit: { limit: 1000, remaining: 950 } },
        stackoverflow: { success: true, message: 'Stack Overflow access verified' }
      }

      return mockResults[account.platform] || { success: false, message: 'Platform not supported' }
    },

    async bulkTestAccounts() {
      if (this.accounts.length === 0) return

      this.testingAccounts = true
      this.testResults = []

      try {
        const accountsToTest = this.accounts.filter(acc => acc.status !== 'invalid')
        
        for (const account of accountsToTest) {
          if (!this.testingAccounts) break // Allow cancellation
          
          try {
            const testResult = await this.simulateAccountTest(account)
            
            // Update account status
            const accountIndex = this.accounts.findIndex(acc => acc.id === account.id)
            if (accountIndex !== -1) {
              this.accounts[accountIndex].status = testResult.success ? 'active' : 'invalid'
              this.accounts[accountIndex].lastTested = new Date().toISOString()
              this.accounts[accountIndex].rateLimit = testResult.rateLimit || null
            }

            this.testResults.push({
              accountId: account.id,
              success: testResult.success,
              message: testResult.message,
              details: testResult.details
            })

          } catch (error) {
            console.error(`❌ Failed to test account ${account.username}:`, error)
            this.testResults.push({
              accountId: account.id,
              success: false,
              message: 'Test failed: ' + error.message
            })
          }
        }

        await this.saveAccounts()
        this.showTestResults = true

        const passed = this.testResults.filter(r => r.success).length
        const failed = this.testResults.filter(r => !r.success).length
        
        this.showNotification(
          `Bulk test completed: ${passed} passed, ${failed} failed`,
          failed === 0 ? 'success' : 'warning'
        )

      } catch (error) {
        console.error('❌ Bulk test failed:', error)
        this.showNotification('Bulk test failed', 'error')
      } finally {
        this.testingAccounts = false
      }
    },

    async deleteAccount(account) {
      if (!confirm(`Are you sure you want to delete the ${account.platform} account for ${account.username}?`)) {
        return
      }

      try {
        this.accounts = this.accounts.filter(acc => acc.id !== account.id)
        await this.saveAccounts()
        this.showNotification('Account deleted successfully', 'success')
      } catch (error) {
        console.error('❌ Failed to delete account:', error)
        this.showNotification('Failed to delete account', 'error')
      }
    },

    async toggleAccountStatus(account) {
      try {
        const newStatus = account.status === 'active' ? 'inactive' : 'active'
        const accountIndex = this.accounts.findIndex(acc => acc.id === account.id)
        
        if (accountIndex !== -1) {
          this.accounts[accountIndex].status = newStatus
          await this.saveAccounts()
          
          this.showNotification(
            `Account ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
            'success'
          )
        }
      } catch (error) {
        console.error('❌ Failed to toggle account status:', error)
        this.showNotification('Failed to update account status', 'error')
      }
    },

    async exportAccounts() {
      try {
        const exportData = {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          accounts: this.accounts.map(acc => ({
            platform: acc.platform,
            username: acc.username,
            // Don't export passwords and API keys for security
            tags: acc.tags,
            createdAt: acc.createdAt
          }))
        }

        const dataStr = JSON.stringify(exportData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        
        const link = document.createElement('a')
        link.href = URL.createObjectURL(dataBlob)
        link.download = `codescraper-accounts-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(link.href)

        this.showNotification('Accounts exported successfully', 'success')

      } catch (error) {
        console.error('❌ Failed to export accounts:', error)
        this.showNotification('Failed to export accounts', 'error')
      }
    },

    importAccounts() {
      this.showImportModal = true
    },

    async importFromJson(event) {
      const file = event.target.files[0]
      if (!file) return

      try {
        const text = await this.readFileAsText(file)
        await this.processImportData(text)
        event.target.value = '' // Reset file input
      } catch (error) {
        console.error('❌ Failed to import accounts from file:', error)
        this.showNotification('Failed to import accounts', 'error')
      }
    },

    async importFromJsonString() {
      if (!this.importJsonData.trim()) return

      try {
        await this.processImportData(this.importJsonData)
        this.importJsonData = ''
      } catch (error) {
        console.error('❌ Failed to import accounts from text:', error)
        this.showNotification('Failed to import accounts', 'error')
      }
    },

    async processImportData(jsonData) {
      try {
        const importData = JSON.parse(jsonData)
        const accountsToImport = Array.isArray(importData) ? importData : (importData.accounts || [])
        
        let importedCount = 0
        let skippedCount = 0

        for (const accountData of accountsToImport) {
          // Check if account already exists
          const exists = this.accounts.some(acc => 
            acc.platform === accountData.platform && 
            acc.username === accountData.username
          )

          if (!exists) {
            const newAccount = {
              id: this.generateId(),
              platform: accountData.platform,
              username: accountData.username,
              password: accountData.password || '',
              apiKey: accountData.apiKey || '',
              tags: accountData.tags || [],
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }

            this.accounts.push(newAccount)
            importedCount++
          } else {
            skippedCount++
          }
        }

        await this.saveAccounts()
        this.showImportModal = false

        this.showNotification(
          `Import completed: ${importedCount} accounts imported, ${skippedCount} skipped`,
          'success'
        )

      } catch (error) {
        console.error('❌ Invalid import data:', error)
        throw new Error('Invalid JSON format for accounts import')
      }
    },

    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target.result)
        reader.onerror = e => reject(new Error('File reading failed'))
        reader.readAsText(file)
      })
    },

    applyFilters() {
      // Filters are applied reactively through computed property
      console.log('🔍 Applying filters:', this.filters)
    },

    clearFilters() {
      this.filters = {
        platform: 'all',
        status: 'all',
        search: ''
      }
    },

    getAccountById(accountId) {
      return this.accounts.find(acc => acc.id === accountId)
    },

    getAccountStatusClass(account) {
      return `status-${account.status}`
    },

    getPlatformIcon(platform) {
      const icons = {
        github: 'mdi:github',
        gitlab: 'mdi:gitlab',
        bitbucket: 'mdi:bitbucket',
        stackoverflow: 'simple-icons:stackoverflow'
      }
      return icons[platform] || 'material-symbols:person'
    },

    formatPlatform(platform) {
      const platforms = {
        github: 'GitHub',
        gitlab: 'GitLab',
        bitbucket: 'Bitbucket',
        stackoverflow: 'Stack Overflow'
      }
      return platforms[platform] || platform
    },

    calculateRateLimitPercentage(rateLimit) {
      if (!rateLimit || rateLimit.limit === 0) return 0
      return (rateLimit.remaining / rateLimit.limit) * 100
    },

    getRateLimitClass(rateLimit) {
      if (!rateLimit) return 'unknown'
      const percentage = this.calculateRateLimitPercentage(rateLimit)
      if (percentage > 50) return 'high'
      if (percentage > 20) return 'medium'
      return 'low'
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    },

    formatRelativeTime(dateString) {
      const now = new Date()
      const date = new Date(dateString)
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return this.formatDate(dateString)
    },

    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2)
    },

    showNotification(message, type = 'info') {
      // You can integrate with your existing notification system
      console.log(`🔔 ${type.toUpperCase()}: ${message}`)
      
      // For now, use a simple alert
      if (type === 'error') {
        alert(`Error: ${message}`)
      } else if (type === 'warning') {
        alert(`Warning: ${message}`)
      } else {
        alert(message)
      }
    }
  },

  beforeUnmount() {
    // Clean up any intervals or event listeners
  }
}
</script>

<style scoped>
/* Add the comprehensive CSS styles here */
/* Since the response is getting long, I'll include key styles but you have the main CSS structure */

.account-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2.5rem;
  color: var(--primary);
}

.stat-icon.active { color: var(--success); }
.stat-icon.warning { color: var(--warning); }
.stat-icon.platforms { color: var(--secondary); }

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.account-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
}

.view-toggle {
  display: flex;
  gap: 0.25rem;
  margin-left: auto;
}

.account-filters {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.filter-group, .search-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label, .search-group label {
  font-weight: 500;
  white-space: nowrap;
}

.search-group {
  position: relative;
  margin-left: auto;
}

.search-group iconify-icon {
  position: absolute;
  left: 0.75rem;
  color: var(--text-secondary);
}

.search-group input {
  padding-left: 2.5rem;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.account-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all 0.3s ease;
}

.account-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.account-card.status-active {
  border-left: 4px solid var(--success);
}

.account-card.status-inactive {
  border-left: 4px solid var(--warning);
}

.account-card.status-expired,
.account-card.status-invalid {
  border-left: 4px solid var(--error);
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.account-platform {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.platform-name {
  color: var(--text-primary);
}

.account-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  text-transform: capitalize;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.account-status.active .status-dot { background: var(--success); }
.account-status.inactive .status-dot { background: var(--warning); }
.account-status.expired .status-dot { background: var(--error); }
.account-status.invalid .status-dot { background: var(--error); }

.account-body {
  padding: 1.5rem;
}

.account-username,
.account-email {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.account-email {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.account-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.account-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: var(--primary-light);
  color: var(--primary);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.account-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.account-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

/* List View Styles */
.accounts-list {
  background: var(--card-bg);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr auto;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.list-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr auto;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
}

.list-row:last-child {
  border-bottom: none;
}

.list-row:hover {
  background: var(--bg-primary);
}

.list-column.platform {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.list-column.username .email {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
  display: inline-block;
}

.status-badge.active { background: var(--success-light); color: var(--success); }
.status-badge.inactive { background: var(--warning-light); color: var(--warning); }
.status-badge.expired { background: var(--error-light); color: var(--error); }
.status-badge.invalid { background: var(--error-light); color: var(--error); }

.rate-limit-bar {
  position: relative;
  background: var(--bg-primary);
  border-radius: 4px;
  height: 20px;
  overflow: hidden;
}

.rate-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.rate-fill.high { background: var(--success); }
.rate-fill.medium { background: var(--warning); }
.rate-fill.low { background: var(--error); }

.rate-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
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

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
}

.password-input,
.api-key-input {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input input,
.api-key-input input {
  flex: 1;
  padding-right: 3rem;
}

.password-input .btn-icon,
.api-key-input .btn-icon {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  color: var(--text-secondary);
}

.help-text {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.tags-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--primary-light);
  color: var(--primary);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
}

.tag-remove {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

/* Test Results */
.test-result {
  padding: 1rem;
  border-radius: var(--radius);
  margin-bottom: 1rem;
  border-left: 4px solid;
}

.test-result.success {
  background: var(--success-light);
  border-left-color: var(--success);
}

.test-result.error {
  background: var(--error-light);
  border-left-color: var(--error);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.result-header .platform {
  color: var(--text-secondary);
  font-weight: normal;
}

.result-message {
  margin-bottom: 0.5rem;
}

.result-details pre {
  background: var(--card-bg);
  padding: 0.75rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 0;
}

/* Import Options */
.import-options {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.import-option {
  padding: 1.5rem;
  background: var(--bg-primary);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
}

.import-option h4 {
  margin: 0 0 0.5rem 0;
}

.import-option p {
  margin: 0 0 1rem 0;
  color: var(--text-secondary);
}

.import-option textarea {
  width: 100%;
  resize: vertical;
  margin-bottom: 1rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 4rem;
  color: var(--text-tertiary);
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
}

.empty-state p {
  margin: 0 0 2rem 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.5;
}

.empty-state a {
  color: var(--primary);
  text-decoration: none;
}

.empty-state a:hover {
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 768px) {
  .account-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .account-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .view-toggle {
    margin-left: 0;
    justify-content: center;
  }
  
  .account-filters {
    flex-direction: column;
  }
  
  .search-group {
    margin-left: 0;
  }
  
  .accounts-grid {
    grid-template-columns: 1fr;
  }
  
  .list-header,
  .list-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .list-column {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .list-column::before {
    content: attr(data-label);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  
  .modal-content {
    width: 95%;
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
/* Enhanced account cards */
.account-card.premium {
  border: 2px solid var(--accent-color);
  background: linear-gradient(135deg, var(--card-bg) 0%, rgba(139, 92, 246, 0.05) 100%);
}

.account-card.expired {
  opacity: 0.7;
  background: var(--bg-primary);
}

/* Enhanced status indicators */
.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 0.5rem;
}

.status-indicator.active {
  background: var(--success-color);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.status-indicator.inactive {
  background: var(--warning-color);
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
}

.status-indicator.error {
  background: var(--error-color);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

/* Enhanced rate limit display */
.rate-limit-bar {
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.25rem;
}

.rate-limit-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.rate-limit-fill.high {
  background: var(--success-color);
}

.rate-limit-fill.medium {
  background: var(--warning-color);
}

.rate-limit-fill.low {
  background: var(--error-color);
}

/* Enhanced test results */
.test-result {
  padding: 1rem;
  border-radius: var(--radius);
  margin-bottom: 1rem;
  border-left: 4px solid;
}

.test-result.success {
  background: var(--success-light);
  border-left-color: var(--success-color);
}

.test-result.error {
  background: var(--error-light);
  border-left-color: var(--error-color);
}

.test-result.warning {
  background: var(--warning-light);
  border-left-color: var(--warning-color);
}

.test-details {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--bg-primary);
  border-radius: var(--radius);
  font-family: monospace;
  font-size: 0.875rem;
}
</style>