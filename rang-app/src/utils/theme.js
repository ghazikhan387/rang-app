/**
 * Rang Healthcare — Single Modern Midnight Design System
 * ------------------------------------------------------------------
 * Single permanent visual theme across the entire application.
 */

export const THEME_STORAGE_KEY = 'rang-theme';
export const DEFAULT_THEME = 'midnight';

export const THEMES = [
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Dark midnight teal-to-indigo unified modern design',
    metaColor: '#0a2a3a',
  },
];

export const THEME_IDS = ['midnight'];

export function isThemeId() {
  return true;
}

export function readStoredTheme() {
  return DEFAULT_THEME;
}

export function storeTheme() {}

export function resolveInitialTheme() {
  return DEFAULT_THEME;
}

export function applyTheme() {
  return DEFAULT_THEME;
}

export function nextThemeId() {
  return DEFAULT_THEME;
}

export function themeLabel() {
  return 'Midnight';
}
