<template>
  <div class="tab-content active" id="scraper">
    <div class="tab-header">
      <h2><iconify-icon icon="iconamoon:cloud-download-light"></iconify-icon> Advanced Code Scraper</h2>
      <p>Extract code from multiple platforms with intelligent filtering and real-time monitoring</p>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <button class="btn btn-primary" @click="startQuickScraping">
        <iconify-icon icon="material-symbols:rocket-launch"></iconify-icon>
        Quick Scrape (Default Settings)
      </button>
      <button class="btn btn-secondary" @click="showAdvancedSettings = !showAdvancedSettings">
        <iconify-icon icon="material-symbols:settings"></iconify-icon>
        {{ showAdvancedSettings ? 'Hide' : 'Show' }} Advanced Settings
      </button>
      <button class="btn btn-outline" @click="loadSavedSession">
        <iconify-icon icon="material-symbols:folder-open"></iconify-icon>
        Load Session
      </button>
    </div>

    <!-- Scraping Configuration -->
    <div class="scraping-configuration">
      <div class="config-section">
        <h3>Search Configuration</h3>
        
        <div class="form-group">
          <label for="searchQuery">Search Query *</label>
          <input 
            type="text" 
            id="searchQuery" 
            v-model="scrapingConfig.query"
            placeholder="Enter programming language, framework, or specific code pattern..."
            :disabled="isScraping"
          >
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="platformSelect">Platforms to Search *</label>
            <select id="platformSelect" v-model="scrapingConfig.platform" @change="handlePlatformChange" :disabled="isScraping">
              <option value="github">GitHub</option>
              <option value="stackoverflow">Stack Overflow</option>
              <option value="gitlab">GitLab</option>
              <option value="bitbucket">Bitbucket</option>
              <option value="codepen">CodePen</option>
              <option value="global">Global Web Search</option>
              <option value="multiple">Multiple Platforms</option>
            </select>
          </div>

          <div class="form-group">
            <label for="maxResults">Maximum Results</label>
            <input 
              type="number" 
              id="maxResults" 
              v-model.number="scrapingConfig.maxResults"
              min="1" 
              max="1000"
              :disabled="isScraping"
            >
          </div>
        </div>

        <!-- Multi-platform selection -->
        <div v-if="scrapingConfig.platform === 'multiple'" class="form-group">
          <label>Select Platforms:</label>
          <div class="platform-checkboxes">
            <label class="checkbox-label">
              <input type="checkbox" v-model="scrapingConfig.selectedPlatforms" value="github" :disabled="isScraping">
              GitHub
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="scrapingConfig.selectedPlatforms" value="stackoverflow" :disabled="isScraping">
              Stack Overflow
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="scrapingConfig.selectedPlatforms" value="gitlab" :disabled="isScraping">
              GitLab
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="scrapingConfig.selectedPlatforms" value="bitbucket" :disabled="isScraping">
              Bitbucket
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="scrapingConfig.selectedPlatforms" value="codepen" :disabled="isScraping">
              CodePen
            </label>
          </div>
        </div>
      </div>

      <!-- Advanced Settings -->
      <div v-if="showAdvancedSettings" class="advanced-settings">
        <h3>Advanced Configuration</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label for="fileTypes">File Types to Scrape</label>
            <div class="file-type-grid">
              <label class="checkbox-label" v-for="fileType in fileTypes" :key="fileType.value">
                <input 
                  type="checkbox" 
                  :value="fileType.value" 
                  v-model="scrapingConfig.fileTypes"
                  :disabled="isScraping"
                >
                <span class="file-type-icon">{{ fileType.icon }}</span>
                {{ fileType.label }}
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="languageFilter">Programming Language</label>
            <select id="languageFilter" v-model="scrapingConfig.language" :disabled="isScraping">
              <option value="">Any Language</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="csharp">C#</option>
              <option value="php">PHP</option>
              <option value="ruby">Ruby</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="swift">Swift</option>
              <option value="kotlin">Kotlin</option>
            </select>

            <label for="codeComplexity" class="mt-2">Code Complexity Filter</label>
            <select id="codeComplexity" v-model="scrapingConfig.complexity" :disabled="isScraping">
              <option value="any">Any Complexity</option>
              <option value="simple">Simple Snippets</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced/Production</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="scrapingConfig.includeForks" :disabled="isScraping">
            Include Forked Repositories
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="scrapingConfig.includeArchived" :disabled="isScraping">
            Include Archived Repositories
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="scrapingConfig.downloadFiles" :disabled="isScraping">
            Download Source Files
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="scrapingConfig.includeTests" :disabled="isScraping">
            Include Test Files
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="scrapingConfig.includeDocumentation" :disabled="isScraping">
            Include Documentation
          </label>
        </div>

        <!-- Repository Filters -->
        <div class="form-row" v-if="['github', 'gitlab', 'bitbucket'].includes(scrapingConfig.platform)">
          <div class="form-group">
            <label for="minStars">Minimum Stars</label>
            <input 
              type="number" 
              id="minStars" 
              v-model.number="scrapingConfig.minStars"
              min="0"
              placeholder="0"
              :disabled="isScraping"
            >
          </div>
          <div class="form-group">
            <label for="minForks">Minimum Forks</label>
            <input 
              type="number" 
              id="minForks" 
              v-model.number="scrapingConfig.minForks"
              min="0"
              placeholder="0"
              :disabled="isScraping"
            >
          </div>
          <div class="form-group">
            <label for="updatedAfter">Updated After</label>
            <input 
              type="date" 
              id="updatedAfter" 
              v-model="scrapingConfig.updatedAfter"
              :disabled="isScraping"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Proxy & Account Selection -->
    <div class="execution-config">
      <h3>Execution Configuration</h3>
      
      <div class="form-row">
        <div class="form-group">
          <label for="proxyGroup">Proxy Group</label>
          <select id="proxyGroup" v-model="scrapingConfig.proxyGroup" :disabled="isScraping">
            <option value="none">No Proxy</option>
            <option v-for="group in proxyGroups" :key="group" :value="group">{{ group }}</option>
          </select>
          <div v-if="scrapingConfig.proxyGroup !== 'none'" class="proxy-status">
            <iconify-icon icon="material-symbols:check-circle" style="color: var(--success);"></iconify-icon>
            Proxy group active
          </div>
        </div>

        <div class="form-group">
          <label for="accountSelection">Account</label>
          <select id="accountSelection" v-model="scrapingConfig.account" :disabled="isScraping">
            <option value="none">No Account</option>
            <option v-for="account in accounts" :key="account.id" :value="account.id">
              {{ account.platform }} - {{ account.username }}
            </option>
          </select>
          <div v-if="scrapingConfig.account !== 'none'" class="account-status">
            <iconify-icon icon="material-symbols:check-circle" style="color: var(--success);"></iconify-icon>
            Account authenticated
          </div>
        </div>

        <div class="form-group">
          <label for="sessionName">Session Name</label>
          <input 
            type="text" 
            id="sessionName" 
            v-model="scrapingConfig.sessionName"
            placeholder="Optional: Save this scraping session"
            :disabled="isScraping"
          >
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="requestDelay">Request Delay: {{ scrapingConfig.requestDelay }}ms</label>
          <input 
            type="range" 
            id="requestDelay" 
            v-model.number="scrapingConfig.requestDelay"
            min="100" 
            max="5000" 
            step="100"
            :disabled="isScraping"
          >
          <div class="range-labels">
            <span>Fast</span>
            <span>Balanced</span>
            <span>Stealth</span>
          </div>
        </div>

        <div class="form-group">
          <label for="timeout">Timeout: {{ scrapingConfig.timeout }}s</label>
          <input 
            type="range" 
            id="timeout" 
            v-model.number="scrapingConfig.timeout"
            min="30" 
            max="300" 
            step="10"
            :disabled="isScraping"
          >
          <div class="range-labels">
            <span>Quick</span>
            <span>Standard</span>
            <span>Extended</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Scraping Controls -->
    <div class="scraping-controls">
      <button 
        class="btn btn-primary" 
        :disabled="isScraping || !scrapingConfig.query || (scrapingConfig.platform === 'multiple' && scrapingConfig.selectedPlatforms.length === 0)"
        @click="startScraping"
      >
        <iconify-icon v-if="isScraping" icon="svg-spinners:bars-rotate-fade"></iconify-icon>
        <iconify-icon v-else icon="material-symbols:play-arrow"></iconify-icon>
        {{ isScraping ? 'Scraping...' : 'Start Scraping' }}
      </button>

      <button 
        class="btn btn-danger" 
        :disabled="!isScraping"
        @click="stopScraping"
      >
        <iconify-icon icon="material-symbols:stop"></iconify-icon>
        Stop Scraping
      </button>

      <button class="btn btn-outline" @click="saveSession" :disabled="isScraping">
        <iconify-icon icon="material-symbols:save"></iconify-icon>
        Save Session
      </button>

      <button class="btn btn-outline" @click="exportResults" :disabled="results.length === 0 || isScraping">
        <iconify-icon icon="material-symbols:download"></iconify-icon>
        Export Results
      </button>

      <button class="btn btn-outline" @click="clearAll" :disabled="isScraping">
        <iconify-icon icon="material-symbols:clear-all"></iconify-icon>
        Clear All
      </button>
    </div>

    <!-- Progress Tracking -->
    <div v-if="isScraping || progress.total > 0" class="progress-section">
      <h3>Scraping Progress</h3>
      
      <div class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${progress.percentage}%` }"
            :class="{ 'pulse': isScraping }"
          ></div>
        </div>
        <div class="progress-text">
          {{ progress.current }} / {{ progress.total }} items processed
          ({{ progress.percentage }}%) - {{ progress.estimatedTime }}
        </div>
      </div>

      <div class="progress-details">
        <div class="progress-item">
          <span>Platform:</span>
          <span class="platform-badge" :class="progress.platform">
            <iconify-icon :icon="getPlatformIcon(progress.platform)"></iconify-icon>
            {{ formatPlatform(progress.platform) }}
          </span>
        </div>
        <div class="progress-item">
          <span>Status:</span>
          <span :class="`status-${progress.status.toLowerCase()}`">{{ progress.status }}</span>
        </div>
        <div class="progress-item">
          <span>Speed:</span>
          <span>{{ progress.speed }} items/min</span>
        </div>
        <div class="progress-item">
          <span>Success Rate:</span>
          <span>{{ progress.successRate }}%</span>
        </div>
      </div>

      <!-- Multi-platform progress -->
      <div v-if="platformProgress.length > 0" class="multi-platform-progress">
        <h4>Platform Progress</h4>
        <div class="platform-progress-grid">
          <div v-for="platform in platformProgress" :key="platform.name" class="platform-progress-item">
            <div class="platform-name">
              <iconify-icon :icon="getPlatformIcon(platform.name)"></iconify-icon>
              {{ formatPlatform(platform.name) }}
            </div>
            <div class="platform-stats">
              <div class="progress-bar small">
                <div class="progress-fill" :style="{ width: `${platform.percentage}%` }"></div>
              </div>
              <span>{{ platform.current }}/{{ platform.total }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Real-time Logs -->
    <div class="logs-section">
      <div class="logs-header">
        <h3>Scraping Logs</h3>
        <div class="logs-controls">
          <button class="btn btn-sm btn-outline" @click="clearLogs" :disabled="logs.length === 0">
            <iconify-icon icon="material-symbols:clear-all"></iconify-icon>
            Clear Logs
          </button>
          <button class="btn btn-sm btn-outline" @click="exportLogs" :disabled="logs.length === 0">
            <iconify-icon icon="material-symbols:download"></iconify-icon>
            Export Logs
          </button>
          <label class="checkbox-label small">
            <input type="checkbox" v-model="autoScrollLogs">
            Auto-scroll
          </label>
        </div>
      </div>
      
      <div class="logs-container" ref="logsContainer">
        <div 
          v-for="(log, index) in logs" 
          :key="index"
          class="log-entry"
          :class="`log-${log.type}`"
        >
          <iconify-icon :icon="getLogIcon(log.type)"></iconify-icon>
          <span class="log-time">{{ log.time }}</span>
          <span class="log-platform" v-if="log.platform">
            [{{ log.platform.toUpperCase() }}]
          </span>
          <span class="log-message">{{ log.message }}</span>
          <span v-if="log.details" class="log-details" @click="showLogDetails(log)">
            <iconify-icon icon="material-symbols:info"></iconify-icon>
          </span>
        </div>
        
        <div v-if="logs.length === 0" class="no-logs">
          <iconify-icon icon="material-symbols:info"></iconify-icon>
          Logs will appear here when scraping starts
        </div>
      </div>
    </div>

    <!-- Results Display -->
    <div v-if="results.length > 0" class="results-section">
      <div class="results-header">
        <h3>Scraping Results ({{ results.length }} items)</h3>
        <div class="results-actions">
          <div class="results-stats">
            <span class="stat-item">
              <iconify-icon icon="material-symbols:code"></iconify-icon>
              {{ uniqueLanguages.length }} languages
            </span>
            <span class="stat-item">
              <iconify-icon icon="material-symbols:folder"></iconify-icon>
              {{ uniquePlatforms.length }} platforms
            </span>
            <span class="stat-item">
              <iconify-icon icon="material-symbols:data-usage"></iconify-icon>
              {{ totalSize }}
            </span>
          </div>
          <button class="btn btn-sm btn-outline" @click="clearResults">
            <iconify-icon icon="material-symbols:clear-all"></iconify-icon>
            Clear Results
          </button>
        </div>
      </div>

      <!-- Results Filter -->
      <div class="results-filter">
        <div class="filter-group">
          <label>Platform:</label>
          <select v-model="resultsFilter.platform">
            <option value="all">All Platforms</option>
            <option v-for="platform in uniquePlatforms" :key="platform" :value="platform">
              {{ formatPlatform(platform) }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label>Language:</label>
          <select v-model="resultsFilter.language">
            <option value="all">All Languages</option>
            <option v-for="lang in uniqueLanguages" :key="lang" :value="lang">
              {{ lang }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label>Sort by:</label>
          <select v-model="resultsFilter.sortBy">
            <option value="date">Date</option>
            <option value="name">Name</option>
            <option value="platform">Platform</option>
            <option value="language">Language</option>
            <option value="stars">Stars</option>
            <option value="size">Size</option>
          </select>
        </div>
        <div class="filter-group">
          <label>
            <input type="checkbox" v-model="resultsFilter.onlyWithCode">
            Only with code
          </label>
        </div>
      </div>

      <div class="results-grid">
        <div 
          v-for="(result, index) in filteredResults" 
          :key="result.id"
          class="result-card"
          :class="`platform-${result.platform}`"
        >
          <div class="result-header">
            <div class="result-platform">
              <iconify-icon :icon="getPlatformIcon(result.platform)"></iconify-icon>
              {{ formatPlatform(result.platform) }}
            </div>
            <div class="result-actions">
              <button class="btn-icon" @click="viewResult(result)" title="View Details">
                <iconify-icon icon="material-symbols:visibility"></iconify-icon>
              </button>
              <button class="btn-icon" @click="downloadResult(result)" title="Download">
                <iconify-icon icon="material-symbols:download"></iconify-icon>
              </button>
              <button class="btn-icon" @click="copyCode(result)" title="Copy Code" v-if="result.code">
                <iconify-icon icon="material-symbols:content-copy"></iconify-icon>
              </button>
              <button class="btn-icon" @click="bookmarkResult(result)" title="Bookmark">
                <iconify-icon :icon="result.bookmarked ? 'material-symbols:bookmark' : 'material-symbols:bookmark-outline'"></iconify-icon>
              </button>
            </div>
          </div>
          
          <div class="result-content">
            <h4 class="result-title" @click="viewResult(result)">{{ result.title }}</h4>
            <p class="result-description" v-if="result.description">
              {{ result.description }}
            </p>
            
            <div class="result-meta">
              <div v-if="result.language" class="result-language">
                <iconify-icon icon="material-symbols:code"></iconify-icon>
                {{ result.language }}
              </div>
              <div v-if="result.stars" class="result-stars">
                <iconify-icon icon="material-symbols:star"></iconify-icon>
                {{ result.stars }}
              </div>
              <div v-if="result.size" class="result-size">
                <iconify-icon icon="material-symbols:data-usage"></iconify-icon>
                {{ formatFileSize(result.size) }}
              </div>
              <div class="result-date">
                <iconify-icon icon="material-symbols:calendar-today"></iconify-icon>
                {{ formatDate(result.date) }}
              </div>
            </div>

            <!-- Code Preview Snippet -->
            <div v-if="result.code && resultsFilter.onlyWithCode" class="code-snippet">
              <pre><code>{{ truncateCode(result.code) }}</code></pre>
            </div>

            <!-- File Info -->
            <div v-if="result.files" class="file-info">
              <div class="file-count">
                <iconify-icon icon="material-symbols:folder"></iconify-icon>
                {{ result.files.length }} files
              </div>
              <div class="file-types">
                <span v-for="fileType in getUniqueFileTypes(result.files)" :key="fileType" class="file-type-tag">
                  {{ fileType }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="result-footer">
            <a :href="result.url" target="_blank" class="result-link">
              View Source
              <iconify-icon icon="material-symbols:open-in-new"></iconify-icon>
            </a>
            <div class="result-actions-mini">
              <button class="btn-text" @click="toggleFavorite(result)">
                <iconify-icon :icon="result.favorite ? 'material-symbols:favorite' : 'material-symbols:favorite-outline'"></iconify-icon>
                {{ result.favorite ? 'Favorited' : 'Favorite' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMoreResults" class="load-more">
        <button class="btn btn-outline" @click="loadMoreResults" :disabled="isScraping">
          <iconify-icon icon="material-symbols:add"></iconify-icon>
          Load More Results
        </button>
      </div>
    </div>

    <!-- Result Viewer Modal -->
    <div v-if="selectedResult" class="modal-overlay" @click="selectedResult = null">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedResult.title }}</h3>
          <button class="btn-icon" @click="selectedResult = null">
            <iconify-icon icon="material-symbols:close"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="result-details">
            <div class="detail-grid">
              <div class="detail-item">
                <strong>Platform:</strong> 
                <span class="platform-badge" :class="selectedResult.platform">
                  <iconify-icon :icon="getPlatformIcon(selectedResult.platform)"></iconify-icon>
                  {{ formatPlatform(selectedResult.platform) }}
                </span>
              </div>
              <div class="detail-item">
                <strong>URL:</strong> 
                <a :href="selectedResult.url" target="_blank">{{ selectedResult.url }}</a>
              </div>
              <div v-if="selectedResult.language" class="detail-item">
                <strong>Language:</strong> {{ selectedResult.language }}
              </div>
              <div v-if="selectedResult.stars" class="detail-item">
                <strong>Stars:</strong> {{ selectedResult.stars }}
              </div>
              <div v-if="selectedResult.forks" class="detail-item">
                <strong>Forks:</strong> {{ selectedResult.forks }}
              </div>
              <div v-if="selectedResult.size" class="detail-item">
                <strong>Size:</strong> {{ formatFileSize(selectedResult.size) }}
              </div>
              <div class="detail-item">
                <strong>Scraped:</strong> {{ formatDate(selectedResult.date) }}
              </div>
            </div>
            
            <div v-if="selectedResult.description" class="detail-item full-width">
              <strong>Description:</strong> 
              <p>{{ selectedResult.description }}</p>
            </div>
          </div>
          
          <div v-if="selectedResult.code" class="code-preview">
            <div class="code-header">
              <h4>Code Preview</h4>
              <div class="code-actions">
                <button class="btn btn-sm btn-outline" @click="copyCode(selectedResult)">
                  <iconify-icon icon="material-symbols:content-copy"></iconify-icon>
                  Copy Code
                </button>
                <button class="btn btn-sm btn-outline" @click="downloadCode(selectedResult)">
                  <iconify-icon icon="material-symbols:download"></iconify-icon>
                  Download
                </button>
              </div>
            </div>
            <pre class="code-block"><code>{{ selectedResult.code }}</code></pre>
          </div>

          <div v-if="selectedResult.files && selectedResult.files.length > 0" class="files-preview">
            <h4>Files ({{ selectedResult.files.length }})</h4>
            <div class="files-grid">
              <div v-for="file in selectedResult.files" :key="file.name" class="file-item">
                <iconify-icon :icon="getFileIcon(file.name)"></iconify-icon>
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export Modal -->
    <div v-if="showExportModal" class="modal-overlay" @click="showExportModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Export Results</h3>
          <button class="btn-icon" @click="showExportModal = false">
            <iconify-icon icon="material-symbols:close"></iconify-icon>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="export-options">
            <label class="radio-label">
              <input type="radio" v-model="exportConfig.format" value="json">
              <span class="radio-custom"></span>
              JSON Format
            </label>
            <label class="radio-label">
              <input type="radio" v-model="exportConfig.format" value="csv">
              <span class="radio-custom"></span>
              CSV Format
            </label>
            <label class="radio-label">
              <input type="radio" v-model="exportConfig.format" value="html">
              <span class="radio-custom"></span>
              HTML Report
            </label>
            <label class="radio-label">
              <input type="radio" v-model="exportConfig.format" value="markdown">
              <span class="radio-custom"></span>
              Markdown
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="exportConfig.includeCode">
              Include code content
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="exportConfig.includeMetadata">
              Include metadata
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="exportConfig.onlyBookmarked">
              Only bookmarked items
            </label>
          </div>

          <button class="btn btn-primary" @click="performExport">
            <iconify-icon icon="material-symbols:download"></iconify-icon>
            Export Results
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'CodeScraper',
  data() {
    return {
      isScraping: false,
      showAdvancedSettings: false,
      showExportModal: false,
      selectedResult: null,
      autoScrollLogs: true,
      fileTypes: [
        { value: '.js', label: 'JavaScript', icon: '🟨' },
        { value: '.ts', label: 'TypeScript', icon: '🔷' },
        { value: '.py', label: 'Python', icon: '🐍' },
        { value: '.java', label: 'Java', icon: '☕' },
        { value: '.cpp', label: 'C++', icon: '⚙️' },
        { value: '.cs', label: 'C#', icon: '🔷' },
        { value: '.php', label: 'PHP', icon: '🐘' },
        { value: '.rb', label: 'Ruby', icon: '💎' },
        { value: '.go', label: 'Go', icon: '🐹' },
        { value: '.rs', label: 'Rust', icon: '🦀' },
        { value: '.html', label: 'HTML', icon: '🌐' },
        { value: '.css', label: 'CSS', icon: '🎨' },
        { value: '.json', label: 'JSON', icon: '📋' },
        { value: '.xml', label: 'XML', icon: '📄' },
        { value: '.md', label: 'Markdown', icon: '📝' },
        { value: '.yml', label: 'YAML', icon: '⚙️' }
      ],
      scrapingConfig: {
        query: '',
        platform: 'github',
        selectedPlatforms: ['github', 'stackoverflow'],
        maxResults: 50,
        fileTypes: ['.js', '.py', '.java', '.html', '.css'],
        language: '',
        complexity: 'any',
        includeForks: false,
        includeArchived: false,
        includeTests: false,
        includeDocumentation: false,
        downloadFiles: true,
        proxyGroup: 'none',
        account: 'none',
        sessionName: '',
        requestDelay: 1000,
        timeout: 60,
        minStars: 0,
        minForks: 0,
        updatedAfter: ''
      },
      progress: {
        current: 0,
        total: 0,
        percentage: 0,
        platform: '',
        status: 'Ready',
        speed: 0,
        successRate: 100,
        estimatedTime: 'Calculating...'
      },
      platformProgress: [],
      logs: [],
      results: [],
      proxyGroups: [],
      accounts: [],
      resultsFilter: {
        platform: 'all',
        language: 'all',
        sortBy: 'date',
        onlyWithCode: false
      },
      exportConfig: {
        format: 'json',
        includeCode: true,
        includeMetadata: true,
        onlyBookmarked: false
      },
      scraper: null,
      hasMoreResults: false
    }
  },
  computed: {
    filteredResults() {
      let filtered = this.results

      // Platform filter
      if (this.resultsFilter.platform !== 'all') {
        filtered = filtered.filter(result => result.platform === this.resultsFilter.platform)
      }

      // Language filter
      if (this.resultsFilter.language !== 'all') {
        filtered = filtered.filter(result => result.language === this.resultsFilter.language)
      }

      // Only with code filter
      if (this.resultsFilter.onlyWithCode) {
        filtered = filtered.filter(result => result.code)
      }

      // Sort results
      filtered = this.sortResults(filtered, this.resultsFilter.sortBy)

      return filtered
    },
    uniquePlatforms() {
      return [...new Set(this.results.map(result => result.platform))]
    },
    uniqueLanguages() {
      return [...new Set(this.results.map(result => result.language).filter(Boolean))]
    },
    totalSize() {
      const totalBytes = this.results.reduce((sum, result) => sum + (result.size || 0), 0)
      return this.formatFileSize(totalBytes)
    }
  },
  async mounted() {
    await this.loadProxyGroups()
    await this.loadAccounts()
    if (window.electronAPI) {
  window.electronAPI.onScrapingProgress((event, data) => {
    this.progress.current = data.current || this.progress.current
    this.progress.total = data.total || this.progress.total
    this.progress.percentage = data.progress || this.progress.percentage
    this.progress.status = data.status || this.progress.status
    this.progress.platform = data.platform || this.progress.platform
    
    if (data.scraperId) {
      this.currentScraperId = data.scraperId
    }
  })

  window.electronAPI.onScrapingError((event, data) => {
    this.addLog('error', data.error || 'Scraping error occurred')
    this.isScraping = false
    this.progress.status = 'Error'
  })
}
    // Load previous results and session
    this.loadSavedData()
  },
  watch: {
    autoScrollLogs(newVal) {
      if (newVal) {
        this.scrollLogsToBottom()
      }
    },
    logs() {
      if (this.autoScrollLogs) {
        this.$nextTick(() => {
          this.scrollLogsToBottom()
        })
      }
    }
  },
  methods: {
    async loadProxyGroups() {
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.getProxyGroups()
          if (result.success) {
            this.proxyGroups = result.groups
          }
        } else {
          // Demo data
          this.proxyGroups = ['Premium Proxies', 'Residential Pool', 'Datacenter Fast']
        }
      } catch (error) {
        console.error('Error loading proxy groups:', error)
        this.addLog('error', 'Failed to load proxy groups')
      }
    },
    
    async loadAccounts() {
      try {
        const savedAccounts = localStorage.getItem('codeScraperAccounts')
        if (savedAccounts) {
          this.accounts = JSON.parse(savedAccounts)
        } else {
          // Demo accounts
          this.accounts = [
            { id: '1', platform: 'github', username: 'demo-user', status: 'active' },
            { id: '2', platform: 'gitlab', username: 'demo-user', status: 'active' }
          ]
        }
      } catch (error) {
        console.error('Error loading accounts:', error)
        this.addLog('error', 'Failed to load accounts')
      }
    },

    loadSavedData() {
      // Load previous results
      const savedResults = localStorage.getItem('codeScraperResults')
      if (savedResults) {
        this.results = JSON.parse(savedResults)
      }

      // Load session
      const savedSession = localStorage.getItem('codeScraperSession')
      if (savedSession) {
        const session = JSON.parse(savedSession)
        this.scrapingConfig = { ...this.scrapingConfig, ...session }
      }

      // Load logs
      const savedLogs = localStorage.getItem('codeScraperLogs')
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs).slice(0, 100) // Keep only recent logs
      }
    },
    
    handlePlatformChange() {
      if (this.scrapingConfig.platform === 'global') {
        this.addLog('info', 'Global web scraping enabled. This will search across the entire web.')
      } else if (this.scrapingConfig.platform === 'multiple') {
        this.addLog('info', `Multiple platform scraping enabled for: ${this.scrapingConfig.selectedPlatforms.join(', ')}`)
      }
    },
    
    async startQuickScraping() {
      this.scrapingConfig.query = 'javascript react nodejs python'
      this.scrapingConfig.maxResults = 25
      this.scrapingConfig.platform = 'github'
      
      this.addLog('info', 'Starting quick scraping session with default settings...')
      await this.startScraping()
    },
    
async startScraping() {
  if (!this.scrapingConfig.query.trim()) {
    this.addLog('error', 'Please enter a search query')
    return
  }

  if (this.scrapingConfig.platform === 'multiple' && this.scrapingConfig.selectedPlatforms.length === 0) {
    this.addLog('error', 'Please select at least one platform for multi-platform scraping')
    return
  }
  
  this.isScraping = true
  this.progress = {
    current: 0,
    total: this.scrapingConfig.maxResults,
    percentage: 0,
    platform: this.scrapingConfig.platform,
    status: 'Initializing...',
    speed: 0,
    successRate: 100,
    estimatedTime: 'Calculating...'
  }

  this.platformProgress = this.scrapingConfig.platform === 'multiple' 
    ? this.scrapingConfig.selectedPlatforms.map(platform => ({
        name: platform,
        current: 0,
        total: Math.floor(this.scrapingConfig.maxResults / this.scrapingConfig.selectedPlatforms.length),
        percentage: 0
      }))
    : []
  
  this.addLog('info', `Starting scraping session: ${this.scrapingConfig.query}`)
  
  try {
    // Use IPC to call Electron main process instead of direct scraper
    const result = await window.electronAPI.startScraping(this.scrapingConfig)
    
    if (result.success) {
      this.results = result.data
      this.addLog('success', `Scraping completed! Found ${this.results.length} results`)
      this.progress.status = 'Completed'
      this.progress.current = this.results.length
      this.progress.percentage = 100
    } else {
      throw new Error(result.error)
    }
    
  } catch (error) {
    this.addLog('error', `Scraping failed: ${error.message}`)
    console.error('Scraping error:', error)
  } finally {
    this.isScraping = false
    
    // Save results and session
    this.saveData()
  }
},  // ← END of startScraping method

addLog(type, message, platform = null) {
  const logEntry = {
    type,
    message,
    platform,
    time: new Date().toLocaleTimeString()
  }
  
  this.logs.unshift(logEntry)
  
  // Keep only last 200 logs
  if (this.logs.length > 200) {
    this.logs = this.logs.slice(0, 200)
  }

  // Save logs periodically
  if (this.logs.length % 10 === 0) {
    this.saveData()
  }
},

clearLogs() {
  this.logs = []
  localStorage.removeItem('codeScraperLogs')
  this.addLog('info', 'Logs cleared')
},

exportLogs() {
  const logData = this.logs.map(log => ({
    timestamp: new Date().toISOString(),
    time: log.time,
    type: log.type,
    platform: log.platform,
    message: log.message
  }))

  const dataStr = JSON.stringify(logData, null, 2)
  this.downloadFile(dataStr, `code-scraper-logs-${new Date().toISOString().split('T')[0]}.json`, 'application/json')
  
  this.addLog('success', 'Logs exported successfully')
},

clearResults() {
  this.results = []
  localStorage.removeItem('codeScraperResults')
  this.addLog('info', 'Results cleared')
},

clearAll() {
  this.clearResults()
  this.clearLogs()
  this.progress = {
    current: 0,
    total: 0,
    percentage: 0,
    platform: '',
    status: 'Ready',
    speed: 0,
    successRate: 100,
    estimatedTime: 'Calculating...'
  }
  this.addLog('info', 'All data cleared')
},

viewResult(result) {
  this.selectedResult = result
},

async downloadResult(result) {
  this.addLog('info', `Downloading: ${result.title}`)
  
  if (result.code) {
    this.downloadFile(result.code, `${result.title}.${this.getFileExtension(result.language)}`, 'text/plain')
  } else {
    // Download metadata as JSON
    const metadata = { ...result }
    delete metadata.code // Don't include code in metadata download
    this.downloadFile(JSON.stringify(metadata, null, 2), `${result.title}-metadata.json`, 'application/json')
  }
},

copyCode(result) {
  if (result.code) {
    navigator.clipboard.writeText(result.code)
    this.addLog('success', `Code copied to clipboard: ${result.title}`)
    
    // Show temporary feedback
    const originalTitle = result.title
    result.title = '✓ Copied!'
    setTimeout(() => {
      result.title = originalTitle
    }, 1000)
  }
},

downloadCode(result) {
  if (result.code) {
    this.downloadFile(result.code, `${result.title}.${this.getFileExtension(result.language)}`, 'text/plain')
    this.addLog('success', `Code downloaded: ${result.title}`)
  }
},

bookmarkResult(result) {
  result.bookmarked = !result.bookmarked
  this.addLog('info', `${result.bookmarked ? 'Bookmarked' : 'Unbookmarked'}: ${result.title}`)
  this.saveData()
},

toggleFavorite(result) {
  result.favorite = !result.favorite
  this.addLog('info', `${result.favorite ? 'Added to favorites' : 'Removed from favorites'}: ${result.title}`)
  this.saveData()
},

showLogDetails(log) {
  // Show detailed log information
  alert(`Log Details:\nTime: ${log.time}\nType: ${log.type}\nPlatform: ${log.platform || 'N/A'}\nMessage: ${log.message}`)
},

scrollLogsToBottom() {
  const container = this.$refs.logsContainer
  if (container) {
    container.scrollTop = container.scrollHeight
  }
},

exportResults() {
  this.showExportModal = true
},

    async performExport() {
      let dataToExport = this.results

      if (this.exportConfig.onlyBookmarked) {
        dataToExport = dataToExport.filter(result => result.bookmarked)
      }

      if (!this.exportConfig.includeCode) {
        dataToExport = dataToExport.map(({ code, ...result }) => result)
      }

      if (!this.exportConfig.includeMetadata) {
        dataToExport = dataToExport.map(({ favorite, bookmarked, ...result }) => result)
      }

      let exportData = ''
      let fileExtension = ''
      let mimeType = ''

      switch (this.exportConfig.format) {
        case 'json':
          exportData = JSON.stringify(dataToExport, null, 2)
          fileExtension = 'json'
          mimeType = 'application/json'
          break
        case 'csv':
          exportData = this.convertToCSV(dataToExport)
          fileExtension = 'csv'
          mimeType = 'text/csv'
          break
        case 'html':
          exportData = this.convertToHTML(dataToExport)
          fileExtension = 'html'
          mimeType = 'text/html'
          break
        case 'markdown':
          exportData = this.convertToMarkdown(dataToExport)
          fileExtension = 'md'
          mimeType = 'text/markdown'
          break
      }

      this.downloadFile(exportData, `code-scraper-export-${new Date().toISOString().split('T')[0]}.${fileExtension}`, mimeType)
      this.showExportModal = false
      this.addLog('success', `Exported ${dataToExport.length} results as ${this.exportConfig.format.toUpperCase()}`)
    },

    convertToCSV(data) {
      const headers = ['Platform', 'Title', 'Language', 'URL', 'Date', 'Stars', 'Size']
      const csvRows = [headers.join(',')]
      
      for (const row of data) {
        const values = [
          `"${row.platform}"`,
          `"${row.title}"`,
          `"${row.language || ''}"`,
          `"${row.url}"`,
          `"${row.date}"`,
          `"${row.stars || ''}"`,
          `"${row.size || ''}"`
        ]
        csvRows.push(values.join(','))
      }
      
      return csvRows.join('\n')
    },

    convertToHTML(data) {
      let html = `<!DOCTYPE html>
