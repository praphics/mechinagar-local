/**
 * Server-only: the single place that picks a concrete ImageGenerationProvider.
 * Callers (scripts/generate-image.ts today; a future editorial Server Action
 * later) never instantiate a provider class directly — they call
 * getImageGenerationProvider() so swapping in a real provider later is a
 * one-file change here, not a change to the article workflow.
 */

import type { ImageGenerationProvider } from "./provider";
import type { ImageGenerationProviderName } from "./config";
import { getConfiguredProviderName } from "./config";
import { MockImageGenerationProvider } from "./providers/mockProvider";
import { OpenAiImageGenerationProvider } from "./providers/openaiProvider";

/**
 * `nameOverride` lets the CLI script's --provider flag win over the
 * AI_IMAGE_PROVIDER env var; omit it to use the configured default.
 */
export function getImageGenerationProvider(
  nameOverride?: ImageGenerationProviderName
): ImageGenerationProvider {
  const name = nameOverride ?? getConfiguredProviderName();

  switch (name) {
    case "mock":
      return new MockImageGenerationProvider();
    case "openai":
      return new OpenAiImageGenerationProvider();
    case "gemini":
      // Intentionally not implemented — wire it up the same way as
      // ./providers/openaiProvider.ts when there's a reason to connect it.
      throw new Error(
        `Image generation provider "${name}" is not implemented yet. ` +
          `Use "mock" or "openai" until it's connected.`
      );
    default: {
      const exhaustive: never = name;
      throw new Error(`Unknown image generation provider "${exhaustive}"`);
    }
  }
}
