import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export const config = {
  port: process.env.PORT || 5000,
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  kaprukaMcpEndpoint: process.env.KAPRUKA_MCP_ENDPOINT || 'https://mcp.kapruka.com/mcp',
  hfToken: process.env.HF_TOKEN || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  aiProvider: process.env.AI_PROVIDER || 'huggingface',
  embeddingProvider: process.env.EMBEDDING_PROVIDER || 'huggingface',
  huggingfaceModel: process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  aiMaxTokens: parseInt(process.env.AI_MAX_TOKENS || '512', 10),
  aiTemperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
}
