import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { handleClientsRequest, parseAccounts } from './api/_lib.js'

const PRIVATE_JSON = fileURLToPath(new URL('./data-private/me_data.json', import.meta.url))
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

const readPrivateJson = async () => JSON.parse(await readFile(PRIVATE_JSON, 'utf8'))

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => (raw += chunk))
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'))
      } catch {
        resolve({})
      }
    })
  })

// Local-only routes for the "Clients needing action" tab. They exist only in
// the local dev/preview server (never in the Vercel build) and answer requests
// from this computer only, even if the server is started with --host.
//   /__private/me_data.json  full file, no password (the M&E PC's own view)
//   /api/clients             the password-protected API, as on Vercel, with
//                            passwords from .env.local and data from data-private
function privateClientData(env) {
  const accounts = parseAccounts(env.CLIENT_PASSWORDS)

  const middleware = async (req, res, next) => {
    const isPrivate = req.url?.startsWith('/__private/')
    const isApi = req.url?.startsWith('/api/clients')
    if (!isPrivate && !isApi) return next()

    if (!LOOPBACK.has(req.socket.remoteAddress)) {
      res.statusCode = 403
      return res.end('Client-level data is available on the M&E computer only.')
    }
    res.setHeader('Cache-Control', 'no-store')

    if (isApi) {
      const { status, body } = await handleClientsRequest({
        method: req.method,
        body: req.method === 'POST' ? await readBody(req) : null,
        accounts,
        loadData: readPrivateJson,
      })
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      return res.end(JSON.stringify(body))
    }

    try {
      const body = await readFile(PRIVATE_JSON)
      res.setHeader('Content-Type', 'application/json')
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
export default defineConfig(({ mode }) => ({
  plugins: [react(), privateClientData(loadEnv(mode, process.cwd(), ''))],
}))
