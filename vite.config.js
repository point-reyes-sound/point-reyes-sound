import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'clean-urls-dev',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/news/alchemist-chicago-2026' || req.url === '/news/alchemist-chicago-2026/') {
            req.url = '/news/alchemist-chicago-2026/index.html';
          }
          if (req.url === '/film' || req.url === '/film/') {
            req.url = '/film/index.html';
          }
          next();
        });
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        interactive: resolve(__dirname, 'interactive.html'),
        papermache: resolve(__dirname, 'papermache.html'),
        anfa: resolve(__dirname, 'anfa-deck.html'),
        alchemist: resolve(__dirname, 'alchemist-deck.html'),
        news_alchemist: resolve(__dirname, 'news/alchemist-chicago-2026/index.html'),
        film: resolve(__dirname, 'film/index.html')
      }
    }
  }
})
