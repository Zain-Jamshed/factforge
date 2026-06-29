// packageAgent.ts
// Final stage: Generates caption, updates memory, and writes final logs.

import { TopicOutput, RunState } from "../types"
import { readMemory, writeMemory } from "../utils/memory"
import { logger } from "../utils/logger"
import * as fs from "fs-extra"
import * as path from "path"

/**
 * Packages the final output, updates project memory, and logs completion stats.
 */
export async function packageAgent(state: RunState & { memoryPath?: string }): Promise<void> {
  if (!state.topic || !state.output_folder) {
    throw new Error("Missing topic or output folder in RunState")
  }

  const { topic, category, slug } = state.topic
  const outputDir = path.resolve(state.output_folder)
  const captionPath = path.join(outputDir, "caption.txt")
  const memoryPath = state.memoryPath || undefined

  logger.info("Packaging final output and updating memory...")

  // ... rest of step 1 ...
  const hook = state.script?.scenes[0]?.narration || ""
  const teaser1 = state.script?.scenes[2]?.narration || ""
  const teaser2 = state.script?.scenes[8]?.narration || ""

  const categoryHashtag = category.toLowerCase().replace(/\s+/g, "")
  const topicHashtag = slug.split("-")[0]

  const captionContent = `${hook}\n\n${teaser1}\n${teaser2}\n\n#darkhistory #historyfacts #didyouknow #truecrime #history #${categoryHashtag} #${topicHashtag} #learnontiktok #facts`

  await fs.writeFile(captionPath, captionContent)
  logger.info(`Caption saved: ${captionPath}`)

  // 2. Update memory
  const memory = readMemory(memoryPath)
  
  if (!memory.used_topics) memory.used_topics = []
  
  memory.used_topics.push(topic)
  memory.total_videos_produced = (memory.total_videos_produced || 0) + 1
  memory.last_run = new Date().toISOString().split("T")[0]

  writeMemory(memory, memoryPath)
  logger.info(`Memory updated at ${memoryPath || 'default path'}`)

  // 3. Final run.log entry
  const runDuration = state.start_time ? ((Date.now() - state.start_time) / 1000).toFixed(1) : "unknown"
  const finalLog = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[FactForge] DONE in ${runDuration}s
Topic: ${topic}
Output: ${path.join(outputDir, "final_video.mp4")}
Cost this run: $0.00
  - OpenRouter (LLaMA 3.3 70B): $0.00
  - Pollinations.ai (FLUX images): $0.00
  - Edge TTS (voiceover): $0.00
  - FFmpeg (animation + stitch): $0.00
Ready to upload.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
  // We use the logger which appends to run.log already, but this is the "pretty" block
  console.log(finalLog)
  await fs.appendFile(path.join(process.cwd(), "run.log"), finalLog + "\n")
}
