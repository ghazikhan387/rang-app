/**
 * Rang Healthcare — Utility functions
 */
import { MapPin, Globe } from 'lucide-react';

/**
 * Format a date relative to now (e.g., "2 hours ago", "3 days ago").
 * Falls back to a formatted absolute date if older than 7 days.
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return 'Date unavailable';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1)   return 'Just now';
  if (diffMin < 60)  return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHr < 24)   return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
  if (diffDay < 7)   return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format an absolute date (e.g., "October 5, 2026")
 */
export function formatAbsoluteDate(dateString) {
  if (!dateString) return 'Date unavailable';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Truncate text to a given length with ellipsis.
 */
export function truncateText(text, maxLength = 160) {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Simple debounce utility.
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Check if a date falls within a recency window.
 */
export function isWithinRecency(dateString, recencyId) {
  if (!dateString || recencyId === 'all' || recencyId === 'latest') return true;

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHr = diffMs / (1000 * 60 * 60);

  switch (recencyId) {
    case '24h': return diffHr <= 24;
    case '7d':  return diffHr <= 168;
    default:    return true;
  }
}

/**
 * Get the Lucide icon component for a country.
 * Returns a component (render as <Icon size={…} />), never an emoji.
 */
export function getCountryIcon(country) {
  switch (country) {
    case 'US':
    case 'CA':
      return MapPin;
    default:
      return Globe;
  }
}

/**
 * Get country display name.
 */
export function getCountryName(country) {
  switch (country) {
    case 'US': return 'United States';
    case 'CA': return 'Canada';
    default:   return 'International';
  }
}

/**
 * Format date alias
 */
export function formatDate(dateString) {
  return formatAbsoluteDate(dateString);
}

/**
 * Get human-readable impact label from status
 */
export function getImpactLabel(status) {
  switch (status) {
    case 'confirmed':
      return 'Confirmed development';
    case 'potential':
      return 'Potential recruiting relevance';
    case 'unclear':
    default:
      return 'No clear recruiting impact identified';
  }
}

/**
 * Get CSS badge class for impact status
 */
export function getImpactBadgeClass(status) {
  switch (status) {
    case 'confirmed':
      return 'impact-badge--confirmed';
    case 'potential':
      return 'impact-badge--potential';
    case 'unclear':
    default:
      return 'impact-badge--unclear';
  }
}

/* ============================================================
   Feed quality: press-release detection, cross-source dedupe
   and recruiter-first feed ordering.
   ============================================================ */

/** Landing pages / wire services that publish press releases verbatim */
const PRESS_RELEASE_PATTERNS = [
  'press release',
  'news release',
  'media release',
  'pr newswire',
  'business wire',
  'globenewswire',
  'newswire',
];

/**
 * True when the source name looks like an institutional/wire press-release
 * outlet (e.g. "VA News Releases", "PR Newswire") rather than a newsroom
 * that does its own reporting.
 */
export function isPressReleaseSource(sourceName) {
  const n = (sourceName || '').toLowerCase();
  return PRESS_RELEASE_PATTERNS.some((p) => n.includes(p));
}

/**
 * Reputation ranking (lower = more reputable) for outlets that do original
 * reporting. Anything not listed falls back to the lowest tier.
 * Used only for tie-breaking between near-duplicate stories.
 */
const REPUTABLE_REPORTING_SOURCES = [
  'reuters',
  'associated press',
  'ap news',
  'the new york times',
  'wall street journal',
  'washington post',
  'npr',
  'cnn',
  'cbs news',
  'nbc news',
  'abc news',
  'fox news',
  'state news service',
  'stat news',
  'kff health news',
  'beckers',
  "becker's",
  'becker\u2019s',
  'fierce healthcare',
  'healthcare dive',
  'modern healthcare',
  'medpage today',
  'medscape',
  'mcknights',
  "mcknight's",
  'mcknight\u2019s',
  'cidrap',
  'health affairs',
  'axios',
  'politico',
  'cbc',
  'ctv news',
  'the globe and mail',
  'national post',
  'toronto star',
  'global news',
];

function sourceReputationTier(sourceName) {
  const n = (sourceName || '').toLowerCase();
  for (let i = 0; i < REPUTABLE_REPORTING_SOURCES.length; i++) {
    if (n.includes(REPUTABLE_REPORTING_SOURCES[i])) return i;
  }
  return REPUTABLE_REPORTING_SOURCES.length;
}

/**
 * Normalizes a headline for duplicate matching across sources.
 */
function normalizeTitle(title) {
  return (title || '')
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d'",.:;()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Removes stories that surface from multiple sources by matching normalized
 * titles within the same country. For every duplicate group we keep either
 * the earliest story, or a more reputable outlet that published the same
 * story within 36 hours of the earliest (so fresh reporting wins, stale
 * round-ups don't).
 */
export function dedupeArticles(articles) {
  if (!Array.isArray(articles)) return [];

  const groups = new Map();
  for (const article of articles) {
    const key = `${normalizeTitle(article.title)}||${article.country}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(article);
  }

  const WINDOW_MS = 36 * 60 * 60 * 1000;
  const deduped = [];

  groups.forEach((group) => {
    if (group.length === 1) {
      deduped.push(group[0]);
      return;
    }
    const earliest = Math.min(
      ...group.map((a) => (a.published_at ? new Date(a.published_at).getTime() : Infinity))
    );
    const freshCandidates = group.filter((a) => {
      const t = a.published_at ? new Date(a.published_at).getTime() : Infinity;
      return t - earliest <= WINDOW_MS;
    });
    const pick = freshCandidates.sort((x, y) => {
      const tier = sourceReputationTier(x.source_name) - sourceReputationTier(y.source_name);
      if (tier !== 0) return tier;
      return new Date(x.published_at) - new Date(y.published_at);
    })[0];
    deduped.push(pick);
  });

  return deduped;
}

/**
 * Feed comparator: original reporting outranks press releases when the two
 * stories are published within 24 hours of each other; otherwise the feed
 * stays strictly newest-first.
 */
export function compareArticlesForFeed(a, b) {
  const pressA = isPressReleaseSource(a?.source_name);
  const pressB = isPressReleaseSource(b?.source_name);
  const timeA = new Date(a?.published_at).getTime();
  const timeB = new Date(b?.published_at).getTime();

  if (pressA !== pressB && Math.abs(timeA - timeB) <= 24 * 60 * 60 * 1000) {
    return pressA ? 1 : -1; // reporting first, press release after
  }
  return timeB - timeA;
}
