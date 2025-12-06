<template>
  <div class="job-manager-modal-wrapper" :class="{ 'floating': isFloating }" :style="wrapperStyle">
    <!-- Drag Handle -->
    <div class="drag-handle" @mousedown="startDrag" @dblclick="toggleFloating">
      <iconify-icon icon="material-symbols:work-history"></iconify-icon>
      <span>Job Manager 🇹🇩</span>
      <div class="job-summary">
        <span class="summary-item active">{{ stats.activeJobs }} active</span>
        <span class="summary-item queued">{{ stats.queuedJobs }} queued</span>
        <span class="summary-item completed">{{ stats.completedJobs }} completed</span>
      </div>
      <div class="drag-controls">
        <button class="btn-icon btn-sm" @click="toggleAutoRefresh" :title="autoRefresh ? 'Pause Auto-refresh' : 'Resume Auto-refresh'">
          <iconify-icon :icon="autoRefresh ? 'material-symbols:pause' : 'material-symbols:play-arrow'"></iconify-icon>
        </button>
        <button class="btn-icon btn-sm" @click="toggleFloating" :title="isFloating ? 'Dock' : 'Float'">
          <iconify-icon :icon="isFloating ? 'material-symbols:vertical-align-bottom' : 'material-symbols:open-in-new'"></iconify-icon>
        </button>
        <button class="btn-icon btn-sm" @click="closeModal" title="Close">
          <iconify-icon icon="material-symbols:close"></iconify-icon>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="job-manager-content" ref="modalContent">
      <!-- Tabs -->
      <div class="job-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-button"
          :class="{ 'active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <iconify-icon :icon="tab.icon"></iconify-icon>
          {{ tab.label }}
          <span class="tab-badge" :class="`tab-${tab.id}`">{{ tab.count }}</span>
        </button>
      </div>

      <!-- Active Jobs Tab -->
      <div v-if="activeTab === 'active'" class="tab-content active-tab">
        <div class="jobs-header">
          <h4>Active Scraping Jobs ({{ activeJobs.length }})</h4>
          <div class="header-actions">
            <button class="btn btn-sm btn-outline" @click="pauseAllJobs">
              <iconify-icon icon="material-symbols:pause"></iconify-icon>
              Pause All
            </button>
            <button class="btn btn-sm btn-outline btn-danger" @click="stopAllJobs" :disabled="activeJobs.length === 0">
              <iconify-icon icon="material-symbols:stop"></iconify-icon>
              Stop All
            </button>
          </div>
        </div>
        
        <div class="jobs-grid">
          <div 
            v-for="job in activeJobs" 
            :key="job.id"
            class="job-card active"
            @contextmenu.prevent="showJobContextMenu(job, $event)"
          >
            <div class="job-card-header">
              <div class="job-platform">
                <iconify-icon :icon="getPlatformIcon(job.platform)" class="platform-icon"></iconify-icon>
                <span class="platform-name">{{ formatPlatform(job.platform) }}</span>
                <span class="job-priority" :class="`priority-${job.priority}`">
                  P{{ job.priority }}
                </span>
              </div>
              <div class="job-actions">
                <button class="btn-icon btn-sm" @click="pauseJob(job.id)" title="Pause">
                  <iconify-icon icon="material-symbols:pause"></iconify-icon>
                </button>
                <button class="btn-icon btn-sm btn-danger" @click="stopJob(job.id)" title="Stop">
                  <iconify-icon icon="material-symbols:stop"></iconify-icon>
                </button>
              </div>
            </div>
            
            <div class="job-card-body">
              <div class="job-query" :title="job.query">
                {{ truncateText(job.query, 40) }}
              </div>
              
              <div class="job-progress-section">
                <div class="progress-info">
                  <span>{{ job.progress }}%</span>
                  <span>{{ job.itemsProcessed }}/{{ job.totalItems }}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: `${job.progress}%` }"></div>
                </div>
              </div>
              
              <div class="job-stats">
                <div class="stat-item">
                  <iconify-icon icon="material-symbols:speed"></iconify-icon>
                  <span>{{ job.speed || 0 }}/min</span>
                </div>
                <div class="stat-item">
                  <iconify-icon icon="material-symbols:timer"></iconify-icon>
                  <span>{{ formatDuration(job.duration) }}</span>
                </div>
                <div class="stat-item">
                  <iconify-icon icon="material-symbols:check-circle"></iconify-icon>
                  <span>{{ job.successRate || 0 }}%</span>
                </div>
              </div>
            </div>
            
            <div class="job-card-footer">
              <div class="job-resources">
                <div class="resource-item">
                  <iconify-icon icon="material-symbols:cpu"></iconify-icon>
                  <span>{{ job.cpuUsage || 0 }}%</span>
                </div>
                <div class="resource-item">
                  <iconify-icon icon="material-symbols:memory"></iconify-icon>
                  <span>{{ formatBytes(job.memoryUsage || 0) }}</span>
                </div>
              </div>
              <div class="job-eta">
                ETA: {{ job.eta || 'Calculating...' }}
              </div>
            </div>
          </div>
          
          <div v-if="activeJobs.length === 0" class="no-jobs">
            <iconify-icon icon="material-symbols:work-outline" class="empty-icon"></iconify-icon>
            <h5>No active jobs</h5>
            <p>Start a scraping job to see it here</p>
          </div>
        </div>
      </div>

      <!-- Queued Jobs Tab -->
      <div v-if="activeTab === 'queued'" class="tab-content queued-tab">
        <div class="jobs-header">
          <h4>Queued Jobs ({{ queuedJobs.length }})</h4>
          <div class="header-actions">
            <button class="btn btn-sm btn-primary" @click="startAllQueued" :disabled="queuedJobs.length === 0">
              <iconify-icon icon="material-symbols:play-arrow"></iconify-icon>
              Start All
            </button>
            <button class="btn btn-sm btn-outline btn-danger" @click="clearQueue" :disabled="queuedJobs.length === 0">
              <iconify-icon icon="material-symbols:delete"></iconify-icon>
              Clear Queue
            </button>
          </div>
        </div>
        
        <div class="queue-container">
          <div class="queue-header">
            <span>Position</span>
            <span>Platform</span>
            <span>Query</span>
            <span>Priority</span>
            <span>Scheduled</span>
            <span>Actions</span>
          </div>
          
          <draggable 
            v-model="queuedJobs"
            item-key="id"
            handle=".drag-handle-item"
            @end="onQueueReorder"
            class="queue-list"
          >
            <template #item="{ element: job, index }">
              <div class="queue-item" :class="`priority-${job.priority}`">
                <div class="queue-position">
                  <iconify-icon icon="material-symbols:drag-handle" class="drag-handle-item"></iconify-icon>
                  <span>#{{ index + 1 }}</span>
                </div>
                <div class="queue-platform">
                  <iconify-icon :icon="getPlatformIcon(job.platform)"></iconify-icon>
                  {{ formatPlatform(job.platform) }}
                </div>
                <div class="queue-query" :title="job.query">
                  {{ truncateText(job.query, 30) }}
                </div>
                <div class="queue-priority">
                  <select v-model="job.priority" @change="updateJobPriority(job)" class="priority-select">
                    <option value="1">1 - Critical</option>
                    <option value="2">2 - High</option>
                    <option value="3">3 - Normal</option>
                    <option value="4">4 - Low</option>
                    <option value="5">5 - Background</option>
                  </select>
                </div>
                <div class="queue-schedule">
                  {{ job.scheduledTime || 'Immediate' }}
                </div>
                <div class="queue-actions">
                  <button class="btn-icon btn-sm" @click="startQueuedJob(job.id)" title="Start Now">
                    <iconify-icon icon="material-symbols:play-arrow"></iconify-icon>
                  </button>
                  <button class="btn-icon btn-sm" @click="moveUpQueue(job.id)" title="Move Up" :disabled="index === 0">
                    <iconify-icon icon="material-symbols:arrow-upward"></iconify-icon>
                  </button>
                  <button class="btn-icon btn-sm" @click="moveDownQueue(job.id)" title="Move Down" :disabled="index === queuedJobs.length - 1">
                    <iconify-icon icon="material-symbols:arrow-downward"></iconify-icon>
                  </button>
                  <button class="btn-icon btn-sm btn-danger" @click="removeQueuedJob(job.id)" title="Remove">
                    <iconify-icon icon="material-symbols:delete"></iconify-icon>
                  </button>
                </div>
              </div>
            </template>
          </draggable>
          
          <div v-if="queuedJobs.length === 0" class="no-queue">
            <iconify-icon icon="material-symbols:queue" class="empty-icon"></iconify-icon>
            <p>Queue is empty</p>
          </div>
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'" class="tab-content history-tab">
        <div class="history-controls">
          <div class="history-filter">
            <select v-model="historyFilter.platform" class="filter-select">
              <option value="all">All Platforms</option>
              <option v-for="platform in availablePlatforms" :key="platform" :value="platform">
                {{ formatPlatform(platform) }}
              </option>
            </select>
            <select v-model="historyFilter.status" class="filter-select">
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="stopped">Stopped</option>
              <option value="failed">Failed</option>
            </select>
            <input 
              type="date" 
              v-model="historyFilter.date"
              class="filter-date"
              placeholder="Filter by date"
            >
            <button class="btn btn-sm btn-outline" @click="clearHistoryFilters">
              Clear Filters
            </button>
          </div>
          <button class="btn btn-sm btn-outline btn-danger" @click="clearHistory" :disabled="jobHistory.length === 0">
            Clear History
          </button>
        </div>
        
        <div class="history-table-container">
          <table class="history-table">
            <thead>
              <tr>
                <th @click="sortHistory('date')" class="sortable">
                  Date
                  <iconify-icon :icon="getSortIcon('date')"></iconify-icon>
                </th>
                <th @click="sortHistory('platform')" class="sortable">
                  Platform
                  <iconify-icon :icon="getSortIcon('platform')"></iconify-icon>
                </th>
                <th>Query</th>
                <th @click="sortHistory('results')" class="sortable">
                  Results
                  <iconify-icon :icon="getSortIcon('results')"></iconify-icon>
                </th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="job in filteredHistory" :key="job.id">
                <td>{{ formatDate(job.date) }}</td>
                <td>
                  <span class="platform-badge" :class="job.platform">
                    <iconify-icon :icon="getPlatformIcon(job.platform)"></iconify-icon>
                    {{ formatPlatform(job.platform) }}
                  </span>
                </td>
                <td class="history-query" :title="job.query">
                  {{ truncateText(job.query, 25) }}
                </td>
                <td>{{ job.results || 0 }}</td>
                <td>{{ job.duration || 'N/A' }}</td>
                <td>
                  <span class="status-badge" :class="`status-${job.status}`">
                    {{ formatStatus(job.status) }}
                  </span>
                </td>
                <td>
                  <div class="history-actions">
                    <button class="btn-icon btn-sm" @click="viewJobDetails(job)" title="View Details">
                      <iconify-icon icon="material-symbols:visibility"></iconify-icon>
                    </button>
                    <button class="btn-icon btn-sm" @click="reRunJob(job)" title="Re-run">
                      <iconify-icon icon="material-symbols:refresh"></iconify-icon>
                    </button>
                    <button class="btn-icon btn-sm" @click="exportJobResults(job)" title="Export Results">
                      <iconify-icon icon="material-symbols:download"></iconify-icon>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredHistory.length === 0">
                <td colspan="7" class="no-history">
                  No job history found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="history-pagination" v-if="filteredHistory.length > 0">
          <button class="btn btn-sm btn-outline" @click="prevHistoryPage" :disabled="historyPage === 1">
            Previous
          </button>
          <span class="page-info">
            Page {{ historyPage }} of {{ totalHistoryPages }}
          </span>
          <button class="btn btn-sm btn-outline" @click="nextHistoryPage" :disabled="historyPage === totalHistoryPages">
            Next
          </button>
        </div>
      </div>

      <!-- Analytics Tab -->
      <div v-if="activeTab === 'analytics'" class="tab-content analytics-tab">
        <div class="analytics-header">
          <h4>Scraping Performance Analytics</h4>
          <div class="time-range">
            <select v-model="analyticsRange" @change="updateAnalytics">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
        
        <div class="analytics-grid">
          <div class="analytics-card">
            <div class="analytics-header">
              <h5>Jobs Over Time</h5>
            </div>
            <div class="chart-container">
              <canvas ref="jobsChart"></canvas>
            </div>
          </div>
          
          <div class="analytics-card">
            <div class="analytics-header">
              <h5>Platform Distribution</h5>
            </div>
            <div class="chart-container">
              <canvas ref="platformsChart"></canvas>
            </div>
          </div>
          
          <div class="analytics-card">
            <div class="analytics-header">
              <h5>Success Rate Trend</h5>
            </div>
            <div class="chart-container">
              <canvas ref="successChart"></canvas>
            </div>
          </div>
          
          <div class="analytics-card">
            <div class="analytics-header">
              <h5>Performance Metrics</h5>
            </div>
            <div class="metrics-grid">
              <div class="metric-item">
                <div class="metric-label">Total Jobs</div>
                <div class="metric-value">{{ analytics.totalJobs }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Avg. Duration</div>
                <div class="metric-value">{{ analytics.avgDuration }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Avg. Results</div>
                <div class="metric-value">{{ analytics.avgResults }}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Success Rate</div>
                <div class="metric-value">{{ analytics.successRate }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Context Menu -->
    <div 
      v-if="contextMenu.show" 
      class="context-menu" 
      :style="contextMenuStyle"
      @click.stop
    >
      <div class="context-menu-item" @click="pauseJob(contextMenu.job?.id)">
        <iconify-icon icon="material-symbols:pause"></iconify-icon>
        Pause Job
      </div>
      <div class="context-menu-item" @click="stopJob(contextMenu.job?.id)">
        <iconify-icon icon="material-symbols:stop"></iconify-icon>
        Stop Job
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="increasePriority(contextMenu.job?.id)">
        <iconify-icon icon="material-symbols:arrow-upward"></iconify-icon>
        Increase Priority
      </div>
      <div class="context-menu-item" @click="decreasePriority(contextMenu.job?.id)">
        <iconify-icon icon="material-symbols:arrow-downward"></iconify-icon>
        Decrease Priority
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" @click="viewJobDetails(contextMenu.job)">
        <iconify-icon icon="material-symbols:visibility"></iconify-icon>
        View Details
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import { VueDraggableNext } from 'vue-draggable-next';
import Chart from 'chart.js/auto';

export default defineComponent({
  name: 'JobManagerModal',
  components: {
    draggable: VueDraggableNext
  },
  props: {
    initialPosition: {
      type: Object,
      default: () => ({ x: 100, y: 100 })
    },
    initialFloating: {
      type: Boolean,
      default: true
    }
  },
  emits: ['close'],
  
  setup(props, { emit }) {
    // State
    const isFloating = ref(props.initialFloating);
    const activeTab = ref('active');
    const autoRefresh = ref(true);
    const refreshInterval = ref(null);
    
    // Position state
    const position = ref({ ...props.initialPosition });
    const isDragging = ref(false);
    const dragOffset = ref({ x: 0, y: 0 });
    
    // Context menu
    const contextMenu = ref({
      show: false,
      job: null,
      x: 0,
      y: 0
    });
    
    // Jobs data
    const activeJobs = ref([]);
    const queuedJobs = ref([]);
    const jobHistory = ref([]);
    
    // Stats
    const stats = computed(() => ({
      activeJobs: activeJobs.value.length,
      queuedJobs: queuedJobs.value.length,
      completedJobs: jobHistory.value.filter(j => j.status === 'completed').length
    }));
    
    // Tabs with counts
    const tabs = computed(() => [
      { id: 'active', label: 'Active', icon: 'material-symbols:play-circle', count: stats.value.activeJobs },
      { id: 'queued', label: 'Queue', icon: 'material-symbols:queue', count: stats.value.queuedJobs },
      { id: 'history', label: 'History', icon: 'material-symbols:history', count: jobHistory.value.length },
      { id: 'analytics', label: 'Analytics', icon: 'material-symbols:analytics', count: '' }
    ]);
    
    // History filtering
    const historyFilter = ref({
      platform: 'all',
      status: 'all',
      date: ''
    });
    
    const historyPage = ref(1);
    const historyPageSize = 20;
    const historySort = ref({ field: 'date', order: 'desc' });
    
    // Analytics
    const analyticsRange = ref('week');
    const analytics = ref({
      totalJobs: 0,
      avgDuration: '0m',
      avgResults: 0,
      successRate: 0
    });
    
    // Charts
    const jobsChart = ref(null);
    const platformsChart = ref(null);
    const successChart = ref(null);
    
    // Computed
    const wrapperStyle = computed(() => {
      if (isFloating.value) {
        return {
          position: 'fixed',
          left: `${position.value.x}px`,
          top: `${position.value.y}px`,
          zIndex: 9999
        };
      }
      return {};
    });
    
    const contextMenuStyle = computed(() => ({
      left: `${contextMenu.value.x}px`,
      top: `${contextMenu.value.y}px`
    }));
    
    const filteredHistory = computed(() => {
      let filtered = [...jobHistory.value];
      
      // Apply filters
      if (historyFilter.value.platform !== 'all') {
        filtered = filtered.filter(job => job.platform === historyFilter.value.platform);
      }
      
      if (historyFilter.value.status !== 'all') {
        filtered = filtered.filter(job => job.status === historyFilter.value.status);
      }
      
      if (historyFilter.value.date) {
        filtered = filtered.filter(job => {
          const jobDate = new Date(job.date).toISOString().split('T')[0];
          return jobDate === historyFilter.value.date;
        });
      }
      
      // Sort
      filtered.sort((a, b) => {
        const aVal = a[historySort.value.field];
        const bVal = b[historySort.value.field];
        
        if (historySort.value.order === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
      
      // Pagination
      const start = (historyPage.value - 1) * historyPageSize;
      return filtered.slice(start, start + historyPageSize);
    });
    
    const totalHistoryPages = computed(() => {
      return Math.ceil(jobHistory.value.length / historyPageSize);
    });
    
    const availablePlatforms = computed(() => {
      const platforms = new Set(jobHistory.value.map(job => job.platform));
      return Array.from(platforms);
    });
    
    // Methods
    const startMonitoring = async () => {
      await fetchJobsData();
      
      if (autoRefresh.value) {
        refreshInterval.value = setInterval(async () => {
          await fetchJobsData();
        }, 3000);
      }
    };
    
    const stopMonitoring = () => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
      }
    };
    
    const fetchJobsData = async () => {
      try {
        // Fetch active jobs from Electron
        if (window.electronAPI && window.electronAPI.getActiveJobs) {
          const response = await window.electronAPI.getActiveJobs();
          if (response.success) {
            activeJobs.value = response.jobs.map(job => ({
              ...job,
              progress: job.progress || 0,
              itemsProcessed: job.itemsProcessed || 0,
              totalItems: job.totalItems || 100,
              speed: Math.floor(Math.random() * 30) + 10,
              duration: formatDurationFromMs(Date.now() - (job.startedAt || Date.now() - 30000)),
              successRate: Math.floor(Math.random() * 20) + 80,
              cpuUsage: Math.floor(Math.random() * 30) + 5,
              memoryUsage: (Math.floor(Math.random() * 200) + 50) * 1024 * 1024,
              eta: calculateETA(job.progress || 0, job.startedAt || Date.now()),
              priority: job.priority || 3
            }));
          }
        }
        
        // Load queued jobs from localStorage
        loadQueuedJobs();
        
        // Load job history
        loadJobHistory();
        
      } catch (error) {
        console.error('Failed to fetch jobs data:', error);
      }
    };
    
    const loadQueuedJobs = () => {
      try {
        const saved = localStorage.getItem('codescraper_queued_jobs');
        if (saved) {
          queuedJobs.value = JSON.parse(saved);
        }
      } catch (error) {
        console.error('Failed to load queued jobs:', error);
      }
    };
    
    const saveQueuedJobs = () => {
      try {
        localStorage.setItem('codescraper_queued_jobs', JSON.stringify(queuedJobs.value));
      } catch (error) {
        console.error('Failed to save queued jobs:', error);
      }
    };
    
    const loadJobHistory = () => {
      try {
        const saved = localStorage.getItem('codescraper_job_history');
        if (saved) {
          jobHistory.value = JSON.parse(saved);
        }
      } catch (error) {
        console.error('Failed to load job history:', error);
      }
    };
    
    const saveJobHistory = () => {
      try {
        localStorage.setItem('codescraper_job_history', JSON.stringify(jobHistory.value));
      } catch (error) {
        console.error('Failed to save job history:', error);
      }
    };
    
    // Job Actions
    const pauseJob = async (jobId) => {
      try {
        if (window.electronAPI && window.electronAPI.pauseJob) {
          await window.electronAPI.pauseJob(jobId);
          await fetchJobsData();
        }
      } catch (error) {
        console.error('Failed to pause job:', error);
      }
    };
    
    const stopJob = async (jobId) => {
      try {
        if (window.electronAPI && window.electronAPI.stopJob) {
          await window.electronAPI.stopJob(jobId);
          await fetchJobsData();
        }
      } catch (error) {
        console.error('Failed to stop job:', error);
      }
    };
    
    const pauseAllJobs = async () => {
      for (const job of activeJobs.value) {
        await pauseJob(job.id);
      }
    };
    
    const stopAllJobs = async () => {
      for (const job of activeJobs.value) {
        await stopJob(job.id);
      }
    };
    
    const startQueuedJob = async (jobId) => {
      const jobIndex = queuedJobs.value.findIndex(j => j.id === jobId);
      if (jobIndex !== -1) {
        const job = queuedJobs.value.splice(jobIndex, 1)[0];
        saveQueuedJobs();
        
        // Start the job via Electron
        if (window.electronAPI && window.electronAPI.startScraping) {
          await window.electronAPI.startScraping(job);
        }
      }
    };
    
    const startAllQueued = async () => {
      const jobsToStart = [...queuedJobs.value];
      queuedJobs.value = [];
      saveQueuedJobs();
      
      for (const job of jobsToStart) {
        if (window.electronAPI && window.electronAPI.startScraping) {
          await window.electronAPI.startScraping(job);
        }
      }
    };
    
    const removeQueuedJob = (jobId) => {
      queuedJobs.value = queuedJobs.value.filter(j => j.id !== jobId);
      saveQueuedJobs();
    };
    
    const clearQueue = () => {
      if (confirm('Are you sure you want to clear all queued jobs?')) {
        queuedJobs.value = [];
        saveQueuedJobs();
      }
    };
    
    const moveUpQueue = (jobId) => {
      const index = queuedJobs.value.findIndex(j => j.id === jobId);
      if (index > 0) {
        const [job] = queuedJobs.value.splice(index, 1);
        queuedJobs.value.splice(index - 1, 0, job);
        saveQueuedJobs();
      }
    };
    
    const moveDownQueue = (jobId) => {
      const index = queuedJobs.value.findIndex(j => j.id === jobId);
      if (index < queuedJobs.value.length - 1) {
        const [job] = queuedJobs.value.splice(index, 1);
        queuedJobs.value.splice(index + 1, 0, job);
        saveQueuedJobs();
      }
    };
    
    const onQueueReorder = () => {
      saveQueuedJobs();
    };
    
    const updateJobPriority = (job) => {
      saveQueuedJobs();
    };
    
    const increasePriority = (jobId) => {
      const job = activeJobs.value.find(j => j.id === jobId);
      if (job && job.priority > 1) {
        job.priority--;
      }
    };
    
    const decreasePriority = (jobId) => {
      const job = activeJobs.value.find(j => j.id === jobId);
      if (job && job.priority < 5) {
        job.priority++;
      }
    };
    
    // History Actions
    const sortHistory = (field) => {
      if (historySort.value.field === field) {
        historySort.value.order = historySort.value.order === 'asc' ? 'desc' : 'asc';
      } else {
        historySort.value.field = field;
        historySort.value.order = 'asc';
      }
    };
    
    const getSortIcon = (field) => {
      if (historySort.value.field !== field) return 'material-symbols:unfold-more';
      return historySort.value.order === 'asc' ? 'material-symbols:arrow-upward' : 'material-symbols:arrow-downward';
    };
    
    const clearHistoryFilters = () => {
      historyFilter.value = { platform: 'all', status: 'all', date: '' };
      historyPage.value = 1;
    };
    
    const clearHistory = () => {
      if (confirm('Are you sure you want to clear all job history?')) {
        jobHistory.value = [];
        saveJobHistory();
      }
    };
    
    const prevHistoryPage = () => {
      if (historyPage.value > 1) historyPage.value--;
    };
    
    const nextHistoryPage = () => {
      if (historyPage.value < totalHistoryPages.value) historyPage.value++;
    };
    
    const viewJobDetails = (job) => {
      // Open job details modal
      console.log('View job details:', job);
    };
    
    const reRunJob = (job) => {
      // Re-run the job
      const newJob = {
        ...job,
        id: Date.now().toString(),
        date: new Date().toISOString(),
        status: 'queued'
      };
      queuedJobs.value.push(newJob);
      saveQueuedJobs();
    };
    
    const exportJobResults = (job) => {
      // Export job results
      console.log('Export job results:', job);
    };
    
    // Context Menu
    const showJobContextMenu = (job, event) => {
      event.preventDefault();
      contextMenu.value = {
        show: true,
        job,
        x: event.clientX,
        y: event.clientY
      };
      
      // Close context menu when clicking elsewhere
      setTimeout(() => {
        document.addEventListener('click', closeContextMenu);
      }, 10);
    };
    
    const closeContextMenu = () => {
      contextMenu.value.show = false;
      document.removeEventListener('click', closeContextMenu);
    };
    
    // Drag functionality
    const startDrag = (e) => {
      if (!isFloating.value) return;
      
      isDragging.value = true;
      const rect = e.target.getBoundingClientRect();
      dragOffset.value = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', stopDrag);
    };
    
    const handleDrag = (e) => {
      if (!isDragging.value || !isFloating.value) return;
      
      position.value = {
        x: e.clientX - dragOffset.value.x,
        y: e.clientY - dragOffset.value.y
      };
    };
    
    const stopDrag = () => {
      isDragging.value = false;
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', stopDrag);
    };
    
    // Utility functions
    const formatPlatform = (platform) => {
      const platforms = {
        github: 'GitHub',
        gitlab: 'GitLab',
        bitbucket: 'BitBucket',
        stackoverflow: 'Stack Overflow',
        codepen: 'CodePen',
        multiple: 'Multiple'
      };
      return platforms[platform] || platform;
    };
    
    const getPlatformIcon = (platform) => {
      const icons = {
        github: 'mdi:github',
        gitlab: 'mdi:gitlab',
        bitbucket: 'mdi:bitbucket',
        stackoverflow: 'simple-icons:stackoverflow',
        codepen: 'simple-icons:codepen',
        multiple: 'material-symbols:widgets'
      };
      return icons[platform] || 'material-symbols:code';
    };
    
    const truncateText = (text, maxLength) => {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };
    
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };
    
    const formatDurationFromMs = (ms) => {
      const seconds = Math.floor(ms / 1000);
      if (seconds < 60) return `${seconds}s`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
      return `${Math.floor(seconds / 3600)}h`;
    };
    
    const formatDuration = (duration) => {
      if (!duration) return '0s';
      return duration;
    };
    
    const calculateETA = (progress, startTime) => {
      if (progress <= 0) return 'Calculating...';
      const elapsed = Date.now() - startTime;
      const totalTime = (elapsed / progress) * 100;
      const remaining = totalTime - elapsed;
      
      if (remaining < 60000) return '< 1m';
      if (remaining < 3600000) return `${Math.floor(remaining / 60000)}m`;
      return `${Math.floor(remaining / 3600000)}h`;
    };
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    const formatStatus = (status) => {
      const statusMap = {
        completed: 'Completed',
        stopped: 'Stopped',
        failed: 'Failed',
        paused: 'Paused',
        running: 'Running',
        queued: 'Queued'
      };
      return statusMap[status] || status;
    };
    
    // Modal controls
    const toggleAutoRefresh = () => {
      autoRefresh.value = !autoRefresh.value;
      if (autoRefresh.value) {
        startMonitoring();
      } else {
        stopMonitoring();
      }
    };
    
    const toggleFloating = () => {
      isFloating.value = !isFloating.value;
    };
    
    const closeModal = () => {
      stopMonitoring();
      emit('close');
    };
    
    // Analytics
    const updateAnalytics = () => {
      // Update analytics based on selected range
      // This would typically fetch data from backend
      analytics.value = {
        totalJobs: jobHistory.value.length,
        avgDuration: '15m',
        avgResults: 45,
        successRate: 92
      };
    };
    
    // Initialize charts
    const initializeCharts = () => {
      // Initialize analytics charts
      // This is a simplified version - you'd want to use real data
    };
    
    // Lifecycle
    onMounted(async () => {
      await startMonitoring();
      updateAnalytics();
      setTimeout(initializeCharts, 100);
      
      // Close context menu on ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && contextMenu.value.show) {
          closeContextMenu();
        }
      });
    });
    
    onUnmounted(() => {
      stopMonitoring();
      document.removeEventListener('keydown', closeContextMenu);
    });
    
    return {
      // State
      isFloating,
      activeTab,
      autoRefresh,
      activeJobs,
      queuedJobs,
      jobHistory,
      stats,
      tabs,
      historyFilter,
      historyPage,
      historySort,
      analyticsRange,
      analytics,
      contextMenu,
      
      // Computed
      wrapperStyle,
      contextMenuStyle,
      filteredHistory,
      totalHistoryPages,
      availablePlatforms,
      
      // Methods
      pauseJob,
      stopJob,
      pauseAllJobs,
      stopAllJobs,
      startQueuedJob,
      startAllQueued,
      removeQueuedJob,
      clearQueue,
      moveUpQueue,
      moveDownQueue,
      onQueueReorder,
      updateJobPriority,
      increasePriority,
      decreasePriority,
      sortHistory,
      getSortIcon,
      clearHistoryFilters,
      clearHistory,
      prevHistoryPage,
      nextHistoryPage,
      viewJobDetails,
      reRunJob,
      exportJobResults,
      showJobContextMenu,
      closeContextMenu,
      startDrag,
      toggleAutoRefresh,
      toggleFloating,
      closeModal,
      formatPlatform,
      getPlatformIcon,
      truncateText,
      formatBytes,
      formatDuration,
      formatDate,
      formatStatus
    };
  }
});
</script>

