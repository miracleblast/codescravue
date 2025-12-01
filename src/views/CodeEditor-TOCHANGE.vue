<template>
  <div class="code-editor-tab">
    <!-- Header Section -->
    <div class="tab-header">
      <h1>Code Editor & Runner</h1>
      <p>Advanced file editing with built-in code preview and execution</p>
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

        <!-- Right Panel - File Info & Tools -->
        <div class="editor-right-panel" v-if="showRightPanel">
          <!-- ... your existing right panel code ... -->
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

    <!-- ... your existing modals ... -->
  </div>
</template>

<script>
// File Tree Node Component (same as before)
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

// Helper functions (same as before)
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
    </script>
</body>
</html>`,
      autoRun: false,
      
      // Advanced editor data (same as before)
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
      
      // Templates
      codeTemplates: {
        'html-basic': `<!DOCTYPE html>
<html>
<head>
    <title>Basic HTML Page</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <h1>Hello World!</h1>
    <p>This is a basic HTML template.</p>
</body>
</html>`,

        'html-css-js': `<!DOCTYPE html>
<html>
<head>
    <title>My Web Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        button {
            background: #2563EB;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
        }
        button:hover {
            background: #1D4ED8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to My Page</h1>
        <p>This page has CSS and JavaScript included.</p>
        <button onclick="showAlert()">Click Me!</button>
        <div id="content"></div>
    </div>

    <script>
        function showAlert() {
            document.getElementById('content').innerHTML = 
                '<p style="color: green;">Button clicked! JavaScript is working.</p>';
        }
    </script>
</body>
</html>`,

        'bootstrap': `<!DOCTYPE html>
<html>
<head>
    <title>Bootstrap Template</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .hero-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 100px 0;
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="#">MySite</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a class="nav-link" href="#">Home</a></li>
                    <li class="nav-item"><a class="nav-link" href="#">About</a></li>
                    <li class="nav-item"><a class="nav-link" href="#">Contact</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section text-center">
        <div class="container">
            <h1 class="display-4">Welcome to Our Site</h1>
            <p class="lead">Built with Bootstrap 5</p>
            <button class="btn btn-light btn-lg">Get Started</button>
        </div>
    </section>

    <!-- Features -->
    <section class="py-5">
        <div class="container">
            <div class="row">
                <div class="col-md-4 text-center">
                    <h3>Feature One</h3>
                    <p>Amazing feature description here.</p>
                </div>
                <div class="col-md-4 text-center">
                    <h3>Feature Two</h3>
                    <p>Another great feature description.</p>
                </div>
                <div class="col-md-4 text-center">
                    <h3>Feature Three</h3>
                    <p>Third fantastic feature details.</p>
                </div>
            </div>
        </div>
    </section>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`,

        'api-test': `<!DOCTYPE html>
<html>
<head>
    <title>API Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }
        button {
            background: #2563EB;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            background: white;
            border-radius: 5px;
            border-left: 4px solid #2563EB;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>API Testing Tool</h1>
        <p>Test various APIs directly from your browser</p>
        
        <div>
            <button onclick="testJSONPlaceholder()">Test JSONPlaceholder API</button>
            <button onclick="testPublicAPI()">Test Public API</button>
            <button onclick="clearResults()">Clear Results</button>
        </div>
        
        <div id="results" class="result">
            Results will appear here...
        </div>
    </div>

    <script>
        async function testJSONPlaceholder() {
            try {
                const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
                const data = await response.json();
                document.getElementById('results').innerHTML = 
                    '<h3>JSONPlaceholder API Response:</h3><pre>' + 
                    JSON.stringify(data, null, 2) + '</pre>';
            } catch (error) {
                document.getElementById('results').innerHTML = 
                    '<p style="color: red;">Error: ' + error.message + '</p>';
            }
        }

        async function testPublicAPI() {
            try {
                const response = await fetch('https://api.publicapis.org/random');
                const data = await response.json();
                document.getElementById('results').innerHTML = 
                    '<h3>Public APIs Response:</h3><pre>' + 
                    JSON.stringify(data, null, 2) + '</pre>';
            } catch (error) {
                document.getElementById('results').innerHTML = 
                    '<p style="color: red;">Error: ' + error.message + '</p>';
            }
        }

        function clearResults() {
            document.getElementById('results').innerHTML = 'Results cleared.';
        }
    </script>
</body>
</html>`
      }
    }
  },

  computed: {
    // ... your existing computed properties ...
    
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

  methods: {
    // ========================
    // SIMPLE RUNNER METHODS
    // ========================
    
    runSimpleCode() {
      // Force refresh the iframe
      this.$nextTick(() => {
        if (this.$refs.simplePreviewFrame) {
          // The iframe will auto-update due to :srcdoc binding
          console.log('Code executed successfully!')
        }
      })
    },
    
    clearSimpleCode() {
      this.simpleCode = ''
    },
    
    refreshSimplePreview() {
      // Force iframe reload by triggering update
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
      if (this.codeTemplates[templateKey]) {
        this.simpleCode = this.codeTemplates[templateKey]
        this.currentMode = 'simple'
      }
    },
    
    // Auto-run debounced method
    autoRunDebounced: null,
    
    // ========================
    // ADVANCED EDITOR METHODS
    // ========================
    
    // ... all your existing advanced editor methods ...
    // (refreshFiles, createNewFile, selectFile, saveFile, formatCode, etc.)
    
    generatePreviewHtml() {
      if (!this.isHtmlFile) return ''
      
      let htmlContent = this.editorContent
      
      // Ensure basic HTML structure if missing
      if (!htmlContent.includes('<html')) {
        htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: white; 
            color: black;
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`
      }
      
      return htmlContent
    },
    
    refreshPreview() {
      // Force iframe update
      this.$nextTick(() => {
        console.log('Preview refreshed')
      })
    },
    
    openInNewWindow() {
      if (this.isHtmlFile) {
        const newWindow = window.open('', '_blank')
        newWindow.document.write(this.generatePreviewHtml())
        newWindow.document.close()
      }
    },
    
    // Utility methods
    updateStats() {
      this.editorStats = [
        { id: 1, label: 'Open Files', value: this.openTabs.length.toString(), icon: 'material-symbols:file-open', class: 'stat-primary' },
        { id: 2, label: 'Total Files', value: this.countTotalFiles().toString(), icon: 'material-symbols:folder', class: 'stat-secondary' },
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
    
    // ... other existing methods like handleContentChange, updateSyntaxHighlighting, etc.
    
    // Initialize sample file tree (for demo)
    loadSampleFileTree() {
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
                { name: 'index.html', path: '/projects/web-app/index.html', type: 'file', size: 1024 },
                { name: 'styles.css', path: '/projects/web-app/styles.css', type: 'file', size: 2048 },
                { name: 'app.js', path: '/projects/web-app/app.js', type: 'file', size: 3072 }
              ]
            }
          ]
        }
      ]
    }
  },
  
  created() {
    // Setup auto-run debouncing
    this.autoRunDebounced = this.debounce(() => {
      if (this.autoRun) {
        this.runSimpleCode()
      }
    }, 1000)
    
    // Load sample data
    this.loadSampleFileTree()
  },
  
  methods: {
    // Debounce utility
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
    },
    
    // You'll need to implement the advanced editor methods here
    // (They would be quite lengthy, so I'm showing the structure)
    refreshFiles() {
      console.log('Refreshing files...')
    },
    
    createNewFile() {
      console.log('Creating new file...')
    },
    
    createNewFolder() {
      console.log('Creating new folder...')
    },
    
    selectFile(file) {
      console.log('Selecting file:', file)
    },
    
    closeTab(tab) {
      console.log('Closing tab:', tab)
    },
    
    saveFile() {
      console.log('Saving file...')
    },
    
    formatCode() {
      console.log('Formatting code...')
    },
    
    findInFile() {
      console.log('Finding in file...')
    },
    
    toggleComment() {
      console.log('Toggling comment...')
    },
    
    togglePreview() {
      this.showPreview = !this.showPreview
    },
    
    handleLanguageChange() {
      console.log('Language changed to:', this.currentLanguage)
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
    
    handleContentChange() {
      // Handle content changes
      console.log('Content changed')
    },
    
    handleKeydown(e) {
      // Handle key events
      if (e.key === 'Tab') {
        e.preventDefault()
        // Insert tab logic
      }
    },
    
    handleScroll() {
      // Handle scroll synchronization
    },
    
    updateCursorPosition() {
      // Update cursor position
    },
    
    updateSyntaxHighlighting() {
      // Update syntax highlighting
    }
  }
}
</script>

<style scoped>
/* ... your existing advanced editor styles ... */

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