import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { registerSocketHandlers } from './dominion/socketHandlers.js'

const app = express()
const server = createServer(app)

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000', 'https://xaura-ranking.netlify.app'], credentials: true }))
app.use(express.json())

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: Date.now() }))

const io = new Server(server, {
  cors: { origin: ['http://localhost:5173', 'http://localhost:3000', 'https://xaura-ranking.netlify.app'], methods: ['GET', 'POST'], credentials: true },
  pingTimeout: 30000,
  pingInterval: 10000,
})

registerSocketHandlers(io)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`xAura Dominion server running on port ${PORT}`)
})
