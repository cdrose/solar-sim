import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GITHUB_PAGES=true is set by the deploy workflow.
// Locally base stays '/' so npm run dev works without any backend.
const base = process.env.GITHUB_PAGES === 'true' ? '/solar-sim/' : '/'

export default defineConfig({
  base,
  plugins: [react()],
})
