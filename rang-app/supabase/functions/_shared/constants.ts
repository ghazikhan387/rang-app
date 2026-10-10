/**
 * Rang Healthcare — Constants & Configuration
 * Centralised pipeline limits, categories, and model configuration.
 */

// ============================================================
// Pipeline Limits (PRD §17: Cost-Control Requirements)
// ============================================================
export const PIPELINE_LIMITS = {
  /** Max RSS entries to process per source per run */
  MAX_ENTRIES_PER_SOURCE: 20,
  /** Max new article candidates per entire run */
  MAX_CANDIDATES_PER_RUN: 50,
  /** Max AI summary calls per run */
  MAX_AI_CALLS_PER_RUN: 15,
  /** Max article age in days to consider for ingestion */
  MAX_ARTICLE_AGE_DAYS: 14,
  /** Max retry count before marking as permanently failed */
  MAX_RETRY_COUNT: 3,
  /** Request timeout for fetching RSS feeds (ms) */
  RSS_FETCH_TIMEOUT_MS: 10_000,
  /** Request timeout for fetching article pages (ms) */
  PAGE_FETCH_TIMEOUT_MS: 15_000,
  /** Minimum delay between page fetches to be respectful (ms) */
  FETCH_DELAY_MS: 500,
} as const;

// ============================================================
// Valid Categories (matches frontend categories.js)
// ============================================================
export const VALID_CATEGORIES = [
  "hospitals",
  "workforce",
  "nursing",
  "policy",
  "insurance",
  "business",
  "public-health",
  "technology",
  "research",
  "mergers",
  "other",
] as const;

export type ValidCategory = (typeof VALID_CATEGORIES)[number];

// ============================================================
// Article Statuses
// ============================================================
export const ARTICLE_STATUS = {
  DISCOVERED: "discovered",
  RETRIEVED: "retrieved",
  PROCESSING: "processing",
  PUBLISHED: "published",
  REJECTED: "rejected",
  FAILED: "failed",
} as const;

// ============================================================
// Impact Statuses (PRD §9: Recruiter-impact labels)
// ============================================================
export const IMPACT_STATUSES = ["confirmed", "potential", "unclear"] as const;
export type ImpactStatus = (typeof IMPACT_STATUSES)[number];

// ============================================================
// AI Model Configuration
// ============================================================
export const AI_CONFIG = {
  /** Model identifier — Gemini 3.8 Flash (free tier) */
  MODEL_NAME: "gemini-3.8-flash",
  /** Max output tokens */
  MAX_OUTPUT_TOKENS: 4096,
  /** Temperature — low for factual accuracy */
  TEMPERATURE: 0.3,
  /** API endpoint */
  GEMINI_API_BASE: "https://generativelanguage.googleapis.com/v1beta/models",
} as const;

// ============================================================
// Countries
// ============================================================
export const VALID_COUNTRIES = ["US", "CA", "OTHER"] as const;
export type ValidCountry = (typeof VALID_COUNTRIES)[number];

// ============================================================
// URL Tracking Parameters to strip during normalization
// ============================================================
export const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "fbclid",
  "gclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
] as const;