<html>
<head>
    <title>CodeScraper Export</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .result { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .platform { font-weight: bold; color: #666; }
        .code { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>CodeScraper Export</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
    <p>Total results: ${data.length}</p>
    <div class="results">
`

      for (const item of data) {
        html += `
        <div class="result">
            <div class="platform">${this.formatPlatform(item.platform)}</div>
            <h3>${item.title}</h3>
            <p><strong>Language:</strong> ${item.language || 'N/A'}</p>
            <p><strong>URL:</strong> <a href="${item.url}" target="_blank">${item.url}</a></p>
            <p><strong>Date:</strong> ${this.formatDate(item.date)}</p>
            ${item.code ? `<div class="code"><pre><code>${item.code}</code></pre></div>` : ''}
        </div>`
      }

      html += `
    </div>
</body>
</html>`
      
      return html
    },

    convertToMarkdown(data) {
      let markdown = `# CodeScraper Export\n\n`
      markdown += `Generated on: ${new Date().toLocaleString()}\n`
      markdown += `Total results: ${data.length}\n\n`

      for (const item of data) {
        markdown += `## ${item.title}\n\n`
        markdown += `- **Platform**: ${this.formatPlatform(item.platform)}\n`
        markdown += `- **Language**: ${item.language || 'N/A'}\n`
        markdown += `- **URL**: [${item.url}](${item.url})\n`
        markdown += `- **Date**: ${this.formatDate(item.date)}\n`
        if (item.stars) markdown += `- **Stars**: ${item.stars}\n`
        if (item.size) markdown += `- **Size**: ${this.formatFileSize(item.size)}\n`
        
        if (item.code) {
          markdown += `\n\`\`\`${item.language || 'text'}\n${item.code}\n\`\`\`\n`
        }
        
        markdown += '\n---\n\n'
      }
      
      return markdown
    },

    downloadFile(content, filename, mimeType) {
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    },

    async saveSession() {
      if (this.scrapingConfig.sessionName) {
        const sessionData = {
          ...this.scrapingConfig,
          timestamp: new Date().toISOString(),
          resultCount: this.results.length
        }
        
        localStorage.setItem(`codeScraperSession_${this.scrapingConfig.sessionName}`, JSON.stringify(sessionData))
        this.addLog('success', `Session "${this.scrapingConfig.sessionName}" saved`)
      } else {
        this.addLog('error', 'Please enter a session name')
      }
    },

    async loadSavedSession() {
      // In a real app, you'd show a list of saved sessions
      const sessionName = prompt('Enter session name to load:')
      if (sessionName) {
        const savedSession = localStorage.getItem(`codeScraperSession_${sessionName}`)
        if (savedSession) {
          const session = JSON.parse(savedSession)
          this.scrapingConfig = { ...this.scrapingConfig, ...session }
          this.addLog('success', `Session "${sessionName}" loaded`)
        } else {
          this.addLog('error', `Session "${sessionName}" not found`)
        }
      }
    },

    loadMoreResults() {
      // Implementation for pagination
      this.addLog('info', 'Loading more results...')
      // This would trigger additional scraping with offset
    },

    saveData() {
      localStorage.setItem('codeScraperResults', JSON.stringify(this.results))
      localStorage.setItem('codeScraperLogs', JSON.stringify(this.logs))
      localStorage.setItem('codeScraperSession', JSON.stringify(this.scrapingConfig))
    },

    sortResults(results, sortBy) {
      return results.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.title.localeCompare(b.title)
          case 'platform':
            return a.platform.localeCompare(b.platform)
          case 'language':
            return (a.language || '').localeCompare(b.language || '')
          case 'stars':
            return (b.stars || 0) - (a.stars || 0)
          case 'size':
            return (b.size || 0) - (a.size || 0)
          case 'date':
          default:
            return new Date(b.date) - new Date(a.date)
        }
      })
    },

    getUniqueFileTypes(files) {
      const extensions = files.map(file => {
        const ext = file.name.split('.').pop()
        return ext ? `.${ext}` : 'unknown'
      })
      return [...new Set(extensions)].slice(0, 3) // Show max 3 file types
    },

    truncateCode(code, maxLength = 200) {
      if (code.length <= maxLength) return code
      return code.substring(0, maxLength) + '...'
    },

    getFileExtension(language) {
      const extensions = {
        javascript: 'js',
        typescript: 'ts',
        python: 'py',
        java: 'java',
        cpp: 'cpp',
        csharp: 'cs',
        php: 'php',
        ruby: 'rb',
        go: 'go',
        rust: 'rs',
        html: 'html',
        css: 'css'
      }
      return extensions[language?.toLowerCase()] || 'txt'
    },

    getFileIcon(filename) {
      const extension = filename.split('.').pop()?.toLowerCase()
      const icons = {
        js: 'material-symbols:javascript',
        ts: 'material-symbols:typescript',
        py: 'material-symbols:python',
        java: 'material-symbols:java',
        cpp: 'material-symbols:cpp',
        cs: 'material-symbols:csharp',
        php: 'material-symbols:php',
        rb: 'material-symbols:ruby',
        go: 'material-symbols:go',
        rs: 'material-symbols:rust',
        html: 'material-symbols:html',
        css: 'material-symbols:css',
        json: 'material-symbols:json',
        xml: 'material-symbols:xml',
        md: 'material-symbols:markdown',
        yml: 'material-symbols:yaml',
        yaml: 'material-symbols:yaml'
      }
      return icons[extension] || 'material-symbols:code'
    },
    
    getLogIcon(type) {
      const icons = {
        info: 'material-symbols:info',
        success: 'material-symbols:check-circle',
        warning: 'material-symbols:warning',
        error: 'material-symbols:error'
      }
      return icons[type] || icons.info
    },
    
    getPlatformIcon(platform) {
      const icons = {
        github: 'mdi:github',
        stackoverflow: 'simple-icons:stackoverflow',
        gitlab: 'mdi:gitlab',
        bitbucket: 'mdi:bitbucket',
        codepen: 'simple-icons:codepen',
        web: 'material-symbols:public'
      }
      return icons[platform] || 'material-symbols:code'
    },

    formatPlatform(platform) {
      const platforms = {
        github: 'GitHub',
        stackoverflow: 'Stack Overflow',
        gitlab: 'GitLab',
        bitbucket: 'Bitbucket',
        codepen: 'CodePen',
        web: 'Web Search'
      }
      return platforms[platform] || platform
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    },

    formatFileSize(bytes) {
      if (!bytes) return '0 B'
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    },
    
    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2)
    }
  },
  
}
</script>

