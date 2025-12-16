<template>
  <div class="monitoring-modal" :style="modalStyle" v-click-outside="closeIfFloating">
    <!-- Drag Handle -->
    <div class="drag-handle" @mousedown="startDrag" v-if="isFloating">
      <LocalIcon icon="material-symbols:drag-handle"></LocalIcon>
      <span>System Monitor 🇹🇩</span>
      <div class="drag-controls">
        <button class="btn-icon btn-sm" @click="toggleFloating" :title="isFloating ? 'Dock' : 'Float'">
          <LocalIcon :icon="isFloating ? 'material-symbols:vertical-align-bottom' : 'material-symbols:open-in-new'"></LocalIcon>
        </button>
        <button class="btn-icon btn-sm" @click="closeModal" title="Close">
          <LocalIcon icon="material-symbols:close"></LocalIcon>
        </button>
      </div>
    </div>

    <!-- Modal Content -->
    <div class="modal-content">
      <div class="modal-header" v-if="!isFloating">
        <h3>
          <LocalIcon icon="material-symbols:monitor-heart"></LocalIcon>
          System Monitor 🇹🇩 Solar Powered
        </h3>
        <button class="btn-icon" @click="closeModal">
          <LocalIcon icon="material-symbols:close"></LocalIcon>
        </button>
      </div>
      
      <div class="modal-body">
        <!-- Real-time Stats Grid -->
        <div class="stats-grid">
          <!-- CPU Card -->
          <div class="stat-card">
            <div class="stat-header">
              <LocalIcon icon="mdi:cpu" class="stat-icon"></LocalIcon>
              <h4>CPU Usage</h4>
              <span class="stat-value">{{ stats.cpu }}%</span>
            </div>
            <div class="stat-content">
              <div v-if="chartsEnabled" class="chart-container">
                <canvas ref="cpuChart"></canvas>
              </div>
              <div v-else class="fallback-chart">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: `${stats.cpu}%` }"></div>
                </div>
                <div class="progress-labels">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- RAM Card -->
          <div class="stat-card">
            <div class="stat-header">
              <LocalIcon icon="material-symbols:memory" class="stat-icon"></LocalIcon>
              <h4>RAM Usage</h4>
              <span class="stat-value">{{ stats.memory }}%</span>
            </div>
            <div class="stat-content">
              <div v-if="chartsEnabled" class="chart-container">
                <canvas ref="memoryChart"></canvas>
              </div>
              <div v-else class="fallback-chart">
                <div class="memory-visual">
                  <div class="memory-bar">
                    <div class="memory-used" :style="{ width: `${stats.memory}%` }">
                      <span>{{ formatBytes(stats.memoryUsed) }}</span>
                    </div>
                    <div class="memory-free" :style="{ width: `${100 - stats.memory}%` }">
                      <span>{{ formatBytes(stats.memoryTotal - stats.memoryUsed) }}</span>
                    </div>
                  </div>
                  <div class="memory-total">
                    Total: {{ formatBytes(stats.memoryTotal) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Jobs Card -->
          <div class="stat-card">
            <div class="stat-header">
              <LocalIcon icon="material-symbols:work-history" class="stat-icon"></LocalIcon>
              <h4>Active Jobs</h4>
              <span class="stat-value">{{ stats.jobs }}</span>
            </div>
            <div class="stat-content">
              <div class="jobs-list" v-if="activeJobs.length > 0">
                <div v-for="job in activeJobs.slice(0, 3)" :key="job.id" class="job-item">
                  <LocalIcon icon="getPlatformIcon(job.platform)"></LocalIcon>
                  <span class="job-name">{{ truncateText(job.query, 20) }}</span>
                  <span class="job-progress">{{ job.progress || 0 }}%</span>
                </div>
              </div>
              <div v-else class="no-jobs">
                <LocalIcon icon="material-symbols:work-outline"></LocalIcon>
                <span>No active jobs</span>
              </div>
            </div>
          </div>

          <!-- Network Card -->
          <div class="stat-card">
            <div class="stat-header">
              <LocalIcon icon="material-symbols:network-wifi" class="stat-icon"></LocalIcon>
              <h4>Network</h4>
            </div>
            <div class="stat-content">
              <div class="network-stats">
                <div class="network-item">
                  <LocalIcon icon="material-symbols:download"></LocalIcon>
                  <div class="network-info">
                    <span class="network-value">{{ formatBytes(stats.network.download) }}/s</span>
                    <span class="network-label">Download</span>
                  </div>
                </div>
                <div class="network-item">
                  <LocalIcon icon="material-symbols:upload"></LocalIcon>
                  <div class="network-info">
                    <span class="network-value">{{ formatBytes(stats.network.upload) }}/s</span>
                    <span class="network-label">Upload</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="controls">
          <button class="btn btn-outline" @click="refreshStats">
            <LocalIcon icon="material-symbols:refresh"></LocalIcon>
            Refresh
          </button>
          <button class="btn btn-outline" @click="toggleCharts">
            <LocalIcon :icon="chartsEnabled ? 'material-symbols:visibility-off' : 'material-symbols:visibility'"></LocalIcon>
            {{ chartsEnabled ? 'Hide Charts' : 'Show Charts' }}
          </button>
          <button class="btn btn-outline" @click="toggleFloating" v-if="!isFloating">
            <LocalIcon icon="material-symbols:open-in-new"></LocalIcon>
            Float Window
          </button>
        </div>

        <!-- Chart.js Warning -->
        <div v-if="chartError" class="chart-warning">
          <LocalIcon icon="material-symbols:warning"></LocalIcon>
          <span>Charts disabled: {{ chartError }}</span>
          <button class="btn-link" @click="retryCharts">Retry</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';

export default {
  name: 'MonitoringModal',
  emits: ['close'],
  
  props: {
    floating: {
      type: Boolean,
      default: false
    },
    position: {
      type: Object,
      default: () => ({ x: 100, y: 100 })
    }
  },
  
  setup(props, { emit }) {
    // State
    const isFloating = ref(props.floating);
    const position = ref({ ...props.position });
    const isDragging = ref(false);
    const dragOffset = ref({ x: 0, y: 0 });
    
    // Stats
    const stats = ref({
      cpu: 0,
      memory: 0,
      memoryUsed: 0,
      memoryTotal: 16 * 1024 * 1024 * 1024, // 16GB default
      jobs: 0,
      network: {
        download: 0,
        upload: 0
      }
    });
    
    const activeJobs = ref([]);
    const interval = ref(null);
    
    // Charts
    const chartsEnabled = ref(true);
    const chartError = ref(null);
    const cpuChart = ref(null);
    const memoryChart = ref(null);
    const chartInstances = ref({});
    
    // Computed
    const modalStyle = computed(() => {
      if (isFloating.value) {
        return {
          position: 'fixed',
          left: `${position.value.x}px`,
          top: `${position.value.y}px`,
          zIndex: 10000
        };
      }
      return {};
    });
    
    // Methods
    const fetchStats = async () => {
      try {
        // Get system stats
        if (window.electronAPI?.getSystemStats) {
          const response = await window.electronAPI.getSystemStats();
          if (response.success) {
            const data = response.stats;
            stats.value.cpu = Math.round(data.cpu?.total || 0);
            stats.value.memory = Math.round(data.memory?.percentage || 0);
            stats.value.memoryUsed = data.memory?.used || 0;
            stats.value.memoryTotal = data.memory?.total || stats.value.memoryTotal;
            stats.value.network.download = data.network?.download || 0;
            stats.value.network.upload = data.network?.upload || 0;
          }
        }
        
        // Get active jobs
        if (window.electronAPI?.getActiveJobs) {
          const response = await window.electronAPI.getActiveJobs();
          if (response.success) {
            activeJobs.value = response.jobs || [];
            stats.value.jobs = activeJobs.value.length;
          }
        }
        
        // Update charts if enabled
        if (chartsEnabled.value) {
          updateCharts();
        }
        
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    
    const refreshStats = () => {
      fetchStats();
    };
    
    // Chart methods with fallback
    const initializeCharts = async () => {
      try {
        // Try to load Chart.js dynamically
        const Chart = (await import('chart.js/auto')).default;
        
        // Initialize CPU chart
        if (cpuChart.value && !chartInstances.value.cpu) {
          const ctx = cpuChart.value.getContext('2d');
          chartInstances.value.cpu = new Chart(ctx, {
            type: 'line',
            data: {
              labels: [],
              datasets: [{
                label: 'CPU Usage',
                data: [],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, max: 100 } }
            }
          });
        }
        
        // Initialize Memory chart
        if (memoryChart.value && !chartInstances.value.memory) {
          const ctx = memoryChart.value.getContext('2d');
          chartInstances.value.memory = new Chart(ctx, {
            type: 'line',
            data: {
              labels: [],
              datasets: [{
                label: 'RAM Usage',
                data: [],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, max: 100 } }
            }
          });
        }
        
        chartError.value = null;
        
      } catch (error) {
        console.warn('Chart.js failed to load:', error);
        chartsEnabled.value = false;
        chartError.value = error.message;
      }
    };
    
    const updateCharts = () => {
      if (!chartsEnabled.value || !chartInstances.value.cpu || !chartInstances.value.memory) return;
      
      try {
        // Update CPU chart
        const cpuData = chartInstances.value.cpu.data;
        cpuData.labels.push(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        cpuData.datasets[0].data.push(stats.value.cpu);
        
        if (cpuData.labels.length > 20) {
          cpuData.labels.shift();
          cpuData.datasets[0].data.shift();
        }
        
        chartInstances.value.cpu.update('none');
        
        // Update Memory chart
        const memoryData = chartInstances.value.memory.data;
        memoryData.labels.push(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        memoryData.datasets[0].data.push(stats.value.memory);
        
        if (memoryData.labels.length > 20) {
          memoryData.labels.shift();
          memoryData.datasets[0].data.shift();
        }
        
        chartInstances.value.memory.update('none');
        
      } catch (error) {
        console.warn('Chart update failed:', error);
        chartsEnabled.value = false;
      }
    };
    
    const toggleCharts = () => {
      chartsEnabled.value = !chartsEnabled.value;
      if (chartsEnabled.value && !chartInstances.value.cpu) {
        initializeCharts();
      }
    };
    
    const retryCharts = () => {
      chartsEnabled.value = true;
      chartError.value = null;
      initializeCharts();
    };
    
    // Drag functionality
    const startDrag = (e) => {
      if (!isFloating.value) return;
      
      isDragging.value = true;
      const rect = e.currentTarget.getBoundingClientRect();
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
    
    const toggleFloating = () => {
      isFloating.value = !isFloating.value;
    };
    
    const closeIfFloating = () => {
      if (isFloating.value) {
        closeModal();
      }
    };
    
    const closeModal = () => {
      emit('close');
    };
    
    // Utility functions
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };
    
    const truncateText = (text, maxLength) => {
      if (!text) return '';
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };
    
    const getPlatformIcon = (platform) => {
      const icons = {
        github: 'mdi:github',
        gitlab: 'mdi:gitlab',
        bitbucket: 'mdi:bitbucket',
        stackoverflow: 'simple-icons:stackoverflow',
        codepen: 'simple-icons:codepen'
      };
      return icons[platform] || 'material-symbols:code';
    };
    
    // Lifecycle
    onMounted(async () => {
      await fetchStats();
      
      if (chartsEnabled.value) {
        await initializeCharts();
      }
      
      interval.value = setInterval(fetchStats, 3000);
    });
    
    onUnmounted(() => {
      if (interval.value) {
        clearInterval(interval.value);
      }
      
      // Destroy charts
      Object.values(chartInstances.value).forEach(chart => {
        if (chart) chart.destroy();
      });
    });
    
    return {
      // State
      isFloating,
      stats,
      activeJobs,
      chartsEnabled,
      chartError,
      cpuChart,
      memoryChart,
      
      // Computed
      modalStyle,
      
      // Methods
      refreshStats,
      toggleCharts,
      retryCharts,
      startDrag,
      toggleFloating,
      closeIfFloating,
      closeModal,
      formatBytes,
      truncateText,
      getPlatformIcon
    };
  }
};
</script>

<style scoped>
.monitoring-modal {
  background: var(--card-bg);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  width: 800px;
  max-width: 90vw;
}

.monitoring-modal.floating {
  position: fixed;
  resize: both;
  overflow: hidden;
  min-width: 600px;
  min-height: 400px;
  max-width: 95vw;
  max-height: 95vh;
}

.drag-handle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.drag-controls {
  margin-left: auto;
  display: flex;
  gap: 0.25rem;
}

.modal-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-body {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--bg-primary);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid var(--border-color);
}

.stat-icon {
  font-size: 1.5rem;
  color: var(--primary);
}

.stat-header h4 {
  margin: 0;
  flex: 1;
  font-size: 1rem;
}

.stat-value {
  font-weight: 700;
  color: var(--text-primary);
}

.stat-content {
  padding: 1rem;
  height: 150px;
}

.chart-container {
  height: 100%;
}

.fallback-chart {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
}

.progress-bar {
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  transition: width 0.3s ease;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.memory-visual {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.memory-bar {
  display: flex;
  height: 20px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--border-color);
}

.memory-used {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.memory-free {
  background: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.memory-total {
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.jobs-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.job-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.job-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.job-progress {
  font-weight: 600;
  color: var(--primary);
}

.no-jobs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 0.5rem;
  color: var(--text-secondary);
}

.no-jobs LocalIcon {
  font-size: 2rem;
  opacity: 0.5;
}

.network-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.network-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.network-item LocalIcon {
  font-size: 1.5rem;
  color: var(--primary);
}

.network-info {
  display: flex;
  flex-direction: column;
}

.network-value {
  font-weight: 600;
  color: var(--text-primary);
}

.network-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.chart-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  margin-top: 1rem;
  background: rgba(245, 158, 11, 0.1);
  border-radius: var(--radius);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #f59e0b;
  font-size: 0.875rem;
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  margin-left: auto;
  font-size: 0.875rem;
}

.btn-link:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .monitoring-modal.floating {
    min-width: unset;
    width: 95vw;
  }
  
  .stat-content {
    height: 120px;
  }
}

/* Resize handle for floating window */
.monitoring-modal.floating::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, transparent 50%, var(--border-color) 50%);
  cursor: nwse-resize;
}
</style>