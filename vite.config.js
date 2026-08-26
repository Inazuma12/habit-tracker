import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { existsSync, readFileSync } from 'node:fs'

const localCertificatePath = 'secrets/dev-localhost.pfx'

export default defineConfig({
  server: {
    https: existsSync(localCertificatePath)
      ? {
          pfx: readFileSync(localCertificatePath),
          passphrase: 'habit-tracker-local',
        }
      : undefined,
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})
