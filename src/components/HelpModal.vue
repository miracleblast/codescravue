<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content help-modal" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <iconify-icon icon="material-symbols:help" class="header-icon"></iconify-icon>
          <div>
            <h2>CodeScraper Pro Help & Guide</h2>
            <p>Everything you need to master code scraping</p>
          </div>
        </div>
        <button class="btn-icon close-btn" @click="$emit('close')">
          <iconify-icon icon="material-symbols:close"></iconify-icon>
        </button>
      </div>

      <!-- Navigation & Content -->
      <div class="help-container">
        <!-- Sidebar Navigation -->
        <nav class="help-sidebar">
          <div class="search-box">
            <iconify-icon icon="material-symbols:search"></iconify-icon>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search help articles..."
            >
          </div>
          
          <div class="nav-sections">
            <!-- NEW: License & Privacy Section -->
            <div class="nav-section">
              <button 
                class="nav-section-btn"
                :class="{ active: activeSection === 'license-privacy' }"
                @click="activeSection = 'license-privacy'"
              >
                <iconify-icon icon="material-symbols:lock"></iconify-icon>
                License & Privacy
                <iconify-icon 
                  :icon="activeSection === 'license-privacy' ? 'material-symbols:expand-less' : 'material-symbols:expand-more'"
                  class="chevron"
                ></iconify-icon>
              </button>
              
              <div v-if="activeSection === 'license-privacy'" class="nav-items">
                <button 
                  class="nav-item"
                  :class="{ active: activeArticle === 'privacy-first' }"
                  @click="setActiveArticle('privacy-first')"
                >
                  Privacy-First Approach
                </button>
                <button 
                  class="nav-item"
                  :class="{ active: activeArticle === 'license-system' }"
                  @click="setActiveArticle('license-system')"
                >
                  License System
                </button>
                <button 
                  class="nav-item"
                  :class="{ active: activeArticle === 'crypto-payments' }"
                  @click="setActiveArticle('crypto-payments')"
                >
                  Crypto Payments
                </button>
                <button 
                  class="nav-item"
                  :class="{ active: activeArticle === 'humanitarian-mission' }"
                  @click="setActiveArticle('humanitarian-mission')"
                >
                  Our Mission - Solar for Chad
                </button>
              </div>
            </div>

            <div 
              v-for="section in filteredSections" 
              :key="section.id"
              class="nav-section"
            >
              <button 
                class="nav-section-btn"
                :class="{ active: activeSection === section.id }"
                @click="activeSection = section.id"
              >
                <iconify-icon :icon="section.icon"></iconify-icon>
                {{ section.title }}
                <iconify-icon 
                  :icon="activeSection === section.id ? 'material-symbols:expand-less' : 'material-symbols:expand-more'"
                  class="chevron"
                ></iconify-icon>
              </button>
              
              <div v-if="activeSection === section.id" class="nav-items">
                <button 
                  v-for="item in section.items" 
                  :key="item.id"
                  class="nav-item"
                  :class="{ active: activeArticle === item.id }"
                  @click="setActiveArticle(item.id)"
                >
                  {{ item.title }}
                </button>
              </div>
            </div>
          </div>
        </nav>

        <!-- Main Content -->
        <main class="help-content">
          <div v-if="activeArticleContent" class="article-content">
            <h1>{{ activeArticleContent.title }}</h1>
            
            <div class="article-meta">
              <div class="meta-item">
                <iconify-icon icon="material-symbols:update"></iconify-icon>
                Last updated: {{ activeArticleContent.lastUpdated }}
              </div>
              <div class="meta-item">
                <iconify-icon icon="material-symbols:visibility"></iconify-icon>
                {{ activeArticleContent.difficulty }}
              </div>
            </div>

            <div class="article-body">
              <div 
                v-for="(block, index) in activeArticleContent.content" 
                :key="index"
                class="content-block"
                :class="block.type"
              >
                <!-- Heading -->
                <h2 v-if="block.type === 'heading'">{{ block.text }}</h2>
                
                <!-- Paragraph -->
                <p v-else-if="block.type === 'paragraph'">{{ block.text }}</p>
                
                <!-- Code Block -->
                <div v-else-if="block.type === 'code'" class="code-block">
                  <div class="code-header">
                    <span>{{ block.language }}</span>
                    <button class="btn-icon" @click="copyCode(block.code)">
                      <iconify-icon icon="material-symbols:content-copy"></iconify-icon>
                    </button>
                  </div>
                  <pre><code>{{ block.code }}</code></pre>
                </div>
                
                <!-- Tip -->
                <div v-else-if="block.type === 'tip'" class="tip-block">
                  <iconify-icon icon="material-symbols:lightbulb"></iconify-icon>
                  <div>
                    <strong>Pro Tip:</strong> {{ block.text }}
                  </div>
                </div>
                
                <!-- Warning -->
                <div v-else-if="block.type === 'warning'" class="warning-block">
                  <iconify-icon icon="material-symbols:warning"></iconify-icon>
                  <div>
                    <strong>Important:</strong> {{ block.text }}
                  </div>
                </div>

                <!-- Feature List -->
                <div v-else-if="block.type === 'feature-list'" class="feature-list">
                  <div 
                    v-for="(feature, featureIndex) in block.features" 
                    :key="featureIndex"
                    class="feature-item"
                    :class="feature.type"
                  >
                    <iconify-icon :icon="getFeatureIcon(feature.type)"></iconify-icon>
                    <div class="feature-content">
                      <strong>{{ feature.title }}</strong>
                      <p>{{ feature.description }}</p>
                    </div>
                  </div>
                </div>
                
                <!-- Mission Block -->
                <div v-else-if="block.type === 'mission'" class="mission-block">
                  <div class="mission-header">
                    <iconify-icon :icon="block.icon" class="mission-icon"></iconify-icon>
                    <h3>{{ block.title }}</h3>
                  </div>
                  <p>{{ block.description }}</p>
                  <div class="mission-stats" v-if="block.stats">
                    <div 
                      v-for="(stat, statIndex) in block.stats" 
                      :key="statIndex"
                      class="mission-stat"
                    >
                      <div class="stat-value">{{ stat.value }}</div>
                      <div class="stat-label">{{ stat.label }}</div>
                    </div>
                  </div>
                </div>
                
                <!-- Steps -->
                <div v-else-if="block.type === 'steps'" class="steps-block">
                  <h3>{{ block.title }}</h3>
                  <div 
                    v-for="(step, stepIndex) in block.steps" 
                    :key="stepIndex"
                    class="step"
                  >
                    <div class="step-number">{{ stepIndex + 1 }}</div>
                    <div class="step-content">
                      <p>{{ step.text }}</p>
                      <div v-if="step.code" class="step-code">
                        <pre><code>{{ step.code }}</code></pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Article Navigation -->
            <div class="article-navigation">
              <button 
                v-if="previousArticle" 
                class="btn btn-outline"
                @click="setActiveArticle(previousArticle.id)"
              >
                <iconify-icon icon="material-symbols:arrow-back"></iconify-icon>
                {{ previousArticle.title }}
              </button>
              
              <button 
                v-if="nextArticle" 
                class="btn btn-primary"
                @click="setActiveArticle(nextArticle.id)"
              >
                {{ nextArticle.title }}
                <iconify-icon icon="material-symbols:arrow-forward"></iconify-icon>
              </button>
            </div>
          </div>

          <!-- Search Results / Welcome -->
          <div v-else class="welcome-content">
            <div class="welcome-header">
              <iconify-icon icon="material-symbols:help-center" class="welcome-icon"></iconify-icon>
              <h1>How can we help you?</h1>
              <p>Search our documentation or browse by category</p>
            </div>

            <!-- Humanitarian Banner -->
            <div class="humanitarian-banner">
              <div class="banner-content">
                <div class="banner-icon">
                  <iconify-icon icon="material-symbols:solar-power"></iconify-icon>
                </div>
                <div class="banner-text">
                  <h3>🌞🇹🇩 100% of Profits Fund Solar Energy for Chad</h3>
                  <p>Your purchase brings electricity to remote villages and supports Sudanese refugee communities</p>
                </div>
                <button class="btn btn-primary" @click="setActiveArticle('humanitarian-mission')">
                  Learn More
                </button>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-help-actions">
              <div class="help-card" @click="setActiveArticle('getting-started')">
                <iconify-icon icon="material-symbols:rocket-launch"></iconify-icon>
                <h3>Getting Started</h3>
                <p>New to CodeScraper? Start here</p>
              </div>
              
              <div class="help-card" @click="setActiveArticle('privacy-first')">
                <iconify-icon icon="material-symbols:lock"></iconify-icon>
                <h3>Privacy First</h3>
                <p>No tracking, no data collection</p>
              </div>
              
              <div class="help-card" @click="setActiveArticle('troubleshooting')">
                <iconify-icon icon="material-symbols:bug-report"></iconify-icon>
                <h3>Troubleshooting</h3>
                <p>Common issues and solutions</p>
              </div>
              
              <div class="help-card" @click="contactSupport">
                <iconify-icon icon="material-symbols:contact-support"></iconify-icon>
                <h3>Contact Support</h3>
                <p>Get help from us</p>
              </div>
            </div>

            <!-- Popular Articles -->
            <div class="popular-articles">
              <h2>Popular Articles</h2>
              <div class="article-list">
                <button 
                  v-for="article in popularArticles" 
                  :key="article.id"
                  class="article-preview"
                  @click="setActiveArticle(article.id)"
                >
                  <h4>{{ article.title }}</h4>
                  <p>{{ article.description }}</p>
                  <div class="article-meta">
                    <span>{{ article.readTime }} read</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelpModal',
  emits: ['close'],
  data() {
    return {
      searchQuery: '',
      activeSection: 'license-privacy', // Default to privacy section
      activeArticle: 'privacy-first', // Default to privacy article
      helpContent: {
        sections: [
          {
            id: 'license-privacy',
            title: 'License & Privacy',
            icon: 'material-symbols:lock',
            items: [
              { id: 'privacy-first', title: 'Privacy-First Approach' },
              { id: 'license-system', title: 'License System' },
              { id: 'crypto-payments', title: 'Crypto Payments' },
              { id: 'humanitarian-mission', title: 'Our Mission - Solar for Chad' }
            ]
          },
          {
            id: 'getting-started',
            title: 'Getting Started',
            icon: 'material-symbols:rocket-launch',
            items: [
              { id: 'welcome', title: 'Welcome to CodeScraper Pro' },
              { id: 'installation', title: 'Installation Guide' },
              { id: 'first-scrape', title: 'Your First Scraping Session' },
              { id: 'interface-overview', title: 'Interface Overview' }
            ]
          },
          {
            id: 'scraping',
            title: 'Scraping Features',
            icon: 'iconamoon:cloud-download-light',
            items: [
              { id: 'github-scraping', title: 'GitHub Code Scraping' },
              { id: 'stackoverflow-scraping', title: 'Stack Overflow Scraping' },
              { id: 'advanced-search', title: 'Advanced Search Queries' },
              { id: 'proxy-usage', title: 'Using Proxies' },
              { id: 'account-setup', title: 'Account Configuration' }
            ]
          },
          {
            id: 'configuration',
            title: 'Configuration',
            icon: 'material-symbols:settings',
            items: [
              { id: 'storage-setup', title: 'Storage Management' },
              { id: 'proxy-management', title: 'Proxy Management' },
              { id: 'account-management', title: 'Account Management' },
              { id: 'captcha-settings', title: 'Anti-Captcha Setup' }
            ]
          },
          {
            id: 'troubleshooting',
            title: 'Troubleshooting',
            icon: 'material-symbols:bug-report',
            items: [
              { id: 'common-issues', title: 'Common Issues' },
              { id: 'error-codes', title: 'Error Codes' },
              { id: 'performance', title: 'Performance Optimization' },
              { id: 'debugging', title: 'Debugging Tools' }
            ]
          },
          {
            id: 'advanced',
            title: 'Advanced Usage',
            icon: 'material-symbols:code-blocks',
            items: [
              { id: 'api-integration', title: 'API Integration' },
              { id: 'custom-scripts', title: 'Custom Scripts' },
              { id: 'batch-operations', title: 'Batch Operations' },
              { id: 'automation', title: 'Automation Features' }
            ]
          }
        ],
        articles: {
          // NEW: PRIVACY & LICENSE ARTICLES
          'privacy-first': {
            title: 'Privacy-First Approach',
            lastUpdated: '2025-11-25',
            difficulty: 'All Users',
            content: [
              { type: 'paragraph', text: 'At CodeScraper Pro, we believe your data belongs to you. We built this application with privacy as the foundation, not an afterthought.' },
              { type: 'heading', text: 'What We DO NOT Collect:' },
              { type: 'feature-list', features: [
                { type: 'success', title: 'No Personal Data', description: 'We never collect your personal information, browsing history, or usage patterns' },
                { type: 'success', title: 'No Analytics', description: 'Zero tracking, zero analytics, zero behavioral profiling' },
                { type: 'success', title: 'No Crash Reporting', description: 'If the app crashes, we don\'t know about it unless you tell us' },
                { type: 'success', title: 'No Telemetry', description: 'No background data sending to our servers' }
              ]},
              { type: 'heading', text: 'What We DO:' },
              { type: 'feature-list', features: [
                { type: 'info', title: 'License Validation Only', description: 'We only validate your license key for activation' },
                { type: 'info', title: 'Local Processing', description: 'All scraping happens 100% on your computer' },
                { type: 'info', title: 'Local Storage', description: 'All your scraped data stays on your machine' },
                { type: 'info', title: 'Offline Capable', description: 'Work completely offline after activation' }
              ]},
              { type: 'tip', text: 'Your privacy is our priority. We make money from software licenses, not from selling your data. But we will always offer free solutions to people with the lowest budget.' }
            ]
          },
          'license-system': {
            title: 'License System',
            lastUpdated: '2025-11-25',
            difficulty: 'All Users',
            content: [
              { type: 'paragraph', text: 'Our license system is designed to be simple, fair, and respectful of your privacy.' },
              { type: 'heading', text: 'How Licensing Works:' },
              { type: 'steps', title: 'License Activation', steps: [
                { text: 'Purchase a license using cryptocurrency (we only accept crypto)' },
                { text: 'Enter your license key in the application' },
                { text: 'We validate the key against our server once' },
                { text: 'Your app is activated for 30 days' }
              ]},
              { type: 'heading', text: 'License Tiers:' },
              { type: 'feature-list', features: [
                { type: 'info', title: 'Free License', description: '1000 requests per month, renew each month' },
                { type: 'info', title: 'Pro License', description: '0 Limits - $79.99 monthly' }
              ]},
              { type: 'warning', text: 'Your license key is the ONLY information stored on our servers. No usage data, no personal information, no tracking.' }
            ]
          },
          'crypto-payments': {
            title: 'Crypto Payments',
            lastUpdated: '2025-11-25',
            difficulty: 'All Users',
            content: [
              { type: 'paragraph', text: 'We accept cryptocurrency payments to protect your financial privacy and make the process accessible worldwide.' },
              { type: 'heading', text: 'Accepted Cryptocurrencies:' },
              { type: 'feature-list', features: [
                { type: 'crypto', title: 'Ethereum (ETH)', description: 'Smart contract platform' },
                { type: 'crypto', title: 'Litecoin (LTC)', description: 'Fast and low-fee payments' },
                { type: 'crypto', title: 'USDT/USDC (ERC-20)', description: 'Stablecoin option' }
              ]},
              { type: 'heading', text: 'Payment Process:' },
              { type: 'steps', title: 'How to Pay with Crypto', steps: [
                { text: 'Select your license tier and click "Purchase"' },
                { text: 'Choose your preferred cryptocurrency' },
                { text: 'Send the exact amount to the provided wallet address' },
                { text: 'Wait for blockchain confirmation (usually 10-30 minutes)' },
                { text: 'Receive your license key instantly on the same window' }
              ]},
              { type: 'tip', text: 'Using Stablecoin provides the fastest and lowest fees transaction. We do not collect any personal information, never!' }
            ]
          },
          'humanitarian-mission': {
            title: 'Our Mission - Solar Energy for Chad',
            lastUpdated: '2025-01-15',
            difficulty: 'All Users',
            content: [
              { type: 'paragraph', text: 'When you purchase CodeScraper Pro, you\'re not just buying software - you\'re funding solar energy projects in Chad and supporting humanitarian efforts.' },
              { type: 'mission', icon: 'material-symbols:solar-power', title: 'Bringing Light to Chad', description: '100% of our profits fund solar panel installations in remote villages across Chad, bringing electricity to communities that have never had reliable power.' },
              { type: 'heading', text: 'Our Impact:' },
              { type: 'mission', icon: 'material-symbols:flag', title: 'Supporting Sudanese Refugees', description: 'We work with refugee communities from Sudan, providing solar power for schools, medical clinics, and community centers.', stats: [
                { value: '25,000+', label: 'People Impacted' },
                { value: '27', label: 'Villages Powered' },
                { value: '100%', label: 'Profits Donated' }
              ]},
              { type: 'heading', text: 'Why Chad?' },
              { type: 'feature-list', features: [
                { type: 'humanitarian', title: 'Extreme Need', description: 'Chad has one of the lowest electrification rates in the world, approx 13kwh/year' },
                { type: 'humanitarian', title: 'Solar Potential', description: 'Abundant sunshine makes solar power ideal' },
                { type: 'humanitarian', title: 'Local Partnerships', description: 'We work with trusted local organizations' },
                { type: 'humanitarian', title: 'Sustainable Impact', description: 'Training locals to maintain the systems' }
              ]},
              { type: 'mission', icon: 'material-symbols:handshake', title: 'Sustainable Development', description: 'We believe in sustainable development, not surveillance capitalism. Your purchase directly funds clean energy and education in communities that need it most.' },
              { type: 'tip', text: 'Every license sold provides solar power for approximately 10 people for one year. You\'re making a real difference!' }
            ]
          },
          // ... (keep your existing articles here)
          'welcome': {
            title: 'Welcome to CodeScraper Pro',
            lastUpdated: '2024-01-15',
            difficulty: 'Beginner',
            content: [
              { type: 'paragraph', text: 'Welcome to CodeScraper Pro - the most powerful code extraction tool designed for developers, researchers, and data scientists.' },
              { type: 'heading', text: 'What is CodeScraper Pro?' },
              { type: 'paragraph', text: 'CodeScraper Pro is an advanced desktop application that allows you to extract code snippets, repositories, and programming examples from various platforms including GitHub, Stack Overflow, GitLab, and more.' },
              { type: 'tip', text: 'Start with the Quick Scrape feature to get familiar with the basic functionality before diving into advanced settings.' },
              { type: 'heading', text: 'Key Features' },
              { type: 'steps', title: 'Getting Started', steps: [
                { text: 'Install the application for your operating system' },
                { text: 'Configure your storage preferences in the Storage tab' },
                { text: 'Set up accounts for the platforms you want to scrape' },
                { text: 'Start your first scraping session with default settings' }
              ]}
            ]
          },
          'github-scraping': {
            title: 'GitHub Code Scraping',
            lastUpdated: '2024-01-10',
            difficulty: 'Intermediate',
            content: [
              { type: 'paragraph', text: 'Learn how to effectively scrape code from GitHub repositories using CodeScraper Pro.' },
              { type: 'heading', text: 'Search Query Syntax' },
              { type: 'code', language: 'search query', code: 'javascript react hooks\npython machine-learning\n"web scraping" language:typescript' },
              { type: 'paragraph', text: 'You can use advanced search operators to refine your results:' },
              { type: 'steps', title: 'Search Operators', steps: [
                { text: 'language:javascript - Filter by programming language' },
                { text: 'stars:>100 - Repositories with more than 100 stars' },
                { text: 'pushed:>2023-01-01 - Recently updated repositories' },
                { text: 'topic:react - Search by repository topics' }
              ]},
              { type: 'warning', text: 'Be respectful of GitHub rate limits. Use appropriate delays between requests and consider using authenticated requests for higher limits.' }
            ]
          }
        }
      },
      popularArticles: [
        {
          id: 'privacy-first',
          title: 'Privacy-First Approach',
          description: 'How we protect your data and privacy',
          readTime: '3 min'
        },
        {
          id: 'humanitarian-mission',
          title: 'Solar Energy for Chad',
          description: 'How your purchase makes a difference',
          readTime: '4 min'
        },
        {
          id: 'getting-started',
          title: 'Getting Started Guide',
          description: 'Complete beginner guide to CodeScraper Pro',
          readTime: '5 min'
        },
        {
          id: 'github-scraping',
          title: 'GitHub Scraping',
          description: 'Master GitHub code extraction',
          readTime: '8 min'
        }
      ]
    }
  },
  computed: {
    filteredSections() {
      if (!this.searchQuery) return this.helpContent.sections
      
      const query = this.searchQuery.toLowerCase()
      return this.helpContent.sections.map(section => ({
        ...section,
        items: section.items.filter(item => 
          item.title.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query)
        )
      })).filter(section => section.items.length > 0)
    },
    
    activeArticleContent() {
      if (!this.activeArticle) return null
      return this.helpContent.articles[this.activeArticle]
    },
    
    previousArticle() {
      // Implementation to get previous article in sequence
      return null
    },
    
    nextArticle() {
      // Implementation to get next article in sequence  
      return null
    }
  },
  methods: {
    setActiveArticle(articleId) {
      this.activeArticle = articleId
      // Scroll to top of content
      const contentElement = this.$el.querySelector('.help-content')
      if (contentElement) {
        contentElement.scrollTop = 0
      }
    },
    
    copyCode(code) {
      navigator.clipboard.writeText(code).then(() => {
        this.showNotification('Code copied to clipboard!', 'success')
      })
    },
    
    getFeatureIcon(type) {
      const icons = {
        'success': 'material-symbols:check-circle',
        'info': 'material-symbols:info',
        'warning': 'material-symbols:warning',
        'crypto': 'material-symbols:currency-bitcoin',
        'humanitarian': 'material-symbols:volunteer-activism'
      }
      return icons[type] || 'material-symbols:info'
    },
    
    contactSupport() {
      if (window.electronAPI) {
        window.electronAPI.openExternal('https://harambee.sbs/support')
      } else {
        window.open('https://harambee.sbs/support', '_blank')
      }
      this.$emit('close')
    },
    
    showNotification(message, type = 'info') {
      // Use your existing notification system
      if (window.showNotification) {
        window.showNotification(message, type)
      }
    }
  },
  
  mounted() {
    // Default to privacy-first article
    this.activeArticle = 'privacy-first'
  }
}
</script>

