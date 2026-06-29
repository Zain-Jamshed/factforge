// animationAgent.ts
// Animates images into clips using FFmpeg Ken Burns effect.

import * as path from "path"
import * as fs from "fs"
import { ClipsOutput, AnimatedClip, ScriptScene } from "../types"
import { animateImage } from "../utils/ffmpeg"
import { logger } from "../utils/logger"
import * as dotenv from "dotenv"

dotenv.config()

export async function animationAgent(
  imagesFolder: string,
  clipsFolder: string,
  voiceoverDuration: number,
  scenes: ScriptScene[],
): Promise<ClipsOutput> {
  const imagesDir = path.resolve(imagesFolder)
  const clipsDir = path.resolve(clipsFolder)

  if (!fs.existsSync(clipsDir)) {
    fs.mkdirSync(clipsDir, { recursive: true })
  }

  const imageFiles = fs.readdirSync(imagesDir).filter(f => f.endsWith(".png")).sort()
  console.log(`[AnimationAgent] Found ${imageFiles.length} images in ${imagesDir}: [${imageFiles.join(", ")}]`)
  console.log("First animation item:", JSON.stringify({ file: imageFiles[0] }, null, 2))

  logger.info(`Starting animation of ${imageFiles.length} images in: ${imagesDir}`)

  const totalImages = imageFiles.length
  const clipDuration = voiceoverDuration / totalImages
  console.log(`Total images: ${totalImages}, Voiceover: ${voiceoverDuration}s, Each clip: ${(voiceoverDuration/totalImages).toFixed(2)}s`)
  const clips: AnimatedClip[] = []

  const DIRECTIONS = [
    "topToBottom", "bottomToTop",
    "leftToRight", "rightToLeft"
  ] as const

  for (let i = 0; i < imageFiles.length; i++) {
    const imageFile = imageFiles[i]
    const imagePath = path.join(imagesDir, imageFile)
    const outputFileName = `clip_${String(i + 1).padStart(2, "0")}.mp4`
    const outputPath = path.join(clipsDir, outputFileName)

    const animationType = DIRECTIONS[i % 4]

    console.log(`Animating ${imageFile} → clip_${String(i + 1).padStart(2, "0")}.mp4 (${animationType}) for ${clipDuration}s`)

    try {
      await animateImage(imagePath, outputPath, animationType, clipDuration)
      clips.push({ scene: i + 1, file_path: outputPath })
    } catch (error) {
      logger.error(`Failed to animate ${imageFile}`, error)
      throw error
    }
  }

  logger.info(`Successfully animated ${clips.length} clips.`)
  return clips
}
