import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/freedle/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,txt,webmanifest}'],
        additionalManifestEntries: [
          { url: 'manifest.json', revision: null },
          { url: 'data/target-dictionary.json', revision: null },
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    })
  ],
})
