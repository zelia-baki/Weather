import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // nginx en prod sert les .mjs en application/octet-stream : Chrome refuse
        // alors de charger le worker PDF.js comme module et aucun aperçu PDF ne
        // s'affiche. On émet ces fichiers en .js (servi en application/javascript).
        assetFileNames: (asset) =>
          (asset.names?.[0] ?? asset.name ?? '').endsWith('.mjs')
            ? 'assets/[name]-[hash].js'
            : 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000", // ton backend Flask
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
