<template>
  <div class="app-container">
    <!-- Sidebar Navigation -->
    <nav class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <iconify-icon icon="material-symbols:code" class="logo-icon"></iconify-icon>
          <h2>CodeScraper Pro by bisi.</h2>
        </div>
      </div>
      
      <ul class="nav-menu">
        <li class="nav-item">
          <router-link to="/" class="nav-link" active-class="active">
            <iconify-icon class="nav-icon" icon="majesticons:dashboard-line"></iconify-icon>
            <span>Dashboard</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/download" class="nav-link" active-class="active">
            <iconify-icon class="nav-icon" icon="material-symbols:download"></iconify-icon>
            <span>Download App</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/scraper" class="nav-link" active-class="active">
            <iconify-icon class="nav-icon" icon="iconamoon:cloud-download-light"></iconify-icon>
            <span>Code Scraper</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/code" class="nav-link" active-class="active">
            <iconify-icon class="nav-icon" icon="material-symbols:code-blocks"></iconify-icon>
            <span>Code Editor</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/storage" class="nav-link" active-class="active">
            <iconify-icon class="nav-icon" icon="solar:folder-with-files-linear"></iconify-icon>
            <span>Storage</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/proxy" class="nav-link" active-class="active">
            <iconify-icon class="nav-icon" icon="material-symbols:security"></iconify-icon>
            <span>Proxy Management</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/accounts" class="nav-link" active-class="active">
            <iconify-icon class="nav-icon" icon="material-symbols:person"></iconify-icon>
            <span>Account Management</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/settings" class="nav-link" active-class="active">
            <iconify-icon class="nav-icon" icon="material-symbols:settings"></iconify-icon>
            <span>Settings</span>
          </router-link>
        </li>
      </ul>

      <div class="sidebar-footer">
        <button class="help-btn" @click="showHelp = true">
          <iconify-icon icon="material-symbols:help"></iconify-icon>
          <span>Help & Guide</span>
        </button>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <router-view></router-view>
    </main>

    <!-- Help Modal -->
    <HelpModal v-if="showHelp" @close="showHelp = false" />
    
    <!-- Theme Toggle -->
    <div class="theme-toggle">
      <div class="theme-btn" @click="toggleTheme" id="themeToggle">
        <iconify-icon :icon="isDarkTheme ? 'material-symbols:light-mode' : 'material-symbols:dark-mode'"></iconify-icon>
      </div>
    </div>
    
    <!-- Language Toggle -->
    <div class="language-toggle">
      <div class="lang-btn" @click="toggleLanguage" id="languageToggle">
        <iconify-icon icon="material-symbols:translate"></iconify-icon>
      </div>
    </div>
  </div>
</template>

<script>
import HelpModal from './components/HelpModal.vue'

export default {
  name: 'App',
  components: { HelpModal },
  data() {
    return {
      isDarkTheme: true, // Default to dark theme
      showHelp: false
    }
  },
  methods: {
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme
      document.documentElement.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light')
      localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light')
    },
    toggleLanguage() {
      // Your language toggle logic
      alert('Language toggle - feature coming soon!')
    },
    checkElectronAPI() {
      if (!window.electronAPI) {
        console.warn('Electron API not available - running in browser mode')
      }
    }
  },
  mounted() {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark'
    this.isDarkTheme = savedTheme === 'dark'
    document.documentElement.setAttribute('data-theme', savedTheme)
    
    this.checkElectronAPI()
  }
}
</script>