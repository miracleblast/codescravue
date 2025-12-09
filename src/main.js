import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './main.css'
import { clickOutside } from './directives/clickOutside'

console.log('🚀 Vue app starting...')

const app = createApp(App)

// NO compilerOptions here - they're in vite.config.js
console.log('✅ Vue app created')

app.use(router)
console.log('✅ Router installed')
app.directive('click-outside', clickOutside)
app.mount('#app')
console.log('✅ Vue app mounted to #app')