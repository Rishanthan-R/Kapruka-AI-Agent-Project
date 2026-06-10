import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export const config = {
  port: process.env.PORT || 5000,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  kaprukaMcpEndpoint: process.env.KAPRUKA_MCP_ENDPOINT || 'https://mcp.kapruka.com/mcp',
}
