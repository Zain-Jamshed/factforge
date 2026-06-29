// topicAgent.ts
// Picks the single most compelling untold dark history story for today's video.

import { TopicOutput } from "../types"
import { readMemory } from "../utils/memory"
import { logger } from "../utils/logger"
import { slugify } from "../utils/slugify"
import { callOpenRouter } from "../utils/openrouter"
import { jsonrepair } from "jsonrepair"
import * as dotenv from "dotenv"

dotenv.config()

/**
 * Selects a topic using Claude based on memory and hook styles.
 */
export async function topicAgent(memoryPath?: string): Promise<TopicOutput> {
  logger.info("Selecting topic with TopicAgent...")

  const memory = readMemory(memoryPath)
  const usedTopics = memory.used_topics || []
  const winningCategories = memory.winning_categories || []
  const topHookStyles = memory.top_hook_styles || ["contradiction", "stakes", "unbelievable-but-true"]

  const systemPrompt = `
You are a TikTok dark history content strategist.
Pick ONE topic about an unbelievable true crime 
or government crime that sounds impossible.

Topic must be:
- A real verified historical event
- Sounds impossible or unbelievable but is 100% true
- Can be about individual criminals OR governments
  doing something criminal to their own citizens
- Must have a clear criminal act, a method, 
  and a resolution (caught or exposed)
- Explainable in under 90 seconds
- NOT in the used topics list: {used_topics}
- Shocking enough to make someone stop scrolling

Good examples of topic types:
- A person who committed an impossible crime
- A government that secretly committed crimes 
  against its own citizens
- A criminal who evaded justice in an unbelievable way
- A crime so elaborate it sounds fictional

Return ONLY valid JSON (no markdown, no code fences):
{
  "topic": "string",
  "category": "string",
  "hook_style": "unbelievable-but-true",
  "angle": "the one sentence shocking angle",
  "slug": "url-safe-slug"
}
`

  const userPrompt = `
Used topics to avoid: ${usedTopics.join(", ")}
Winning categories: ${winningCategories.join(", ")}
Target hook styles: ${topHookStyles.join(", ")}
`

  try {
    let content = await callOpenRouter(systemPrompt, userPrompt, 1024)
    content = content.replace(/```json\s*/gi, "").replace(/```/g, "").trim()
    let result: any
    try {
      result = JSON.parse(content)
    } catch {
      logger.warn("LLM returned malformed JSON — attempting repair with jsonrepair...")
      result = JSON.parse(jsonrepair(content))
    }

    const topicOutput: TopicOutput = {
      ...result,
      slug: slugify(result.topic)
    }

    logger.info(`Topic selected: "${topicOutput.topic}" (${topicOutput.category})`)
    logger.info(`Hook: ${topicOutput.hook_style} | Angle: ${topicOutput.angle}`)

    return topicOutput

  } catch (error: any) {
    logger.error("TopicAgent failed to select topic", error)
    throw error
  }
}
