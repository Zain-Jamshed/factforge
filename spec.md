# FactForge — spec.md

## Overview

A local Node.js + TypeScript pipeline that runs with one command and produces a complete, ready-to-upload TikTok video about dark history facts. The operator reviews the output and uploads manually to TikTok.

**Runtime:** Local machine (MacOS/Windows/Linux)  
**Language:** TypeScript (Node.js)  
**Build tool:** Gemini CLI  
**APIs:** OpenRouter (LLaMA 3.3 70B), Pollinations.ai (FLUX), Microsoft Edge TTS  
**Local tools:** FFmpeg (must be installed)  
**Human touchpoint:** Final review + TikTok upload only

---

## Project Structure

```
factforge/
  ├── src/
  │     ├── run.ts                  ← Entry point — orchestrates all stages
  │     ├── types.ts                ← ALREADY WRITTEN — all shared TypeScript interfaces
  │     ├── agents/
  │     │     ├── topicAgent.ts
  │     │     ├── scriptAgent.ts
  │     │     ├── promptAgent.ts
  │     │     ├── imageAgent.ts
  │     │     ├── voiceAgent.ts
  │     │     ├── animationAgent.ts
  │     │     ├── composerAgent.ts
  │     │     └── packageAgent.ts
  │     └── utils/
  │           ├── memory.ts         ← Read/write memory.json
  │           ├── ffmpeg.ts         ← ALREADY WRITTEN — all FFmpeg command wrappers
  │           ├── logger.ts         ← Console + file logging
  │           └── slugify.ts        ← Convert topic to folder-safe slug
  ├── memory/
  │     ├── memory.json             ← ALREADY WRITTEN — starter dark history values
  │     ├── hooks.txt               ← ALREADY WRITTEN — 10 starter hook patterns
  │     └── scripts/                ← Empty — human adds best performing scripts here
  ├── outputs/                      ← All generated videos (gitignored)
  ├── assets/
  │     └── bgm/                    ← Human drops royalty-free .mp3 files here
  ├── .env
  ├── agent.md
  ├── spec.md
  ├── CONTEXT.md                    ← ALREADY WRITTEN — Gemini CLI session briefing
  ├── package.json
  └── tsconfig.json
```

---

## Environment Variables

```env
OPENROUTER_API_KEY=
```

---

## Dependencies

```json
{
  "dependencies": {
    "openai": "^4.0.0",
    "axios": "^1.6.0",
    "dotenv": "^16.0.0",
    "edge-tts": "^1.0.0",
    "sharp": "^0.33.0",
    "fs-extra": "^11.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/fs-extra": "^11.0.0",
    "ts-node": "^10.9.0"
  }
}
```

**FFmpeg:** Must be installed separately on the machine.  
- Mac: `brew install ffmpeg`  
- Windows: Download from ffmpeg.org, add to PATH  
- Linux: `sudo apt install ffmpeg`

---

## Pre-Written Files

These files are already written and must NOT be rewritten by Gemini:

| File | Rule |
|---|---|
| `src/types.ts` | All agents import interfaces from here. Never define interfaces inside agent files. |
| `src/utils/ffmpeg.ts` | All agents import FFmpeg functions from here. Never write raw FFmpeg commands inside agent files. |
| `memory/memory.json` | Production-ready starter values. Agent writes to it — human never edits `used_topics` manually. |
| `memory/hooks.txt` | 10 starter hook patterns. Human adds more every 2 weeks based on analytics. |
| `CONTEXT.md` | Gemini session briefing. Update the build status table after each session. |

---

## Pipeline Stages

All stages run sequentially. Each stage writes output to disk before the next begins. If any stage fails, the pipeline stops and logs the error — it never silently continues with bad data.

Every agent file must start with:
```typescript
import { /* relevant types */ } from '../types'
import * as dotenv from 'dotenv'
dotenv.config()
```

---

### Stage 1 — TopicAgent (`topicAgent.ts`)

**Input:** `memory/memory.json`  
**Output:** `{ topic, category, hook_style, angle, slug }`

Reads memory to understand what topics are used, what categories win, and what hook styles perform. Calls LLaMA 3.3 70B via OpenRouter to pick the next topic.

