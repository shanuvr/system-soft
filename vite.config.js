import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // The project lives on a WSL-mounted Windows drive (/mnt/c), where the
      // default fs change events are unreliable. Poll so HMR fires on save.
      usePolling: true,
      interval: 200,
    },
  },
})
