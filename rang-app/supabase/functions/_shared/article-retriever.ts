/**
 * Rang Healthcare — Article Page Retriever
 * PRD §12.1 step 4: Fetch public pages, extract metadata and text.
 * Respects robots.txt, never bypasses paywalls.
 */

import { PIPELINE_LIMITS } from "./constants.ts";

export interface PageData {
  title: string | null;
  description: string | null;
  canonicalUrl: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  author: string | null;
  bodyText: string;
}

/**
 * Fetch a public web page and extract article metadata + body text.
 * Returns null if the page is inaccessible, paywalled, or blocked.
 */
export async function retrieveArticlePage(
  url: string
): Promise<PageData | null> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    PIPELINE_LIMITS.PAGE_FETCH_TIMEOUT_MS
  );

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      console.warn(`[retriever] HTTP ${response.status} for ${url}`);
      return null;
    }

    // Check for paywall / access-denied indicators in headers
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("html")) {
      console.warn(`[retriever] Non-HTML content-type for ${url}: ${contentType}`);
      return null;
    }

    const html = await response.text();

    // Detect paywall / login walls
    if (detectPaywall(html)) {
      console.warn(`[retriever] Paywall detected for ${url}`);
      return null;
    }

    return parseHtmlPage(html, url);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn(`[retriever] Timeout fetching ${url}`);
    } else {
      console.warn(`[retriever] Error fetching ${url}:`, (error as Error).message);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse HTML to extract structured article data.
 */
function parseHtmlPage(html: string, sourceUrl: string): PageData {
  return {
    title: extractMeta(html, "og:title") || extractTitleTag(html),
    description:
      extractMeta(html, "og:description") ||
      extractMeta(html, "description") ||
      null,
    canonicalUrl:
      extractCanonicalLink(html) ||
      extractMeta(html, "og:url") ||
      sourceUrl,
    imageUrl: extractMeta(html, "og:image") || null,
    publishedAt:
      extractMeta(html, "article:published_time") ||
      extractMeta(html, "datePublished") ||
      extractJsonLdDate(html) ||
      null,
    author:
      extractMeta(html, "author") ||
      extractMeta(html, "article:author") ||
      null,
    bodyText: extractBodyText(html),
  };
}

// ─── HTML Extraction Helpers ────────────────────────────────

function extractMeta(html: string, property: string): string | null {
  // Try property attribute
  const propRegex = new RegExp(
    `<meta[^>]+(?:property|name)\\s*=\\s*["']${escapeRegex(property)}["'][^>]+content\\s*=\\s*["']([^"']+)["']`,
    "i"
  );
  const propMatch = html.match(propRegex);
  if (propMatch) return propMatch[1];

  // Try reverse order: content before property
  const reverseRegex = new RegExp(
    `<meta[^>]+content\\s*=\\s*["']([^"']+)["'][^>]+(?:property|name)\\s*=\\s*["']${escapeRegex(property)}["']`,
    "i"
  );
  const reverseMatch = html.match(reverseRegex);
  return reverseMatch ? reverseMatch[1] : null;
}

function extractTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractCanonicalLink(html: string): string | null {
  const match = html.match(
    /<link[^>]+rel\s*=\s*["']canonical["'][^>]+href\s*=\s*["']([^"']+)["']/i
  );
  return match ? match[1] : null;
}

function extractJsonLdDate(html: string): string | null {
  const match = html.match(
    /"datePublished"\s*:\s*"([^"]+)"/i
  );
  return match ? match[1] : null;
}

/**
 * Extract main body text from an article page.
 * Targets <article>, <main>, or common article-body CSS classes.
 * Strips navigation, scripts, styles, and boilerplate.
 */
function extractBodyText(html: string): string {
  // Remove scripts, styles, nav, footer, header, aside
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Try to isolate article body
  const articleMatch = cleaned.match(
    /<article[\s\S]*?>([\s\S]*?)<\/article>/i
  );
  if (articleMatch) {
    cleaned = articleMatch[1];
  } else {
    // Try <main>
    const mainMatch = cleaned.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      cleaned = mainMatch[1];
    }
  }

  // Strip remaining HTML tags
  const text = cleaned
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Limit to ~3000 chars to avoid sending boilerplate to the LLM
  return text.slice(0, 3000);
}

/**
 * Simple paywall / access wall detection heuristics.
 */
function detectPaywall(html: string): boolean {
  const lower = html.toLowerCase();
  const indicators = [
    "subscribe to continue reading",
    "you've reached your monthly limit",
    "sign in to read the full article",
    "this content is for subscribers",
    "paywall",
    "create a free account to continue",
    "premium content",
    "members only",
  ];
  return indicators.some((i) => lower.includes(i));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
