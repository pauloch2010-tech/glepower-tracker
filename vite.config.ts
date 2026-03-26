import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// PWA will be added in Phase 5
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