<style scoped>
/* Add these new styles for the humanitarian content */

.humanitarian-banner {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  border-radius: var(--radius);
  padding: 1.5rem;
  margin-bottom: 2rem;
  color: white;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.banner-icon {
  font-size: 3rem;
}

.banner-text h3 {
  margin: 0 0 0.5rem 0;
  color: white;
}

.banner-text p {
  margin: 0;
  opacity: 0.9;
}

/* Feature List Styles */
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1.5rem 0;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--radius);
  background: var(--bg-primary);
  border-left: 4px solid var(--primary);
}

.feature-item.success {
  border-left-color: var(--success);
}

.feature-item.info {
  border-left-color: var(--primary);
}

.feature-item.warning {
  border-left-color: var(--warning);
}

.feature-item.crypto {
  border-left-color: var(--secondary);
}

.feature-item.humanitarian {
  border-left-color: #FF6B35; /* Humanitarian orange */
}

.feature-item iconify-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.feature-item.success iconify-icon {
  color: var(--success);
}

.feature-item.info iconify-icon {
  color: var(--primary);
}

.feature-item.warning iconify-icon {
  color: var(--warning);
}

.feature-item.crypto iconify-icon {
  color: var(--secondary);
}

.feature-item.humanitarian iconify-icon {
  color: #FF6B35;
}