<style scoped>
/* Enhanced styles for the advanced scraper */
.quick-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.scraping-configuration,
.execution-config {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.platform-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
}

.file-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--bg-primary);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
}

.file-type-icon {
  margin-right: 0.5rem;
  font-size: 1.2em;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 1rem;
}

.checkbox-label.small {
  font-size: 0.875rem;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.proxy-status,
.account-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--success);
  margin-top: 0.25rem;
}

.scraping-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.progress-section {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.progress-container {
  margin-bottom: 1rem;
}

.progress-bar {
  background: var(--bg-primary);
  border-radius: 10px;
  height: 8px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar.small {
  height: 4px;
}

.progress-fill {
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  height: 100%;
  transition: width 0.3s ease;
}

.progress-fill.pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.progress-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--bg-primary);
  border-radius: 12px;
  font-size: 0.875rem;
  border: 1px solid var(--border-color);
}

.status-completed { color: var(--success); }
.status-initializing { color: var(--warning); }
.status-error { color: var(--error); }
.status-stopped { color: var(--text-secondary); }

.multi-platform-progress {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.platform-progress-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.platform-progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-primary);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
}

.platform-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.platform-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logs-section {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.logs-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logs-container {
  height: 200px;
  overflow-y: auto;
  background: var(--bg-primary);
  border-radius: var(--radius);
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid var(--border-color);
}

.log-info { color: var(--text-primary); }
.log-success { color: var(--success); }
.log-warning { color: var(--warning); }
.log-error { color: var(--error); }

.log-time {
  color: var(--text-secondary);
  font-size: 0.75rem;
  min-width: 80px;
}

.log-platform {
  color: var(--primary);
  font-weight: 500;
  font-size: 0.75rem;
}

.log-details {
  color: var(--text-secondary);
  cursor: pointer;
  margin-left: auto;
}

.log-details:hover {
  color: var(--primary);
}

.no-logs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  justify-content: center;
  height: 100%;
}

