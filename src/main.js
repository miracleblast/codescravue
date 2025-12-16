// src/main.js - CORRECTED VERSION
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './main.css'
import { clickOutside } from './directives/clickOutside'

console.log('🚀 Vue app starting...')

// Create app FIRST
const app = createApp(App)
console.log('✅ Vue app created')

// THEN register components and plugins
import LocalIcon from './components/LocalIcon.vue'
app.component('LocalIcon', LocalIcon)
console.log('✅ LocalIcon component registered')

app.use(router)
console.log('✅ Router installed')

app.directive('click-outside', clickOutside)

// FINALLY mount
app.mount('#app')
console.log('✅ Vue app mounted to #app')