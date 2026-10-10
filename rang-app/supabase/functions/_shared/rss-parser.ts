/**
 * Rang Healthcare — RSS Feed Parser
 * Fetches and parses RSS/Atom feeds into a normalized candidate structure.
 * PRD §12.1 steps 1-3: Discovery, date filtering, deduplication prep.
 */

import { PIPELINE_LIMITS, VALID_COUNTRIES, type ValidCountry } from "./constants.ts";

export interface RssEntry {
  title: string;
  url: string;
  publishedAt: string | null;
  description: string | null;
  imageUrl: string | null;
  sourceName: string;
  country: ValidCountry;
}

interface FeedSource {
  id: string;
  name: string;
  feed_url: string;
  country_scope: string | null;
}

/**
 * Fetch and parse an RSS/Atom feed, returning normalized entries.
 */
export async function fetchRssFeed(source: FeedSource): Promise<RssEntry[]> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    PIPELINE_LIMITS.RSS_FETCH_TIMEOUT_MS
  );

  try {
    const response = await fetch(source.feed_url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,application/rss+xml,application/atom+xml,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    return parseRssXml(xml, source);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse RSS/Atom XML text into normalized entries.
 * Uses a lightweight regex-based parser for the Deno edge function runtime.
 */
function parseRssXml(xml: string, source: FeedSource): RssEntry[] {
  const entries: RssEntry[] = [];
  const country = resolveCountry(source.country_scope);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - PIPELINE_LIMITS.MAX_ARTICLE_AGE_DAYS);

  // Try RSS 2.0 <item> elements first
  const items = extractElements(xml, "item");

  if (items.length > 0) {
    for (const item of items.slice(0, PIPELINE_LIMITS.MAX_ENTRIES_PER_SOURCE)) {
      const title = extractText(item, "title");
      const link = extractLink(item) || extractText(item, "link");
      const pubDate = extractText(item, "pubDate") || extractText(item, "dc:date");
      const description =
        extractText(item, "description") || extractText(item, "content:encoded");
      const imageUrl = extractMediaUrl(item);

      if (!title || !link) continue;

      // Date filtering — skip articles older than the cutoff
      const publishedAt = pubDate ? parseDate(pubDate) : null;
      if (publishedAt && publishedAt < cutoffDate) continue;

      entries.push({
        title: cleanHtml(title).trim(),
        url: link.trim(),
        publishedAt: publishedAt?.toISOString() ?? null,
        description: description ? cleanHtml(description).slice(0, 500) : null,
        imageUrl: imageUrl || null,
        sourceName: source.name,
        country,
      });
    }
    return entries;
  }

  // Try Atom <entry> elements
  const atomEntries = extractElements(xml, "entry");
  for (const entry of atomEntries.slice(0, PIPELINE_LIMITS.MAX_ENTRIES_PER_SOURCE)) {
    const title = extractText(entry, "title");
    const link = extractAtomLink(entry);
    const updated =
      extractText(entry, "published") || extractText(entry, "updated");
    const summary =
      extractText(entry, "summary") || extractText(entry, "content");
    const imageUrl = extractMediaUrl(entry);

    if (!title || !link) continue;

    const publishedAt = updated ? parseDate(updated) : null;
    if (publishedAt && publishedAt < cutoffDate) continue;

    entries.push({
      title: cleanHtml(title).trim(),
      url: link.trim(),
      publishedAt: publishedAt?.toISOString() ?? null,
      description: summary ? cleanHtml(summary).slice(0, 500) : null,
      imageUrl: imageUrl || null,
      sourceName: source.name,
      country,
    });
  }

  return entries;
}

// ─── XML Helpers ─────────────────────────────────────────────

function extractElements(xml: string, tagName: string): string[] {
  const regex = new RegExp(
    `<${tagName}[\\s>][\\s\\S]*?<\\/${tagName}>`,
    "gi"
  );
  return [...xml.matchAll(regex)].map((m) => m[0]);
}

function extractText(xml: string, tagName: string): string | null {
  // Handle CDATA sections
  const cdataRegex = new RegExp(
    `<${tagName}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tagName}>`,
    "i"
  );
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1];

  // Regular element
  const regex = new RegExp(
    `<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`,
    "i"
  );
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function extractLink(item: string): string | null {
  // Try <link> with href attribute (Atom style in RSS)
  const hrefMatch = item.match(/<link[^>]+href\s*=\s*"([^"]+)"/i);
  if (hrefMatch) return hrefMatch[1];

  // Try plain <link> text content
  const textMatch = item.match(/<link[^>]*>([^<]+)<\/link>/i);
  return textMatch ? textMatch[1].trim() : null;
}

function extractAtomLink(entry: string): string | null {
  // Prefer alternate link
  const altMatch = entry.match(
    /<link[^>]+rel\s*=\s*"alternate"[^>]+href\s*=\s*"([^"]+)"/i
  );
  if (altMatch) return altMatch[1];

  // Fallback to first link href
  const hrefMatch = entry.match(/<link[^>]+href\s*=\s*"([^"]+)"/i);
  return hrefMatch ? hrefMatch[1] : null;
}

function extractMediaUrl(item: string): string | null {
  // media:content or media:thumbnail
  const mediaMatch = item.match(
    /<media:(content|thumbnail)[^>]+url\s*=\s*"([^"]+)"/i
  );
  if (mediaMatch) return mediaMatch[2];

  // enclosure
  const enclosureMatch = item.match(
    /<enclosure[^>]+url\s*=\s*"([^"]+)"[^>]*type\s*=\s*"image/i
  );
  if (enclosureMatch) return enclosureMatch[1];

  return null;
}

/**
 * Strip HTML tags for text-only output.
 */
function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(dateStr: string): Date | null {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function resolveCountry(scope: string | null): ValidCountry {
  if (scope === "US") return "US";
  if (scope === "CA") return "CA";
  return "OTHER";
}
