import axios from "axios";
import * as fs from "fs-extra";
import * as path from "path";
import sharp from "sharp";
import { logger } from "../utils/logger";
import { PromptsOutput, ImagesOutput } from "../types";

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt/";
const IMG_WIDTH = 608;
const IMG_HEIGHT = 1080;
const PROMPT_PREFIX = "portrait orientation, vertical frame, 9:16 aspect ratio, mobile screen format";
const REQUEST_DELAY_MS = 5000;

export async function imageAgent(prompts: PromptsOutput, outputFolder: string): Promise<ImagesOutput> {
  logger.info("Generating images with ImageAgent (Pollinations.ai)...");

  const imagesDir = path.join(outputFolder, "images");
  await fs.ensureDir(imagesDir);

  console.log(`[ImageAgent] Received ${prompts.length} prompts`);
  console.log(`Processing ${prompts.length} prompts — expecting 20-25 images`);
  console.log("First prompt object:", JSON.stringify(prompts[0], null, 2));

  prompts.forEach((prompt, index) => {
    if (!prompt.image_prompt) {
      console.log(`WARNING: prompt ${index} missing image_prompt field:`, JSON.stringify(prompt));
    }
    if (!prompt.scene) {
      console.log(`WARNING: prompt ${index} missing scene field:`, JSON.stringify(prompt));
    }
  });

  const results: ImagesOutput = [];

  for (const [i, item] of prompts.entries()) {
    console.log(`[ImageAgent] Generating image ${i + 1}/${prompts.length}`);
    const part = item.part ?? "";
    const sceneId = item.scene?.toString() ?? String(i + 1);
    const sceneStr = `${sceneId}${part}`;
    const fileName = `scene_${sceneId.padStart(2, "0")}${part}.png`;
    const filePath = path.join(imagesDir, fileName);

    const imagePrompt = item.image_prompt ?? (item as any).prompt ?? "";
    if (!imagePrompt) {
      console.log(`Skipping scene ${sceneStr} — no prompt found`);
      continue;
    }

    logger.info(`Generating image for scene ${sceneStr}...`);

    const sceneNumber = item.scene ?? (i + 1);
    const fullPrompt = `Scene${sceneNumber}: ${PROMPT_PREFIX}, ${imagePrompt}`;
    const encoded = encodeURIComponent(fullPrompt);
    const seed = Date.now() + (sceneNumber * 1000);
    const url = `${POLLINATIONS_BASE}${encoded}?width=${IMG_WIDTH}&height=${IMG_HEIGHT}&nologo=true&model=flux&seed=${seed}`;

    const maxAttempts = i === 0 ? 5 : 3;
    const retryDelay = i === 0 ? 10000 : 5000;
    let success = false;
    let attempt = 0;

    while (attempt < maxAttempts && !success) {
      attempt++;
      try {
        const response = await axios.get(url, {
          responseType: "arraybuffer",
          validateStatus: (status) => status === 200,
        });

        let buffer = Buffer.from(response.data);

        const metadata = await sharp(buffer).metadata();
        if (metadata.width && metadata.height && metadata.width > metadata.height) {
          console.log(`[ImageAgent] Landscape detected (${metadata.width}x${metadata.height}), rotating 90°`);
          buffer = await sharp(buffer).rotate(90).toBuffer();
        }

        await fs.writeFile(filePath, buffer);
        success = true;
        console.log(`Image ${sceneStr} saved: ${filePath}`);
        logger.info(`Saved image for scene ${sceneStr} to ${filePath}`);
      } catch (error: any) {
        const status = error.response?.status ?? "N/A";
        const body = error.response?.data
          ? Buffer.from(error.response.data).toString("utf-8").slice(0, 500)
          : "No response body";
        const errMsg = error.message ?? "Unknown error";

        console.log(`[ImageAgent] Attempt ${attempt}/${maxAttempts} failed for scene ${sceneStr}`);
        console.log(`[ImageAgent]   Status: ${status}`);
        console.log(`[ImageAgent]   URL: ${url}`);
        console.log(`[ImageAgent]   Prompt: ${fullPrompt.slice(0, 200)}`);
        console.log(`[ImageAgent]   Response: ${body}`);
        logger.error(`Attempt ${attempt} failed for scene ${sceneStr}: ${errMsg}`);

        if (attempt >= maxAttempts) {
          console.log(`[ImageAgent] All attempts exhausted for scene ${sceneStr}, falling back to duplicate`);
          logger.warn(`Fallback: duplicating previous image for scene ${sceneStr}`);
          if (results.length > 0) {
            await fs.copy(results[results.length - 1].file_path, filePath);
            success = true;
          } else {
            throw new Error(
              `Failed to generate first image (scene ${sceneStr}) after ${maxAttempts} attempts. ` +
              `Last error: ${errMsg}. Response: ${body}`
            );
          }
        } else {
          console.log(`[ImageAgent] Waiting ${retryDelay / 1000}s before retry...`);
          await new Promise(r => setTimeout(r, retryDelay));
        }
      }
    }

    if (success) {
      results.push({ scene: item.scene, file_path: filePath });
    }

    if (i < prompts.length - 1) {
      console.log(`[ImageAgent] Waiting ${REQUEST_DELAY_MS / 1000}s before next image...`);
      await new Promise(r => setTimeout(r, REQUEST_DELAY_MS));
    }
  }

  return results;
}
