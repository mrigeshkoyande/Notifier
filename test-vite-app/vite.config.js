import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output a single-page app compatible with Nginx SPA routing
    outDir: 'dist',
    // Generate source maps for easier Cloud Run log debugging
    sourcemap: false,
    // Raise chunk size warning threshold (TensorFlow.js is large)
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        // Manually split large vendor chunks to improve cache efficiency
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase'],
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          'vendor-tensorflow': ['@tensorflow/tfjs', '@tensorflow-models/coco-ssd'],
        },
      },
    },
  },
  server: {
    // Local dev proxy — avoids CORS issues when backend runs on :5000
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/capture': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/video_feed': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/captured': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
