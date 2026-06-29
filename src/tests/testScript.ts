// testScript.ts
// Test script for ScriptAgent

import * as dotenv from "dotenv";
dotenv.config();

import { scriptAgent } from "../agents/scriptAgent";
import { TopicOutput } from "../types";

async function main() {
  console.log("Testing ScriptAgent...");
  
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is missing in .env");
    return;
  }

  const mockTopic: TopicOutput = {
    "topic": "Operation Midnight Climax",
    "category": "government experiments",
    "hook_style": "unbelievable-but-true",
    "angle": "The CIA ran actual brothels in San Francisco where they drugged unsuspecting clients and watched through two-way mirrors to study mind control",
    "slug": "operation-midnight-climax"
  };

  try {
    const result = await scriptAgent(mockTopic);
    console.log("\n--- Verification ---");
    console.log("Script Output:", JSON.stringify(result, null, 2));
    
    if (result.scenes && result.scenes.length === 10 && result.full_narration) {
      console.log("\nSuccess: Script generated with 10 scenes.");
      console.log(`Word count: ${result.word_count}`);
    } else {
      console.error("\nError: Script validation failed (check scene count or narration).");
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

main();
