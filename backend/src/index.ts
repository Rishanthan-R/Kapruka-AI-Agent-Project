import express from 'express'
import cors from 'cors'
import { config } from './config/env'
import chatRouter from './routes/chat'
import { McpService } from './services/mcpService'

const app = express()
const port = config.port

// Middleware
app.use(cors())
app.use(express.json())

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// Routes
app.use('/api', chatRouter)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: "OK", timestamp: new Date() })
})

// Pre-initialize and connect to Kapruka MCP remote service
const mcpService = McpService.getInstance()
mcpService.connect()
  .then(connected => {
    if (connected) {
      console.log("MCP Service pre-loaded successfully!")
    } else {
      console.log("MCP Service initialized in offline simulation mode.")
    }
  })
  .catch(err => {
    console.error("⚠️ Failed to pre-load MCP Service on startup. The server will start in offline/simulation fallback mode.", err)
  })

// Start listening
const server = app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`)
})

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`)
  server.close(async () => {
    console.log("HTTP server closed.")
    await mcpService.disconnect()
    console.log("MCP connection disconnected.")
    process.exit(0)
  })
  
  // Force exit after 3 seconds if cleanup is stuck
  setTimeout(() => {
    console.warn("Cleanup took too long. Force exiting.")
    process.exit(1)
  }, 3000)
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
// Nodemon uses SIGUSR2 to restart
process.once('SIGUSR2', async () => {
  console.log("Nodemon restarting...")
  await mcpService.disconnect()
  process.kill(process.pid, 'SIGUSR2')
})

