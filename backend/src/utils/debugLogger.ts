import fs from 'fs'
import path from 'path'

/**
 * Debug logger utility.
 * Writes JSON debug payloads to a local `logs/` directory relative to the backend root.
 * In production, set DEBUG_LOGGING=false in .env to disable file writes.
 */

const LOGS_DIR = path.resolve(__dirname, '../../logs')
const DEBUG_ENABLED = process.env.DEBUG_LOGGING !== 'false'

// Ensure the logs directory exists on first use
let logsDirCreated = false
function ensureLogsDir(): void {
  if (logsDirCreated) return
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true })
    }
    logsDirCreated = true
  } catch (err) {
    console.warn('⚠️ Could not create logs directory:', err)
  }
}

/**
 * Write a debug payload to a JSON file in the logs directory.
 * @param filename - Name of the log file (e.g., 'groq_debug.json')
 * @param data - Object to serialize as JSON
 */
export function writeDebugLog(filename: string, data: Record<string, unknown>): void {
  if (!DEBUG_ENABLED) return

  ensureLogsDir()
  try {
    const filePath = path.join(LOGS_DIR, filename)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error(`Failed to write debug log '${filename}':`, err)
  }
}
