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
          if (req.url === '/genesis-q' || req.url === '/genesis-q/') {
            req.url = '/genesis-q-deck.html';
          }
          if (req.url === '/genesis-q-deck' || req.url === '/genesis-q-deck/') {
            req.url = '/genesis-q-deck.html';
          }
          if (req.url === '/quantonation-deck' || req.url === '/quantonation-deck/') {
            req.url = '/quantonation-deck.html';
          }
          if (req.url === '/a16z' || req.url === '/a16z/') {
            req.url = '/a16z-deck.html';
          }
          if (req.url === '/a16z-deck' || req.url === '/a16z-deck/') {
            req.url = '/a16z-deck.html';
          }
          if (req.url === '/a16z-appendix' || req.url === '/a16z-appendix/') {
            req.url = '/a16z-appendix.html';
          }
          if (req.url === '/lynam' || req.url === '/lynam/' || req.url === '/lynam-deck' || req.url === '/lynam-deck/') {
            req.url = '/lynam-deck.html';
          }
          if (req.url === '/pre-seed-deck' || req.url === '/pre-seed-deck/') {
            req.url = '/pre-seed-deck.html';
          }
          if (req.url === '/point-reyes-sound-deck' || req.url === '/point-reyes-sound-deck/' || req.url === '/deck' || req.url === '/deck/') {
            req.url = '/point-reyes-sound-deck.html';
          }
          if (
            req.url === '/preview' || req.url === '/preview/' ||
            req.url === '/q-boltz' || req.url === '/q-boltz/' ||
            req.url === '/qboltz' || req.url === '/qboltz/' ||
            req.url === '/demo' || req.url === '/demo/' ||
            req.url === '/orbitals' || req.url === '/orbitals/'
          ) {
            req.url = '/preview.html';
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
        preview: resolve(__dirname, 'preview.html'),
        q_boltz: resolve(__dirname, 'q-boltz.html'),
        interactive: resolve(__dirname, 'interactive.html'),
        demo: resolve(__dirname, 'demo.html'),
        anfa: resolve(__dirname, 'anfa-deck.html'),
        alchemist: resolve(__dirname, 'alchemist-deck.html'),
        a16z: resolve(__dirname, 'a16z-deck.html'),
        a16z_appendix: resolve(__dirname, 'a16z-appendix.html'),
        lynam: resolve(__dirname, 'lynam-deck.html'),
        preseed: resolve(__dirname, 'pre-seed-deck.html'),
        prs_deck: resolve(__dirname, 'point-reyes-sound-deck.html'),
        mighty_capital: resolve(__dirname, 'mighty-capital-deck.html'),
        speciale_deck: resolve(__dirname, 'speciale-deck.html'),
        news_alchemist: resolve(__dirname, 'news/alchemist-chicago-2026/index.html'),
        film: resolve(__dirname, 'film/index.html')
      }
    }
  }
})
