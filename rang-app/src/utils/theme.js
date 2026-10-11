/**
 * Rang Healthcare — Theme plumbing
 * ------------------------------------------------------------------
 * A single source of truth for the three reader themes. The theme is
 * expressed as `data-theme="press|parchment|modern"` on <html>; all
 * presentation differences are driven from CSS custom properties in
 * src/styles/theme.css.
 */

export const THEME_STORAGE_KEY = 'rang-theme';
export const DEFAULT_THEME = 'press';

export const THEMES = [
  {
    id: 'press',
    label: 'Press',
    description: 'Grey broadsheet, ink and rules',
    metaColor: '#E4E4E1',
  },
  {
    id: 'parchment',
    label: 'Parchment',
    description: 'Aged gazette on warm paper',
    metaColor: '#E8D3AB',
  },
  {
    id: 'modern',
    label: 'Modern',
    description: 'Contemporary editorial magazine',
    metaColor: '#F3F3F1',
  },
];

export const THEME_IDS = THEMES.map((t) => t.id);

export function isThemeId(value) {
  return typeof value === 'string' && THEME_IDS.includes(value);
}

/** Read the persisted theme (safely — private mode can throw). */
export function readStoredTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(saved) ? saved : null;
  } catch {
    return null;
  }
}

/** Persist the theme choice. */
export function storeTheme(themeId) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch {
    /* storage unavailable — the theme still applies for this session */
  }
}

/**
 * Initial theme for React state. The inline script in index.html has
 * already decided what to paint, so trust the DOM first and only fall
 * back to storage/defaults if it is missing or invalid.
 */
export function resolveInitialTheme() {
  if (typeof document !== 'undefined') {
    const painted = document.documentElement.getAttribute('data-theme');
    if (isThemeId(painted)) return painted;
  }
  return readStoredTheme() || DEFAULT_THEME;
}

/** Apply a theme to the document (idempotent). */
export function applyTheme(themeId) {
  const next = isThemeId(themeId) ? themeId : DEFAULT_THEME;
  const root = document.documentElement;
  if (root.getAttribute('data-theme') !== next) {
    root.setAttribute('data-theme', next);
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  const match = THEMES.find((t) => t.id === next);
  if (meta && match) meta.setAttribute('content', match.metaColor);
  return next;
}

/** Theme that follows the current one in the cycle order. */
export function nextThemeId(currentId) {
  const index = THEME_IDS.indexOf(isThemeId(currentId) ? currentId : DEFAULT_THEME);
  return THEME_IDS[(index + 1) % THEME_IDS.length];
}

/** Human label for a theme id. */
export function themeLabel(themeId) {
  return THEMES.find((t) => t.id === themeId)?.label || 'Press';
}
