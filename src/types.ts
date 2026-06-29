// types.ts
// This file defines the exact shape of data passed between agents.
// Every agent imports from here. Never change these unless you change the spec.

// ─── Output of TopicAgent ───────────────────────────────────────────────────
export interface TopicOutput {
  topic: string                                                 // e.g. "MKUltra"
  category: string                                             // e.g. "government experiments"
  hook_style: "contradiction" | "stakes" | "unbelievable-but-true"
  angle: string                                                // the shocking one-line framing
  slug: string                                                 // e.g. "cia-mkultra-brainwash" (used as folder name)
}

// ─── One scene inside a script ──────────────────────────────────────────────
export interface ScriptScene {
  scene: number                                                // 1 through N
  label: string                                                // e.g. "HOOK", "FACT 1", "CTA"
  narration: string                                            // the actual words spoken
  word_count: number                                           // word count for this scene
}

// ─── Output of ScriptAgent ──────────────────────────────────────────────────
export interface ScriptOutput {
  scenes: ScriptScene[]                                        // array of 10 scenes
  full_narration: string                                       // all scenes joined — sent to VoiceAgent
  word_count: number                                           // should be 200–240
}

// ─── One image prompt ───────────────────────────────────────────────────────
export interface ImagePrompt {
  scene: number                                                // matches scene number in script
  narration: string                                            // the narration this image represents
  image_prompt: string                                         // the full prompt sent to fal.ai
  split?: boolean                                              // true if scene was split into 2 prompts
  part?: "a" | "b"                                             // which half of a split scene
  clip_duration?: number                                       // duration in seconds for this clip
}

// ─── Output of PromptAgent ──────────────────────────────────────────────────
export type PromptsOutput = ImagePrompt[]                      // array of 10 prompts

// ─── One generated image ────────────────────────────────────────────────────
export interface GeneratedImage {
  scene: number                                                // matches scene number
  file_path: string                                            // absolute path to the saved .png file
}

// ─── Output of ImageAgent ───────────────────────────────────────────────────
export type ImagesOutput = GeneratedImage[]                    // array of 10 images

// ─── One animated clip ──────────────────────────────────────────────────────
export interface AnimatedClip {
  scene: number                                                // matches scene number
  file_path: string                                            // absolute path to the saved .mp4 clip
}

// ─── Output of AnimationAgent ───────────────────────────────────────────────
export type ClipsOutput = AnimatedClip[]                       // array of 10 clips

// ─── Output of VoiceAgent ───────────────────────────────────────────────────
export interface VoiceOutput {
  file_path: string                                            // absolute path to voiceover.mp3
  duration_seconds: number                                     // how long the audio is
}

// ─── Output of ComposerAgent ────────────────────────────────────────────────
export interface ComposerOutput {
  file_path: string                                            // absolute path to final_video.mp4
}

// ─── The full run state — passed through all agents in run.ts ───────────────
// This is the single object that run.ts builds up stage by stage.
export interface RunState {
  topic?: TopicOutput
  script?: ScriptOutput
  prompts?: PromptsOutput
  images?: ImagesOutput
  clips?: ClipsOutput
  voice?: VoiceOutput
  video?: ComposerOutput
  output_folder?: string                                       // absolute path to this run's output folder
  start_time?: number                                          // Date.now() at start of run
}
