import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/freedle/',
  plugins: [
    vue(),
    VitePWA({ registerType: 'prompt' })
  ],
})
