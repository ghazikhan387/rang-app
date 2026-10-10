/**
 * Rang Healthcare — Utility functions
 */

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
  if (!dateString || recencyId === 'latest') return true;

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
 * Get the country flag emoji.
 */
export function getCountryFlag(country) {
  switch (country) {
    case 'US': return '🇺🇸';
    case 'CA': return '🇨🇦';
    default:   return '🌍';
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