.results-section {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.results-stats {
  display: flex;
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.results-filter {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.result-card {
  background: var(--bg-primary);
  border-radius: var(--radius);
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.result-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.platform-github { border-left: 4px solid #28a745; }
.platform-gitlab { border-left: 4px solid #fc6d26; }
.platform-bitbucket { border-left: 4px solid #0052cc; }
.platform-codepen { border-left: 4px solid #000000; }
.platform-stackoverflow { border-left: 4px solid #f48024; }
.platform-web { border-left: 4px solid #0ea5e9; }

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.result-platform {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.result-actions {
  display: flex;
  gap: 0.25rem;
}

.result-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  cursor: pointer;
  line-height: 1.3;
}

.result-title:hover {
  color: var(--primary);
}

.result-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 1rem;
  flex-grow: 1;
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.result-meta > div {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.code-snippet {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 0.75rem;
  margin: 0.5rem 0;
  border: 1px solid var(--border-color);
  max-height: 100px;
  overflow: hidden;
}

.code-snippet pre {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.3;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-all;
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: var(--card-bg);
  border-radius: var(--radius);
  font-size: 0.8rem;
}

.file-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-secondary);
}

.file-types {
  display: flex;
  gap: 0.25rem;
}

.file-type-tag {
  background: var(--primary);
  color: white;
  padding: 0.1rem 0.4rem;
  border-radius: 8px;
  font-size: 0.7rem;
}

.result-footer {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.result-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary);
  text-decoration: none;
  font-size: 0.9rem;
}

.result-link:hover {
  text-decoration: underline;
}

.result-actions-mini {
  display: flex;
  gap: 0.5rem;
}

.btn-text {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-text:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
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
  max-width: 900px;
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
}

.detail-item {
  margin-bottom: 0.5rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item a {
  color: var(--primary);
  text-decoration: none;
  word-break: break-all;
}

.detail-item a:hover {
  text-decoration: underline;
}

.code-preview {
  background: var(--bg-primary);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.code-block {
  margin: 0;
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
  background: var(--card-bg);
  border-radius: 0 0 var(--radius) var(--radius);
}

.code-block code {
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.4;
}

.files-preview {
  background: var(--bg-primary);
  border-radius: var(--radius);
  padding: 1rem;
  border: 1px solid var(--border-color);
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--card-bg);
  border-radius: var(--radius);
  font-size: 0.875rem;
}

.file-name {
  flex: 1;
  word-break: break-all;
}

.file-size {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.export-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  transition: all 0.2s ease;
}

.radio-label:hover {
  border-color: var(--primary);
  background: var(--bg-primary);
}

.radio-label input[type="radio"] {
  display: none;
}

.radio-custom {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  position: relative;
  transition: all 0.2s ease;
}

.radio-label input[type="radio"]:checked + .radio-custom {
  border-color: var(--primary);
  background: var(--primary);
}

.radio-label input[type="radio"]:checked + .radio-custom::after {
  content: '';
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.mt-2 {
  margin-top: 0.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .quick-actions {
    flex-direction: column;
  }
  
  .scraping-controls {
    flex-direction: column;
  }
  
  .results-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    padding: 1rem;
  }
  
  .results-header,
  .logs-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .results-stats {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .results-filter {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .filter-group select {
    flex: 1;
  }
}
/* Enhanced progress indicators */
.scraping-progress {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.progress-stat {
  text-align: center;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: var(--radius);
}

.progress-stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  display: block;
}

.progress-stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  display: block;
}

/* Enhanced result cards */
.result-card.featured {
  border: 2px solid var(--primary-color);
  background: linear-gradient(135deg, var(--card-bg) 0%, rgba(99, 102, 241, 0.05) 100%);
}

.result-card .code-preview {
  position: relative;
}

.result-card .code-preview::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
}

/* Enhanced platform badges */
.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.platform-badge.github {
  background: rgba(36, 41, 46, 0.1);
  color: #24292e;
  border: 1px solid rgba(36, 41, 46, 0.2);
}

.platform-badge.stackoverflow {
  background: rgba(244, 128, 36, 0.1);
  color: #f48024;
  border: 1px solid rgba(244, 128, 36, 0.2);
}

.platform-badge.gitlab {
  background: rgba(252, 109, 38, 0.1);
  color: #fc6d26;
  border: 1px solid rgba(252, 109, 38, 0.2);
}

/* Enhanced filter controls */
.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group select {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 0.5rem;
  color: var(--text-primary);
  font-size: 0.875rem;
}

/* Enhanced log entries */
.log-entry {
  transition: all 0.2s ease;
}

.log-entry:hover {
  background: var(--bg-primary);
  transform: translateX(4px);
}

.log-entry.error {
  border-left: 3px solid var(--error-color);
}

.log-entry.warning {
  border-left: 3px solid var(--warning-color);
}

.log-entry.success {
  border-left: 3px solid var(--success-color);
}

.log-entry.info {
  border-left: 3px solid var(--primary-color);
}
</style>