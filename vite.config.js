import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        interactive: resolve(__dirname, 'interactive.html'),
        anfa: resolve(__dirname, 'anfa-deck.html'),
        alchemist: resolve(__dirname, 'alchemist-deck.html')
      }
    }
  }
})
