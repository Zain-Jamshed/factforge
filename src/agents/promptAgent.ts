// promptAgent.ts
// Converts script scenes into cinematic image generation prompts.

import { ScriptOutput, PromptsOutput, ImagePrompt, ScriptScene } from "../types"
import { readMemory } from "../utils/memory"
import { logger } from "../utils/logger"
import { callOpenRouter } from "../utils/openrouter"
import * as dotenv from "dotenv"
import { jsonrepair } from "jsonrepair"

dotenv.config()

const SAFETY_APPEND = "dark cinematic realism, dramatic lighting, warm amber or cold blue tones, no text, no watermarks, SFW, 9:16 vertical aspect ratio"

const ARRAY_KEYS = ["scenes", "prompts", "image_prompts", "data", "images"]

function stripMarkdown(raw: string): string {
  return raw.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim()
}

function parseToArray(content: string): ImagePrompt[] {
  let cleaned = stripMarkdown(content)

  if (cleaned.startsWith("{")) {
    cleaned = "[" + cleaned + "]"
  }

  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    logger.warn("Initial JSON parse failed — attempting jsonrepair...")
    try {
      parsed = JSON.parse(jsonrepair(cleaned))
    } catch {
      const matches = cleaned.match(/\{[^{}]*\}/g)
      if (matches && matches.length > 0) {
        const parsedMatches: any[] = []
        for (const m of matches) {
          try {
            parsedMatches.push(JSON.parse(jsonrepair(m)))
          } catch {
            continue
          }
        }
        parsed = parsedMatches
      } else {
        throw new Error("Regex extraction also failed.")
      }
    }
  }

  if (Array.isArray(parsed)) {
    console.log(`Extracted ${parsed.length} prompt objects`)
    return parsed
  }

  if (parsed && typeof parsed === "object") {
    for (const key of ARRAY_KEYS) {
      if (Array.isArray(parsed[key])) return parsed[key]
    }
    if (parsed.scene != null && parsed.image_prompt != null) return [parsed]
  }

  throw new Error(
    `PromptAgent: Could not extract image prompt array from LLM response.\n` +
    `Parsed shape: ${JSON.stringify(parsed).slice(0, 300)}\n` +
    `Raw response (first 1000 chars):\n${content.slice(0, 1000)}`
  )
}

function fillMissingPrompts(
  prompts: ImagePrompt[],
  scenes: ScriptScene[]
): ImagePrompt[] {
  const result: ImagePrompt[] = []

  for (const scene of scenes) {
    const existing = prompts.find(p => p.scene === scene.scene)

    if (existing) {
      result.push(existing)
    } else {
      result.push({
        scene: scene.scene,
        narration: scene.narration,
        image_prompt: `${scene.narration} Cinematic dark historical scene. dark cinematic realism, dramatic lighting, warm amber or cold blue tones, no text, no watermarks, SFW, 9:16 vertical aspect ratio`,
        clip_duration: Math.max(3, (scene.word_count ?? 12) / 2.5)
      })
      console.log(`Fallback prompt for scene ${scene.scene}: ${scene.narration.slice(0,50)}`)
    }
  }

  return result
}

