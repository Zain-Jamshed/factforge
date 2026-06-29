// testTopic.ts
// Test script for TopicAgent

import * as dotenv from "dotenv";
dotenv.config();

import * as path from "path";
import { topicAgent } from "../agents/topicAgent";

async function main() {
  console.log("Testing TopicAgent...");
  
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is missing in .env");
    return;
  }

  const testMemoryPath = path.join(process.cwd(), "memory", "memory.test.json");

  try {
    const result = await topicAgent(testMemoryPath);
    console.log("\n--- Verification ---");
    console.log("Topic Output:", JSON.stringify(result, null, 2));
    
    if (result.slug && result.topic && result.category && result.hook_style) {
      console.log("\nSuccess: All required fields are present.");
    } else {
      console.error("\nError: Missing required fields in TopicOutput.");
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

main();
