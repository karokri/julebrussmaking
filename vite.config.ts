import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' gjør at appen fungerer under https://<bruker>.github.io/<repo>/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // INLINE=1 legger bilder inn i JS-en (brukes for enkeltfil-demo)
    assetsInlineLimit: process.env.INLINE ? 100_000_000 : 4096,
  },
})
