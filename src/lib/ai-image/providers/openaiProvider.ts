/**
 * Server-only: real OpenAI Images API implementation of
 * ImageGenerationProvider. Uses gpt-image-2 via a plain fetch() call — no
 * `openai` SDK dependency, consistent with this project's minimal-
 * dependency approach (see AGENTS.md / prior task history on not
 * installing an unnecessary image SDK).
 *
 * Parameters below were confirmed against OpenAI's current API docs
 * (developers.openai.com/api/docs/guides/image-generation and
 * .../api/docs/models/gpt-image-2, checked 2026-08-15) rather than
 * guessed:
 *   - Endpoint: POST https://api.openai.com/v1/images/generations
 *   - gpt-image-2 does NOT support `response_format` — unlike dall-e-2/
 *     dall-e-3, it always returns base64 image bytes in data[0].b64_json.
 *     There is no `data[0].url` option for this model. Do not add
 *     response_format: "url" — it isn't valid for gpt-image-2.
 *   - size "2048x1152" is an exact 16:9 landscape (matches the prompt
 *     builder's own "16:9 landscape composition" requirement) and is
 *     listed as a standard supported size for this model.
 *   - quality "low" is the cheapest tier — appropriate for an editorial
 *     illustration fallback, not a hero asset.
 *
 * Never retries: one failed generate() call is one failed paid API
 * request that should surface to the caller immediately, not silently
 * multiply into additional paid attempts.
 */

import type { GeneratedImage, ImageGenerationInput, ImageGenerationProvider } from "../provider";
import { getProviderApiKey } from "../config";

const OPENAI_IMAGES_ENDPOINT = "https://api.openai.com/v1/images/generations";
const MODEL = "gpt-image-2";

/** Exact 16:9 — see file header for why this size specifically. */
const SIZE = "2048x1152";

/** Cheapest quality tier. Never raise this as a "default" — cost must stay opt-in per generation. */
const QUALITY = "low";

interface OpenAiImagesResponse {
  data?: Array<{ b64_json?: string }>;
}

interface OpenAiErrorResponse {
  error?: { message?: string; type?: string; code?: string };
}

export class OpenAiImageGenerationProvider implements ImageGenerationProvider {
  readonly name = "openai";

  async generate(input: ImageGenerationInput): Promise<GeneratedImage> {
    const apiKey = getProviderApiKey("openai");
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. Add it to .env.local (never NEXT_PUBLIC_OPENAI_API_KEY, " +
          "never commit it) before using --provider openai."
      );
    }

    // Single request, no retry logic — see file header.
    const response = await fetch(OPENAI_IMAGES_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: input.prompt,
        n: 1,
        size: SIZE,
        quality: QUALITY,
      }),
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as OpenAiErrorResponse | null;
      const message = errorBody?.error?.message ?? `HTTP ${response.status} ${response.statusText}`;
      throw new Error(`OpenAI image generation failed: ${message}`);
    }

    const body = (await response.json()) as OpenAiImagesResponse;
    const b64 = body.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error("OpenAI image generation succeeded but the response contained no image data.");
    }

    return {
      bytes: Buffer.from(b64, "base64"),
      contentType: "image/png",
      provider: this.name,
      promptVersion: input.promptVersion,
      generatedAt: new Date().toISOString(),
    };
  }
}
