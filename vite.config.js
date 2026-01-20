import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vue core
          'vue-vendor': ['vue', 'vue-router'],
          // 3D graphics
          'three': ['three'],
          // Code editor
          'codemirror': [
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/lang-html',
            '@codemirror/lang-css',
            '@codemirror/lang-javascript',
            '@codemirror/autocomplete',
            '@codemirror/commands',
            '@codemirror/language'
          ],
          // PDF handling
          'pdf': ['pdf-lib', 'pdfjs-dist'],
          // Audio
          'audio': ['wavesurfer.js'],
          // Utils
          'utils': ['js-yaml']
        }
      }
    }
  }
})
