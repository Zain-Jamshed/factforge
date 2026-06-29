// voiceAgent.ts
// Converts script narration into a voiceover using Microsoft Edge TTS (free).

import { VoiceOutput, ScriptOutput } from "../types"
import { getAudioDuration } from "../utils/ffmpeg"
import { logger } from "../utils/logger"
import { EdgeTTS } from "node-edge-tts"
import * as dotenv from "dotenv"
import * as fs from "fs-extra"
import * as path from "path"

dotenv.config()

const VOICE = "en-US-ChristopherNeural"

/**
 * Generates a voiceover from the script's narration using Edge TTS.
 * Adds blank lines between scenes for natural pacing.
 */
export async function voiceAgent(script: ScriptOutput, outputFolder: string): Promise<VoiceOutput> {
  const outputDir = path.resolve(outputFolder)
  const voiceoverPath = path.join(outputDir, "voiceover.mp3")
  const fallbackPath = path.join(outputDir, "voiceover_needed.txt")

  await fs.ensureDir(outputDir)

  const spacedNarration = script.scenes
    .map(scene => scene.narration.trim())
    .join("\n\n")

  logger.info("Generating voiceover with Edge TTS...")
  console.log("Using Edge TTS voice:", VOICE)

  const maxAttempts = 3
  let attempt = 0
  while (attempt < maxAttempts) {
    attempt++
    try {
      const tts = new EdgeTTS({ voice: VOICE, lang: "en-US" })
      await tts.ttsPromise(spacedNarration, voiceoverPath)
      break
    } catch (error: any) {
      console.log(`Edge TTS attempt ${attempt}/${maxAttempts} failed: ${error?.message ?? 'Unknown error'}`)
      if (attempt >= maxAttempts) {
        logger.error("Edge TTS failed after all retries. Saving script for manual voiceover.", error)
        await fs.writeFile(fallbackPath, spacedNarration)
        throw new Error(`Edge TTS failed after ${maxAttempts} attempts: ${error?.message ?? 'Unknown error'}`)
      }
      console.log('Waiting 5s before retry...')
      await new Promise(r => setTimeout(r, 5000))
    }
  }

  let duration = 0
  try {
    duration = await getAudioDuration(voiceoverPath)
  } catch {
    logger.warn("Could not determine audio duration (ffprobe not found). Using 0.")
  }

  logger.info(`Voiceover saved: ${voiceoverPath} (${duration.toFixed(2)}s)`)

  return {
    file_path: voiceoverPath,
    duration_seconds: duration
  }
}