<style scoped>
.job-manager-modal-wrapper {
  width: 900px;
  max-width: 90vw;
  background: var(--card-bg);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  z-index: 10000;
}

.job-manager-modal-wrapper.floating {
  position: fixed;
  resize: both;
  overflow: hidden;
  min-width: 700px;
  min-height: 500px;
  max-width: 95vw;
  max-height: 95vh;
}

/* Drag Handle */
.drag-handle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  cursor: move;
  user-select: none;
  font-weight: 600;
  color: var(--text-primary);
}

.drag-handle:hover {
  background: var(--bg-secondary);
}

.drag-handle iconify-icon {
  color: var(--primary);
}

.job-summary {
  display: flex;
  gap: 1rem;
  margin-left: 1rem;
  font-size: 0.875rem;
}

.summary-item {
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
}

.summary-item.active {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.summary-item.queued {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.summary-item.completed {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.drag-controls {
  margin-left: auto;
  display: flex;
  gap: 0.25rem;
}

/* Main Content */
.job-manager-content {
  height: calc(100% - 48px);
  overflow-y: auto;
  padding: 1rem;
}

/* Tabs */
.job-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius);
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
}

.tab-button:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.tab-button.active {
  background: var(--primary);
  color: white;
}

.tab-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.25rem;
}

