<template>
  <div class="storage-tab">
    <!-- Storage Overview -->
    <div class="storage-overview">
      <div class="overview-header">
        <h1><LocalIcon icon="material-symbols:storage"></LocalIcon> Storage Management</h1>
        <p>Storage detection across Windows, macOS, and Linux</p>
      </div>
      
      <!-- Real-time Storage Stats -->
      <div class="real-stats-grid">
        <div class="stat-card" v-for="stat in realStats" :key="stat.id" :class="stat.class">
          <div class="stat-icon">
            <LocalIcon :icon="stat.icon"></LocalIcon>
          </div>
          <div class="stat-content">
            <h3>{{ stat.value }}</h3>
            <p>{{ stat.label }}</p>
            <small v-if="stat.subtext">{{ stat.subtext }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Storage Locations Management -->
    <div class="storage-management">
      <div class="management-header">
        <h2><LocalIcon icon="mdi:folder-multiple"></LocalIcon> Storage Locations</h2>
        <div class="header-actions">
          <button class="btn btn-secondary" @click="refreshStorage">
            <LocalIcon icon="material-symbols:refresh"></LocalIcon>
            Refresh Detection
          </button>
          <button class="btn btn-primary" @click="openAddLocationModal">
            <LocalIcon icon="material-symbols:add"></LocalIcon>
            Add Custom Location
          </button>
          <button class="btn btn-success" @click="openCloudSyncModal">
            <LocalIcon icon="material-symbols:cloud-sync"></LocalIcon>
            Cloud Sync
          </button>
        </div>
      </div>

      <!-- Storage Filters -->
      <div class="storage-filters">
        <div class="filter-group">
          <label>Filter by:</label>
          <select v-model="filterType" class="filter-select">
            <option value="all">All Locations</option>
            <option value="local">Local Storage</option>
            <option value="cloud">Cloud Storage</option>
            <option value="removable">Removable Drives</option>
            <option value="custom">Custom Locations</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Sort by:</label>
          <select v-model="sortBy" class="filter-select">
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="free">Free Space</option>
            <option value="type">Type</option>
          </select>
        </div>
        <div class="filter-group">
          <label>
            <input type="checkbox" v-model="showOnlyAccessible" />
            Show only accessible
          </label>
        </div>
      </div>

      <!-- Storage Locations Grid -->
      <div class="locations-grid">
        <div v-for="location in filteredLocations" :key="location.path" 
             class="location-card" :class="getLocationCardClass(location)">
          
          <!-- Location Header -->
          <div class="location-header">
            <div class="location-icon" :class="getLocationIconClass(location)">
              <LocalIcon icon="getLocationIcon(location)"></LocalIcon>
            </div>
            <div class="location-info">
              <div class="location-title">
                <h4>{{ location.name }}</h4>
                <span class="location-badge" :class="getLocationBadgeClass(location)">
                  {{ getLocationType(location) }}
                </span>
                <span v-if="location.default" class="location-badge badge-default">
                  Default
                </span>
                <span v-if="location.filesystem && location.filesystem !== 'unknown'" 
                      class="filesystem-badge" :class="getFilesystemClass(location.filesystem)">
                  {{ location.filesystem.toUpperCase() }}
                </span>
              </div>
              <p class="location-path">
                <LocalIcon icon="mdi:folder"></LocalIcon>
                {{ location.path }}
              </p>
            </div>
            <div class="location-status">
              <div v-if="location.accessible !== false" class="status-indicator status-active">
                <LocalIcon icon="mdi:check-circle"></LocalIcon>
                Accessible
              </div>
              <div v-else class="status-indicator status-error">
                <LocalIcon icon="mdi:alert-circle"></LocalIcon>
                Inaccessible
              </div>
            </div>
          </div>

          <!-- Storage Stats -->
          <div class="storage-stats">
            <div class="stat-row">
              <div class="stat-item">
                <span class="stat-label">Total Size:</span>
                <span class="stat-value">{{ formatSize(location.size || 0) }}</span>
              </div>
              <div class="stat-item" v-if="location.free !== undefined">
                <span class="stat-label">Free Space:</span>
                <span class="stat-value">{{ formatSize(location.free) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Files:</span>
                <span class="stat-value">{{ location.fileCount || 0 }}</span>
              </div>
            </div>
            
            <!-- Storage Usage Bar -->
            <div v-if="location.size > 0 && location.free !== undefined" class="storage-usage">
              <div class="usage-bar">
                <div class="usage-fill" :style="{ width: getUsagePercentage(location) + '%' }"></div>
              </div>
              <div class="usage-label">
                {{ getUsagePercentage(location) }}% used
              </div>
            </div>
          </div>

          <!-- Location Actions -->
          <div class="location-actions">
            <button class="btn-action" @click="scanLocation(location)" 
                    :disabled="scanningLocations.has(location.path)" 
                    title="Scan Location">
              <LocalIcon icon="material-symbols:search"></LocalIcon>
              Scan
            </button>
            <button class="btn-action" @click="openInExplorer(location.path)" 
                    :disabled="location.accessible === false"
                    title="Open in File Explorer">
              <LocalIcon icon="material-symbols:folder-open"></LocalIcon>
              Open
            </button>
            <button v-if="location.custom" class="btn-action btn-danger" 
                    @click="removeLocation(location)" title="Remove Location">
              <LocalIcon icon="material-symbols:delete"></LocalIcon>
              Remove
            </button>
            <button v-if="location.cloudProvider" class="btn-action btn-cloud" 
                    @click="configureCloudSync(location)" title="Configure Cloud Sync">
              <LocalIcon icon="material-symbols:cloud"></LocalIcon>
              Sync
            </button>
          </div>

          <!-- Scanning Progress -->
          <div v-if="scanningLocations.has(location.path)" class="scan-progress">
            <div class="progress-header">
              <LocalIcon icon="material-symbols:search"></LocalIcon>
              Scanning...
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (location.scanProgress || 0) + '%' }"></div>
            </div>
            <div class="progress-info">
              <span>{{ location.fileCount || 0 }} files found</span>
              <span>{{ location.scanProgress || 0 }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredLocations.length === 0" class="empty-state">
        <LocalIcon icon="mdi:folder-off" class="empty-icon"></LocalIcon>
        <h3>No storage locations found</h3>
        <p>Click "Add Custom Location" to add a storage directory</p>
        <button class="btn btn-primary" @click="refreshStorage">
          <LocalIcon icon="material-symbols:refresh"></LocalIcon>
          Try Detection Again
        </button>
      </div>
    </div>

    <!-- Add Location Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add Custom Storage Location</h3>
          <button class="btn-close" @click="closeAddModal">
            <LocalIcon icon="material-symbols:close"></LocalIcon>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="locationName">
              <LocalIcon icon="mdi:tag"></LocalIcon>
              Location Name
            </label>
            <input type="text" id="locationName" v-model="newLocation.name" 
                   placeholder="e.g., My Projects Folder" class="form-control">
          </div>
          <div class="form-group">
            <label for="locationPath">
              <LocalIcon icon="mdi:folder"></LocalIcon>
              Folder Path
            </label>
            <div class="path-input-group">
              <input type="text" id="locationPath" v-model="newLocation.path" 
                     :placeholder="getPathPlaceholder()" class="form-control">
              <button class="btn btn-outline" @click="browseFolder">
                <LocalIcon icon="material-symbols:folder-open"></LocalIcon>
                Browse
              </button>
            </div>
          </div>
          <div class="form-group">
            <label for="storageLimit">
              <LocalIcon icon="mdi:harddisk"></LocalIcon>
              Storage Limit (Optional)
            </label>
            <div class="limit-input-group">
              <input type="range" id="storageLimit" v-model="newLocation.limitGB" 
                     min="1" max="1000" class="limit-slider">
              <div class="limit-display">
                <span v-if="newLocation.limitGB">{{ newLocation.limitGB }} GB limit</span>
                <span v-else>No limit</span>
                <button type="button" class="btn-link" @click="newLocation.limitGB = null">
                  Clear limit
                </button>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="newLocation.autoBackup">
              <LocalIcon icon="mdi:backup-restore"></LocalIcon>
              Enable automatic backups
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeAddModal">Cancel</button>
          <button class="btn btn-primary" @click="addCustomLocation" 
                  :disabled="!isValidLocation">
            <LocalIcon icon="material-symbols:add"></LocalIcon>
            Add Location
          </button>
        </div>
      </div>
    </div>

    <!-- Cloud Sync Modal -->
    <div v-if="showCloudModal" class="modal-overlay" @click.self="showCloudModal = false">
      <div class="modal-content modal-lg">
        <div class="modal-header">
          <h3><LocalIcon icon="material-symbols:cloud-sync"></LocalIcon> Cloud Sync Configuration</h3>
          <button class="btn-close" @click="showCloudModal = false">
            <LocalIcon icon="material-symbols:close"></LocalIcon>
          </button>
        </div>
        <div class="modal-body">
          <div class="cloud-providers">
            <div class="provider-card" @click="configureOneDrive">
              <div class="provider-icon">
                <LocalIcon icon="simple-icons:microsoftonedrive" style="color: #0078d4;"></LocalIcon>
              </div>
              <h4>OneDrive</h4>
              <p>Sync with Microsoft OneDrive</p>
              <div class="provider-status" v-if="oneDriveStatus">
                <span class="status-badge" :class="oneDriveStatus.connected ? 'connected' : 'disconnected'">
                  {{ oneDriveStatus.connected ? 'Connected' : 'Disconnected' }}
                </span>
              </div>
            </div>
            <div class="provider-card" @click="configureGoogleDrive">
              <div class="provider-icon">
                <LocalIcon icon="logos:google-drive" style="color: #34a853;"></LocalIcon>
              </div>
              <h4>Google Drive</h4>
              <p>Sync with Google Drive</p>
              <div class="provider-status" v-if="googleDriveStatus">
                <span class="status-badge" :class="googleDriveStatus.connected ? 'connected' : 'disconnected'">
                  {{ googleDriveStatus.connected ? 'Connected' : 'Disconnected' }}
                </span>
              </div>
            </div>
          </div>
          
          <div v-if="activeCloudConfig" class="cloud-config">
            <h4>Sync Configuration</h4>
            <div class="form-group">
              <label>Sync Frequency</label>
              <select v-model="syncConfig.frequency" class="form-control">
                <option value="realtime">Real-time</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="manual">Manual Only</option>
              </select>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="syncConfig.syncScrapedData">
                Sync scraped data
              </label>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="syncConfig.syncConfig">
                Sync app configuration
              </label>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="syncConfig.encryptData">
                Encrypt data before sync
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCloudModal = false">Cancel</button>
          <button v-if="activeCloudConfig" class="btn btn-primary" @click="saveCloudConfig">
            Save Configuration
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
      // Real storage data
      storageLocations: [],
      scanningLocations: new Set(),
      realStats: [
        { id: 1, label: 'Total Locations', value: '0', icon: 'mdi:folder-multiple', class: 'stat-primary' },
        { id: 2, label: 'Total Storage', value: '0 GB', icon: 'mdi:harddisk', class: 'stat-secondary' },
        { id: 3, label: 'Free Space', value: '0 GB', icon: 'mdi:harddisk-plus', class: 'stat-success' },
        { id: 4, label: 'Files Count', value: '0', icon: 'mdi:file-multiple', class: 'stat-warning' }
      ],
      
      // UI state
      showAddModal: false,
      showCloudModal: false,
      filterType: 'all',
      sortBy: 'name',
      showOnlyAccessible: true,
      
      // New location form
      newLocation: {
        name: '',
        path: '',
        limitGB: null,
        autoBackup: true
      },
      
      // Cloud sync
      activeCloudConfig: null,
      syncConfig: {
        frequency: 'daily',
        syncScrapedData: true,
        syncConfig: true,
        encryptData: false
      },
      oneDriveStatus: null,
      googleDriveStatus: null,
      
      // Refresh interval
      refreshInterval: null
    };
  },
  
  computed: {
    filteredLocations() {
      let locations = [...this.storageLocations];
      
      // Filter by type
      if (this.filterType !== 'all') {
        locations = locations.filter(loc => {
          if (this.filterType === 'local') return !loc.cloudProvider;
          if (this.filterType === 'cloud') return loc.cloudProvider;
          if (this.filterType === 'removable') return loc.type === 'removable';
          if (this.filterType === 'custom') return loc.custom === true;
          return true;
        });
      }
      
      // Filter by accessibility
      if (this.showOnlyAccessible) {
        locations = locations.filter(loc => loc.accessible !== false);
      }
      
      // Sort
      locations.sort((a, b) => {
        switch (this.sortBy) {
          case 'size':
            return (b.size || 0) - (a.size || 0);
          case 'free':
            return (b.free || 0) - (a.free || 0);
          case 'type':
            return (a.type || '').localeCompare(b.type || '');
          case 'name':
          default:
            return (a.name || '').localeCompare(b.name || '');
        }
      });
      
      return locations;
    },
    
    isValidLocation() {
      return this.newLocation.name.trim() !== '' && 
             this.newLocation.path.trim() !== '';
    },
    
    totalStorage() {
      return this.storageLocations.reduce((total, loc) => total + (loc.size || 0), 0);
    },
    
    totalFreeSpace() {
      return this.storageLocations.reduce((total, loc) => total + (loc.free || 0), 0);
    },
    
    totalFiles() {
      return this.storageLocations.reduce((total, loc) => total + (loc.fileCount || 0), 0);
    }
  },
  
  async mounted() {
    await this.loadStorageLocations();
    
    // Auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadStorageLocations();
    }, 30000);
  },
  
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  
  methods: {
      async loadCloudStatus() {
    try {
      if (window.electronAPI && window.electronAPI.getCloudStatus) {
        const result = await window.electronAPI.getCloudStatus();
        if (result.success) {
          this.oneDriveStatus = result.clouds.onedrive;
          this.googleDriveStatus = result.clouds.googleDrive;
          
          // Save to localStorage for quick access
          localStorage.setItem('onedrive-status', JSON.stringify(this.oneDriveStatus));
          localStorage.setItem('googledrive-status', JSON.stringify(this.googleDriveStatus));
        }
      }
    } catch (error) {
      console.error('Error loading cloud status:', error);
      // Fallback to localStorage
      try {
        this.oneDriveStatus = JSON.parse(localStorage.getItem('onedrive-status')) || { connected: false };
        this.googleDriveStatus = JSON.parse(localStorage.getItem('googledrive-status')) || { connected: false };
      } catch (e) {
        this.oneDriveStatus = { connected: false };
        this.googleDriveStatus = { connected: false };
      }
    }
  },
  
  async saveCloudConfig() {
    try {
      if (!window.electronAPI || !window.electronAPI.saveCloudConfig) {
        // Fallback to localStorage
        const config = {
          provider: this.activeCloudConfig,
          ...this.syncConfig,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(`${this.activeCloudConfig}-config`, JSON.stringify(config));
        
        // Update status
        if (this.activeCloudConfig === 'onedrive') {
          this.oneDriveStatus = { connected: true };
          localStorage.setItem('onedrive-status', JSON.stringify(this.oneDriveStatus));
        } else if (this.activeCloudConfig === 'google-drive') {
          this.googleDriveStatus = { connected: true };
          localStorage.setItem('googledrive-status', JSON.stringify(this.googleDriveStatus));
        }
        
        this.showCloudModal = false;
        return;
      }
      
      const config = {
        provider: this.activeCloudConfig,
        ...this.syncConfig,
        lastUpdated: new Date().toISOString()
      };
      
      const result = await window.electronAPI.saveCloudConfig(config);
      if (result.success) {
        // Update status
        await this.loadCloudStatus();
        this.showCloudModal = false;
      }
    } catch (error) {
      console.error('Error saving cloud config:', error);
    }
  },
  
  async openCloudSyncModal() {
    this.showCloudModal = true;
    await this.loadCloudStatus();
  },
  
  // loadStorageLocations method to include cloud detection
  async loadStorageLocations() {
    try {
      if (window.electronAPI) {
        // Load regular storage locations
        const result = await window.electronAPI.getStorageLocations();
        if (result.success) {
          this.storageLocations = result.locations || [];
          
          // Load cloud locations separately
          const cloudResult = await window.electronAPI.detectCloudStorage();
          if (cloudResult.success && cloudResult.cloudMounts) {
            // Add cloud locations to the list
            this.storageLocations.push(...cloudResult.cloudMounts);
          }
          
          this.updateStats();
        }
      }
    } catch (error) {
      console.error('Error loading storage locations:', error);
    }
  },
    
    async refreshStorage() {
      try {
        await this.loadStorageLocations();
      } catch (error) {
        console.error('Error refreshing storage:', error);
      }
    },
    
    updateStats() {
      this.realStats = [
        { 
          id: 1, 
          label: 'Total Locations', 
          value: this.storageLocations.length.toString(), 
          icon: 'mdi:folder-multiple', 
          class: 'stat-primary' 
        },
        { 
          id: 2, 
          label: 'Total Storage', 
          value: this.formatSize(this.totalStorage), 
          icon: 'mdi:harddisk', 
          class: 'stat-secondary' 
        },
        { 
          id: 3, 
          label: 'Free Space', 
          value: this.formatSize(this.totalFreeSpace), 
          icon: 'mdi:harddisk-plus', 
          class: 'stat-success',
          subtext: `${Math.round((this.totalFreeSpace / this.totalStorage) * 100) || 0}% available`
        },
        { 
          id: 4, 
          label: 'Files Count', 
          value: this.totalFiles.toString(), 
          icon: 'mdi:file-multiple', 
          class: 'stat-warning' 
        }
      ];
    },
    
    formatSize(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    getLocationIcon(location) {
      if (location.cloudProvider) {
        if (location.cloudProvider === 'onedrive') return 'simple-icons:microsoftonedrive';
        if (location.cloudProvider === 'google-drive') return 'logos:google-drive';
        return 'material-symbols:cloud';
      }
      
      // Platform-specific icons
      if (location.type === 'removable') return 'mdi:usb';
      if (location.type === 'home') return 'mdi:home';
      if (location.type === 'system') return 'mdi:server';
      if (location.filesystem) {
        if (location.filesystem.includes('ext') || location.filesystem.includes('linux')) return 'mdi:linux';
        if (location.filesystem.includes('ntfs') || location.filesystem.includes('fat')) return 'mdi:microsoft-windows';
      }
      
      return 'mdi:harddisk';
    },
    
    getLocationIconClass(location) {
      if (location.accessible === false) return 'icon-inaccessible';
      if (location.cloudProvider) return 'icon-cloud';
      if (location.type === 'removable') return 'icon-removable';
      if (location.type === 'system') return 'icon-system';
      return 'icon-default';
    },
    
    getLocationType(location) {
      if (location.cloudProvider) {
        return location.cloudProvider.replace('-', ' ');
      }
      
      if (location.type) {
        const typeMap = {
          'removable': 'Removable Drive',
          'fixed': 'Local Drive',
          'home': 'Home Directory',
          'system': 'System Drive',
          'directory': 'Directory'
        };
        return typeMap[location.type] || location.type;
      }
      
      return 'Storage';
    },
    
    getLocationBadgeClass(location) {
      if (location.cloudProvider) return 'badge-cloud';
      if (location.type === 'removable') return 'badge-removable';
      if (location.type === 'system') return 'badge-system';
      if (location.type === 'home') return 'badge-home';
      return 'badge-default';
    },
    
    getFilesystemClass(filesystem) {
      const fs = filesystem.toLowerCase();
      if (fs.includes('ext')) return 'ext4-badge';
      if (fs.includes('ntfs')) return 'ntfs-badge';
      if (fs.includes('fat32')) return 'fat32-badge';
      if (fs.includes('exfat')) return 'exfat-badge';
      if (fs.includes('btrfs')) return 'btrfs-badge';
      if (fs.includes('xfs')) return 'xfs-badge';
      return 'filesystem-default';
    },
    
    getLocationCardClass(location) {
      const classes = [];
      if (location.accessible === false) classes.push('location-inaccessible');
      if (location.cloudProvider) classes.push('location-cloud');
      if (location.type === 'removable') classes.push('location-removable');
      if (location.type === 'system') classes.push('location-system');
      return classes.join(' ');
    },
    
    getUsagePercentage(location) {
      if (!location.size || !location.free) return 0;
      const used = location.size - location.free;
      return Math.round((used / location.size) * 100);
    },
    
    openAddLocationModal() {
      this.newLocation = { name: '', path: '', limitGB: null, autoBackup: true };
      this.showAddModal = true;
    },
    
    closeAddModal() {
      this.showAddModal = false;
    },
    
    getPathPlaceholder() {
      if (window.electronAPI && window.electronAPI.getPlatform) {
      try {
        const platform = window.electronAPI.getPlatform();
        if (platform === 'win32') return 'C:\\Users\\YourName\\Projects';
        if (platform === 'darwin') return '/Users/YourName/Projects';
        return '/home/yourname/projects';
      } catch (error) {
        console.warn('Failed to get platform from electronAPI:', error);
      }
    }
    
    // Fallback using user agent detection
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) return 'C:\\Users\\YourName\\Projects';
    if (userAgent.includes('mac')) return '/Users/YourName/Projects';
    if (userAgent.includes('linux')) return '/home/yourname/projects';
    
    // Default fallback
    return '/home/yourname/projects';
  },

    async browseFolder() {
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Select Storage Directory'
          });
          
          if (!result.canceled && result.filePaths.length > 0) {
            this.newLocation.path = result.filePaths[0];
          }
        }
      } catch (error) {
        console.error('Error browsing folder:', error);
      }
    },
    
    async addCustomLocation() {
  if (!this.isValidLocation) {
    alert('Please provide a name and path');
    return;
  }
  
  try {
    if (window.electronAPI) {
      console.log('Attempting to add location:', this.newLocation);
      
      // Create a simple, clean object
      const locationData = {
        path: this.newLocation.path.trim(),
        name: this.newLocation.name.trim() || 'Custom Location',
        autoBackup: this.newLocation.autoBackup || false,
        limitGB: this.newLocation.limitGB || null
      };
      
      const result = await window.electronAPI.addStorageLocation(locationData);
      console.log('Add location result:', result);
      
      if (result.success) {
        this.closeAddModal();
        await this.loadStorageLocations();
        alert('Location added successfully!');
      } else {
        alert('Failed to add location: ' + (result.error || 'Unknown error'));
      }
    }
  } catch (error) {
    console.error('Error adding location:', error);
    alert('Error: ' + error.message);
  }
},
    
    async removeLocation(location) {
      if (!location.custom) return;
      
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.removeStorageLocation(location.path);
          if (result.success) {
            await this.loadStorageLocations();
          }
        }
      } catch (error) {
        console.error('Error removing location:', error);
      }
    },
    
    async scanLocation(location) {
      this.scanningLocations.add(location.path);
      
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.scanStorageLocation(location.path);
          if (result.success) {
            // Update the location with new stats
            const index = this.storageLocations.findIndex(l => l.path === location.path);
            if (index !== -1) {
              this.storageLocations[index] = {
                ...this.storageLocations[index],
                ...result.stats
              };
              this.updateStats();
            }
          }
        }
      } catch (error) {
        console.error('Error scanning location:', error);
      } finally {
        this.scanningLocations.delete(location.path);
      }
    },
    
    async openInExplorer(path) {
      try {
        if (window.electronAPI) {
          await window.electronAPI.showItemInFolder(path);
        }
      } catch (error) {
        console.error('Error opening in explorer:', error);
      }
    },
    
    openCloudSyncModal() {
      this.showCloudModal = true;
      this.loadCloudStatus();
    },
    
    async loadCloudStatus() {
      // Load cloud sync status from localStorage or backend
      try {
        this.oneDriveStatus = JSON.parse(localStorage.getItem('onedrive-status')) || { connected: false };
        this.googleDriveStatus = JSON.parse(localStorage.getItem('googledrive-status')) || { connected: false };
      } catch (error) {
        this.oneDriveStatus = { connected: false };
        this.googleDriveStatus = { connected: false };
      }
    },
    
    configureOneDrive() {
      this.activeCloudConfig = 'onedrive';
    },
    
    configureGoogleDrive() {
      this.activeCloudConfig = 'google-drive';
    },
    
    async saveCloudConfig() {
      // Save cloud configuration
      try {
        const config = {
          provider: this.activeCloudConfig,
          ...this.syncConfig,
          lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem(`${this.activeCloudConfig}-config`, JSON.stringify(config));
        
        // Update status
        if (this.activeCloudConfig === 'onedrive') {
          this.oneDriveStatus = { connected: true };
          localStorage.setItem('onedrive-status', JSON.stringify(this.oneDriveStatus));
        } else if (this.activeCloudConfig === 'google-drive') {
          this.googleDriveStatus = { connected: true };
          localStorage.setItem('googledrive-status', JSON.stringify(this.googleDriveStatus));
        }
        
        this.showCloudModal = false;
      } catch (error) {
        console.error('Error saving cloud config:', error);
      }
    }
  }
};
</script>

