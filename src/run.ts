import * as dotenv from "dotenv"
import * as path from "path"
import * as fs from "fs-extra"
import { logger } from "./utils/logger"
import { readMemory } from "./utils/memory"
import { RunState } from "./types"
import { topicAgent } from "./agents/topicAgent"
import { scriptAgent } from "./agents/scriptAgent"
import { promptAgent } from "./agents/promptAgent"
import { imageAgent } from "./agents/imageAgent"
import { voiceAgent } from "./agents/voiceAgent"
import { animationAgent } from "./agents/animationAgent"
import { composerAgent } from "./agents/composerAgent"
import { packageAgent } from "./agents/packageAgent"

dotenv.config()

async function main() {
  const startTime = Date.now()
  let currentStage = "init"

  try {
    const memory = readMemory()
    const runNumber = (memory.total_videos_produced || 0) + 1

    console.log(`[FactForge] Starting run #${runNumber}`)
    console.log(`[FactForge] Reading memory...\n`)

    const state: RunState = { start_time: startTime }

    // Stage 1 — Topic
    currentStage = "TopicAgent"
    console.log(`[TopicAgent] Selecting topic...`)
    const topic = await topicAgent()
    state.topic = topic
    console.log(`[TopicAgent] ✓ "${topic.topic}"`)
    console.log(`[TopicAgent] Category: ${topic.category} | Hook: ${topic.hook_style}\n`)

    const outputFolder = path.resolve("outputs", topic.slug)
    state.output_folder = outputFolder
    await fs.ensureDir(outputFolder)

    // Stage 2 — Script
    currentStage = "ScriptAgent"
    console.log(`[ScriptAgent] Writing script...`)
    const script = await scriptAgent(topic)
    state.script = script
    console.log(`[ScriptAgent] ✓ ${script.word_count} words, ${script.scenes.length} scenes\n`)

    // Stage 3 — Prompts
    currentStage = "PromptAgent"
    console.log(`[PromptAgent] Generating image prompts...`)
    const prompts = await promptAgent(script)
    state.prompts = prompts
    console.log(`[PromptAgent] ✓ ${prompts.length} prompts ready\n`)

    // Stage 4 — Images
    currentStage = "ImageAgent"
    console.log(`[ImageAgent] Generating images...`)
    const images = await imageAgent(prompts, outputFolder)
    state.images = images
    console.log(`[ImageAgent] ✓ ${images.length} images saved\n`)

    // Stage 5 — Voice
    currentStage = "VoiceAgent"
    console.log(`[VoiceAgent] Generating voiceover...`)
    const voice = await voiceAgent(script, outputFolder)
    state.voice = voice
    console.log(`[VoiceAgent] ✓ voiceover.mp3 saved (${voice.duration_seconds.toFixed(0)} seconds)\n`)

    // Stage 6 — Animation
    currentStage = "AnimationAgent"
    const imagesDir = path.join(outputFolder, "images")
    const clipsDir = path.join(outputFolder, "clips")
    console.log(`[AnimationAgent] Animating clips...`)
    const clips = await animationAgent(imagesDir, clipsDir, state.voice.duration_seconds, state.script.scenes)
    state.clips = clips
    console.log(`[AnimationAgent] ✓ ${clips.length} clips rendered\n`)

    // Stage 7 — Composition
    currentStage = "ComposerAgent"
    console.log(`[ComposerAgent] Composing final video...`)
    const video = await composerAgent(clipsDir, state.voice.file_path, outputFolder)
    state.video = video
    console.log(`[ComposerAgent] ✓ final_video.mp4 ready\n`)

    // Stage 8 — Package
    currentStage = "PackageAgent"
    console.log(`[PackageAgent] Writing caption...`)
    await packageAgent({ ...state, memoryPath: undefined })
    console.log(`[PackageAgent] ✓ caption.txt saved`)
    console.log(`[PackageAgent] ✓ memory.json updated\n`)

    // Final summary
    const totalSec = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`${"━".repeat(45)}`)
    console.log(`[FactForge] DONE in ${totalSec}s`)
    console.log(`Output → ${path.join(outputFolder, "final_video.mp4")}`)
    console.log(`Caption → ${path.join(outputFolder, "caption.txt")}`)
    console.log(`Cost this run → ~$1.51`)
    console.log(`${"━".repeat(45)}`)
    console.log(`Go upload it.`)

  } catch (error: any) {
    const msg = `Pipeline failed at ${currentStage}: ${error.message}`
    console.error(`\n[FactForge] FAILED — ${msg}`)
    logger.error(msg, error)
    process.exit(1)
  }
}

main()
