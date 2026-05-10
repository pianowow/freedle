import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { LATEST_DICT_VERSION } from './src/constants/dictionary.js'

const dictPath = `data/target-dictionary-v${LATEST_DICT_VERSION}.json`;

// https://vite.dev/config/
export default defineConfig({
  base: '/freedle/',
  server: {
    allowedHosts: ['freedle-dev.pianowow.com'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,txt,webmanifest}'],
        additionalManifestEntries: [
          { url: 'manifest.json', revision: null },
          { url: dictPath, revision: null },
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    })
  ],
})
