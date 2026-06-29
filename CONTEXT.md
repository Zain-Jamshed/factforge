# FactForge — CONTEXT.md
# Read this at the start of every Gemini CLI session before doing anything.

---

## What This Project Is

A local Node.js + TypeScript pipeline that runs with one command and produces a complete TikTok video automatically. It picks a dark history topic, writes a script, generates images, animates them, creates a voiceover, stitches everything into a final video, and writes a TikTok caption. The human only reviews and uploads.

**Run command:** `npx ts-node src/run.ts`  
**Niche:** Dark history facts — disturbing, hidden, morally complex true stories  
**Target audience:** English speakers aged 16–32 (US, UK, Australia)

---

## Files Already Written — Do Not Rewrite These

| File | Location | What It Does |
|---|---|---|
| `agent.md` | `/agent.md` | Agent identity, voice, constraints, memory system |
| `spec.md` | `/spec.md` | Full technical spec — all stages, API calls, FFmpeg commands |
| `types.ts` | `/src/types.ts` | All TypeScript interfaces shared between agents |
| `ffmpeg.ts` | `/src/utils/ffmpeg.ts` | All FFmpeg command wrappers with absolute path handling |
| `memory.json` | `/memory/memory.json` | Channel memory — topics used, what works, visual style |
| `hooks.txt` | `/memory/hooks.txt` | Hook patterns the ScriptAgent reads before writing |
| `CONTEXT.md` | `/CONTEXT.md` | This file |

**Never rewrite or overwrite any of the above files unless explicitly told to.**

---

## Project Structure

```
factforge/
  ├── src/
  │     ├── run.ts                        ← Entry point
  │     ├── types.ts                      ← ALREADY WRITTEN
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
  │           ├── ffmpeg.ts               ← ALREADY WRITTEN
  │           ├── memory.ts
  │           ├── logger.ts
  │           └── slugify.ts
  ├── memory/
  │     ├── memory.json                   ← ALREADY WRITTEN
  │     ├── hooks.txt                     ← ALREADY WRITTEN
  │     └── scripts/                      ← Empty — human adds scripts here
  ├── outputs/                            ← Gitignored
  ├── assets/
  │     └── bgm/                          ← Human drops .mp3 files here
  ├── .env
  ├── agent.md
  ├── spec.md
  ├── CONTEXT.md
  ├── package.json
  └── tsconfig.json
```

---

## APIs Used

| API | Purpose | Key in .env |
|---|---|---|
| OpenRouter | Topic, script, prompts (LLaMA 3.3 70B) | OPENROUTER_API_KEY |
| Pollinations.ai | Image generation (FLUX) | None — free, no key |
| Edge TTS | Voiceover (Christopher Neural) | None — free, no key |
| FFmpeg | Animation + stitching | Installed locally, no key |

---

## Data Flow Between Agents

This is the exact shape of data passed between agents. Always import from `src/types.ts`:

```
run.ts builds a RunState object, passing it through each agent:

TopicAgent    → returns TopicOutput      → saved to RunState.topic
ScriptAgent   → returns ScriptOutput     → saved to RunState.script
PromptAgent   → returns PromptsOutput    → saved to RunState.prompts
ImageAgent    → returns ImagesOutput     → saved to RunState.images
VoiceAgent    → returns VoiceOutput      → saved to RunState.voice
AnimationAgent→ returns ClipsOutput      → saved to RunState.clips
ComposerAgent → returns ComposerOutput   → saved to RunState.video
PackageAgent  → returns void             → writes files, updates memory
```

---

## Rules Gemini Must Follow

1. Always import types from `src/types.ts` — never define interfaces inside agent files
2. Always import FFmpeg functions from `src/utils/ffmpeg.ts` — never write raw FFmpeg commands inside agents
3. Always use `path.resolve()` for any file path passed to FFmpeg
4. Always use `dotenv` to load `.env` at the top of any file that uses API keys
5. Never hardcode API keys anywhere
6. Every agent function must be async and return the correct type from `types.ts`
7. Every agent must log its progress using the logger utility
8. If an API call fails, follow the error handling rules in `agent.md`
9. Never delete files from the outputs folder — even on error
10. Test each agent individually before wiring into `run.ts`

---

## Build Order (Session by Session)

| Session | What to Build |
|---|---|
| 1 | `package.json` + `tsconfig.json` + folder structure |
| 2 | `utils/memory.ts` + `utils/logger.ts` + `utils/slugify.ts` |
| 3 | `agents/topicAgent.ts` + test |
| 4 | `agents/scriptAgent.ts` + test |
| 5 | `agents/promptAgent.ts` + test |
| 6 | `agents/animationAgent.ts` + test (free) |
| 7 | `agents/composerAgent.ts` + test (free) |
| 8 | `agents/imageAgent.ts` + test (costs money — test with 1 image only) |
| 9 | `agents/voiceAgent.ts` + test (costs money — test with short text) |
| 10 | `agents/packageAgent.ts` + test |
| 11 | `src/run.ts` — wire all agents together |
| 12+ | Bug fixing and output quality tuning |

---

## Current Build Status

