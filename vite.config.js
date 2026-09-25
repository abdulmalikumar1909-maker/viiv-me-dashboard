import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const PRIVATE_JSON = fileURLToPath(new URL('./data-private/me_data.json', import.meta.url))
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

// Serves the patient-level file at /__private/me_data.json for the local
// "Clients needing action" tab. It exists only in the local dev/preview server
// (never in the Vercel build) and answers requests from this computer only,
// even if the server is started with --host.
function privateClientData() {
  const middleware = async (req, res, next) => {
    if (!req.url?.startsWith('/__private/')) return next()
    if (!LOOPBACK.has(req.socket.remoteAddress)) {
      res.statusCode = 403
      return res.end('Client-level data is available on the M&E computer only.')
    }
    try {
      const body = await readFile(PRIVATE_JSON)
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(body)
    } catch {
      res.statusCode = 404
      res.end('No private data on this computer.')
    }
  }
  return {
    name: 'private-client-data',
    // Block bodies: a returned value would be run by Vite as a post-hook.
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), privateClientData()],
})