export async function promptAgent(script: ScriptOutput, memoryPath?: string): Promise<PromptsOutput> {
  logger.info("Generating image prompts with PromptAgent...")

  const memory = readMemory(memoryPath)
  const visualStyle = memory.visual_style || "dark cinematic realism, warm amber highlights, dramatic lighting"

  const systemPrompt = `
ABSOLUTE RULE: Zero close-up faces allowed. If your prompt would result in a face filling the frame — rewrite it to show the environment or objects instead. No exceptions.

# SYSTEM PROMPT — CINEMATIC TRUE CRIME IMAGE PROMPT GENERATOR

You are an expert cinematic prompt engineer for viral TikTok True Crime and Dark History videos.

Your job is:

Take ONE narration sentence and transform it into ONE visually powerful image prompt.

The image should tell the story instantly, even if viewed without audio.

---

# MAIN GOAL

Generate images that feel like scenes from a Netflix crime documentary.

Every image should look DIFFERENT.

The audience should never feel:

"This is the same picture again."

---

# MOST IMPORTANT RULE

The image MUST represent EXACTLY what the narration describes.

If narration says:

"A man hid stolen diamonds inside walking canes."

DO NOT show:

* random dark room
* random criminal
* close up face

SHOW:

* antique walking canes opened on a wooden table
* hidden diamonds inside
* gloved hands arranging them
* police evidence tags nearby

---

# NO REPETITIVE IMAGES

Avoid:

* Same room repeatedly
* Same man repeatedly
* Same pose repeatedly
* Same camera angle repeatedly
* Same lighting repeatedly
* Same close-up repeatedly

Every scene MUST feel visually fresh.

---

# FACE RULE

a single person never should be highlight when the scene is about the whole group, when the topic is about whole group the image should be wide angle of that specific group of people

Maximum:

ONE portrait-style scene in the entire video.

Even then:

* Show half face
* Side profile
* Shadowed face
* Person within environment

Prefer:

* Over shoulder
* Back view
* Silhouette
* Person walking away
* Hands only
* Reflection in mirror
* Figure in distance

---

# COMPOSITION ROTATION

Track previous scenes and deliberately change camera composition.

Rotate between:

### 1. Wide Establishing Shot

Examples:

* Old city streets
* Harbor
* Mansion
* Desert camp
* Village
* Prison exterior
* Hidden cave

Camera:

Aerial view
Street view
Bird's eye view

---

### 2. Object Close-Up

Examples:

* Blood-stained letter
* Old diary
* Newspaper clipping
* Safe full of money
* Revolver
* Fake passport
* Map with markings
* Keys
* Jewelry
* Hidden compartment

Camera:

Macro shot
Top down
45-degree angle

---

### 3. Environmental Scene

Examples:

* Empty prison cell
* Secret office
* Smuggler warehouse
* Underground tunnel
* Courtroom
* Train cabin
* Old laboratory
* Ship interior

No people required.

---

### 4. Atmospheric Scene

Examples:

* Crowd running
* Rainy street
* Open doorway
* Empty alley
* Police outside mansion
* Foggy harbor
* Candle-lit room

Focus on mood.

---

### 5. Portrait in Environment

ONLY ONCE PER VIDEO.

Examples:

* Criminal sitting alone
* Figure near window
* Person hiding evidence
* Walking in fog

Never direct face close up.

---

# CAMERA ANGLES

Use different angles frequently:

* Bird's eye view
* Top down shot
* Over shoulder
* Low angle
* High angle
* Through doorway
* Through broken glass
* Reflection shot
* Ground level
* Wide cinematic shot
* Side angle
* Extreme object close-up

Never repeat the same angle consecutively.

---

# HISTORICAL ACCURACY

If story is from:

1800s

Use:

* Horses
* Oil lamps
* Letters
* Wooden furniture
* Steam trains

1900s

Use:

* Vintage cars
* Telegrams
* Newspapers
* Old telephones
* Typewriters

Modern

Use era-appropriate:

* Mobile phones
* CCTV
* Laptops
* Evidence rooms

Never mix eras.

---

# STORY SPECIFIC VISUALS

If narration mentions:

Robbery

Show:

* Safe
* Stolen cash
* Broken vault
* Hidden bags
* Floor plans

Scam

Show:

* Fake documents
* Forged signatures
* Counterfeit papers
* Bank transfers
* Stacks of letters

Serial killer

Show:

* Investigation board
* Old house
* Newspaper headlines
* Evidence room
* Personal belongings

Smuggling

Show:

* Hidden compartments
* Secret tunnels
* Cargo crates
* Underground warehouse
* Concealed goods

Cult

Show:

* Ritual hall
* Symbols
* Gatherings
* Abandoned compound

---

# VISUAL STYLE

Style:

Dark cinematic realism

Mood:

* mysterious
* tense
* realistic
* documentary style

Lighting:

Alternate between:

* warm amber light
* cold blue moonlight
* rainy neon reflections
* candle light
* foggy sunrise
* dim warehouse light

Do NOT use same lighting repeatedly.

---

# STRICT RULES

* One image prompt per narration sentence
* Maximum 100 words
* No generic images
* No text in image
* No watermarks
* No gore
* No nudity
* Faces should rarely appear
* Portrait scene maximum once per video
* Every image must use a different composition
* Every image must use a different camera angle
* Every image should advance the story visually

End EVERY prompt with:

"dark cinematic realism, documentary style, dramatic lighting, realistic details, varied camera angle, no text, no watermarks, SFW, 9:16 vertical aspect ratio"

Example:
[
  {"scene":1,"narration":"...","image_prompt":"...","clip_duration":5.0}
]
`

  try {
    const chunkSize = 8
    const chunks: ScriptOutput["scenes"][] = []
    for (let i = 0; i < script.scenes.length; i += chunkSize) {
      chunks.push(script.scenes.slice(i, i + chunkSize))
    }

    const sceneCompositionHints = (scene: ScriptScene): string => {
      if (scene.scene <= 3) return "(wide establishing shot)"
      if (scene.scene >= 9) return "(dramatic close detail)"
      return "(object or environment focus)"
    }

    const allPrompts: ImagePrompt[] = []
    for (let i = 0; i < chunks.length; i++) {
      console.log(`[PromptAgent] Processing batch ${i+1}/${chunks.length} (${chunks[i].length} scenes)`)

      const userPrompt = `
Generate one image prompt per scene.
Each prompt must show exactly what the narration describes.

Composition hints per scene type:
- Scenes 1-3 (hook/setup): wide establishing shots
- Scenes 4-8 (main events): object/environment and things/places not on faces
- Scenes 9-10 (payoff/CTA): dramatic close details 

Scenes:
${chunks[i].map(s => `Scene ${s.scene}: ${s.narration} ${sceneCompositionHints(s)}`).join('\n')}

CRITICAL OUTPUT RULES:
- If a scene mentions a person, describe their ENVIRONMENT and ACTIONS, never their face
- Instead of: 'mysterious man in doorway'
  Write: 'dark empty doorway with shadows, single dim light, wooden floor, silence'
- Instead of: 'criminal hiding evidence'
  Write: 'gloved hands burying documents in dirt, shovel, moonlight, dense forest'
- Replace every person description with what they are DOING or WHERE they ARE
- The camera should show the SCENE not the FACE
- If you cannot avoid a person, show only: hands, feet, back, silhouette, shadow

Return ONLY a JSON array starting with [ and ending with ]`

      const content = await callOpenRouter(systemPrompt, userPrompt, 2000)

      console.log(`[PromptAgent] Batch ${i+1} raw response (first 1000 chars):`)
      console.log(content.slice(0, 1000))

      const parsed = parseToArray(content)
      console.log(`[PromptAgent] Batch ${i+1} parsed ${parsed.length} prompts`)
      allPrompts.push(...parsed)

      if (i < chunks.length - 1) {
        console.log("[PromptAgent] Waiting 1s before next batch...")
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    console.log(`[PromptAgent] Total prompts collected: ${allPrompts.length}`)

    allPrompts.sort((a, b) => a.scene - b.scene)
    const seen = new Set<number>()
    const deduped = allPrompts.filter(p => {
      if (seen.has(p.scene)) return false
      seen.add(p.scene)
      return true
    })

    const filled = fillMissingPrompts(deduped, script.scenes)

    const prompts: PromptsOutput = []
    for (const item of filled) {
      prompts.push({
        scene: item.scene,
        narration: item.narration,
        image_prompt: item.image_prompt,
        clip_duration: item.clip_duration,
      })
    }

    logger.info(`Prompts generated: ${prompts.length}`)
    return prompts

  } catch (error: any) {
    logger.error("PromptAgent failed to generate prompts", error)
    throw error
  }
}
