import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist-learning',
    rollupOptions: {
      input: {
        main: './learning.html'
      }
    }
  },
  server: {
    port: 5175
  }
})