# FactForge

**8-agent AI pipeline that produces TikTok videos automatically. One command. Zero cost.**

A content creator was spending 3–4 hours every day just to post one TikTok video — script, images, voiceover, editing, captions, hashtags. FactForge automates the entire production pipeline from a single terminal command.

---

## Demo

**Sample output videos** — real videos produced by FactForge:
> 📁 See the `/demos` folder in this repo.

---

## How It Works

```
npx ts-node src/run.ts
```

One command triggers 8 agents in sequence:

```
TopicAgent → ScriptAgent → PromptAgent → ImageAgent → VoiceAgent → AnimationAgent → ComposerAgent → PackageAgent
```

| Agent | What It Does |
|---|---|
| **TopicAgent** | Picks an unused dark history topic from memory |
| **ScriptAgent** | Writes a 20–25 scene viral script with a locked story structure |
| **PromptAgent** | Generates a cinematic image prompt for every scene (batched 8/call) |
| **ImageAgent** | Fetches vertical 9:16 AI images from Pollinations.ai FLUX |
| **VoiceAgent** | Narrates the full script using Microsoft Edge TTS |
| **AnimationAgent** | Adds directional pan movement to every image clip |
| **ComposerAgent** | Stitches all clips, mixes BGM at 12% volume |
| **PackageAgent** | Writes TikTok caption + hashtags, updates memory, logs the run |

---

## Output Per Run

```
outputs/{topic-slug}/
  ├── script.md          ← Full narration with scene labels
  ├── prompts.json       ← Image prompt per scene
  ├── images/            ← Generated 608x1080px vertical images
  ├── clips/             ← Animated video clips per scene
  ├── voiceover.mp3      ← Full narration audio
  ├── final_video.mp4    ← Ready to upload
  ├── caption.txt        ← TikTok caption + hashtags
  └── run.log            ← Timing + errors
```

---

## Stack

| Stage | Tool | Cost |
|---|---|---|
| Topic, Script, Prompts | LLaMA 3.3 70B via OpenRouter | $0.00 |
| Image Generation | Pollinations.ai FLUX (608x1080px) | $0.00 |
| Voiceover | Microsoft Edge TTS — en-US-ChristopherNeural | $0.00 |
| Animation + Stitching | FFmpeg (local) | $0.00 |
| **Total per video** | | **$0.00** |

---

## Setup

### Prerequisites
- Node.js 18+
- FFmpeg installed locally and added to PATH
- OpenRouter account (free tier)

### Installation

```bash
git clone https://github.com/zain-jamshed/factforge.git
cd factforge
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
OPENROUTER_API_KEY=your_key_here
```

Get a free key at [openrouter.ai](https://openrouter.ai)

### Run

```bash
npx ts-node src/run.ts
```

---

## Project Structure

```
factforge/
  ├── src/
  │     ├── agents/        ← 8 agent files
  │     ├── utils/         ← FFmpeg, memory, logger, OpenRouter helpers
  │     ├── tests/         ← Individual agent test files
  │     ├── run.ts         ← Entry point
  │     └── types.ts       ← Shared TypeScript interfaces
  ├── memory/
  │     ├── memory.json    ← Channel memory — topics used, what works
  │     └── hooks.txt      ← Curated hook patterns
  ├── assets/
  │     └── bgm/           ← Drop royalty-free .mp3 files here for background music
  ├── .env                 ← API keys (not committed)
  ├── agent.md             ← Agent identity, voice, constraints
  ├── spec.md              ← Full technical specification
  └── CONTEXT.md           ← Session context for AI-assisted development
```

---

## Key Technical Decisions

- **No zoompan** — uses scale+crop with FFmpeg's `n` frame counter for smooth panning on Windows
- **Never `-c copy` in concat** — always re-encodes to handle mixed codecs
- **Batched LLaMA calls** — 8 scenes per API call to stay within token limits
- **Random seed per image** — prevents Pollinations.ai from returning cached duplicates
- **memory.json isolation** — test runs always write to `memory.test.json`, never production memory

---

## Niche

Dark history — disturbing, hidden, and morally complex true stories. Target audience: English speakers aged 16–32 (US, UK, Australia).

---

## Built By

Zain Ali — AI Systems Developer, Karachi, Pakistan  
[LinkedIn](https://www.linkedin.com/in/zain-ali-741215385)
