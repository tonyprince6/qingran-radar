import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleAnalyze } from './server/analyze.js'

function localApi() {
  return {
    name: 'local-analysis-api',
    configureServer(server) {
      server.middlewares.use('/api/analyze', (request, response) => {
        handleAnalyze(request, response)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    if (value && process.env[key] === undefined) process.env[key] = value
  }

  return {
    base: './',
    plugins: [react(), localApi()],
  }
})
