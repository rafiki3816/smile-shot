import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      timeout: 60000,
      overlay: false
    }
  },
  build: {
    chunkSizeWarningLimit: 10000
  }
})
