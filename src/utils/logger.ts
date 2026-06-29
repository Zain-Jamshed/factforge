// logger.ts
// Logs to console and to run.log file.

import * as fs from "fs"
import * as path from "path"

const LOG_FILE = path.join(process.cwd(), "run.log")

export const logger = {
  info: (message: string) => {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [INFO] ${message}`
    console.log(logMessage)
    fs.appendFileSync(LOG_FILE, logMessage + "\n")
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [ERROR] ${message}${error ? `: ${error.message || error}` : ""}`
    console.error(logMessage)
    fs.appendFileSync(LOG_FILE, logMessage + "\n")
    if (error && error.stack) {
      fs.appendFileSync(LOG_FILE, error.stack + "\n")
    }
  },
  warn: (message: string) => {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [WARN] ${message}`
    console.warn(logMessage)
    fs.appendFileSync(LOG_FILE, logMessage + "\n")
  }
}
