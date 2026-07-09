import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      '~bulma': path.resolve(__dirname, 'node_modules/bulma')
    }
  },
  plugins: [
    vue(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,ttf,woff2}'],
        globIgnores: ['**/covers/**']
      },
      devOptions: {
        enabled: mode === 'development'
      }
    })
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['import', 'if-function']
      }
    }
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true
  }
}))
