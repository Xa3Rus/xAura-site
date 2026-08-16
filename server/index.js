import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import { Server } from 'socket.io'
import { authenticateSocket } from './middleware/auth.js'
import { registerSocketHandlers } from './monopoly/socketHandlers.js'

const app = express()
const server = createServer(app)

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://xaura-ranking.netlify.app',
].concat(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : [])

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }))
app.use(express.json())

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: Date.now() }))

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
})

io.use(authenticateSocket)

registerSocketHandlers(io)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`xAura Monopoly server running on port ${PORT}`)
})
