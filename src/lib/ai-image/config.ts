/**
 * Server-only: AI image generation configuration. Reads only from
 * process.env, which Next.js populates from .env.local (git-ignored — see
 * .gitignore's ".env*" rule) on the server; a standalone script (like
 * scripts/generate-image.ts) needs `--env-file-if-exists=.env.local`
 * passed to `node` instead, since Node doesn't auto-load it the way
 * Next.js does — see that script's npm run generate:image definition in
 * package.json.
 *
 * Each provider reads its key from its own conventional env var name
 * here — never a generic shared one — so it is never bundled into client
 * JavaScript and never accidentally read from the wrong place. Do not add
 * a "NEXT_PUBLIC_" fallback for any of these.
 */

export type ImageGenerationProviderName = "mock" | "openai" | "gemini";

const KNOWN_PROVIDER_NAMES: readonly ImageGenerationProviderName[] = ["mock", "openai", "gemini"];

const DEFAULT_PROVIDER_NAME: ImageGenerationProviderName = "mock";

export function isKnownProviderName(value: string): value is ImageGenerationProviderName {
  return (KNOWN_PROVIDER_NAMES as readonly string[]).includes(value);
}

/** AI_IMAGE_PROVIDER is optional — absent or unrecognized both fall back to "mock". */
export function getConfiguredProviderName(): ImageGenerationProviderName {
  const raw = process.env.AI_IMAGE_PROVIDER;
  if (raw && isKnownProviderName(raw)) return raw;
  return DEFAULT_PROVIDER_NAME;
}

/**
 * The one sanctioned place each provider reads its key from. "openai"
 * reads OPENAI_API_KEY (the standard convention name — never
 * NEXT_PUBLIC_OPENAI_API_KEY, and never read this anywhere else, e.g. not
 * in article content, not in manifest.json). "gemini" and "mock" have no
 * key today: gemini isn't implemented yet, and mock never calls the network.
 */
export function getProviderApiKey(provider: ImageGenerationProviderName): string | undefined {
  if (provider === "openai") return process.env.OPENAI_API_KEY;
  return undefined;
}