.feature-content strong {
  display: block;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.feature-content p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Mission Block Styles */
.mission-block {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 1.5rem;
  margin: 1.5rem 0;
  text-align: center;
}

.mission-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.mission-icon {
  font-size: 2rem;
  color: var(--primary);
}

.mission-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.mission-block p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.mission-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.mission-stat {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .banner-content {
    flex-direction: column;
    text-align: center;
  }
  
  .mission-stats {
    grid-template-columns: 1fr;
  }
  
  .feature-item {
    flex-direction: column;
    text-align: center;
  }
}
/* Enhanced navigation */
.help-sidebar {
  background: var(--bg-primary);
  border-right: 1px solid var(--border-color);
}

.nav-section {
  margin-bottom: 0.5rem;
}

.nav-section-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  font-weight: 500;
}

.nav-section-btn:hover {
  background: var(--bg-secondary);
}

.nav-section-btn.active {
  background: var(--primary-color);
  color: white;
}

.nav-items {
  padding-left: 2rem;
}

.nav-item {
  width: 100%;
  text-align: left;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.nav-item.active {
  color: var(--primary-color);
  background: var(--primary-light);
}

/* Enhanced content blocks */
.content-block.tip {
  background: var(--success-light);
  border-left: 4px solid var(--success-color);
  padding: 1rem;
  border-radius: 0 var(--radius) var(--radius) 0;
}

.content-block.warning {
  background: var(--warning-light);
  border-left: 4px solid var(--warning-color);
  padding: 1rem;
  border-radius: 0 var(--radius) var(--radius) 0;
}

.content-block.note {
  background: var(--primary-light);
  border-left: 4px solid var(--primary-color);
  padding: 1rem;
  border-radius: 0 var(--radius) var(--radius) 0;
}

/* Enhanced code blocks */
.code-block {
  background: var(--bg-secondary);
  border-radius: var(--radius);
  overflow: hidden;
  margin: 1rem 0;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.code-block pre {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* Enhanced article navigation */
.article-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}
</style>