import * as dotenv from "dotenv";
dotenv.config();

import * as path from "path";
import * as fs from "fs-extra";
import { imageAgent } from "../agents/imageAgent";
import { PromptsOutput } from "../types";

async function main() {
  console.log("Testing ImageAgent with 1 image...");

  const outputFolder = path.join(process.cwd(), "outputs", "test-image-agent");
  await fs.ensureDir(outputFolder);

  const testPrompts: PromptsOutput = [
    {
      scene: 1,
      narration: "A dark, cinematic shot of a mysterious hooded figure in a Victorian London alleyway.",
      image_prompt: "A dark, cinematic shot of a mysterious hooded figure in a Victorian London alleyway, gaslight flickering, deep shadows, 9:16 vertical aspect ratio. Cinematic. No text. No watermarks. No real human faces. No gore. No graphic violence."
    }
  ];

  try {
    const images = await imageAgent(testPrompts, outputFolder);
    console.log("Images generated:", images.length);
    if (images.length > 0) {
      console.log("First image path:", images[0].file_path);
      if (fs.existsSync(images[0].file_path)) {
        console.log("SUCCESS: Image exists on disk.");
      } else {
        console.error("ERROR: Image file not found.");
      }
    }
  } catch (error) {
    console.error("ImageAgent test failed:", error);
  }
}

main();
