import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    // Les tests E2E Selenium (tests/e2e) sont lancés via "npm run test:e2e" (Mocha), pas par Vitest
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
