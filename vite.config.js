import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/.netlify': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/tiermaker-api': {
        target: 'https://tiermaker.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tiermaker-api/, ''),
        secure: false,
      },
    },
  },
})
