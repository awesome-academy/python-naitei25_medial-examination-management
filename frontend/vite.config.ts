import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
      },
    })
  ],
  server: {
    proxy: {
      // Proxy tất cả requests bắt đầu với /auth tới backend
      '/auth': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path // Giữ nguyên path
      },
      // Proxy tất cả requests bắt đầu với /api tới backend
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        // Tối ưu cho fonts
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.otf') || 
              assetInfo.name?.endsWith('.woff2') || 
              assetInfo.name?.endsWith('.woff') || 
              assetInfo.name?.endsWith('.ttf')) {
            return 'fonts/[name].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        }
      }
    }
  }
})