<style scoped>
/* Add your scoped styles here */
.storage-tab {
  padding: 1.5rem;
}

.storage-overview {
  margin-bottom: 2rem;
}

.overview-header {
  margin-bottom: 1.5rem;
}

.overview-header h1 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.overview-header p {
  color: var(--text-secondary);
}

.real-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-primary .stat-icon { background: rgba(37, 99, 235, 0.1); color: var(--primary); }
.stat-secondary .stat-icon { background: rgba(14, 165, 233, 0.1); color: var(--secondary); }
.stat-success .stat-icon { background: rgba(16, 185, 129, 0.1); color: var(--success); }
.stat-warning .stat-icon { background: rgba(245, 158, 11, 0.1); color: var(--warning); }

.stat-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.stat-content p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.stat-content small {
  color: var(--text-secondary);
  opacity: 0.7;
  font-size: 0.8rem;
}

.storage-management {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.management-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.storage-filters {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.filter-select {
  padding: 0.5rem;
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.filter-group input[type="checkbox"] {
  margin-right: 0.25rem;
}

.locations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.location-card {
  background: var(--bg-primary);
  border-radius: var(--radius);
  padding: 1.25rem;
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.location-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow);
}

.location-card.location-inaccessible {
  opacity: 0.7;
  border-style: dashed;
}

.location-card.location-inaccessible:hover {
  border-color: var(--error);
}

.location-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.location-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.icon-default { background: rgba(37, 99, 235, 0.1); color: var(--primary); }
.icon-cloud { background: rgba(14, 165, 233, 0.1); color: var(--secondary); }
.icon-removable { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
.icon-system { background: rgba(119, 33, 111, 0.1); color: #77216F; }
.icon-inaccessible { background: rgba(239, 68, 68, 0.1); color: var(--error); }

.location-info {
  flex: 1;
  min-width: 0;
}

.location-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.location-title h4 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.location-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-default { background: rgba(100, 116, 139, 0.1); color: #64748b; }
.badge-cloud { background: rgba(14, 165, 233, 0.1); color: var(--secondary); }
.badge-removable { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
.badge-system { background: rgba(119, 33, 111, 0.1); color: #77216F; }
.badge-home { background: rgba(16, 185, 129, 0.1); color: var(--success); }
.badge-default { background: rgba(37, 99, 235, 0.1); color: var(--primary); }

.filesystem-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-family: monospace;
  font-weight: 600;
}

.ext4-badge { background: #E95420; color: white; }
.ntfs-badge { background: #0078d4; color: white; }
.fat32-badge { background: #107c10; color: white; }
.exfat-badge { background: #ff8c00; color: white; }
.btrfs-badge { background: #5e2750; color: white; }
.xfs-badge { background: #00bcf2; color: white; }
.filesystem-default { background: var(--bg-tertiary); color: var(--text-secondary); }

.location-path {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  word-break: break-all;
}

.location-status {
  flex-shrink: 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

.status-active { background: rgba(16, 185, 129, 0.1); color: var(--success); }
.status-error { background: rgba(239, 68, 68, 0.1); color: var(--error); }

.storage-stats {
  margin-bottom: 1rem;
}

.stat-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 0.75rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.125rem;
}

.stat-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.storage-usage {
  margin-top: 0.5rem;
}

.usage-bar {
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.usage-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.usage-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-align: right;
}

.location-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action:hover {
  background: var(--bg-secondary);
  border-color: var(--primary);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-action.btn-danger {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
  border-color: rgba(239, 68, 68, 0.3);
}

.btn-action.btn-danger:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: var(--error);
}

.btn-action.btn-cloud {
  background: rgba(14, 165, 233, 0.1);
  color: var(--secondary);
  border-color: rgba(14, 165, 233, 0.3);
}

.btn-action.btn-cloud:hover {
  background: rgba(14, 165, 233, 0.2);
  border-color: var(--secondary);
}

.scan-progress {
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: var(--radius);
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.progress-bar {
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius);
  margin-top: 2rem;
}

.empty-icon {
  font-size: 3rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
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
  border-radius: var(--radius);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
}

.modal-content.modal-lg {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius);
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

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.95rem;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.path-input-group {
  display: flex;
  gap: 0.5rem;
}

.path-input-group .form-control {
  flex: 1;
}

.limit-input-group {
  margin-top: 0.5rem;
}

.limit-slider {
  width: 100%;
  margin-bottom: 0.5rem;
}

.limit-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  text-decoration: underline;
}

.btn-link:hover {
  color: var(--primary-dark);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.95rem;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.cloud-providers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.provider-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.provider-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.provider-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.provider-card h4 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.provider-card p {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.provider-status {
  margin-top: 1rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.connected {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.status-badge.disconnected {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

.cloud-config {
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  margin-top: 1.5rem;
}

.cloud-config h4 {
  margin-bottom: 1rem;
  color: var(--text-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .storage-tab {
    padding: 1rem;
  }
  
  .locations-grid {
    grid-template-columns: 1fr;
  }
  
  .storage-filters {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .management-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .stat-row {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>