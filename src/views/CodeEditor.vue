<template>
  <div class="code-editor-tab">
    <!-- Header Section -->
    <div class="tab-header">
      <h1>Code Editor</h1>
      <p>Edit and manage your scraped code with syntax highlighting and advanced features</p>
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
            <select v-model="currentLanguage" class="language-select">
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

        <!-- Code Editor -->
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

// Helper function to get file icon
function getFileIcon(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  const iconMap = {
    js: 'material-symbols:javascript',
    ts: 'material-symbols:typescript',
    html: 'material-symbols:html',
    css: 'material-symbols:css',
    py: 'material-symbols:python',
    java: 'material-symbols:java',
    cpp: 'material-symbols:cpp',
    c: 'material-symbols:c',
    php: 'material-symbols:php',
    json: 'material-symbols:json',
    xml: 'material-symbols:xml',
    md: 'material-symbols:markdown',
    txt: 'material-symbols:description',
    pdf: 'material-symbols:pdf',
    zip: 'material-symbols:folder-zip',
    exe: 'material-symbols:windows'
  }
  return iconMap[extension] || 'material-symbols:description'
}

// Helper function to get outline icon
function getOutlineIcon(type) {
  const iconMap = {
    function: 'material-symbols:function',
    class: 'material-symbols:class',
    method: 'material-symbols:method',
    property: 'material-symbols:property',
    variable: 'material-symbols:variable',
    import: 'material-symbols:import',
    export: 'material-symbols:export'
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
      // Editor statistics
      editorStats: [
        { id: 1, label: 'Open Files', value: '0', icon: 'material-symbols:file-open', class: 'stat-primary' },
        { id: 2, label: 'Total Files', value: '0', icon: 'material-symbols:folder', class: 'stat-secondary' },
        { id: 3, label: 'Lines of Code', value: '0', icon: 'material-symbols:code', class: 'stat-success' },
        { id: 4, label: 'Last Saved', value: 'Just now', icon: 'material-symbols:schedule', class: 'stat-warning' }
      ],

      // File system
      fileTree: [],
      storageLocations: [],
      recentFiles: [],
      openTabs: [],
      currentFile: null,

      // Editor content
      editorContent: '',
      originalContent: '',
      isContentModified: false,

      // Editor state
      currentLanguage: 'javascript',
      cursorLine: 1,
      cursorColumn: 1,
      fontSize: 14,
      lineHeight: 20,
      wordWrap: false,
      isDarkTheme: true,
      showRightPanel: true,

      // Search and find
      fileSearch: '',
      searchQuery: '',
      searchResults: [],
      showFindModal: false,
      findQuery: '',
      replaceQuery: '',
      findOptions: {
        caseSensitive: false,
        wholeWord: false,
        regex: false
      },

      // Modals
      showNewFileModal: false,
      newFileName: '',
      newFileLocation: '',

      // Right panel
      rightPanelTab: 'info',

      // Supported languages
      supportedLanguages: [
        { name: 'JavaScript', value: 'javascript' },
        { name: 'TypeScript', value: 'typescript' },
        { name: 'HTML', value: 'html' },
        { name: 'CSS', value: 'css' },
        { name: 'Python', value: 'python' },
        { name: 'Java', value: 'java' },
        { name: 'C++', value: 'cpp' },
        { name: 'PHP', value: 'php' },
        { name: 'JSON', value: 'json' },
        { name: 'XML', value: 'xml' },
        { name: 'Markdown', value: 'markdown' },
        { name: 'Plain Text', value: 'text' }
      ],

      // Syntax highlighting
      highlightedLines: [],
      visibleLines: [],

      // File outline
      fileOutline: []
    }
  },

  computed: {
    editorStyles() {
    return {
      fontSize: this.fontSize + 'px',
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      lineHeight: this.lineHeight + 'px'
    }
  },
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

  async mounted() {
    await this.loadFileTree()
    await this.loadStorageLocations()
    this.setupKeyboardShortcuts()
    this.updateVisibleLines()
    this.updateStats()
  },

  methods: {
    // File operations
    async loadFileTree() {
      try {
        if (window.electronAPI && window.electronAPI.getFileTree) {
          const result = await window.electronAPI.getFileTree()
          if (result.success) {
            this.fileTree = result.tree
          }
        } else {
          // Fallback: Load sample file tree
          this.loadSampleFileTree()
        }
      } catch (error) {
        console.error('Failed to load file tree:', error)
        this.loadSampleFileTree()
      }
    },

    loadSampleFileTree() {
      this.fileTree = [
        {
          name: 'src',
          path: '/projects/src',
          type: 'folder',
          children: [
            {
              name: 'components',
              path: '/projects/src/components',
              type: 'folder',
              children: [
                { name: 'Button.js', path: '/projects/src/components/Button.js', type: 'file', size: 2048, modified: new Date() },
                { name: 'Header.js', path: '/projects/src/components/Header.js', type: 'file', size: 4096, modified: new Date() }
              ]
            },
            {
              name: 'utils',
              path: '/projects/src/utils',
              type: 'folder',
              children: [
                { name: 'helpers.js', path: '/projects/src/utils/helpers.js', type: 'file', size: 1024, modified: new Date() }
              ]
            },
            { name: 'index.js', path: '/projects/src/index.js', type: 'file', size: 512, modified: new Date() },
            { name: 'styles.css', path: '/projects/src/styles.css', type: 'file', size: 8192, modified: new Date() }
          ]
        },
        {
          name: 'public',
          path: '/projects/public',
          type: 'folder',
          children: [
            { name: 'index.html', path: '/projects/public/index.html', type: 'file', size: 1024, modified: new Date() }
          ]
        },
        { name: 'package.json', path: '/projects/package.json', type: 'file', size: 512, modified: new Date() },
        { name: 'README.md', path: '/projects/README.md', type: 'file', size: 2048, modified: new Date() }
      ]
    },

    async loadStorageLocations() {
      try {
        if (window.electronAPI && window.electronAPI.getStorageLocations) {
          const result = await window.electronAPI.getStorageLocations()
          if (result.success) {
            this.storageLocations = result.locations
            this.newFileLocation = this.storageLocations[0]?.path || ''
          }
        }
      } catch (error) {
        console.error('Failed to load storage locations:', error)
      }
    },

    async loadFileContent(file) {
      try {
        if (window.electronAPI && window.electronAPI.readFile) {
          const result = await window.electronAPI.readFile(file.path)
          if (result.success) {
            this.editorContent = result.content
            this.originalContent = result.content
            this.isContentModified = false
          }
        } else {
          // Fallback: Load sample content based on file type
          this.loadSampleFileContent(file)
        }
      } catch (error) {
        console.error('Failed to load file content:', error)
        this.editorContent = '// Error loading file content'
      }
    },

    loadSampleFileContent(file) {
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
    },

    async saveFile() {
      if (!this.currentFile) return

      try {
        if (window.electronAPI && window.electronAPI.writeFile) {
          const result = await window.electronAPI.writeFile(this.currentFile.path, this.editorContent)
          if (result.success) {
            this.originalContent = this.editorContent
            this.isContentModified = false
            this.updateStats()
          }
        } else {
          // Fallback: Simulate save
          this.originalContent = this.editorContent
          this.isContentModified = false
          this.updateStats()
          console.log('File saved successfully (simulated)')
        }
      } catch (error) {
        console.error('Failed to save file:', error)
      }
    },

    // File selection and management
    selectFile(file) {
      if (file.type === 'file') {
        // Check if file is already open in tabs
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
        // Check if content is modified
        if (this.isContentModified && this.currentFile?.path === tab.path) {
          if (!confirm('You have unsaved changes. Are you sure you want to close this file?')) {
            return
          }
        }
        
        this.openTabs.splice(index, 1)
        
        // If we're closing the current file, select another tab or clear
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
      
      // Keep only last 10 files
      if (this.recentFiles.length > 10) {
        this.recentFiles.pop()
      }
    },

    // Editor functionality
    setupKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
            case 's':
              e.preventDefault()
              this.saveFile()
              break
            case 'f':
              e.preventDefault()
              this.showFindModal = true
              break
            case 'z':
              e.preventDefault()
              // Undo functionality would go here
              break
            case 'y':
              e.preventDefault()
              // Redo functionality would go here
              break
            case '/':
              e.preventDefault()
              this.toggleComment()
              break
          }
        }
      })
    },

    handleContentChange() {
      // Content change is handled by watcher
    },

    handleKeydown(e) {
      // Handle tab key for indentation
      if (e.key === 'Tab') {
        e.preventDefault()
        this.insertText('  ') // Two spaces for indentation
      }
    },

    insertText(text) {
      const textarea = this.$refs.editorTextarea
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      
      this.editorContent = this.editorContent.substring(0, start) + text + this.editorContent.substring(end)
      
      // Set cursor position after inserted text
      this.$nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length
        textarea.focus()
      })
    },

    updateCursorPosition() {
      const textarea = this.$refs.editorTextarea
      const text = textarea.value.substring(0, textarea.selectionStart)
      const lines = text.split('\n')
      this.cursorLine = lines.length
      this.cursorColumn = lines[lines.length - 1].length + 1
    },

    handleScroll() {
      this.updateVisibleLines()
    },

    updateVisibleLines() {
      const lineCount = this.lineCount
      this.visibleLines = Array.from({ length: lineCount }, (_, i) => i + 1)
    },

    // Syntax highlighting (simplified)
    updateSyntaxHighlighting() {
      const lines = this.editorContent.split('\n')
      this.highlightedLines = lines.map(line => {
        // Simple JavaScript highlighting for demo
        if (this.currentLanguage === 'javascript') {
          return this.highlightJavaScript(line)
        }
        return this.escapeHtml(line)
      })
    },

    highlightJavaScript(line) {
      // Simple keyword highlighting for demo
      const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class']
      let highlighted = this.escapeHtml(line)
      
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g')
        highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`)
      })
      
      // Highlight strings
      highlighted = highlighted.replace(/(['"])(.*?)\1/g, '<span class="string">$1$2$1</span>')
      
      // Highlight comments
      highlighted = highlighted.replace(/\/\/.*$/g, '<span class="comment">$&</span>')
      
      return highlighted
    },

    escapeHtml(text) {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    },

    // File outline
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

        // Simple JavaScript outline detection
        if (this.currentLanguage === 'javascript') {
          // Function detection
          const functionMatch = trimmed.match(/function\s+(\w+)\s*\(/)
          if (functionMatch) {
            this.fileOutline.push({
              name: functionMatch[1],
              type: 'function',
              line: lineNumber
            })
          }

          // Class detection
          const classMatch = trimmed.match(/class\s+(\w+)/)
          if (classMatch) {
            this.fileOutline.push({
              name: classMatch[1],
              type: 'class',
              line: lineNumber
            })
          }

          // Method detection (in classes)
          const methodMatch = trimmed.match(/(\w+)\s*\([^)]*\)\s*{/)
          if (methodMatch && !trimmed.startsWith('function') && !trimmed.startsWith('class')) {
            this.fileOutline.push({
              name: methodMatch[1],
              type: 'method',
              line: lineNumber
            })
          }
        }
      })
    },

    // UI actions
    refreshFiles() {
      this.loadFileTree()
    },

    createNewFile() {
      this.newFileName = ''
      this.showNewFileModal = true
    },

    createNewFolder() {
      // Implementation for creating new folder
      console.log('Create new folder functionality')
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

      // Remove from file tree
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

      // Remove from open tabs
      this.closeTab(node)

      // Remove from recent files
      this.recentFiles = this.recentFiles.filter(f => f.path !== node.path)
    },

    formatCode() {
      // Simple formatting for demo
      if (this.currentLanguage === 'javascript') {
        // Basic indentation formatting
        const lines = this.editorContent.split('\n')
        let indentLevel = 0
        const formatted = lines.map(line => {
          const trimmed = line.trim()
          if (trimmed.endsWith('}') || trimmed.endsWith(']') || trimmed.endsWith(')')) {
            indentLevel = Math.max(0, indentLevel - 1)
          }
          
          const indented = '  '.repeat(indentLevel) + trimmed
          
          if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
            indentLevel++
          }
          
          return indented
        }).join('\n')
        
        this.editorContent = formatted
      }
    },

    toggleComment() {
      const textarea = this.$refs.editorTextarea
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = this.editorContent.substring(start, end)
      
      let commentedText
      if (this.currentLanguage === 'javascript') {
        commentedText = selectedText.split('\n').map(line => {
          return line.trim().startsWith('//') ? line.replace(/^\/\//, '') : '//' + line
        }).join('\n')
      }
      
      this.editorContent = this.editorContent.substring(0, start) + commentedText + this.editorContent.substring(end)
    },

    findInFile() {
      this.showFindModal = true
      this.$nextTick(() => {
        document.getElementById('findInput')?.focus()
      })
    },

    findNext() {
      this.performSearch(this.findQuery)
    },

    findPrevious() {
      // Implementation for find previous
      console.log('Find previous functionality')
    },

    replaceNext() {
      // Implementation for replace next
      console.log('Replace next functionality')
    },

    replaceAll() {
      if (!this.findQuery) return
      
      const regex = new RegExp(this.findQuery, this.findOptions.caseSensitive ? 'g' : 'gi')
      this.editorContent = this.editorContent.replace(regex, this.replaceQuery)
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
      const lines = this.editorContent.split('\n')
      let position = 0
      
      for (let i = 0; i < lineNumber - 1; i++) {
        position += lines[i].length + 1 // +1 for newline
      }
      
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = position
      this.updateCursorPosition()
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

    // Utility methods
    getFileIcon(fileName) {
      return getFileIcon(fileName)
    },

    getOutlineIcon(type) {
      return getOutlineIcon(type)
    },

    getRelativePath(fullPath) {
      return fullPath.split('/').slice(-2).join('/')
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    formatDate(date) {
      return new Date(date).toLocaleString()
    },

    updateStats() {
      this.editorStats = [
        { id: 1, label: 'Open Files', value: this.openTabs.length.toString(), icon: 'material-symbols:file-open', class: 'stat-primary' },
        { id: 2, label: 'Total Files', value: this.countTotalFiles().toString(), icon: 'material-symbols:folder', class: 'stat-secondary' },
        { id: 3, label: 'Lines of Code', value: this.lineCount.toString(), icon: 'material-symbols:code', class: 'stat-success' },
        { id: 4, label: 'Last Saved', value: 'Just now', icon: 'material-symbols:schedule', class: 'stat-warning' }
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

    closeFindModal() {
      this.showFindModal = false
    },

    closeNewFileModal() {
      this.showNewFileModal = false
      this.newFileName = ''
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
</style>