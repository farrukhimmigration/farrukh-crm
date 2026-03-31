import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-app': ['firebase/app', 'firebase/auth'],
          'firebase-db':  ['firebase/firestore', 'firebase/storage'],
          'icons':        ['lucide-react'],
        },
      },
    },
    // Increase chunk size warning limit (Firebase is large)
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    open: true,
  },
  // Ensure env vars with VITE_ prefix are exposed
  envPrefix: 'VITE_',
})
