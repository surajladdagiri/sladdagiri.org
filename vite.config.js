import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // No source maps in production. Without them the original source can't be
    // reconstructed in the browser's devtools.
    sourcemap: false,
    target: 'es2020',
    chunkSizeWarningLimit: 300,
  },
})
