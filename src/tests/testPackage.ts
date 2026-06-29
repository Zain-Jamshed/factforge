// testPackage.ts
// Test script for PackageAgent

import { packageAgent } from "../agents/packageAgent";
import { RunState, TopicOutput, ScriptOutput } from "../types";
import { readMemory } from "../utils/memory";
import * as path from "path";
import * as fs from "fs-extra";

async function main() {
  console.log("Testing PackageAgent with isolated memory...");

  const memoryTestPath = path.join(process.cwd(), "memory", "memory.test.json");

  // Reset/Initialize test memory
  const initialMemory = {
    used_topics: [],
    total_videos_produced: 0,
    last_run: null,
    winning_categories: ["government experiments"],
    top_hook_styles: ["unbelievable-but-true"]
  };
  await fs.writeJSON(memoryTestPath, initialMemory, { spaces: 2 });

  const mockTopic: TopicOutput = {
    topic: "MKUltra",
    category: "government experiments",
    hook_style: "unbelievable-but-true",
    angle: "TEST", // Trigger mock cost in agent
    slug: "test-mkultra"
  };

  const mockScript: ScriptOutput = {
    scenes: [
      { scene: 1, label: "HOOK", narration: "For 20 years, the CIA ran experiments on American citizens." },
      { scene: 2, label: "SETUP", narration: "Context line." },
      { scene: 3, label: "FACT 1", narration: "First teaser line." },
      { scene: 4, label: "FACT 2", narration: "Fact 2." },
      { scene: 5, label: "FACT 3", narration: "Fact 3." },
      { scene: 6, label: "FACT 4", narration: "Fact 4." },
      { scene: 7, label: "DETAIL", narration: "Detail line." },
      { scene: 8, label: "TWIST", narration: "Twist line." },
      { scene: 9, label: "PAYOFF", narration: "20,000 documents survived by accident." },
      { scene: 10, label: "CTA", narration: "Follow for more." }
    ],
    full_narration: "...",
    word_count: 50
  };

  const outputFolder = path.join(process.cwd(), "outputs", "test-mkultra");
  await fs.ensureDir(outputFolder);

  // Extend state with memoryPath for testing
  const mockState: any = {
    topic: mockTopic,
    script: mockScript,
    output_folder: outputFolder,
    start_time: Date.now() - 5000, // Mock 5 seconds duration
    memoryPath: memoryTestPath
  };

  try {
    await packageAgent(mockState);
    
    console.log("\n--- Verification ---");
    const caption = await fs.readFile(path.join(outputFolder, "caption.txt"), "utf-8");
    console.log("Generated Caption (partial):\n", caption.substring(0, 100) + "...");

    const memory = readMemory(memoryTestPath);
    console.log("\nUpdated memory.test.json snippet:");
    console.log({
      used_topics: memory.used_topics,
      total_videos_produced: memory.total_videos_produced,
      last_run: memory.last_run
    });

    // Final sanity check
    const productionMemory = readMemory();
    console.log("\nProduction memory.json check (should be empty):");
    console.log({
      used_topics: productionMemory.used_topics,
      total_videos_produced: productionMemory.total_videos_produced
    });

  } catch (error) {
    console.error("Test failed:", error);
  }
}

main();
