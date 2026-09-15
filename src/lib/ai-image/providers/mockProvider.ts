/**
 * Server-only: development/testing implementation of ImageGenerationProvider
 * that never touches the network. Returns a fixed, deterministic 1x1 PNG
 * fixture — clearly not a real illustration — so the rest of the pipeline
 * (file save, frontmatter update, disclosure metadata) can be exercised
 * without a paid API key. This is the only provider actually implemented
 * right now; see ../providerFactory.ts for how "openai"/"gemini" are
 * deliberately left unimplemented until a real provider is connected.
 */

import type { GeneratedImage, ImageGenerationInput, ImageGenerationProvider } from "../provider";

/** 1x1 transparent PNG — a deterministic fixture, not a generated image. */
const MOCK_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

export class MockImageGenerationProvider implements ImageGenerationProvider {
  readonly name = "mock";

  async generate(input: ImageGenerationInput): Promise<GeneratedImage> {
    return {
      bytes: Buffer.from(MOCK_PNG_BASE64, "base64"),
      contentType: "image/png",
      provider: this.name,
      promptVersion: input.promptVersion,
      generatedAt: new Date().toISOString(),
    };
  }
}
