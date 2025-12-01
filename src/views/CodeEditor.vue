<template>
  <div class="code-editor-tab">
    <!-- Header Section -->
    <div class="tab-header">
      <h1><iconify-icon icon="ion:code-slash"></iconify-icon> Code Editor & Runner</h1>
      <p>Edit and manage your scraped code with syntax highlighting, advanced file editing with built-in code preview and execution</p>
    </div>

    <!-- Editor Statistics -->
    <div class="editor-stats-grid">
      <div class="stat-card" v-for="stat in editorStats" :key="stat.id" :class="stat.class">
        <div class="stat-icon">
          <iconify-icon :icon="stat.icon"></iconify-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stat.value }}</h3>
          <p>{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Mode Toggle -->
    <div class="mode-toggle">
      <div class="toggle-buttons">
        <button class="toggle-btn" :class="{ active: currentMode === 'advanced' }" 
                @click="currentMode = 'advanced'">
          <iconify-icon icon="material-symbols:code-blocks"></iconify-icon>
          Advanced Editor
        </button>
        <button class="toggle-btn" :class="{ active: currentMode === 'simple' }" 
                @click="currentMode = 'simple'">
          <iconify-icon icon="material-symbols:play-arrow"></iconify-icon>
          Quick Runner
        </button>
      </div>
    </div>

    <!-- Advanced Editor Mode -->
    <div v-if="currentMode === 'advanced'" class="advanced-editor-mode">
      <!-- Main Editor Layout -->
      <div class="editor-layout">
        <!-- Sidebar - File Explorer -->
        <div class="editor-sidebar">
          <div class="sidebar-header">
            <h3>File Explorer</h3>
            <div class="sidebar-actions">
              <button class="btn-icon" @click="refreshFiles" title="Refresh">
                <iconify-icon icon="material-symbols:refresh"></iconify-icon>
              </button>
              <button class="btn-icon" @click="createNewFile" title="New File">
                <iconify-icon icon="material-symbols:add"></iconify-icon>
              </button>
              <button class="btn-icon" @click="createNewFolder" title="New Folder">
                <iconify-icon icon="material-symbols:create-new-folder"></iconify-icon>
              </button>
            </div>
          </div>

          <!-- File Tree -->
          <div class="file-tree">
            <div class="tree-header">
              <div class="tree-search">
                <iconify-icon icon="material-symbols:search" class="search-icon"></iconify-icon>
                <input type="text" v-model="fileSearch" placeholder="Search files..." class="search-input">
              </div>
            </div>

            <div class="tree-content">
              <file-tree-node
                v-for="item in filteredFileTree"
                :key="item.path"
                :node="item"
                :selected-file="currentFile"
                @select="selectFile"
                @rename="renameFile"
                @delete="deleteFile"
              />
            </div>
          </div>

          <!-- Recent Files -->
          <div class="recent-files">
            <h4>Recent Files</h4>
            <div class="recent-list">
              <div v-for="file in recentFiles" :key="file.path" 
                   class="recent-item" :class="{ active: currentFile?.path === file.path }"
                   @click="selectFile(file)">
                <iconify-icon :icon="getFileIcon(file.name)"></iconify-icon>
                <span class="recent-name">{{ file.name }}</span>
                <span class="recent-path">{{ getRelativePath(file.path) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Editor Area -->
        <div class="editor-main">
          <!-- Editor Tabs -->
          <div class="editor-tabs">
            <div v-for="tab in openTabs" :key="tab.path" 
                 class="editor-tab" :class="{ active: currentFile?.path === tab.path }"
                 @click="selectFile(tab)">
              <iconify-icon :icon="getFileIcon(tab.name)"></iconify-icon>
              <span class="tab-name">{{ tab.name }}</span>
              <button class="tab-close" @click.stop="closeTab(tab)">
                <iconify-icon icon="material-symbols:close"></iconify-icon>
              </button>
            </div>
          </div>

          <!-- Editor Toolbar -->
          <div class="editor-toolbar">
            <div class="toolbar-left">
              <select v-model="currentLanguage" class="language-select" @change="handleLanguageChange">
                <option v-for="lang in supportedLanguages" :key="lang.value" :value="lang.value">
                  {{ lang.name }}
                </option>
              </select>
              
              <div class="toolbar-buttons">
                <button class="btn-icon" @click="saveFile" :disabled="!currentFile" title="Save (Ctrl+S)">
                  <iconify-icon icon="material-symbols:save"></iconify-icon>
                </button>
                <button class="btn-icon" @click="formatCode" :disabled="!currentFile" title="Format Code">
                  <iconify-icon icon="material-symbols:format_ink_highlighter"></iconify-icon>
                </button>
                <button class="btn-icon" @click="findInFile" title="Find (Ctrl+F)">
                  <iconify-icon icon="material-symbols:search"></iconify-icon>
                </button>
                <button class="btn-icon" @click="toggleComment" :disabled="!currentFile" title="Toggle Comment">
                  <iconify-icon icon="material-symbols:format_quote"></iconify-icon>
                </button>
                <button class="btn-icon" @click="togglePreview" :title="showPreview ? 'Hide Preview' : 'Show Preview'">
                  <iconify-icon :icon="showPreview ? 'material-symbols:visibility-off' : 'material-symbols:visibility'"></iconify-icon>
                </button>
              </div>
            </div>

            <div class="toolbar-right">
              <div class="editor-info">
                <span class="cursor-position">Ln {{ cursorLine }}, Col {{ cursorColumn }}</span>
                <span class="file-size" v-if="currentFile">{{ formatFileSize(currentFile.size) }}</span>
              </div>
              
              <div class="toolbar-buttons">
                <button class="btn-icon" @click="toggleSidebar" title="Toggle Sidebar">
                  <iconify-icon icon="material-symbols:sidebar"></iconify-icon>
                </button>
                <button class="btn-icon" @click="toggleTheme" :title="`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`">
                  <iconify-icon :icon="isDarkTheme ? 'material-symbols:light-mode' : 'material-symbols:dark-mode'"></iconify-icon>
                </button>
                <button class="btn-icon" @click="zoomOut" title="Zoom Out">
                  <iconify-icon icon="material-symbols:zoom-out"></iconify-icon>
                </button>
                <button class="btn-icon" @click="zoomIn" title="Zoom In">
                  <iconify-icon icon="material-symbols:zoom-in"></iconify-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Editor and Preview Container -->
          <div class="editor-preview-container" :class="{ 'preview-active': showPreview }">
            <!-- Code Editor -->
            <div class="code-editor-section">
              <div class="code-editor-container">
                <div class="editor-line-numbers">
                  <div v-for="line in visibleLines" :key="line" 
                       class="line-number" :class="{ active: line === cursorLine }">
                    {{ line }}
                  </div>
                </div>

                <textarea
                  ref="editorTextarea"
                  v-model="editorContent"
                  @input="handleContentChange"
                  @keydown="handleKeydown"
                  @scroll="handleScroll"
                  @click="updateCursorPosition"
                  @keyup="updateCursorPosition"
                  class="code-editor"
                  :style="editorStyles"
                  spellcheck="false"
                ></textarea>

                <!-- Syntax Highlighting Overlay -->
                <div class="syntax-highlighting" ref="highlightOverlay"
                     :style="editorStyles">
                  <div v-for="(line, index) in highlightedLines" :key="index" 
                       class="highlight-line" v-html="line"></div>
                </div>
              </div>

              <!-- Editor Status Bar -->
              <div class="editor-statusbar">
                <div class="status-left">
                  <span class="status-item" v-if="currentFile">
                    {{ currentLanguage.toUpperCase() }}
                  </span>
                  <span class="status-item" v-if="currentFile">
                    {{ lineCount }} lines
                  </span>
                  <span class="status-item" v-if="currentFile">
                    {{ characterCount }} characters
                  </span>
                </div>
                <div class="status-right">
                  <span class="status-item">
                    Encoding: UTF-8
                  </span>
                  <span class="status-item">
                    Line Endings: LF
                  </span>
                  <span class="status-item" @click="toggleWordWrap" style="cursor: pointer">
                    Wrap: {{ wordWrap ? 'On' : 'Off' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Live Preview Section -->
            <div v-if="showPreview" class="preview-section">
              <div class="preview-header">
                <h4>Live Preview</h4>
                <div class="preview-actions">
                  <button class="btn-icon" @click="refreshPreview" title="Refresh Preview">
                    <iconify-icon icon="material-symbols:refresh"></iconify-icon>
                  </button>
                  <button class="btn-icon" @click="openInNewWindow" title="Open in New Window">
                    <iconify-icon icon="material-symbols:open-in-new"></iconify-icon>
                  </button>
                  <button class="btn-icon" @click="togglePreview" title="Close Preview">
                    <iconify-icon icon="material-symbols:close"></iconify-icon>
                  </button>
                </div>
              </div>
              
              <div class="preview-content">
                <iframe 
                  v-if="isHtmlFile && showPreview"
                  ref="previewFrame"
                  class="preview-frame"
                  sandbox="allow-scripts allow-same-origin"
                  :srcdoc="generatePreviewHtml()"
                ></iframe>
                
                <!-- Default Preview for other file types -->
                <div v-else class="default-preview">
                  <div class="preview-placeholder">
                    <iconify-icon icon="material-symbols:code" class="preview-icon"></iconify-icon>
                    <h3>Live Preview</h3>
                    <p>Preview is available for HTML files</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel - File Info & Tools -->
      <div class="editor-right-panel" v-if="showRightPanel">
        <div class="panel-tabs">
          <button class="panel-tab" :class="{ active: rightPanelTab === 'info' }" 
                  @click="rightPanelTab = 'info'">
            File Info
          </button>
          <button class="panel-tab" :class="{ active: rightPanelTab === 'outline' }" 
                  @click="rightPanelTab = 'outline'">
            Outline
          </button>
          <button class="panel-tab" :class="{ active: rightPanelTab === 'search' }" 
                  @click="rightPanelTab = 'search'">
            Search
          </button>
        </div>

        <div class="panel-content">
          <!-- File Info Panel -->
          <div v-if="rightPanelTab === 'info'" class="file-info-panel">
            <div v-if="currentFile" class="file-info">
              <div class="info-item">
                <label>Name:</label>
                <span>{{ currentFile.name }}</span>
              </div>
              <div class="info-item">
                <label>Path:</label>
                <span class="file-path">{{ currentFile.path }}</span>
              </div>
              <div class="info-item">
                <label>Size:</label>
                <span>{{ formatFileSize(currentFile.size) }}</span>
              </div>
              <div class="info-item">
                <label>Modified:</label>
                <span>{{ formatDate(currentFile.modified) }}</span>
              </div>
              <div class="info-item">
                <label>Lines:</label>
                <span>{{ lineCount }}</span>
              </div>
              <div class="info-item">
                <label>Encoding:</label>
                <span>UTF-8</span>
              </div>
            </div>
            <div v-else class="no-file-selected">
              <iconify-icon icon="material-symbols:code-off" class="no-file-icon"></iconify-icon>
              <p>No file selected</p>
            </div>
          </div>

          <!-- Outline Panel -->
          <div v-if="rightPanelTab === 'outline'" class="outline-panel">
            <div v-if="currentFile" class="outline-content">
              <div v-for="item in fileOutline" :key="item.name" 
                   class="outline-item" :class="`outline-${item.type}`"
                   @click="goToLine(item.line)">
                <iconify-icon :icon="getOutlineIcon(item.type)"></iconify-icon>
                <span class="outline-name">{{ item.name }}</span>
                <span class="outline-line">Ln {{ item.line }}</span>
              </div>
            </div>
            <div v-else class="no-file-selected">
              <iconify-icon icon="material-symbols:list-alt" class="no-file-icon"></iconify-icon>
              <p>No file selected</p>
            </div>
          </div>

          <!-- Search Panel -->
          <div v-if="rightPanelTab === 'search'" class="search-panel">
            <div class="search-controls">
              <input type="text" v-model="searchQuery" placeholder="Search in file..." 
                     class="search-input" @keyup.enter="performSearch">
              <button class="btn btn-primary" @click="performSearch">
                <iconify-icon icon="material-symbols:search"></iconify-icon>
              </button>
            </div>
            
            <div class="search-results" v-if="searchResults.length > 0">
              <div class="results-header">
                <span>{{ searchResults.length }} results</span>
                <button class="btn-icon" @click="clearSearch">
                  <iconify-icon icon="material-symbols:clear"></iconify-icon>
                </button>
              </div>
              <div v-for="result in searchResults" :key="result.line" 
                   class="search-result" @click="goToLine(result.line)">
                <span class="result-line">Ln {{ result.line }}</span>
                <span class="result-preview">{{ result.preview }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Simple Code Runner Mode -->
    <div v-if="currentMode === 'simple'" class="simple-runner-mode">
      <section class="code-editor-section">
        <h2 class="section-title">
          <iconify-icon class="section-title-icon" icon="material-symbols:code-blocks"></iconify-icon>
          Code Editor & Preview
        </h2>
        
        <div class="editor-container">
          <div class="editor-toolbar">
            <div class="editor-title">Code Editor</div>
            <div class="editor-actions">
              <button class="btn btn-outline" @click="clearSimpleCode" style="padding: 0.5rem;">
                <iconify-icon icon="material-symbols:clear"></iconify-icon>
                Clear
              </button>
              <button class="btn btn-primary" @click="runSimpleCode" style="padding: 0.5rem;">
                <iconify-icon class="btn-icon" icon="material-symbols:play-arrow"></iconify-icon>
                Run Code
              </button>
            </div>
          </div>
          <div class="editor-content">
            <textarea 
              class="code-input" 
              v-model="simpleCode" 
              placeholder="Enter your HTML, CSS, and JavaScript code here..."
              @input="autoRunDebounced"
            ></textarea>
            <div class="output-container">
              <div class="output-header">
                Preview
                <div class="output-actions">
                  <button class="btn-icon" @click="refreshSimplePreview" title="Refresh">
                    <iconify-icon icon="material-symbols:refresh"></iconify-icon>
                  </button>
                  <button class="btn-icon" @click="openSimpleInNewWindow" title="Open in New Window">
                    <iconify-icon icon="material-symbols:open-in-new"></iconify-icon>
                  </button>
                </div>
              </div>
              <div class="output-content">
                <iframe 
                  v-if="simpleCode.trim()"
                  ref="simplePreviewFrame"
                  class="preview-frame simple-preview"
                  sandbox="allow-scripts allow-same-origin"
                  :srcdoc="generateSimplePreviewHtml()"
                ></iframe>
                <div v-else class="no-code-placeholder">
                  <iconify-icon icon="material-symbols:code" class="placeholder-icon"></iconify-icon>
                  <p style="color: var(--text-secondary); text-align: center; margin-top: 2rem;">
                    Code output will appear here after running
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Code Templates -->
      <div class="code-templates-section">
        <h3 class="section-title">
          <iconify-icon class="section-title-icon" icon="material-symbols:library-books"></iconify-icon>
          Quick Templates
        </h3>
        
        <div class="templates-grid">
          <div class="template-card" @click="loadTemplate('html-basic')">
            <div class="template-icon">
              <iconify-icon icon="material-symbols:html"></iconify-icon>
            </div>
            <h4>Basic HTML</h4>
            <p>Simple HTML page structure</p>
          </div>
          
          <div class="template-card" @click="loadTemplate('html-css-js')">
            <div class="template-icon">
              <iconify-icon icon="material-symbols:code-blocks"></iconify-icon>
            </div>
            <h4>HTML + CSS + JS</h4>
            <p>Complete web page with styling</p>
          </div>
          
          <div class="template-card" @click="loadTemplate('bootstrap')">
            <div class="template-icon">
              <iconify-icon icon="simple-icons:bootstrap"></iconify-icon>
            </div>
            <h4>Bootstrap Template</h4>
            <p>Responsive Bootstrap layout</p>
          </div>
          
          <div class="template-card" @click="loadTemplate('api-test')">
            <div class="template-icon">
              <iconify-icon icon="material-symbols:api"></iconify-icon>
            </div>
            <h4>API Test</h4>
            <p>Fetch API testing template</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Find/Replace Modal -->
    <div v-if="showFindModal" class="modal-overlay" @click.self="closeFindModal">
      <div class="modal-content find-modal">
        <div class="modal-header">
          <h3>Find & Replace</h3>
          <button class="btn-close" @click="closeFindModal">
            <iconify-icon icon="material-symbols:close"></iconify-icon>
          </button>
        </div>
        <div class="modal-body">
          <div class="find-controls">
            <div class="form-group">
              <label for="findInput">Find:</label>
              <input type="text" id="findInput" v-model="findQuery" 
                     @keyup.enter="findNext" class="form-input">
            </div>
            <div class="form-group">
              <label for="replaceInput">Replace:</label>
              <input type="text" id="replaceInput" v-model="replaceQuery" 
                     @keyup.enter="replaceNext" class="form-input">
            </div>
            <div class="find-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="findOptions.caseSensitive">
                <span class="checkmark"></span>
                Case sensitive
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="findOptions.wholeWord">
                <span class="checkmark"></span>
                Whole word
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="findOptions.regex">
                <span class="checkmark"></span>
                Regex
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <div class="find-buttons">
            <button class="btn btn-secondary" @click="findPrevious">
              <iconify-icon icon="material-symbols:arrow-upward"></iconify-icon>
              Previous
            </button>
            <button class="btn btn-secondary" @click="findNext">
              Next
              <iconify-icon icon="material-symbols:arrow-downward"></iconify-icon>
            </button>
            <button class="btn btn-primary" @click="replaceNext">
              Replace
            </button>
            <button class="btn btn-primary" @click="replaceAll">
              Replace All
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- New File Modal -->
    <div v-if="showNewFileModal" class="modal-overlay" @click.self="closeNewFileModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Create New File</h3>
          <button class="btn-close" @click="closeNewFileModal">
            <iconify-icon icon="material-symbols:close"></iconify-icon>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="fileName">File Name</label>
            <input type="text" id="fileName" v-model="newFileName" 
                   placeholder="example.js" class="form-input" @keyup.enter="createFile">
          </div>
          <div class="form-group">
            <label for="fileLocation">Location</label>
            <select id="fileLocation" v-model="newFileLocation" class="form-select">
              <option v-for="location in storageLocations" :key="location.path" :value="location.path">
                {{ location.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeNewFileModal">Cancel</button>
          <button class="btn btn-primary" @click="createFile" 
                  :disabled="!newFileName">Create</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// File Tree Node Component
const FileTreeNode = {
  name: 'FileTreeNode',
  props: {
    node: Object,
    selectedFile: Object
  },
  data() {
    return {
      isExpanded: true,
      isRenaming: false,
      renameValue: ''
    }
  },
  computed: {
    isSelected() {
      return this.selectedFile?.path === this.node.path
    },
    isFile() {
      return this.node.type === 'file'
    },
    hasChildren() {
      return this.node.children && this.node.children.length > 0
    }
  },
  methods: {
    toggleExpand() {
      if (!this.isFile) {
        this.isExpanded = !this.isExpanded
      }
    },
    startRename() {
      this.renameValue = this.node.name
      this.isRenaming = true
      this.$nextTick(() => {
        this.$refs.renameInput?.focus()
        this.$refs.renameInput?.select()
      })
    },
    confirmRename() {
      if (this.renameValue && this.renameValue !== this.node.name) {
        this.$emit('rename', this.node, this.renameValue)
      }
      this.isRenaming = false
    },
    cancelRename() {
      this.isRenaming = false
    },
    handleClick() {
      if (this.isFile) {
        this.$emit('select', this.node)
      } else {
        this.toggleExpand()
      }
    }
  },
  template: `
    <div class="tree-node">
      <div class="node-content" :class="{ selected: isSelected, file: isFile, folder: !isFile }"
           @click="handleClick" @dblclick="startRename">
        <div class="node-icon">
          <iconify-icon v-if="!isFile" :icon="isExpanded ? 'material-symbols:folder-open' : 'material-symbols:folder'"></iconify-icon>
          <iconify-icon v-else :icon="getFileIcon(node.name)"></iconify-icon>
        </div>
        
        <div class="node-name" v-if="!isRenaming">
          {{ node.name }}
        </div>
        
        <input v-else ref="renameInput" v-model="renameValue" 
               @blur="confirmRename" @keyup.enter="confirmRename" 
               @keyup.esc="cancelRename" class="node-rename-input">
        
        <div class="node-actions" v-if="!isRenaming">
          <button class="btn-icon" @click.stop="startRename" title="Rename">
            <iconify-icon icon="material-symbols:edit"></iconify-icon>
          </button>
          <button class="btn-icon btn-danger" @click.stop="$emit('delete', node)" title="Delete">
            <iconify-icon icon="material-symbols:delete"></iconify-icon>
          </button>
        </div>
      </div>
      
      <div class="node-children" v-if="hasChildren && isExpanded">
        <file-tree-node
          v-for="child in node.children"
          :key="child.path"
          :node="child"
          :selected-file="selectedFile"
          @select="$emit('select', $event)"
          @rename="$emit('rename', $event)"
          @delete="$emit('delete', $event)"
        />
      </div>
    </div>
  `
}

// Helper function
function getFileIcon(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  const iconMap = {
    js: 'material-symbols:javascript',
    ts: 'material-symbols:typescript',
    html: 'material-symbols:html',
    css: 'material-symbols:css',
    py: 'material-symbols:python',
    java: 'material-symbols:java',
    json: 'material-symbols:json',
    md: 'material-symbols:markdown',
    txt: 'material-symbols:description'
  }
  return iconMap[extension] || 'material-symbols:description'
}

function getOutlineIcon(type) {
  const iconMap = {
    function: 'material-symbols:function',
    class: 'material-symbols:class',
    method: 'material-symbols:method',
    property: 'material-symbols:property'
  }
  return iconMap[type] || 'material-symbols:code'
}

export default {
  name: 'CodeEditor',
  components: {
    FileTreeNode
  },
  data() {
    return {
      // Mode selection
      currentMode: 'advanced', // 'advanced' or 'simple'
      
      // Simple runner data
      simpleCode: `<!DOCTYPE html>
<html>
<head>
    <title>CodeScraper Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            background: linear-gradient(135deg, #2563EB, #0EA5E9);
            color: white;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
        }
        button {
            background: #10B981;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
        }
        button:hover {
            background: #059669;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to CodeScraper Pro!</h1>
        <p>This is a test page running in the built-in code editor.</p>
        <button onclick="showMessage()">Click Me!</button>
        <div id="output"></div>
    </div>
    <script>
        function showMessage() {
            document.getElementById('output').innerHTML = '<h3>Code execution successful! 🎉</h3>';
        }
    <\/script>
</body>
</html>`,
      
      // Advanced editor data
      editorStats: [
        { id: 1, label: 'Open Files', value: '0', icon: 'material-symbols:file-open', class: 'stat-primary' },
        { id: 2, label: 'Total Files', value: '0', icon: 'material-symbols:folder', class: 'stat-secondary' },
        { id: 3, label: 'Lines of Code', value: '0', icon: 'material-symbols:code', class: 'stat-success' },
        { id: 4, label: 'Preview', value: 'Ready', icon: 'material-symbols:visibility', class: 'stat-warning' }
      ],
      fileTree: [],
      recentFiles: [],
      openTabs: [],
      currentFile: null,
      editorContent: '',
      originalContent: '',
      isContentModified: false,
      currentLanguage: 'html',
      cursorLine: 1,
      cursorColumn: 1,
      fontSize: 14,
      lineHeight: 20,
      wordWrap: false,
      isDarkTheme: true,
      showRightPanel: true,
      showPreview: false,
      fileSearch: '',
      searchQuery: '',
      searchResults: [],
      fileOutline: [],
      supportedLanguages: [
        { name: 'HTML', value: 'html' },
        { name: 'CSS', value: 'css' },
        { name: 'JavaScript', value: 'javascript' },
        { name: 'TypeScript', value: 'typescript' },
        { name: 'Python', value: 'python' },
        { name: 'JSON', value: 'json' },
        { name: 'Markdown', value: 'markdown' }
      ],
      highlightedLines: [],
      visibleLines: [],
      storageLocations: [
        { name: 'Projects', path: '/projects' },
        { name: 'Scraped Code', path: '/scraped' },
        { name: 'Templates', path: '/templates' }
      ],
      newFileName: '',
      newFileLocation: '',
      showNewFileModal: false,
      showFindModal: false,
      findQuery: '',
      replaceQuery: '',
      findOptions: {
        caseSensitive: false,
        wholeWord: false,
        regex: false
      },
      rightPanelTab: 'info'
    }
  },
  computed: {
    filteredFileTree() {
      if (!this.fileSearch) return this.fileTree
      const searchLower = this.fileSearch.toLowerCase()
      
      const filterTree = (nodes) => {
        return nodes.filter(node => {
          if (node.name.toLowerCase().includes(searchLower)) return true
          if (node.children) {
            node.children = filterTree(node.children)
            return node.children.length > 0
          }
          return false
        })
      }
      
      return filterTree([...this.fileTree])
    },
    lineCount() {
      return this.editorContent.split('\n').length
    },
    characterCount() {
      return this.editorContent.length
    },
    isHtmlFile() {
      return this.currentFile && (this.currentFile.name.endsWith('.html') || this.currentLanguage === 'html')
    },
    editorStyles() {
      return {
        fontSize: this.fontSize + 'px',
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        lineHeight: this.lineHeight + 'px'
      }
    }
  },
  watch: {
    currentFile(newFile) {
      if (newFile) {
        this.loadFileContent(newFile)
        this.addToRecent(newFile)
        this.updateFileOutline()
      } else {
        this.editorContent = ''
        this.originalContent = ''
        this.isContentModified = false
      }
      this.updateStats()
    },
    editorContent(newContent) {
      this.isContentModified = newContent !== this.originalContent
      this.updateSyntaxHighlighting()
      this.updateFileOutline()
    },
    currentLanguage() {
      this.updateSyntaxHighlighting()
      this.updateFileOutline()
    }
  },
  mounted() {
    this.loadFileTree()
    this.loadStorageLocations()
    this.setupKeyboardShortcuts()
    this.updateVisibleLines()
    this.updateStats()
    this.autoRunDebounced = this.debounce(() => {
      this.runSimpleCode()
    }, 1000)
  },
  methods: {
    // ========================
    // SIMPLE RUNNER METHODS
    // ========================
    runSimpleCode() {
      this.$nextTick(() => {
        if (this.$refs.simplePreviewFrame) {
          console.log('Code executed successfully!')
        }
      })
    },
    clearSimpleCode() {
      this.simpleCode = ''
    },
    refreshSimplePreview() {
      this.$nextTick(() => {
        this.runSimpleCode()
      })
    },
    openSimpleInNewWindow() {
      const newWindow = window.open('', '_blank')
      newWindow.document.write(this.generateSimplePreviewHtml())
      newWindow.document.close()
    },
    generateSimplePreviewHtml() {
      return this.simpleCode
    },
    loadTemplate(templateKey) {
      const templates = {
        'html-basic': `<!DOCTYPE html>\n<html>\n<head>\n    <title>Basic HTML Page</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n</body>\n</html>`,
        'html-css-js': `<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n    <style>\n        body { font-family: Arial; }\n    </style>\n</head>\n<body>\n    <h1>Welcome</h1>\n    <script>\n        console.log('Hello!');\n    <\/script>\n</body>\n</html>`,
        'bootstrap': `<!DOCTYPE html>\n<html>\n<head>\n    <title>Bootstrap</title>\n    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">\n</head>\n<body>\n    <div class="container">\n        <h1>Bootstrap Page</h1>\n    </div>\n</body>\n</html>`,
        'api-test': `<!DOCTYPE html>\n<html>\n<head>\n    <title>API Test</title>\n</head>\n<body>\n    <h1>API Test Page</h1>\n    <div id="result"></div>\n    <script>\n        fetch('https://jsonplaceholder.typicode.com/todos/1')\n            .then(response => response.json())\n            .then(data => {\n                document.getElementById('result').innerHTML = JSON.stringify(data, null, 2);\n            });\n    <\/script>\n</body>\n</html>`
      }
      
      if (templates[templateKey]) {
        this.simpleCode = templates[templateKey]
        this.currentMode = 'simple'
      }
    },
    // ========================
    // ADVANCED EDITOR METHODS
    // ========================
    loadFileTree() {
      // Load sample data for now
      this.fileTree = [
        {
          name: 'projects',
          path: '/projects',
          type: 'folder',
          children: [
            {
              name: 'web-app',
              path: '/projects/web-app',
              type: 'folder',
              children: [
                { name: 'index.html', path: '/projects/web-app/index.html', type: 'file', size: 1024, modified: new Date() },
                { name: 'styles.css', path: '/projects/web-app/styles.css', type: 'file', size: 2048, modified: new Date() },
                { name: 'app.js', path: '/projects/web-app/app.js', type: 'file', size: 3072, modified: new Date() }
              ]
            }
          ]
        }
      ]
      this.updateStats()
    },
    loadStorageLocations() {
      // Already initialized in data()
    },
    loadFileContent(file) {
      // Load sample content
      const extension = file.name.split('.').pop()
      const sampleContent = {
        js: `// ${file.name}\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\n\nconst message = greet("World");\nconsole.log(message);`,
        html: `<!DOCTYPE html>\n<html>\n<head>\n  <title>${file.name}</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>`,
        css: `/* ${file.name} */\nbody {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}\n\nh1 {\n  color: #333;\n}`,
        json: `{\n  "name": "example",\n  "version": "1.0.0",\n  "description": "Sample JSON file"\n}`
      }
      
      this.editorContent = sampleContent[extension] || `// ${file.name}\n// File content would be loaded here`
      this.originalContent = this.editorContent
      this.isContentModified = false
      this.currentLanguage = extension
    },
    saveFile() {
      if (!this.currentFile) return
      this.originalContent = this.editorContent
      this.isContentModified = false
      this.updateStats()
      console.log('File saved (simulated)')
    },
    selectFile(file) {
      if (file.type === 'file') {
        const existingTab = this.openTabs.find(tab => tab.path === file.path)
        if (!existingTab) {
          this.openTabs.push(file)
        }
        this.currentFile = file
      }
    },
    closeTab(tab) {
      const index = this.openTabs.findIndex(t => t.path === tab.path)
      if (index !== -1) {
        if (this.isContentModified && this.currentFile?.path === tab.path) {
          if (!confirm('You have unsaved changes. Are you sure you want to close this file?')) {
            return
          }
        }
        
        this.openTabs.splice(index, 1)
        
        if (this.currentFile?.path === tab.path) {
          if (this.openTabs.length > 0) {
            this.currentFile = this.openTabs[this.openTabs.length - 1]
          } else {
            this.currentFile = null
          }
        }
      }
    },
    addToRecent(file) {
      const existingIndex = this.recentFiles.findIndex(f => f.path === file.path)
      if (existingIndex !== -1) {
        this.recentFiles.splice(existingIndex, 1)
      }
      this.recentFiles.unshift(file)
      
      if (this.recentFiles.length > 10) {
        this.recentFiles.pop()
      }
    },
    updateStats() {
      const totalFiles = this.countTotalFiles()
      this.editorStats = [
        { id: 1, label: 'Open Files', value: this.openTabs.length.toString(), icon: 'material-symbols:file-open', class: 'stat-primary' },
        { id: 2, label: 'Total Files', value: totalFiles.toString(), icon: 'material-symbols:folder', class: 'stat-secondary' },
        { id: 3, label: 'Lines of Code', value: this.lineCount.toString(), icon: 'material-symbols:code', class: 'stat-success' },
        { id: 4, label: 'Preview', value: this.showPreview ? 'Active' : 'Ready', icon: 'material-symbols:visibility', class: 'stat-warning' }
      ]
    },
    countTotalFiles() {
      const countFiles = (nodes) => {
        return nodes.reduce((count, node) => {
          if (node.type === 'file') return count + 1
          if (node.children) return count + countFiles(node.children)
          return count
        }, 0)
      }
      return countFiles(this.fileTree)
    },
    updateVisibleLines() {
      const lineCount = this.lineCount
      this.visibleLines = Array.from({ length: lineCount }, (_, i) => i + 1)
    },
    updateSyntaxHighlighting() {
      const lines = this.editorContent.split('\n')
      this.highlightedLines = lines.map(line => {
        if (this.currentLanguage === 'javascript') {
          return this.highlightJavaScript(line)
        }
        return this.escapeHtml(line)
      })
    },
    highlightJavaScript(line) {
      const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class']
      let highlighted = this.escapeHtml(line)
      
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g')
        highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`)
      })
      
      highlighted = highlighted.replace(/(['"])(.*?)\1/g, '<span class="string">$1$2$1</span>')
      highlighted = highlighted.replace(/\/\/.*$/g, '<span class="comment">$&</span>')
      
      return highlighted
    },
    escapeHtml(text) {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    },
    updateFileOutline() {
      if (!this.currentFile) {
        this.fileOutline = []
        return
      }

      const lines = this.editorContent.split('\n')
      this.fileOutline = []

      lines.forEach((line, index) => {
        const lineNumber = index + 1
        const trimmed = line.trim()

        if (this.currentLanguage === 'javascript') {
          const functionMatch = trimmed.match(/function\s+(\w+)\s*\(/)
          if (functionMatch) {
            this.fileOutline.push({
              name: functionMatch[1],
              type: 'function',
              line: lineNumber
            })
          }

          const classMatch = trimmed.match(/class\s+(\w+)/)
          if (classMatch) {
            this.fileOutline.push({
              name: classMatch[1],
              type: 'class',
              line: lineNumber
            })
          }
        }
      })
    },
    refreshFiles() {
      this.loadFileTree()
    },
    createNewFile() {
      this.newFileName = ''
      this.showNewFileModal = true
    },
    createNewFolder() {
      console.log('Create new folder')
    },
    createFile() {
      if (!this.newFileName) return

      const newFile = {
        name: this.newFileName,
        path: `${this.newFileLocation}/${this.newFileName}`,
        type: 'file',
        size: 0,
        modified: new Date()
      }

      this.fileTree.push(newFile)
      this.selectFile(newFile)
      this.closeNewFileModal()
    },
    closeNewFileModal() {
      this.showNewFileModal = false
      this.newFileName = ''
    },
    closeFindModal() {
      this.showFindModal = false
    },
    renameFile(node, newName) {
      node.name = newName
      node.path = node.path.replace(/[^/]+$/, newName)
      
      if (this.currentFile?.path === node.path) {
        this.currentFile.name = newName
        this.currentFile.path = node.path
      }
    },
    deleteFile(node) {
      if (!confirm(`Are you sure you want to delete "${node.name}"?`)) return

      const removeFromTree = (nodes) => {
        return nodes.filter(n => {
          if (n.path === node.path) return false
          if (n.children) {
            n.children = removeFromTree(n.children)
          }
          return true
        })
      }

      this.fileTree = removeFromTree(this.fileTree)
      this.closeTab(node)
      this.recentFiles = this.recentFiles.filter(f => f.path !== node.path)
    },
    formatCode() {
      console.log('Format code')
    },
    findInFile() {
      this.showFindModal = true
    },
    toggleComment() {
      console.log('Toggle comment')
    },
    togglePreview() {
      this.showPreview = !this.showPreview
    },
    handleLanguageChange() {
      console.log('Language changed:', this.currentLanguage)
    },
    refreshPreview() {
      console.log('Refresh preview')
    },
    openInNewWindow() {
      if (this.isHtmlFile) {
        const newWindow = window.open('', '_blank')
        newWindow.document.write(this.generatePreviewHtml())
        newWindow.document.close()
      }
    },
    generatePreviewHtml() {
      if (!this.isHtmlFile) return ''
      
      let htmlContent = this.editorContent
      if (!htmlContent.includes('<html')) {
        htmlContent = `<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Preview</title>\n    <style>\n        body { font-family: Arial, sans-serif; margin: 20px; }\n    </style>\n</head>\n<body>\n    ${htmlContent}\n</body>\n</html>`
      }
      
      return htmlContent
    },
    getRelativePath(fullPath) {
      return fullPath.split('/').slice(-2).join('/')
    },
    formatFileSize(bytes) {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    formatDate(date) {
      return new Date(date).toLocaleString()
    },
    getFileIcon(fileName) {
      return getFileIcon(fileName)
    },
    getOutlineIcon(type) {
      return getOutlineIcon(type)
    },
    setupKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault()
          this.saveFile()
        }
      })
    },
    handleContentChange() {
      // Handled by watcher
    },
    handleKeydown(e) {
      if (e.key === 'Tab') {
        e.preventDefault()
        this.insertText('  ')
      }
    },
    insertText(text) {
      const textarea = this.$refs.editorTextarea
      if (!textarea) return
      
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      
      this.editorContent = this.editorContent.substring(0, start) + text + this.editorContent.substring(end)
      
      this.$nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length
        textarea.focus()
      })
    },
    updateCursorPosition() {
      const textarea = this.$refs.editorTextarea
      if (!textarea) return
      
      const text = textarea.value.substring(0, textarea.selectionStart)
      const lines = text.split('\n')
      this.cursorLine = lines.length
      this.cursorColumn = lines[lines.length - 1].length + 1
    },
    handleScroll() {
      this.updateVisibleLines()
    },
    toggleSidebar() {
      this.showRightPanel = !this.showRightPanel
    },
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme
    },
    zoomIn() {
      this.fontSize = Math.min(this.fontSize + 1, 24)
      this.lineHeight = this.fontSize + 6
    },
    zoomOut() {
      this.fontSize = Math.max(this.fontSize - 1, 10)
      this.lineHeight = this.fontSize + 6
    },
    toggleWordWrap() {
      this.wordWrap = !this.wordWrap
    },
    performSearch() {
      if (!this.searchQuery) {
        this.searchResults = []
        return
      }

      const lines = this.editorContent.split('\n')
      this.searchResults = []

      lines.forEach((line, index) => {
        const lineNumber = index + 1
        const searchRegex = new RegExp(this.searchQuery, this.findOptions.caseSensitive ? 'g' : 'gi')
        
        if (searchRegex.test(line)) {
          this.searchResults.push({
            line: lineNumber,
            preview: line.trim().substring(0, 50) + (line.length > 50 ? '...' : '')
          })
        }
      })
    },
    clearSearch() {
      this.searchQuery = ''
      this.searchResults = []
    },
    goToLine(lineNumber) {
      const textarea = this.$refs.editorTextarea
      if (!textarea) return
      
      const lines = this.editorContent.split('\n')
      let position = 0
      
      for (let i = 0; i < lineNumber - 1; i++) {
        position += lines[i].length + 1
      }
      
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = position
      this.updateCursorPosition()
    },
    findNext() {
      this.performSearch()
    },
    findPrevious() {
      console.log('Find previous')
    },
    replaceNext() {
      console.log('Replace next')
    },
    replaceAll() {
      if (!this.findQuery) return
      
      const regex = new RegExp(this.findQuery, this.findOptions.caseSensitive ? 'g' : 'gi')
      this.editorContent = this.editorContent.replace(regex, this.replaceQuery)
    },
    debounce(func, wait) {
      let timeout
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout)
          func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
      }
    }
  }
}
</script>

<style scoped>
.code-editor-tab {
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

.editor-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid var(--border-color);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-primary .stat-icon { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
.stat-secondary .stat-icon { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.stat-success .stat-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.stat-warning .stat-icon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

.stat-content h3 {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.stat-content p {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

/* Editor Layout */
.editor-layout {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}

.editor-sidebar {
  background: var(--card-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  color: var(--text-primary);
  margin: 0;
  font-size: 1.1rem;
}

.sidebar-actions {
  display: flex;
  gap: 0.5rem;
}

/* File Tree */
.file-tree {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tree-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.tree-search {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 2rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

/* File Tree Node Styles */
.tree-node {
  padding-left: 1rem;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  margin: 0 0.5rem;
}

.node-content:hover {
  background: var(--bg-hover);
}

.node-content.selected {
  background: var(--primary-color);
  color: white;
}

.node-icon {
  font-size: 1.1rem;
  display: flex;
  align-items: center;
}

.node-name {
  flex: 1;
  font-size: 0.9rem;
}

.node-rename-input {
  flex: 1;
  background: transparent;
  border: 1px solid var(--primary-color);
  color: var(--text-primary);
  padding: 0.25rem;
  border-radius: 2px;
  font-size: 0.9rem;
}

.node-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
}

.node-content:hover .node-actions {
  opacity: 1;
}

.node-children {
  margin-left: 1rem;
}

/* Recent Files */
.recent-files {
  border-top: 1px solid var(--border-color);
  padding: 1rem;
}

.recent-files h4 {
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.recent-item:hover {
  background: var(--bg-hover);
}

.recent-item.active {
  background: var(--primary-color);
  color: white;
}

.recent-name {
  flex: 1;
  font-weight: 500;
}

.recent-path {
  color: var(--text-secondary);
  font-size: 0.7rem;
}

.recent-item.active .recent-path {
  color: rgba(255, 255, 255, 0.8);
}

/* Main Editor */
.editor-main {
  background: var(--card-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Editor Tabs */
.editor-tabs {
  display: flex;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
}

.editor-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-right: 1px solid var(--border-color);
  cursor: pointer;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.9rem;
  min-width: 150px;
}

.editor-tab:hover {
  background: var(--bg-hover);
}

.editor-tab.active {
  background: var(--card-bg);
  color: var(--text-primary);
  border-bottom: 2px solid var(--primary-color);
}

.tab-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-close {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-close:hover {
  background: var(--error-color);
  color: white;
}

/* Editor Toolbar */
.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.language-select {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.9rem;
}

.toolbar-buttons {
  display: flex;
  gap: 0.5rem;
}

.editor-info {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Code Editor Container */
.code-editor-container {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
}

.editor-line-numbers {
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  padding: 0.5rem;
  overflow-y: auto;
  min-width: 60px;
  text-align: right;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: v-bind(fontSize + 'px');
  line-height: v-bind(lineHeight + 'px');
  color: var(--text-secondary);
}

.line-number {
  padding: 0 0.5rem;
}

.line-number.active {
  background: var(--primary-color);
  color: white;
  border-radius: 2px;
}

.code-editor {
  flex: 1;
  border: none;
  background: transparent;
  color: transparent; /* Make text transparent - we'll use syntax highlighting overlay */
  caret-color: var(--text-primary);
  padding: 0.5rem;
  resize: none;
  outline: none;
  position: relative;
  z-index: 2;
}

.syntax-highlighting {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0.5rem;
  pointer-events: none;
  white-space: pre;
  overflow: hidden;
  z-index: 1;
  background: var(--bg-primary);
}

.highlight-line {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: v-bind(lineHeight + 'px');
}

/* Syntax Highlighting Colors */
:deep(.keyword) {
  color: #ff79c6;
  font-weight: bold;
}

:deep(.string) {
  color: #f1fa8c;
}

:deep(.comment) {
  color: #6272a4;
  font-style: italic;
}

:deep(.number) {
  color: #bd93f9;
}

:deep(.function) {
  color: #50fa7b;
}

/* Editor Status Bar */
.editor-statusbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.status-left,
.status-right {
  display: flex;
  gap: 1rem;
}

.status-item {
  cursor: default;
}

/* Right Panel */
.editor-right-panel {
  background: var(--card-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-tabs {
  display: flex;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.panel-tab {
  flex: 1;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.9rem;
  border-bottom: 2px solid transparent;
}

.panel-tab:hover {
  background: var(--bg-hover);
}

.panel-tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  background: var(--card-bg);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* File Info Panel */
.file-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.info-item label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
  min-width: 80px;
}

.info-item span {
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-align: right;
  word-break: break-all;
}

.file-path {
  font-family: monospace;
  font-size: 0.8rem !important;
}

/* Outline Panel */
.outline-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.outline-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.outline-item:hover {
  background: var(--bg-hover);
}

.outline-name {
  flex: 1;
  color: var(--text-primary);
}

.outline-line {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.outline-function .outline-name { color: #50fa7b; }
.outline-class .outline-name { color: #8be9fd; }
.outline-method .outline-name { color: #ffb86c; }
.outline-property .outline-name { color: #f1fa8c; }

/* Search Panel */
.search-controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.search-results {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  font-size: 0.9rem;
  color: var(--text-primary);
}

.search-result {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  font-size: 0.8rem;
}

.search-result:hover {
  background: var(--bg-hover);
}

.search-result:last-child {
  border-bottom: none;
}

.result-line {
  color: var(--primary-color);
  font-weight: 600;
  min-width: 50px;
}

.result-preview {
  color: var(--text-secondary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* No File Selected */
.no-file-selected {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-secondary);
}

.no-file-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-file-selected p {
  margin: 0;
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
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--card-bg);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.find-modal {
  max-width: 600px;
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

/* Find Controls */
.find-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.find-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.find-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Form Styles */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

.form-input,
.form-select {
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

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: normal;
  font-size: 0.9rem;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-radius: 3px;
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
  font-size: 10px;
  font-weight: bold;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.5rem;
  border-radius: 4px;
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

/* Responsive Design */
@media (max-width: 1200px) {
  .editor-layout {
    grid-template-columns: 250px 1fr;
  }
  
  .editor-right-panel {
    display: none;
  }
}

@media (max-width: 768px) {
  .code-editor-tab {
    padding: 0.5rem;
  }
  
  .editor-layout {
    grid-template-columns: 1fr;
  }
  
  .editor-sidebar {
    display: none;
  }
  
  .toolbar-left,
  .toolbar-right {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .editor-info {
    display: none;
  }
}
/* Enhanced editor layout */
.editor-container {
  position: relative;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.editor-actions {
  display: flex;
  gap: 0.5rem;
}

/* Enhanced syntax highlighting */
.code-line {
  display: flex;
  min-height: 1.5em;
}

.line-number {
  min-width: 3rem;
  padding: 0 0.5rem;
  text-align: right;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  user-select: none;
}

.line-content {
  flex: 1;
  padding: 0 0.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  white-space: pre;
}

/* Enhanced file tree */
.file-tree {
  background: var(--bg-primary);
  border-radius: var(--radius);
  padding: 1rem;
}

.tree-node {
  margin-bottom: 0.25rem;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.node-content:hover {
  background: var(--bg-secondary);
}

.node-content.selected {
  background: var(--primary-color);
  color: white;
}

/* Enhanced outline panel */
.outline-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.outline-item:hover {
  background: var(--bg-secondary);
}

.outline-item.function {
  color: var(--success-color);
}

.outline-item.class {
  color: var(--primary-color);
}

.outline-item.method {
  color: var(--accent-color);
}

.outline-item.variable {
  color: var(--warning-color);
}
/* Editor Preview Layout */
.editor-preview-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-preview-container.preview-active {
  flex-direction: row;
}

.code-editor-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.editor-preview-container.preview-active .code-editor-section {
  flex: 1;
  border-right: 1px solid var(--border-color);
}

.preview-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--bg-primary);
}

/* Preview Header */
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.preview-header h4 {
  margin: 0;
  color: var(--text-primary);
}

.preview-actions {
  display: flex;
  gap: 0.5rem;
}

/* Preview Content */
.preview-content {
  flex: 1;
  overflow: auto;
  position: relative;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

/* CSS Preview */
.css-preview {
  padding: 20px;
  height: 100%;
  overflow: auto;
}

.css-preview-container {
  min-height: 100%;
}

.css-preview-content {
  max-width: 800px;
  margin: 0 auto;
}

.preview-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 1.5rem;
  margin: 1rem 0;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow);
}

/* JavaScript Console */
.js-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.console-output {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--card-bg);
}

.console-header h4 {
  margin: 0;
  color: var(--text-primary);
}

.console-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
}

.console-message {
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid var(--border-light);
}

.console-message.input {
  color: var(--primary);
  font-weight: bold;
}

.console-message.output {
  color: var(--text-primary);
}

.console-message.error {
  color: var(--error);
}

.console-message.warning {
  color: var(--warning);
}

.message-time {
  color: var(--text-secondary);
  font-size: 0.75rem;
  margin-right: 1rem;
}

.console-input {
  display: flex;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  background: var(--card-bg);
}

.console-input-field {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
}

.console-input-field:focus {
  outline: none;
  border-color: var(--primary);
}

/* Default Preview */
.default-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
}

.preview-placeholder {
  text-align: center;
}

.preview-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Responsive Design */
@media (max-width: 768px) {
  .editor-preview-container.preview-active {
    flex-direction: column;
  }
  
  .editor-preview-container.preview-active .code-editor-section {
    border-right: none;
    border-bottom: 1px solid var(--border-color);
    flex: 1;
  }
  
  .preview-section {
    flex: 1;
  }
}
/* Mode Toggle */
.mode-toggle {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.toggle-buttons {
  display: flex;
  gap: 0.5rem;
}

.toggle-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.toggle-btn:hover {
  background: var(--bg-secondary);
}

.toggle-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

/* Simple Runner Mode */
.simple-runner-mode {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Simple Editor Container */
.editor-container {
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--card-bg);
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.editor-title {
  font-weight: 600;
  color: var(--text-primary);
}

.editor-content {
  display: flex;
  height: 500px;
}

.code-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  background: var(--bg-primary);
  color: var(--text-primary);
  border-right: 1px solid var(--border-color);
}

.output-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.output-header {
  padding: 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.output-actions {
  display: flex;
  gap: 0.5rem;
}

.output-content {
  flex: 1;
  background: var(--bg-primary);
  position: relative;
}

.preview-frame.simple-preview {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

.no-code-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Code Templates */
.code-templates-section {
  background: var(--card-bg);
  border-radius: var(--radius);
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.template-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.template-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary);
  box-shadow: var(--shadow);
}

.template-icon {
  font-size: 2.5rem;
  color: var(--primary);
  margin-bottom: 1rem;
}

.template-card h4 {
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.template-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .editor-content {
    flex-direction: column;
    height: 800px;
  }
  
  .code-input {
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
  
  .toggle-buttons {
    flex-direction: column;
  }
  
  .templates-grid {
    grid-template-columns: 1fr;
  }
}
</style>