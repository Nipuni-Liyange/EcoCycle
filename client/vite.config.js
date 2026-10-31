import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 4000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        configure: proxy => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.origin === 'http://127.0.0.1:4000') {
              proxyReq.setHeader('origin', 'http://127.0.0.1:5173')
            }
          })
        },
      },
    },
  },
  preview: { proxy: { '/api': 'http://127.0.0.1:5000' } },
})
