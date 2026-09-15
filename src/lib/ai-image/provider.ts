/**
 * Server-only: provider-agnostic contract for AI illustration generation.
 * Nothing in this file calls a network — it's just the shape that a real
 * provider (OpenAI, Gemini/Imagen, ...) and the MockImageGenerationProvider
 * (./providers/mockProvider.ts) both implement, so the editorial CLI script
 * (scripts/generate-image.ts) and the article workflow never need to know
 * which concrete provider is behind it. See ./providerFactory.ts for how a
 * provider is selected, and ./config.ts for how it will read its API key
 * later (server env only — never NEXT_PUBLIC_).
 */

export interface ImageGenerationInput {
  prompt: string;
  promptVersion: string;
  aspectRatio: "16:9";
}

export interface GeneratedImage {
  bytes: Buffer;
  /** e.g. "image/png" — used to pick the saved file's extension. */
  contentType: string;
  provider: string;
  promptVersion: string;
  generatedAt: string; // ISO 8601
}

export interface ImageGenerationProvider {
  readonly name: string;
  generate(input: ImageGenerationInput): Promise<GeneratedImage>;
}
