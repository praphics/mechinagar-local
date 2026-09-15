export type Language = "ne" | "en";
export type ArticleStatus = "draft" | "published";

export interface Category {
  slug: string;
  nameNe: string;
  nameEn: string;
  descriptionNe?: string;
}

/**
 * "illustration" = a non-AI stock illustration from the approved image
 * library (currently unused — all 19 library entries are photographs).
 * "ai-generated-illustration" = produced by the AI fallback system in
 * src/lib/ai-image/ — always "illustrative" usage, never presented as a
 * real photograph. See src/lib/ai-image/metadata.ts for the fields that
 * accompany this type (generatedAt/provider/promptVersion below).
 */
export type ArticleImageType = "photograph" | "illustration" | "ai-generated-illustration" | "placeholder";
export type ArticleImageUsage = "illustrative" | "documentary";

export interface ArticleImage {
  src: string;
  alt: string;
  caption?: string;
  /** Optional so existing article frontmatter without these fields keeps parsing unchanged. */
  type?: ArticleImageType;
  usage?: ArticleImageUsage;
  /**
   * Only meaningful when type is "ai-generated-illustration" — provenance
   * for an AI-generated image. Never populated for photograph/placeholder.
   */
  generatedAt?: string; // ISO 8601
  provider?: string;
  promptVersion?: string;
}

/**
 * Runtime shape used throughout the app — produced by the content loader
 * (src/lib/content/articles.ts) from content/articles/*.md frontmatter.
 * `headline`/`categorySlug` correspond to the authoring keys `title`/
 * `category` in the markdown frontmatter; see that module for the mapping.
 */
export interface Article {
  slug: string;
  headline: string;
  summary: string;
  bodyHtml: string;
  bodyRaw: string;
  categorySlug: string;
  language: Language;
  publishedAt: string; // ISO 8601
  updatedAt?: string; // ISO 8601
  author: string;
  source?: string;
  sourceUrl?: string;
  featuredImage?: ArticleImage;
  tags: string[];
  featured: boolean;
  status: ArticleStatus;
}

/**
 * The "Today's Mechinagar" alert must support an explicit absent state —
 * callers check for `null`, never render a placeholder/greyed-out card.
 */
export interface Alert {
  headline: string;
  body: string;
  sourceName: string;
  sourceUrl?: string;
  issuedAt: string; // ISO 8601
}

export interface NewsletterConfig {
  headlineNe: string;
  descriptionNe: string;
  ctaLabelNe: string;
  // Placeholder only — no email backend wired up at MVP.
  formAction?: string;
}
