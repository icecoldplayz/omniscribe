import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    chunkSizeWarningLimit: 1000, // Increases the limit to hide the warning
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});