import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const testeE2e = mode === 'e2e'

  return {
    plugins: [react()],

    server: {
      port: testeE2e ? 5174 : 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: testeE2e
            ? 'http://127.0.0.1:8081'
            : 'http://127.0.0.1:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },

    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      include: ['src/**/*.test.{js,jsx}'],
    },
  }
})