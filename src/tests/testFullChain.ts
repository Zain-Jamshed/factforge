// testFullChain.ts
// Test script for Topic -> Script -> Voiceover

import * as dotenv from "dotenv";
dotenv.config();

import * as path from "path";
import * as fs from "fs-extra";
import { topicAgent } from "../agents/topicAgent";
import { scriptAgent } from "../agents/scriptAgent";
import { voiceAgent } from "../agents/voiceAgent";

async function main() {
  console.log("Starting Full Chain Test (Topic -> Script -> Voice)...");
  
  const testMemoryPath = path.join(process.cwd(), "memory", "memory.test.json");
  const outputDir = path.join(process.cwd(), "outputs", "voice-test");

  try {
    // 1. Run TopicAgent
    console.log("\n[1/3] Running TopicAgent...");
    const topic = await topicAgent(testMemoryPath);
    console.log("Topic Selected:", topic.topic);
    console.log("Angle:", topic.angle);

    // 2. Run ScriptAgent
    console.log("\n[2/3] Running ScriptAgent...");
    const script = await scriptAgent(topic);
    console.log("Script Generated (10 scenes).");
    console.log("Full Narration Sample:", script.full_narration.substring(0, 100) + "...");

    // 3. Run VoiceAgent
    console.log("\n[3/3] Running VoiceAgent...");
    const voice = await voiceAgent(script, outputDir);
    console.log("Voiceover Generated Successfully!");
    console.log("File Path:", voice.file_path);
    console.log("Duration:", voice.duration_seconds.toFixed(2), "seconds");

    console.log("\n--- Verification Summary ---");
    console.log("Topic:", topic.topic);
    console.log("Script Scene 1:", script.scenes[0].narration);
    console.log("Voiceover Path:", voice.file_path);
    
    if (fs.existsSync(voice.file_path)) {
      console.log("\nSUCCESS: All stages completed and voiceover.mp3 exists.");
    } else {
      console.error("\nERROR: voiceover.mp3 was not found.");
    }

  } catch (error) {
    console.error("\nFull chain test failed:", error);
  }
}

main();
