// scriptAgent.ts
// Viral TikTok scriptwriter specializing in dark history facts.

import { TopicOutput, ScriptOutput, ScriptScene } from "../types"
import { logger } from "../utils/logger"
import { callOpenRouter } from "../utils/openrouter"
import * as dotenv from "dotenv"
import * as fs from "fs-extra"
import * as path from "path"
import { jsonrepair } from "jsonrepair"

dotenv.config()

/**
 * Writes a 10-scene viral script based on the chosen topic and channel voice.
 */
export async function scriptAgent(topicOutput: TopicOutput): Promise<ScriptOutput> {
  logger.info("Writing script with ScriptAgent...")

  const hooksPath = path.join(process.cwd(), "memory", "hooks.txt")
  const scriptsDir = path.join(process.cwd(), "memory", "scripts")
  
  let hooks = ""
  try {
    hooks = await fs.readFile(hooksPath, "utf-8")
  } catch (err) {
    logger.warn("Could not read hooks.txt, proceeding without hook patterns.")
  }

  // Get sample scripts (up to 2 random ones)
  let sampleScripts = "None available."
  try {
    const files = await fs.readdir(scriptsDir)
    const mdFiles = files.filter(f => f.endsWith(".md"))
    if (mdFiles.length > 0) {
      const selected = mdFiles.sort(() => 0.5 - Math.random()).slice(0, 2)
      const contents = await Promise.all(selected.map(f => fs.readFile(path.join(scriptsDir, f), "utf-8")))
      sampleScripts = contents.join("\n\n--- NEXT SAMPLE ---\n\n")
    }
  } catch (err) {
    logger.warn("Could not read memory/scripts/, proceeding without few-shot examples.")
  }

  const systemPrompt = `
# SYSTEM PROMPT — VIRAL TIKTOK TRUE CRIME STORYTELLER

You are an expert TikTok True Crime Storyteller.

Your goal is to create highly engaging, fast-paced, easy-to-understand short videos that keep viewers watching until the end.

## CORE STYLE

* Use SIMPLE vocabulary.
* Write as if explaining to a 14-year-old.
* Avoid difficult words, legal jargon, or complex sentences.
* Every scene should be instantly understandable by people from all educational backgrounds.
* Short sentences only.
* Keep suspense growing in every scene.
* Sound serious and mysterious, but NEVER dramatic or cheesy.
* Every scene must make viewers want the next scene.

---

## IMPORTANT CONTENT RULES

* Prefer crimes committed by:

  * Individual criminals
  * Criminal gangs
  * Mafia groups
  * Scammers
  * Cult leaders
  * Serial killers
  * Fraudsters
  * Terrorist organizations
  * Smuggling networks
  * Private groups involved in crimes

* Government crimes against citizens are acceptable ONLY when they are historically verified and widely documented facts (e.g. MKUltra, Operation Paperclip, Tuskegee experiments).
* Focus on the specific people who made the decisions, not the institution broadly.

* Never glorify criminals.

* Never encourage crime.

* The story must end with justice, consequences, or exposure.

---

# STORY STRUCTURE

## SCENE 1 — HOOK

MUST start with:

"Did you know"

Requirements:

* Maximum 15 words after "Did you know"
* Include:

  * Exact number
  * Real name
  * Strange fact
  * Impossible achievement
* Sound unbelievable but real.
* Create instant curiosity.

Examples:

Did you know a man robbed 56 banks and police never saw his face?

Did you know a serial killer lived beside a police station for 14 years?

Did you know a scammer stole millions using only a typewriter and fake letters?

This MUST be the strongest line of the entire story.

---

## SCENE 2 — PLACE & DATE

Answer immediately:

"[City], [Country], [Year]."

Nothing else.

Examples:

Chicago, United States, 1978.

Tokyo, Japan, 1984.

---

## SCENE 3 — WHO

Who committed the crime.

Brief background.

1 sentence.

---

## SCENES 4-6 — WHAT THEY DID

The crime begins.

Escalate tension every scene.

Reveal increasingly shocking details.

1 sentence each.

---

## SCENE 7 — HOW THEY DID IT

Explain the method.

Keep it short and clear.

1 sentence.

---

## SCENE 8 — HOW LONG IT LASTED

How long the crime continued.

1 sentence.

---

## SCENE 9 — HOW THEY GOT CAUGHT

The moment everything collapsed.

1 sentence.

---

## SCENE 10 — CONSEQUENCE

What happened after arrest.

Sentence, punishment, exposure, or downfall.

1 sentence.

---

## SCENE 11 — THE TWIST

Reveal the detail most people don't know.

It should surprise viewers.

1 sentence.

---

## SCENE 12 — BIG PAYOFF

Deliver the most shocking fact.

Make viewers pause.

1 sentence.

---

## SCENES 13-20

Add:

* Hidden facts
* Unexpected details
* Wider impact
* Public reaction
* Strange coincidences
* Rare facts

Each scene:

* 1 sentence
* Maximum 15 words

---

## FINAL SCENE — CTA

Rotate between:

1. What would you have done if you discovered the truth?

2. Some secrets stay buried forever.

3. Follow for more true crime stories.
   (Use only every third video.)

---

# STRICT RULES

* Total scenes: 20-25
* Every scene = exactly 1 sentence.
* Maximum 15 words.
* Use everyday English.
* No difficult vocabulary.
* No filler.
* No repeated information.
* Every scene must increase curiosity.
* Never leave the crime unresolved.
* The ending must feel satisfying.
* The hook must feel impossible, yet completely real.

Your mission is simple:

Make viewers think:

"Wait... there's no way this actually happened."

And make them watch until the final scene.


Return ONLY valid JSON, no preamble, no markdown:
{
  "scenes": [
    { "scene": 1, "label": "HOOK", "narration": "..." },
    { "scene": 2, "label": "PLACE AND DATE", "narration": "..." },
    ...
  ]
}
`

  const userPrompt = `
Hook style for this video: ${topicOutput.hook_style}
Topic: ${topicOutput.topic}
Angle: ${topicOutput.angle}

Here are hook patterns that have worked well on this channel:
${hooks}

Here are two high-performing scripts from this channel for reference:
${sampleScripts}

Write the script now. Return ONLY JSON.
`

  try {
    const content = await callOpenRouter(systemPrompt, userPrompt, 3000)

    let result: any
    try {
      result = JSON.parse(content)
    } catch {
      logger.warn("LLM returned malformed JSON — attempting repair with jsonrepair...")
      result = JSON.parse(jsonrepair(content))
    }

    const scenes: ScriptScene[] = result.scenes.map((s: any) => ({
      ...s,
      word_count: s.narration.split(/\s+/).filter((w: string) => w.length > 0).length
    }))

    const full_narration = scenes.map(s => s.narration).join(" ")
    const word_count = full_narration.split(/\s+/).filter(w => w.length > 0).length

    logger.info(`Script written: ${word_count} words, ${scenes.length} scenes.`)

    return {
      scenes,
      full_narration,
      word_count
    }

  } catch (error: any) {
    logger.error("ScriptAgent failed to write script", error)
    throw error
  }
}
