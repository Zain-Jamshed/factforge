// testPrompts.ts
// Test script for PromptAgent

import * as dotenv from "dotenv";
dotenv.config();

import * as path from "path";
import { promptAgent } from "../agents/promptAgent";
import { ScriptOutput } from "../types";

async function main() {
  console.log("Testing PromptAgent...");

  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is missing in .env");
    return;
  }

  const mockScript: ScriptOutput = {
    scenes: [
      { "scene": 1, "label": "HOOK", "narration": "For 10 years, the CIA ran actual brothels in San Francisco — and the clients had no idea they were being drugged and watched." },
      { "scene": 2, "label": "SETUP", "narration": "Operation Midnight Climax. 1955. The CIA was obsessed with mind control, trying to create truth serums before the Soviets did." },
      { "scene": 3, "label": "THE METHOD", "narration": "They rented apartments in Telegraph Hill, furnished them like brothels, and hired prostitutes to bring back men off the street." },
      { "scene": 4, "label": "THE DRUG", "narration": "The drinks were spiked with LSD — massive doses — while CIA agents watched through two-way mirrors, taking notes like scientists." },
      { "scene": 5, "label": "THE AGENT", "narration": "The main agent, George White, kept a diary. His words: 'watching people lose their minds in real time.'" },
      { "scene": 6, "label": "SCALE", "narration": "Hundreds of men. Most were vulnerable — addicts, immigrants, people who wouldn't be believed if they talked." },
      { "scene": 7, "label": "THE TWIST", "narration": "The operation wasn't even secret inside the CIA. Other agents knew. They just didn't care." },
      { "scene": 8, "label": "DISCOVERY", "narration": "It only stopped in 1965 when the CIA internally decided it wasn't producing useful results anymore." },
      { "scene": 9, "label": "CLIMAX", "narration": "Not a single person was ever charged, because the CIA destroyed most of the records in 1973." },
      { "scene": 10, "label": "CTA", "narration": "Follow — new dark history video every day." }
    ],
    full_narration: "...",
    word_count: 181
  };

  const testMemoryPath = path.join(process.cwd(), "memory", "memory.test.json");

  try {
    const result = await promptAgent(mockScript, testMemoryPath);
    console.log("\n--- Verification ---");
    console.log(`Generated ${result.length} prompts.`);
    
    result.forEach((p, i) => {
      console.log(`\nScene ${p.scene}:`);
      console.log(`Prompt: ${p.image_prompt}`);
    });

    const allHaveStyle = result.every(p => p.image_prompt.includes("9:16 vertical"));
    
    if (result.length === 10 && allHaveStyle) {
      console.log("\nSuccess: All prompts generated with correct formatting.");
    } else {
      console.error("\nError: Unexpected prompt output structure or missing style.");
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

main();
