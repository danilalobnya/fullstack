import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    include: ['src/test/**/*.test.ts', 'src/test/**/*.test.tsx'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/hooks/**/*.ts', 'src/utils/**/*.ts', 'src/services/**/*.ts'],
      thresholds: {
        lines: 65,
        branches: 55,
        functions: 60,
        statements: 65,
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        proxyTimeout: 35_000,
      },
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        proxyTimeout: 35_000,
      },
    },
  },
})
