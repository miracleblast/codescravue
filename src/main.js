import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './main.css'

console.log('🚀 Vue app starting...')

const app = createApp(App)
console.log('✅ Vue app created')

app.use(router)
console.log('✅ Router installed')

app.mount('#app')
console.log('✅ Vue app mounted to #app')