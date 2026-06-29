// testVoice.ts
// Test script for VoiceAgent using the Operation Midnight Climax script

import * as dotenv from "dotenv";
dotenv.config();

import { voiceAgent } from "../agents/voiceAgent";
import { ScriptOutput } from "../types";
import * as path from "path";
import * as fs from "fs-extra";

async function main() {
  console.log("Testing VoiceAgent with Edge TTS...");
  console.log("Using Edge TTS voice: en-US-ChristopherNeural")

  const mockScript: ScriptOutput = {
    scenes: [
      {
        scene: 1,
        label: "HOOK",
        word_count: 13,
        narration: "In 1945, the US government made a decision that would shock the world."
      },
      {
        scene: 2,
        label: "REVEAL",
        word_count: 13,
        narration: "Over 1600 Nazi scientists were secretly brought to America and given new identities."
      }
    ],
    full_narration: "In 1945, the US government made a decision that would shock the world. Over 1600 Nazi scientists were secretly brought to America and given new identities.",
    word_count: 24
  };

  const outputFolder = path.join(process.cwd(), "outputs", "voice-test-edge");
  
  try {
    const result = await voiceAgent(mockScript, outputFolder);
    console.log("\n--- Verification ---");
    console.log("Success: Voiceover generated!");
    console.log("Audio file:", result.file_path);
    console.log("Duration:", result.duration_seconds.toFixed(2), "seconds");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

main();
