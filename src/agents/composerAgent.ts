// composerAgent.ts
// Concatenates all animated clips and mixes them with voiceover and background music.

import * as path from "path"
import * as fs from "fs"
import { ComposerOutput } from "../types"
import { concatClips, mixAudio, mixVoiceOnly } from "../utils/ffmpeg"
import { logger } from "../utils/logger"
import * as dotenv from "dotenv"

dotenv.config()

// Delay applied to voiceover audio so images and voice align naturally
const VOICE_DELAY_MS = 500

/**
 * Composes the final video from animated clips, voiceover, and background music.
 */
export async function composerAgent(
  clipsFolder: string,
  voicePath: string,
  outputFolder: string
): Promise<ComposerOutput> {
  const clipsDir = path.resolve(clipsFolder)
  const voiceFile = path.resolve(voicePath)
  const outDir = path.resolve(outputFolder)
  const rawVideoPath = path.join(outDir, "raw_video.mp4")
  const finalVideoPath = path.join(outDir, "final_video.mp4")

  // Ensure output directory exists
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  logger.info(`Starting video composition. Clips: ${clipsDir}, Voice: ${voiceFile}`)

  try {
    // 1. Concatenate all clips in the folder
    const clipFiles = fs.readdirSync(clipsDir).filter(f => f.endsWith(".mp4"))
    console.log(`Found ${clipFiles.length} clips to compose`)
    logger.info("Concatenating clips...")
    await concatClips(clipsDir, rawVideoPath)

    // 2. Determine if background music (BGM) is available
    const bgmDir = path.resolve(process.cwd(), "assets", "bgm")
    let selectedBgm: string | null = null

    if (fs.existsSync(bgmDir)) {
      const bgmFiles = fs.readdirSync(bgmDir).filter(f => f.endsWith(".mp3"))
      if (bgmFiles.length > 0) {
        const randomBgm = bgmFiles[Math.floor(Math.random() * bgmFiles.length)]
        selectedBgm = path.join(bgmDir, randomBgm)
        logger.info(`Using background music: ${randomBgm}`)
      }
    }

    // 3. Mix audio
    if (selectedBgm) {
      logger.info("Mixing video with voiceover and background music...")
      await mixAudio(rawVideoPath, voiceFile, selectedBgm, finalVideoPath, VOICE_DELAY_MS)
    } else {
      logger.info("No background music found, skipping bgm. Mixing voice only...")
      await mixVoiceOnly(rawVideoPath, voiceFile, finalVideoPath, VOICE_DELAY_MS)
    }

    logger.info(`Composition complete: ${finalVideoPath}`)
    return {
      file_path: finalVideoPath
    }
  } catch (error) {
    logger.error("Failed to compose final video", error)
    throw error
  }
}
