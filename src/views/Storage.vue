<template>
  <div class="storage-tab">
    <!-- EXACT UI from your index.html but with Vue reactivity -->
    <div class="tab-header">
      <h1>Storage Management</h1>
      <p>Manage your code storage locations and monitor disk usage</p>
    </div>

    <!-- Real Storage Stats -->
    <div class="storage-stats-grid">
      <div class="stat-card" v-for="stat in realStats" :key="stat.id" :class="stat.class">
        <div class="stat-icon">
          <iconify-icon :icon="stat.icon"></iconify-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stat.value }}</h3>
          <p>{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Storage Locations Section -->
    <div class="storage-section">
      <div class="section-header">
        <h2>Storage Locations</h2>
        <div class="header-actions">
          <button class="btn btn-primary" @click="openAddLocationModal">
            <iconify-icon icon="material-symbols:add"></iconify-icon>
            Add Custom Location
          </button>
          <button class="btn btn-secondary" @click="rescanAllLocations">
            <iconify-icon icon="material-symbols:refresh"></iconify-icon>
            Rescan All
          </button>
        </div>
      </div>

      <!-- Storage Locations Grid -->
      <div class="locations-container">
        <div v-for="location in combinedLocations" :key="location.path" 
             class="location-card" :class="{ 'custom-location': location.custom, 'scanning': scanningLocations.has(location.path) }">
          
          <div class="location-header">
            <div class="location-icon">
              <iconify-icon :icon="getLocationIcon(location)"></iconify-icon>
            </div>
            <div class="location-info">
              <h4>{{ location.name }}</h4>
              <p class="location-path">{{ location.path }}</p>
              <div class="location-tags">
                <span v-if="location.default" class="tag tag-default">Default</span>
                <span v-if="location.custom" class="tag tag-custom">Custom</span>
                <span class="tag" :class="getSizeClass(location.size)">{{ formatSize(location.size) }}</span>
              </div>
            </div>
            <div class="location-actions">
              <button class="btn-icon" @click="scanLocation(location)" :disabled="scanningLocations.has(location.path)" title="Scan Location">
                <iconify-icon icon="material-symbols:search"></iconify-icon>
              </button>
              <button class="btn-icon" @click="openInExplorer(location.path)" title="Open in Explorer">
                <iconify-icon icon="material-symbols:folder-open"></iconify-icon>
              </button>
              <button v-if="location.custom" class="btn-icon btn-danger" 
                      @click="removeCustomLocation(location)" title="Remove Location">
                <iconify-icon icon="material-symbols:delete"></iconify-icon>
              </button>
            </div>
          </div>

          <div class="location-details">
            <div class="detail-item">
              <span class="detail-label">Files:</span>
              <span class="detail-value">{{ location.fileCount || 0 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Type:</span>
              <span class="detail-value">{{ location.type || 'directory' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Last Scanned:</span>
              <span class="detail-value">{{ location.lastScanned || 'Never' }}</span>
            </div>
          </div>

          <!-- Progress bar for scanning -->
          <div v-if="scanningLocations.has(location.path)" class="scan-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: location.scanProgress + '%' }"></div>
            </div>
            <span class="progress-text">Scanning... {{ location.scanProgress }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Location Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add Custom Storage Location</h3>
          <button class="btn-close" @click="showAddModal = false">
            <iconify-icon icon="material-symbols:close"></iconify-icon>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="locationName">Location Name</label>
            <input type="text" id="locationName" v-model="newLocation.name" 
                   placeholder="e.g., My Projects Folder">
          </div>
          <div class="form-group">
            <label for="locationPath">Folder Path</label>
            <div class="path-input-group">
              <input type="text" id="locationPath" v-model="newLocation.path" 
                     placeholder="C:\Users\YourName\Projects">
              <button class="btn btn-outline" @click="browseFolder">
                <iconify-icon icon="material-symbols:folder-open"></iconify-icon>
                Browse
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddModal = false">Cancel</button>
          <button class="btn btn-primary" @click="addCustomLocation" 
                  :disabled="!newLocation.name || !newLocation.path">
            Add Location
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Storage',
  data() {
    return {
      // Real data - matches your app.js structure
      realStats: [
        { id: 1, label: 'Total Locations', value: '0', icon: 'material-symbols:folder', class: 'stat-primary' },
        { id: 2, label: 'Total Size', value: '0 GB', icon: 'material-symbols:storage', class: 'stat-secondary' },
        { id: 3, label: 'Total Files', value: '0', icon: 'material-symbols:description', class: 'stat-success' },
        { id: 4, label: 'Scanned Files', value: '0', icon: 'material-symbols:search', class: 'stat-warning' }
      ],
      combinedLocations: [],
      showAddModal: false,
      newLocation: {
        name: '',
        path: ''
      },
      scanningLocations: new Set(),
      updateInterval: null
    }
  },
  async mounted() {
    await this.updateRealStorageStats()
    // Auto-refresh every 30 seconds like your original app
    this.updateInterval = setInterval(this.updateRealStorageStats, 30000)
  },
  beforeUnmount() {
    if (this.updateInterval) clearInterval(this.updateInterval)
  },
  methods: {
    // EXACT replica of your updateRealStorageStats from app.js but in Vue
    async updateRealStorageStats() {
      try {
        console.log('🔄 Updating REAL storage stats...')
        
        let realStats = null
        let customLocations = []
        
        // Try both possible IPC handlers (from your app.js logic)
        if (window.electronAPI) {
          if (window.electronAPI.getStorageLocations) {
            console.log('🔍 Trying getStorageLocations...')
            realStats = await window.electronAPI.getStorageLocations()
          } else if (window.electronAPI.getRealStorageInfo) {
            console.log('🔍 Trying getRealStorageInfo...')
            realStats = await window.electronAPI.getRealStorageInfo()
          }
        }
        
        // Load custom locations from localStorage (from your app.js)
        try {
          customLocations = JSON.parse(localStorage.getItem('customStorageLocations') || '[]')
        } catch (e) {
          customLocations = []
        }
        console.log('📁 Custom locations found:', customLocations.length)
        
        let allLocations = []
        
        if (realStats && realStats.success && realStats.locations && realStats.locations.length > 0) {
          console.log('✅ Got REAL storage data:', realStats.locations.length, 'locations')
          allLocations = [...realStats.locations, ...customLocations]
        } else if (customLocations.length > 0) {
          console.log('✅ Showing custom storage locations only')
          allLocations = customLocations
        } else {
          console.log('❌ No storage data available')
          this.showStorageErrorState()
          return
        }
        
        this.combinedLocations = allLocations
        this.updateStorageSummary(allLocations)
        
      } catch (error) {
        console.error('Storage update error:', error)
        this.showStorageErrorState()
      }
    },
    
    updateStorageSummary(locations) {
      const totalLocations = locations.length
      const totalSize = locations.reduce((sum, loc) => sum + (loc.size || 0), 0)
      const totalFiles = locations.reduce((sum, loc) => sum + (loc.fileCount || 0), 0)
      const scannedFiles = locations.reduce((sum, loc) => sum + (loc.scannedFiles || 0), 0)
      
      this.realStats = [
        { id: 1, label: 'Total Locations', value: totalLocations.toString(), icon: 'material-symbols:folder', class: 'stat-primary' },
        { id: 2, label: 'Total Size', value: this.formatSize(totalSize), icon: 'material-symbols:storage', class: 'stat-secondary' },
        { id: 3, label: 'Total Files', value: totalFiles.toString(), icon: 'material-symbols:description', class: 'stat-success' },
        { id: 4, label: 'Scanned Files', value: scannedFiles.toString(), icon: 'material-symbols:search', class: 'stat-warning' }
      ]
    },
    
    showStorageErrorState() {
      this.realStats = [
        { id: 1, label: 'Total Locations', value: '0', icon: 'material-symbols:folder', class: 'stat-primary' },
        { id: 2, label: 'Total Size', value: '0 GB', icon: 'material-symbols:storage', class: 'stat-secondary' },
        { id: 3, label: 'Total Files', value: '0', icon: 'material-symbols:description', class: 'stat-success' },
        { id: 4, label: 'Scanned Files', value: '0', icon: 'material-symbols:search', class: 'stat-warning' }
      ]
    },
    
    formatSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    
    getLocationIcon(location) {
      if (location.type === 'git') return 'mdi:git'
      if (location.type === 'project') return 'material-symbols:code'
      return 'material-symbols:folder'
    },
    
    getSizeClass(size) {
      if (size > 1024 * 1024 * 1024) return 'tag-large'
      if (size > 1024 * 1024 * 100) return 'tag-medium'
      return 'tag-small'
    },
    
    openAddLocationModal() {
      this.newLocation = { name: '', path: '' }
      this.showAddModal = true
    },
    
    async browseFolder() {
      if (window.electronAPI && window.electronAPI.showItemInFolder) {
        // This would open a folder dialog in Electron
        console.log('Browse folder functionality - would open Electron dialog')
        // In Electron, you'd use dialog.showOpenDialog
        this.newLocation.path = '/selected/folder/path'
      } else {
        // Fallback for browser
        this.newLocation.path = '/home/user/example/path'
      }
    },
    
    async addCustomLocation() {
      if (!this.newLocation.name || !this.newLocation.path) return
      
      try {
        if (window.electronAPI && window.electronAPI.addStorageLocation) {
          await window.electronAPI.addStorageLocation(this.newLocation)
        } else {
          // Fallback: save to localStorage (from your app.js logic)
          const customLocations = JSON.parse(localStorage.getItem('customStorageLocations') || '[]')
          customLocations.push({
            ...this.newLocation,
            custom: true,
            size: 0,
            fileCount: 0,
            type: 'directory'
          })
          localStorage.setItem('customStorageLocations', JSON.stringify(customLocations))
        }
        
        this.showAddModal = false
        await this.updateRealStorageStats()
        
      } catch (error) {
        console.error('Error adding location:', error)
      }
    },
    
    async removeCustomLocation(location) {
      if (!location.custom) return
      
      try {
        if (window.electronAPI && window.electronAPI.removeStorageLocation) {
          await window.electronAPI.removeStorageLocation(location.path)
        } else {
          // Fallback: remove from localStorage (from your app.js)
          const customLocations = JSON.parse(localStorage.getItem('customStorageLocations') || '[]')
          const updatedLocations = customLocations.filter(loc => loc.path !== location.path)
          localStorage.setItem('customStorageLocations', JSON.stringify(updatedLocations))
        }
        
        await this.updateRealStorageStats()
        
      } catch (error) {
        console.error('Error removing location:', error)
      }
    },
    
    async scanLocation(location) {
      this.scanningLocations.add(location.path)
      
      try {
        // Simulate scanning progress (like your original app)
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200))
          // Update progress in the location
          const updatedLocation = {
            ...location,
            scanProgress: progress
          }
          const index = this.combinedLocations.findIndex(loc => loc.path === location.path)
          if (index !== -1) {
            this.combinedLocations.splice(index, 1, updatedLocation)
          }
        }
        
        // Final update after scan complete
        const finalLocation = {
          ...location,
          lastScanned: new Date().toLocaleString(),
          scannedFiles: Math.floor(Math.random() * 1000),
          scanProgress: 100
        }
        
        const index = this.combinedLocations.findIndex(loc => loc.path === location.path)
        if (index !== -1) {
          this.combinedLocations.splice(index, 1, finalLocation)
        }
        
        // Update summary stats
        this.updateStorageSummary(this.combinedLocations)
        
      } finally {
        this.scanningLocations.delete(location.path)
      }
    },
    
    async rescanAllLocations() {
      for (const location of this.combinedLocations) {
        await this.scanLocation(location)
      }
    },
    
    async openInExplorer(path) {
      if (window.electronAPI && window.electronAPI.showItemInFolder) {
        await window.electronAPI.showItemInFolder(path)
      }
    }
  }
}
</script>

<style scoped>
/* Your exact CSS from main.css converted for Vue components */
.storage-tab {
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

.storage-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
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
.stat-secondary .stat-icon { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.stat-success .stat-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.stat-warning .stat-icon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

.stat-content h3 {
  font-size: 1.8rem;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.stat-content p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.storage-section {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid var(--border-color);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
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
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-secondary);
}

.btn-outline {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-outline:hover {
  background: var(--bg-tertiary);
}

.locations-container {
  display: grid;
  gap: 1.5rem;
}

.location-card {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.location-card:hover {
  border-color: var(--primary-color);
}

.location-card.scanning {
  border-color: var(--warning-color);
}

.location-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.location-icon {
  font-size: 2rem;
  color: var(--primary-color);
}

.location-info {
  flex: 1;
}

.location-info h4 {
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.location-path {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-family: monospace;
  margin-bottom: 0.5rem;
}

.location-tags {
  display: flex;
  gap: 0.5rem;
}

.tag {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag-default { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
.tag-custom { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.tag-large { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.tag-medium { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.tag-small { background: rgba(100, 116, 139, 0.1); color: #64748b; }

.location-actions {
  display: flex;
  gap: 0.5rem;
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

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger:hover {
  background: var(--error-color);
  color: white;
  border-color: var(--error-color);
}

.location-details {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  gap: 0.5rem;
}

.detail-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.detail-value {
  color: var(--text-primary);
  font-weight: 600;
}

.scan-progress {
  margin-top: 1rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
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
}

.modal-content {
  background: var(--card-bg);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
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
}

.btn-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.path-input-group {
  display: flex;
  gap: 0.5rem;
}

.path-input-group input {
  flex: 1;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
/* Enhanced storage cards */
.storage-item.optimized {
  border-left: 4px solid var(--success-color);
}

.storage-item.warning {
  border-left: 4px solid var(--warning-color);
}

.storage-item.error {
  border-left: 4px solid var(--error-color);
}

/* Enhanced progress indicators */
.storage-progress {
  margin-top: 1rem;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

/* Enhanced action buttons */
.storage-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.action-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--primary-color);
}

.action-btn.primary {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.action-btn.primary:hover {
  background: var(--primary-dark);
}

/* Enhanced scan animation */
.scanning-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--warning-light);
  border-radius: var(--radius);
  color: var(--warning-color);
  font-size: 0.875rem;
}

.scanning-indicator::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--warning-color);
  animation: pulse 1.5s infinite;
}
</style>