| File | Status |
|---|---|
| types.ts | ✅ Done |
| ffmpeg.ts | ✅ Done — crop filter, 4 directions |
| memory.json | ✅ Done |
| hooks.txt | ✅ Done |
| package.json | ✅ Done |
| tsconfig.json | ✅ Done |
| utils/memory.ts | ✅ Done |
| utils/logger.ts | ✅ Done |
| utils/slugify.ts | ✅ Done |
| utils/openrouter.ts | ✅ Done — LLaMA 3.3 70B |
| animationAgent.ts | ✅ Done — crop pan, 4 directions, equal duration |
| composerAgent.ts | ✅ Done |
| voiceAgent.ts | ✅ Done — Edge TTS, en-US-ChristopherNeural |
| packageAgent.ts | ✅ Done |
| topicAgent.ts | ✅ Done — tested |
| scriptAgent.ts | ✅ Done — 20-25 scenes, 1 sentence each |
| promptAgent.ts | ✅ Done — batched 8 scenes/call, varied compositions |
| imageAgent.ts | ✅ Done — Pollinations.ai FLUX, 608x1080 |
| run.ts | ✅ Done — full pipeline working |

---

## Session Log

### Session 1
- **Built:** package.json, tsconfig.json, .env, folder structure
- **Details:** Base project scaffolded, all folders created

### Session 2
- **Built:** utils/slugify.ts, utils/logger.ts, utils/memory.ts
- **Details:** All utilities working, no issues

### Session 3
- **Built:** animationAgent.ts
- **Details:** Ken Burns zoom effect — later replaced

### Session 4
- **Built:** composerAgent.ts
- **Details:** Clip concat + audio mixing, BGM fallback working

### Session 5
- **Built:** voiceAgent.ts
- **Details:** Originally ElevenLabs — later switched to Edge TTS

### Session 6
- **Built:** packageAgent.ts, topicAgent.ts, scriptAgent.ts, promptAgent.ts
- **Details:** All built, memory.test.json isolation added

### Session 7
- **Built:** utils/openrouter.ts
- **Details:** 
    - LLaMA 3.3 70B via OpenRouter (free, unlimited)
    - Model string: meta-llama/llama-3.3-70b-instruct

### Session 8
- **Built:** imageAgent.ts
- **Details:**
    - Pollinations.ai FLUX (free, no key, unlimited)
    - URL: https://image.pollinations.ai/prompt/{prompt}?width=608&height=1080&nologo=true&model=flux
    - Added sharp for orientation check and rotation
    - Random seed per request to prevent cached duplicates

### Session 9 — Voice Integration
- **Built:** voiceAgent.ts
- **Details:**
    - Microsoft Edge TTS — permanently selected
    - Voice: en-US-ChristopherNeural (deep, calm, professional)
    - Completely free, unlimited characters, no API key needed
    - Package: edge-tts (npm)

### Session 10 — Pipeline Integration & Fixes
- **Built:** run.ts — full pipeline wired
- **Details:**
    - All 8 agents connected via RunState object
    - voiceover duration passed to animationAgent for sync
    - scenes array passed to animationAgent for word-count based duration
    - FFprobe PATH fixed via hardcoded Windows path in ffmpeg.ts

### Session 11 — Quality Improvements (Ongoing)
- **Changes across multiple agents:**

  scriptAgent.ts:
    - Scene count increased from 10-15 to 20-25 scenes
    - Each scene: exactly 1 sentence, max 15 words
    - Story structure: hook → context → events → resolution → payoff
    - Story always resolves completely by scene 9

  promptAgent.ts:
    - Batched API calls: 8 scenes per batch, 1s delay between batches
    - max_tokens reduced to 2000 per batch (prevents truncation)
    - Sort + deduplicate prompts by scene number after batching
    - fillMissingPrompts generates unique fallbacks from narration
    - Varied composition rules: wide shots, objects, environments, portraits
    - Portrait style limited to 1 in every 5 scenes
    - Removed candlelight as default style — was causing same image repeatedly
    - Style suffix: dark cinematic realism, dramatic lighting, 9:16 vertical

  animationAgent.ts:
    - Replaced Ken Burns zoom with crop-based pan (more reliable on Windows)
    - 4 directions: topToBottom, bottomToTop, leftToRight, rightToLeft
    - Clip duration = voiceoverDuration / totalImages (equal split)
    - Smooth continuous movement using n (frame number) expressions

  ffmpeg.ts:
    - animateImage: uses scale + crop with n*2 pixel movement per frame
    - Scale image large enough to have room to pan
    - leftToRight: scale wide, crop moves x by n*2
    - rightToLeft: scale wide, crop moves x from right
    - topToBottom: scale tall, crop moves y by n*2
    - bottomToTop: scale tall, crop moves y from bottom
    - Windows-safe: no single quotes, no backslashes in expressions

  imageAgent.ts:
    - 3 second delay between requests (was 1s — too fast caused duplicates)
    - Random seed per request: &seed={random} prevents Pollinations cache
    - 5 retry attempts for first image, 2 for subsequent

  voiceAgent.ts:
    - Edge TTS fully integrated
    - Voice: en-US-ChristopherNeural
    - Blank lines between scenes for natural pacing
    - Duration calculated via ffprobe

- **Current known issues:**
    - Animation FFmpeg command still failing on Windows — n expression fix pending
    - Same composition repeating in images — varied composition fix applied
    - Duplicate images in some runs — seed fix applied

- **Next:** 
    - Confirm animation fix working (n*2 crop approach)
    - Run full pipeline and verify visual variety in images
    - Update memory/hooks.txt with real performing hooks
    - Add bgm tracks to assets/bgm/