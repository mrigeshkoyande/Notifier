import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output a single-page app compatible with Nginx SPA routing
    outDir: 'dist',
    sourcemap: false,
    // Raise chunk size warning threshold (TensorFlow.js is large)
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        // rolldown-vite v7 requires manualChunks to be a function (not an object)
        manualChunks(id) {
          if (id.includes('node_modules/@tensorflow')) {
            return 'vendor-tensorflow'
          }
          if (id.includes('node_modules/firebase')) {
            return 'vendor-firebase'
          }
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) {
            return 'vendor-charts'
          }
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'vendor-react'
          }
        },
      },
    },
  },
  server: {
    // Local dev proxy — avoids CORS issues when backend runs on :5000
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/capture': { target: 'http://localhost:5000', changeOrigin: true },
      '/video_feed': { target: 'http://localhost:5000', changeOrigin: true },
      '/captured': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})
