/**
 * Rang Healthcare — URL Normalization & Hashing Utilities
 * PRD §12.3: Deduplication and URL normalization
 */

import { TRACKING_PARAMS } from "./constants.ts";

/**
 * Normalize a URL for consistent deduplication:
 * - Lowercase host
 * - Strip tracking query parameters (UTM, fbclid, etc.)
 * - Remove trailing slashes
 * - Remove fragment identifiers
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());

    // Remove tracking parameters
    for (const param of TRACKING_PARAMS) {
      url.searchParams.delete(param);
    }

    // Sort remaining parameters for consistency
    url.searchParams.sort();

    // Reconstruct without fragment
    let normalized = `${url.protocol}//${url.host.toLowerCase()}${url.pathname}`;

    const search = url.searchParams.toString();
    if (search) {
      normalized += `?${search}`;
    }

    // Remove trailing slash (but keep root "/")
    if (normalized.endsWith("/") && url.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch {
    // If URL parsing fails, return lowercase trimmed original
    return rawUrl.trim().toLowerCase();
  }
}

/**
 * Generate a SHA-256 hex hash of a normalized URL.
 */
export async function hashUrl(rawUrl: string): Promise<string> {
  const normalized = normalizeUrl(rawUrl);
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Check if two URLs are effectively the same after normalization.
 */
export function urlsMatch(url1: string, url2: string): boolean {
  return normalizeUrl(url1) === normalizeUrl(url2);
}

/**
 * Generate a content fingerprint from text for re-processing detection.
 */
export async function contentHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  // Normalize whitespace for consistent fingerprinting
  const normalized = text.replace(/\s+/g, " ").trim().toLowerCase();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
