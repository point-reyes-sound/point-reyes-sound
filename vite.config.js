import { resolve } from 'path'
import fs from 'fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const inputs = {
  main: resolve(__dirname, 'index.html'),
}

// Dynamically include local private slide deck if present
if (fs.existsSync(resolve(__dirname, 'deck/index.html'))) {
  inputs.deck = resolve(__dirname, 'deck/index.html')
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: inputs,
    },
  },
})
