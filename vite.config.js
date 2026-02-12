import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['lucide-react', 'framer-motion', 'recharts'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-query': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          'vendor-calendar': ['react-big-calendar', 'date-fns'],
          'vendor-pdf': ['jspdf', 'html2canvas'],
        }
      }
    }
  }
})