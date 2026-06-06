import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173, // Frontend dev server — backend runs on 5000
    proxy: {
      // Automatically forward all /api requests to the Express backend.
      // This avoids CORS issues during development — the browser sees
      // everything on the same origin (localhost:5173).
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
