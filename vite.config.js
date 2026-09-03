import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'node:child_process'

const TM_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

// Cloudflare на tiermaker.com блокирует TLS-фингерпринт Node, поэтому в dev
// запросы проксируются через curl (в проде — edge-функция на Deno)
function tiermakerCurlProxy() {
  return {
    name: 'tiermaker-curl-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.startsWith('/tiermaker-api')) return next()
        const target = 'https://tiermaker.com' + req.url.replace(/^\/tiermaker-api/, '')
        const proc = spawn('curl', ['-s', '-i', '-L', '--max-time', '30', '-A', TM_UA, '-e', 'https://tiermaker.com/', target])
        const chunks = []
        proc.stdout.on('data', (d) => chunks.push(d))
        proc.on('close', () => {
          const buf = Buffer.concat(chunks)
          const sep = buf.indexOf('\r\n\r\n')
          if (sep === -1) {
            res.statusCode = 502
            res.end('proxy error')
            return
          }
          const rawHeaders = buf.slice(0, sep).toString()
          const body = buf.slice(sep + 4)
          const statusMatch = rawHeaders.match(/^HTTP\/[\d.]+ (\d+)/m)
          res.statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 502
          const ctMatch = rawHeaders.match(/content-type:\s*([^\r\n]+)/i)
          if (ctMatch) res.setHeader('Content-Type', ctMatch[1])
          res.end(body)
        })
        proc.on('error', () => {
          res.statusCode = 502
          res.end('proxy error')
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tiermakerCurlProxy()],
  server: {
    proxy: {
      '/.netlify': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/shikimori-img': {
        target: 'https://shikimori.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/shikimori-img/, ''),
        secure: false,
      },
    },
  },
})
