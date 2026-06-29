// ffmpeg.ts
// This file contains all FFmpeg commands used in the pipeline.
// Every command uses absolute paths so FFmpeg always finds your files.
// Agents never write raw FFmpeg commands — they call these functions instead.

import { exec } from "child_process"
import * as path from "path"
import * as fs from "fs"
import { promisify } from "util"

const execAsync = promisify(exec)                              // lets us use await with exec

// Resolve FFmpeg/FFprobe PATH issue on Windows
const wingetFFmpegBin = "C:\\Users\\Max Computer\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.1-full_build\\bin"
if (fs.existsSync(wingetFFmpegBin) && !process.env.PATH?.includes(wingetFFmpegBin)) {
  process.env.PATH = `${process.env.PATH};${wingetFFmpegBin}`
}


// ─── Helper: run any shell command and wait for it ──────────────────────────
async function run(command: string): Promise<void> {
  try {
    await execAsync(command)
  } catch (error: any) {
    // Print the exact failing command so you know what went wrong
    console.error(`\n[FFmpeg Error] Command failed:`)
    console.error(command)
    console.error(error.message)
    throw error
  }
}

// ─── 1. Animate a single image into a clip ───────────────────────────────────
// Called by: AnimationAgent
// animationType: "topToBottom" | "bottomToTop" | "leftToRight" | "rightToLeft"
export async function animateImage(
  imagePath: string,
  outputPath: string,
  animationType: "topToBottom" | "bottomToTop" | "leftToRight" | "rightToLeft",
  clipDuration: number,
): Promise<void> {

  const input = path.resolve(imagePath)
  const output = path.resolve(outputPath)
  const fps = 25

  const filters: Record<string, () => string> = {
    topToBottom: () => {
      const h = Math.ceil(clipDuration * fps * 2) + 1080
      return `scale=608:${h}:force_original_aspect_ratio=increase,crop=608:1080:0:n*2`
    },
    bottomToTop: () => {
      const h = Math.ceil(clipDuration * fps * 2) + 1080
      return `scale=608:${h}:force_original_aspect_ratio=increase,crop=608:1080:0:${h}-1080-n*2`
    },
    leftToRight: () => {
      const w = Math.ceil(clipDuration * fps * 2) + 608
      return `scale=${w}:1080:force_original_aspect_ratio=increase,crop=608:1080:n*2:0`
    },
    rightToLeft: () => {
      const w = Math.ceil(clipDuration * fps * 2) + 608
      return `scale=${w}:1080:force_original_aspect_ratio=increase,crop=608:1080:${w}-608-n*2:0`
    },
  }

  const filter = filters[animationType]()
  const command = `ffmpeg -loop 1 -i "${input}" -vf "${filter}" -t ${clipDuration} -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -r 25 "${output}" -y`
  console.log("FFmpeg command:", command)
  await run(command)
}

// ─── 2. Concatenate all clips into one video ─────────────────────────────────
// Called by: ComposerAgent
export async function concatClips(
  clipsFolder: string,                                         // absolute path to clips/ folder
  outputPath: string                                           // absolute path to raw_video.mp4
): Promise<void> {

  const folder = path.resolve(clipsFolder)
  const output = path.resolve(outputPath)

  // Build the filelist.txt that FFmpeg needs
  const clips = fs.readdirSync(folder)
    .filter(f => f.endsWith(".mp4"))
    .sort()                                                    // scene_01, scene_02 ... in order
    .map(f => `file '${path.join(folder, f)}'`)
    .join("\n")

  const filelistPath = path.join(folder, "filelist.txt")
  fs.writeFileSync(filelistPath, clips)

  // Validate filelist exists and has content
  if (!fs.existsSync(filelistPath)) {
    throw new Error(`filelist.txt not found at ${filelistPath}`)
  }
  const filelistContent = fs.readFileSync(filelistPath, "utf-8").trim()
  if (!filelistContent) {
    throw new Error(`filelist.txt is empty at ${filelistPath}`)
  }
  const clipCount = filelistContent.split("\n").length
  console.log("Filelist content:", filelistContent)
  console.log(`Concatenating ${clipCount} clips...`)

  await run(
    `ffmpeg -f concat -safe 0 -i "${filelistPath}" ` +
    `-c:v libx264 -preset fast -crf 23 ` +
    `-pix_fmt yuv420p -r 25 "${output}" -y`
  )
}

// ─── 3. Mix video + voiceover + background music into final video ────────────
// Called by: ComposerAgent
export async function mixAudio(
  videoPath: string,                                           // absolute path to raw_video.mp4
  voicePath: string,                                           // absolute path to voiceover.mp3
  bgmPath: string,                                             // absolute path to background music .mp3
  outputPath: string,                                          // absolute path to final_video.mp4
  voiceDelayMs: number = 0                                     // ms delay for voiceover alignment
): Promise<void> {

  const video  = path.resolve(videoPath)
  const voice  = path.resolve(voicePath)
  const bgm    = path.resolve(bgmPath)
  const output = path.resolve(outputPath)

  // voiceover at 100% volume with configurable delay, background music at 12% volume
  await run(
    `ffmpeg -i "${video}" -i "${voice}" -i "${bgm}" ` +
    `-filter_complex "[1:a]adelay=${voiceDelayMs}|${voiceDelayMs},volume=1.0[vo];[2:a]volume=0.12,aloop=loop=-1:size=2e+09[bg];[vo][bg]amix=inputs=2:duration=first[a]" ` +
    `-map 0:v -map "[a]" -c:v copy -c:a aac -shortest "${output}" -y`
  )
}

// ─── 4. Mix video + voiceover only (no background music) ────────────────────
// Called by: ComposerAgent — fallback if no bgm file found in assets/bgm/
export async function mixVoiceOnly(
  videoPath: string,                                           // absolute path to raw_video.mp4
  voicePath: string,                                           // absolute path to voiceover.mp3
  outputPath: string,                                          // absolute path to final_video.mp4
  voiceDelayMs: number = 0                                     // ms delay for voiceover alignment
): Promise<void> {

  const video  = path.resolve(videoPath)
  const voice  = path.resolve(voicePath)
  const output = path.resolve(outputPath)

  await run(
    `ffmpeg -i "${video}" -i "${voice}" ` +
    `-filter_complex "[1:a]adelay=${voiceDelayMs}|${voiceDelayMs}[a]" ` +
    `-map 0:v -map "[a]" -c:v copy -c:a aac -shortest "${output}" -y`
  )
}

// ─── 5. Get duration of an audio file in seconds ─────────────────────────────
// Called by: VoiceAgent
export async function getAudioDuration(filePath: string): Promise<number> {
  const file = path.resolve(filePath)
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`
    )
    return parseFloat(stdout.trim())
  } catch (error: any) {
    console.error(`\n[FFmpeg Error] Failed to get duration:`)
    console.error(error.message)
    throw error
  }
}

// ─── 6. Check FFmpeg is installed ────────────────────────────────────────────
// Called by: run.ts at the very start — fails early with a clear message
export async function checkFFmpeg(): Promise<void> {
  try {
    await execAsync("ffmpeg -version")
    await execAsync("ffprobe -version")
  } catch {
    throw new Error(
      "\n[Setup Error] FFmpeg or ffprobe is not installed or not in your PATH.\n" +
      "Mac: brew install ffmpeg\n" +
      "Windows: download from ffmpeg.org and add to PATH\n" +
      "Linux: sudo apt install ffmpeg\n"
    )
  }
}
