// memory.ts
// Reads and writes memory/memory.json.
// Used to track history (e.g. topics already covered) to avoid repetition.

import * as fs from "fs"
import * as path from "path"

const DEFAULT_MEMORY_PATH = path.join(process.cwd(), "memory", "memory.json")

export interface MemoryData {
  used_topics: string[]
  total_videos_produced: number
  last_run: string | null
  [key: string]: any
}

export function readMemory(customPath?: string): MemoryData {
  const filePath = customPath || DEFAULT_MEMORY_PATH
  if (!fs.existsSync(filePath)) {
    return { used_topics: [], total_videos_produced: 0, last_run: null }
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8")
    return JSON.parse(raw)
  } catch (error) {
    console.error(`Failed to read ${filePath}, returning empty state.`)
    return { used_topics: [], total_videos_produced: 0, last_run: null }
  }
}

export function writeMemory(data: MemoryData, customPath?: string): void {
  const filePath = customPath || DEFAULT_MEMORY_PATH
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
}

export function addTopicToMemory(topic: string, customPath?: string): void {
  const memory = readMemory(customPath)
  if (!memory.used_topics) memory.used_topics = []
  if (!memory.used_topics.includes(topic)) {
    memory.used_topics.push(topic)
    writeMemory(memory, customPath)
  }
}
