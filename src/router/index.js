import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import DownloadApp from '../views/DownloadApp.vue'
import CodeScraper from '../views/CodeScraper.vue'
import CodeEditor from '../views/CodeEditor.vue'
import Storage from '../views/Storage.vue'
import ProxyManagement from '../views/ProxyManagement.vue'
import AccountManagement from '../views/AccountManagement.vue'
import Settings from '../views/Settings.vue'

const routes = [
  { path: '/', component: Dashboard },
  { path: '/download', component: DownloadApp },
  { path: '/scraper', component: CodeScraper },
  { path: '/code', component: CodeEditor },
  { path: '/storage', component: Storage },
  { path: '/proxy', component: ProxyManagement },
  { path: '/accounts', component: AccountManagement },
  { path: '/settings', component: Settings }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router