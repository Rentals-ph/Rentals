import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Helper to get proxy target based on USE_LOCAL_API env var
// Default: local backend, set USE_LOCAL_API=false to use Railway
const getProxyTarget = () => {
  if (process.env.VITE_API_BASE_URL) {
    return process.env.VITE_API_BASE_URL
  }
  const useRemoteApi = process.env.USE_LOCAL_API === 'false' || process.env.USE_LOCAL_API === '0'
  return useRemoteApi ? 'https://rentalsbackend-production.up.railway.app' : 'http://localhost:8000'
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    watch: {
      usePolling: true,
    },
    hmr: {
      overlay: true,
    },
    proxy: {
      '/api': {
        target: getProxyTarget(),
        changeOrigin: true,
        secure: process.env.USE_LOCAL_API === 'false' || process.env.USE_LOCAL_API === '0',
        rewrite: (path) => path, // Keep /api prefix
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url)
          })
        },
      },
    },
  },
})