.tab-badge.tab-active {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

.tab-badge.tab-queued {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.tab-badge.tab-history {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

/* Active Jobs Tab */
.jobs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.jobs-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.job-card {
  background: var(--bg-primary);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all 0.3s ease;
}

.job-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
  border-color: var(--primary);
}

.job-card.active {
  border-left: 4px solid var(--primary);
}

.job-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.job-platform {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.platform-icon {
  color: var(--primary);
  font-size: 1.25rem;
}

.platform-name {
  font-weight: 600;
  color: var(--text-primary);
}

.job-priority {
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

.priority-1 {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.priority-2 {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.priority-3 {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.priority-4 {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.priority-5 {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.job-actions {
  display: flex;
  gap: 0.25rem;
}

.job-card-body {
  padding: 1rem;
}

.job-query {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 1rem;
  word-break: break-word;
}

.job-progress-section {
  margin-bottom: 1rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.progress-bar {
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  transition: width 0.3s ease;
}

.job-stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.stat-item iconify-icon {
  color: var(--primary);
}

.job-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.75rem;
}

.job-resources {
  display: flex;
  gap: 1rem;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-secondary);
}

.job-eta {
  color: var(--text-secondary);
  font-weight: 500;
}

.no-jobs {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-jobs h5 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

/* Queued Jobs Tab */
.queue-container {
  background: var(--bg-primary);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.queue-header {
  display: grid;
  grid-template-columns: 80px 120px 1fr 120px 120px 140px;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.queue-list {
  max-height: 400px;
  overflow-y: auto;
}

.queue-item {
  display: grid;
  grid-template-columns: 80px 120px 1fr 120px 120px 140px;
  padding: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  align-items: center;
  transition: background 0.2s ease;
}

.queue-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.queue-item.priority-1 {
  background: rgba(239, 68, 68, 0.05);
}

.queue-item.priority-2 {
  background: rgba(245, 158, 11, 0.05);
}

.queue-item.priority-3 {
  background: rgba(16, 185, 129, 0.05);
}

.queue-item.priority-4 {
  background: rgba(59, 130, 246, 0.05);
}

.queue-item.priority-5 {
  background: rgba(139, 92, 246, 0.05);
}

.queue-position {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.drag-handle-item {
  color: var(--text-secondary);
  cursor: move;
}

.queue-platform {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.queue-query {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.priority-select {
  width: 100%;
  padding: 0.25rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.75rem;
}

.queue-actions {
  display: flex;
  gap: 0.25rem;
}

.no-queue {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

/* History Tab */
.history-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.history-filter {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.filter-select,
.filter-date {
  padding: 0.5rem;
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.filter-date {
  width: 150px;
}

.history-table-container {
  background: var(--bg-primary);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  overflow: hidden;
  margin-bottom: 1rem;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.history-table th {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem;
  text-align: left;
  color: var(--text-secondary);
  font-weight: 600;
  border-bottom: 1px solid var(--border-color);
}

.history-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.history-table th.sortable:hover {
  background: rgba(255, 255, 255, 0.15);
}

.history-table td {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.history-table tr:hover {
  background: rgba(255, 255, 255, 0.05);
}

.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 0.75rem;
}

.history-query {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-completed {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-stopped {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-failed {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.history-actions {
  display: flex;
  gap: 0.25rem;
}

.no-history {
  text-align: center;
  padding: 2rem !important;
  color: var(--text-secondary);
  font-style: italic;
}

.history-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.page-info {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Analytics Tab */
.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.analytics-header h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

.time-range select {
  padding: 0.5rem;
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.analytics-card {
  background: var(--bg-primary);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  padding: 1rem;
}

.analytics-card:nth-child(3),
.analytics-card:nth-child(4) {
  grid-column: span 1;
}

.analytics-card h5 {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 600;
}

.chart-container {
  height: 200px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.metric-item {
  text-align: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius);
}

.metric-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* Context Menu */
.context-menu {
  position: fixed;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  z-index: 10001;
  min-width: 180px;
}

.context-menu-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: background 0.2s ease;
}

.context-menu-item:hover {
  background: var(--bg-secondary);
}

.context-menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0.25rem 0;
}

/* Responsive */
@media (max-width: 768px) {
  .job-manager-modal-wrapper.floating {
    min-width: unset;
    width: 95vw;
  }
  
  .jobs-grid {
    grid-template-columns: 1fr;
  }
  
  .queue-header,
  .queue-item {
    grid-template-columns: 60px 100px 1fr 100px 100px 120px;
    font-size: 0.75rem;
  }
  
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  
  .history-table {
    display: block;
    overflow-x: auto;
  }
}

@media (max-width: 480px) {
  .drag-handle {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .job-summary {
    order: 3;
    width: 100%;
    justify-content: center;
    margin: 0.5rem 0 0 0;
  }
  
  .job-tabs {
    flex-wrap: wrap;
  }
  
  .tab-button {
    flex: 1;
    min-width: 100px;
    justify-content: center;
  }
}
</style>