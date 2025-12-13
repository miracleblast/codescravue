import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [vue({
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag === 'iconify-icon'
      }
    }
  })],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && /\.(woff2?|ttf|eot)$/.test(assetInfo.name)) {
            return 'assets/fonts/[name][extname]'
          }
          if (assetInfo.name && /\.(png|jpg|jpeg|gif|svg|ico)$/.test(assetInfo.name)) {
            return 'assets/[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096
  },
  server: {
    port: 3000,
    strictPort: true,
    https: {
      key: fs.readFileSync('./ssl/key.pem'),
      cert: fs.readFileSync('./ssl/cert.pem')
    },
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 3000
    },
    cors: true,
    headers: {
  
}
  },
  publicDir: 'public',
  resolve: {
    alias: {
      'vue': 'vue/dist/vue.esm-bundler.js',
      '@': resolve(__dirname, 'src')
    }
  }
})