**LLaMA system prompt:**
```
You are a TikTok dark history content strategist. Your job is to pick 
the single most compelling untold dark history story for today's video.

Rules:
- Must be a true, verifiable historical event
- Must have a natural "wait, really?" quality — shocking but factual
- Must be explainable in under 60 seconds
- Must NOT be in the used topics list
- Must come from a winning category if possible
- The angle must work as one of these hook styles: contradiction, stakes, unbelievable-but-true

Return ONLY valid JSON, no preamble, no markdown:
{
  "topic": "string — the historical event/story",
  "category": "string — e.g. government experiments",
  "hook_style": "contradiction | stakes | unbelievable-but-true",
  "angle": "string — the one-sentence shocking framing of this story"
}
```

---

### Stage 2 — ScriptAgent (`scriptAgent.ts`)

**Input:** Topic JSON + `memory/hooks.txt` + 2 random scripts from `memory/scripts/`  
**Output:** `script.md` saved to output folder

Writes a 10-scene, 200–240 word script using the channel's proven structure. Uses hooks.txt and sample scripts as few-shot examples so it writes in the channel's voice, not generically.

**Script structure enforced in prompt:**
```
[SCENE 1 — HOOK]      2 sentences. Uses the chosen hook_style. Most shocking line first.
[SCENE 2 — SETUP]     1–2 sentences. Historical context. Why this matters.
[SCENE 3 — FACT 1]    1–2 sentences. First disturbing detail.
[SCENE 4 — FACT 2]    1–2 sentences. Escalate. Gets worse.
[SCENE 5 — FACT 3]    1–2 sentences. Third detail — deepen the story.
[SCENE 6 — FACT 4]    1–2 sentences. The part that sounds most impossible.
[SCENE 7 — DETAIL]    1–2 sentences. Specific name, date, number — makes it real.
[SCENE 8 — TWIST]     1–2 sentences. The reversal or unexpected consequence.
[SCENE 9 — PAYOFF]    1 sentence. The single most shocking fact. Standalone line.
[SCENE 10 — CTA]      1 sentence. "Follow — new dark history video every day."
```

**LLaMA system prompt:**
```
You are a viral TikTok scriptwriter specialising in dark history facts.

Channel voice: calm, intense, slightly ominous. Never dry, never screaming.
Target: English audience aged 16–32, primarily US/UK/Australia.
Length: 200–240 words total. 10 scenes. Fast pacing.

Rules:
- Never use filler: no "In this video", "Today we'll learn", "As you can see"
- Every sentence either reveals something new or raises a question
- Scene 9 must be the single most shocking fact — one sentence, standalone
- Scene 10 is always: "Follow — new dark history video every day."
- Write like you're telling a secret to a friend, not reading Wikipedia

Hook style for this video: {hook_style}
Topic: {topic}
Angle: {angle}

Here are two high-performing scripts from this channel for reference:
{sample_scripts}

Here are hook patterns that have worked well on this channel:
{hooks}

Return the script in this exact format with scene labels included.
```

---

### Stage 3 — PromptAgent (`promptAgent.ts`)

**Input:** `script.md`  
**Output:** `prompts.json` saved to output folder

Converts each scene's narration into a cinematic image generation prompt. Locks the visual style from `memory.json` across all prompts for consistency.

**Output format:**
```json
[
  {
    "scene": 1,
    "narration": "...",
    "image_prompt": "..."
  }
]
```

**Image prompt rules enforced in LLaMA prompt:**
- Always end with: `"{visual_style}. 9:16 vertical aspect ratio. Cinematic. No text. No watermarks. No real human faces. No gore. No graphic violence."`
- Scene 1 (hook) → wide dramatic establishing shot
- Middle scenes → close detail shots, specific objects, locations
- Scene 9 (payoff) → most dramatic composition
- Scene 10 (CTA) → dark background, single glowing element

---

### Stage 4 — ImageAgent (`imageAgent.ts`)

**Input:** `prompts.json`  
**Output:** `images/scene_01.png` through `scene_10.png`

Calls Pollinations.ai FLUX for each prompt sequentially with a 3 second delay between calls. Random seed per request prevents cached duplicates. Sharp checks and rotates any landscape images.

