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
mcpService.connect().then(connected => {
  if (connected) {
    console.log("MCP Service pre-loaded successfully!")
  } else {
    console.log("MCP Service initialized in offline simulation mode.")
  }
})

// Start listening
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`)
})
