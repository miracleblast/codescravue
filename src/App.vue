<template>
  <div class="app-container">
    <!-- Sidebar Navigation -->
    <nav class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <LocalIcon icon="material-symbols:code" class="logo-icon"></LocalIcon>
          <h2>CodeHarvest Studio by bísì.</h2>
        </div>
      </div>
      
      <ul class="nav-menu">
        <li class="nav-item">
          <router-link to="/" class="nav-link" active-class="active">
            <LocalIcon class="nav-icon" icon="majesticons:dashboard-line"></LocalIcon>
            <span>Dashboard</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/download" class="nav-link" active-class="active">
            <LocalIcon class="nav-icon" icon="material-symbols:download"></LocalIcon>
            <span>Download App</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/scraper" class="nav-link" active-class="active">
            <LocalIcon class="nav-icon" icon="iconamoon:cloud-download-light"></LocalIcon>
            <span>Code Scraper</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/code" class="nav-link" active-class="active">
            <LocalIcon class="nav-icon" icon="material-symbols:code-blocks"></LocalIcon>
            <span>Code Editor</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/storage" class="nav-link" active-class="active">
            <LocalIcon class="nav-icon" icon="solar:folder-with-files-linear"></LocalIcon>
            <span>Storage</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/proxy" class="nav-link" active-class="active">
            <LocalIcon class="nav-icon" icon="material-symbols:security"></LocalIcon>
            <span>Proxy Management</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/accounts" class="nav-link" active-class="active">
            <LocalIcon class="nav-icon" icon="material-symbols:person"></LocalIcon>
            <span>Account Management</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/settings" class="nav-link" active-class="active">
            <LocalIcon class="nav-icon" icon="material-symbols:settings"></LocalIcon>
            <span>Settings</span>
          </router-link>
        </li>
      </ul>

      <div class="sidebar-footer">
        <button class="help-btn" @click="showHelp = true">
          <LocalIcon icon="material-symbols:help"></LocalIcon>
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
        <LocalIcon :icon="isDarkTheme ? 'material-symbols:light-mode' : 'material-symbols:dark-mode'"></LocalIcon>
      </div>
    </div>
    
    <!-- Language Toggle -->
    <div class="language-toggle">
      <div class="lang-btn" @click="toggleLanguage" id="languageToggle">
        <LocalIcon icon="material-symbols:translate"></LocalIcon>
      </div>
    </div>
  </div>
</template>

<script>
import HelpModal from './components/HelpModal.vue'

export default {
  name: 'App',
  components: { 
    HelpModal 
  },
  data() {
    return {
      isDarkTheme: true,
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
      alert('Language toggle - feature coming soon!')
    }
  },
  mounted() {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    this.isDarkTheme = savedTheme === 'dark'
    document.documentElement.setAttribute('data-theme', savedTheme)
  }
}
</script>