**API call:**
```typescript
const seed = Math.floor(Math.random() * 1000000);
const encodedPrompt = encodeURIComponent(
  `portrait orientation, vertical frame, 9:16 aspect ratio, mobile screen format, ${scene.image_prompt}`
);
const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=608&height=1080&nologo=true&model=flux&seed=${seed}`;

// Download image buffer, check orientation with sharp, save to outputs/{slug}/images/scene_XX.png
```

**Fallback:** If a single image fails, retry up to 5 times for first image, 2 times for subsequent. If all retries fail, duplicate the previous scene's image and log the fallback in `run.log`.

---

### Stage 5 — VoiceAgent (`voiceAgent.ts`)

**Input:** Full narration extracted from `script.md` (all scene text concatenated, scene labels removed)  
**Output:** `voiceover.mp3`

**API call:**
```typescript
import { EdgeTTS } from 'edge-tts';

const tts = new EdgeTTS();
await tts.ttsPromise(fullNarration, `outputs/${slug}/voiceover.mp3`, {
  voice: 'en-US-ChristopherNeural'
});

// Duration calculated via ffprobe after file is saved
```

**Fallback:** If Edge TTS fails, save narration as `voiceover_needed.txt` and log. Human can generate voiceover manually and drop the mp3 into the folder, then re-run from Stage 6.

---

### Stage 6 — AnimationAgent (`animationAgent.ts`)

**Input:** `images/` folder  
**Output:** `clips/scene_01.mp4` through `scene_10.mp4` (6 seconds each)

Uses FFmpeg scale+crop pan effect. Rotates between 4 directions based on scene number to avoid visual monotony:

```typescript
const directions = ['topToBottom', 'bottomToTop', 'leftToRight', 'rightToLeft'];
const direction = directions[sceneIndex % 4];

// topToBottom: scale tall, crop y moves down by n*2
// bottomToTop: scale tall, crop y moves up from bottom
// leftToRight: scale wide, crop x moves right by n*2
// rightToLeft: scale wide, crop x moves left from right
// All expressions use n (frame counter) — never zoompan
```

**FFmpeg command per clip:**
```bash
ffmpeg -loop 1 -i images/scene_01.png \
  -vf "{scale_crop_filter},format=yuv420p" \
  -t {clipDuration} -c:v libx264 -r 30 \
  clips/scene_01.mp4 -y
```

Clip duration = voiceoverDuration / totalImages (equal split, voice-synced).

---

### Stage 7 — ComposerAgent (`composerAgent.ts`)

**Input:** `clips/` folder + `voiceover.mp3` + random bgm from `assets/bgm/`  
**Output:** `final_video.mp4`

**Step 1 — Write filelist:**
```
file 'clips/scene_01.mp4'
file 'clips/scene_02.mp4'
...
```

**Step 2 — Concatenate clips with fade transitions:**
```bash
ffmpeg -f concat -safe 0 -i filelist.txt \
  -vf "fade=t=in:st=0:d=0.3" \
  -c:v libx264 raw_video.mp4 -y
```

**Step 3 — Mix voiceover + background music:**
```bash
ffmpeg -i raw_video.mp4 -i voiceover.mp3 -i {bgm_file} \
  -filter_complex \
  "[1:a]volume=1.0[vo];[2:a]volume=0.12,aloop=loop=-1:size=2e+09[bg];[vo][bg]amix=inputs=2:duration=first[a]" \
  -map 0:v -map "[a]" \
  -c:v copy -c:a aac \
  -shortest final_video.mp4 -y
```

**Output specs:** 1080×1920, H.264 video, AAC audio, optimised for TikTok upload.

---

### Stage 8 — PackageAgent (`packageAgent.ts`)

**Input:** Topic JSON + script hook line + run stats  
**Output:** `caption.txt` + updated `memory.json` + completed `run.log`

**caption.txt format:**
```
{Hook sentence from Scene 1 — repurposed as caption}

{2-line teaser pulling from scenes 3 and 9}

#darkhistory #historyfacts #didyouknow #truecrime #history 
#{category_hashtag} #{topic_keyword_hashtag} #learnontiktok #facts
```

**memory.json update:**
- Append topic to `used_topics`
- Increment `total_videos_produced`
- Update `last_run` to today's date

**run.log final entry:**
```
[COMPLETE] Run #76 finished in 5m 12s
Topic: The man who remembered everything and went insane
Output: /outputs/memory-man-insane/final_video.mp4
Cost this run: $0.00
Ready to upload.
```

---

## Entry Point — `run.ts`

Orchestrates all 8 stages sequentially. Handles top-level error catching. Prints clean progress to terminal.

**Terminal output during a run:**
```
[FactForge] Starting run #76
[FactForge] Reading memory...

[TopicAgent] Selecting topic...
[TopicAgent] ✓ "The CIA's MKUltra program that brainwashed American citizens"
[TopicAgent] Category: government experiments | Hook: unbelievable-but-true

[ScriptAgent] Writing script...
[ScriptAgent] ✓ 224 words, 10 scenes

[PromptAgent] Generating image prompts...
[PromptAgent] ✓ 10 prompts ready

[ImageAgent] Generating images...
[ImageAgent] ✓ 1/10
[ImageAgent] ✓ 2/10
...
[ImageAgent] ✓ 10/10 — all images saved

[VoiceAgent] Generating voiceover...
[VoiceAgent] ✓ voiceover.mp3 saved (58 seconds)

[AnimationAgent] Animating clips...
[AnimationAgent] ✓ 10/10 clips rendered

[ComposerAgent] Composing final video...
[ComposerAgent] ✓ final_video.mp4 ready

[PackageAgent] Writing caption...
[PackageAgent] ✓ caption.txt saved
[PackageAgent] ✓ memory.json updated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[FactForge] DONE in 5m 12s
Output → /outputs/cia-mkultra-brainwash/final_video.mp4
Caption → /outputs/cia-mkultra-brainwash/caption.txt
Cost this run → $0.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Go upload it.
```

---

## Run Command

```bash
npx ts-node src/run.ts
```

---

## Cost Per Video

| Stage | Tool | Cost |
|---|---|---|
| Topic + Script + Prompts | LLaMA 3.3 70B via OpenRouter | $0.00 |
| Images (20–25 scenes) | Pollinations.ai FLUX | $0.00 |
| Voiceover | Microsoft Edge TTS | $0.00 |
| Animation + Stitching | FFmpeg (local) | $0.00 |
| **Total** | | **$0.00/video** |

**Monthly (30 videos):** $0.00

---

## Monthly Cost

| Phase | Monthly Cost | Videos |
|---|---|---|
| Current (free stack) | $0.00 | 30 |

---

## Out of Scope (v1)

- Kling AI animation (add in v2 post-monetization)
- Auto-posting to TikTok
- Subtitle/caption overlay (done manually in TikTok editor)
- Analytics ingestion (manual every 2 weeks)
- Scheduling / cron (operator runs manually each day)
- Multiple videos per day

---

## Gemini CLI Instructions

Start every session with:
```
Read CONTEXT.md first. Then read agent.md and spec.md. 
Tell me what's already built and what we're building this session.
```

Work stage by stage in this exact order:

| Session | Build | Notes |
|---|---|---|
| 1 | `package.json` + `tsconfig.json` + folder structure | Do not touch pre-written files |
| 2 | `utils/memory.ts` + `utils/logger.ts` + `utils/slugify.ts` | Import types from `src/types.ts` |
| 3 | `agents/topicAgent.ts` | Test in isolation before continuing |
| 4 | `agents/scriptAgent.ts` | Test with topicAgent output |
| 5 | `agents/promptAgent.ts` | Test with scriptAgent output |
| 6 | `agents/animationAgent.ts` | Free to test — uses ffmpeg.ts |
| 7 | `agents/composerAgent.ts` | Free to test — uses ffmpeg.ts |
| 8 | `agents/imageAgent.ts` | Costs money — test with 1 image only |
| 9 | `agents/voiceAgent.ts` | Costs money — test with short text only |
| 10 | `agents/packageAgent.ts` | Test with mock run data |
| 11 | `src/run.ts` | Wire all agents together |
| 12+ | Bug fixing + output quality tuning | |

After each session update the build status table in `CONTEXT.md`.
