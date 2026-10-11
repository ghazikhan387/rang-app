import { useEffect, useRef, useState } from 'react';
import {
  THEMES,
  applyTheme,
  nextThemeId,
  resolveInitialTheme,
  storeTheme,
  themeLabel,
} from '../../utils/theme';
import './ThemeSwitcher.css';

/* Window event used to keep every mounted switcher in sync */
const THEME_EVENT = 'rang:theme-change';

/* Small, theme-agnostic glyphs. Purely decorative — the labels carry meaning. */
function ThemeIcon({ id }) {
  if (id === 'press') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <rect x="1.5" y="3" width="13" height="14" />
        <rect x="14.5" y="6.5" width="4" height="10.5" />
        <path d="M4 6.5h8M4 9.5h8M4 12.5h5" />
      </svg>
    );
  }
  if (id === 'parchment') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <path d="M5 2.5h10v13a2 2 0 0 0 2 2H4a1.5 1.5 0 0 1-1.5-1.5V4" />
        <path d="M5 2.5v13a2 2 0 0 1-2 2" />
        <path d="M8 6h4M8 9h4M8 12h2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M2.5 5.5h15M2.5 10h15M2.5 14.5h9" />
      <path d="M16 14.5h1.5" />
    </svg>
  );
}

export default function ThemeSwitcher({ variant = 'default' }) {
  const [theme, setTheme] = useState(resolveInitialTheme);
  const groupRef = useRef(null);

  /*
    Two switchers can be on screen (header + mobile menu). They share one
    source of truth: whichever one changes the theme broadcasts it and the
    others follow, so the labels and pressed states never drift apart.
  */
  useEffect(() => {
    const sync = (event) => setTheme(event.detail.theme);
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);

  /* Apply + persist. The <html> attribute is the single switch the CSS reads. */
  useEffect(() => {
    applyTheme(theme);
    storeTheme(theme);
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme } }));
  }, [theme]);

  const radioRefs = useRef([]);

  /* Radiogroup keyboard pattern: arrows move and select, Home/End jump. */
  const handleKeyDown = (event) => {
    const currentIndex = THEMES.findIndex((t) => t.id === theme);
    let nextIndex = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % THEMES.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + THEMES.length) % THEMES.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = THEMES.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    setTheme(THEMES[nextIndex].id);
    radioRefs.current[nextIndex]?.focus();
  };

  const cycleTheme = () => setTheme((current) => nextThemeId(current));
  const current = THEMES.find((t) => t.id === theme) || THEMES[0];
  const isMenuVariant = variant === 'menu';

  return (
    <div className={`theme-switcher theme-switcher--${variant}`}>
      {/* Desktop / tablet: 3-option segmented control */}
      <div
        className="theme-switcher__segmented"
        role="radiogroup"
        aria-label="Reader theme"
        ref={groupRef}
        onKeyDown={handleKeyDown}
      >
        {THEMES.map((t, index) => {
          const active = t.id === theme;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              ref={(node) => {
                radioRefs.current[index] = node;
              }}
              className={`theme-switcher__option ${active ? 'is-active' : ''}`}
              onClick={() => setTheme(t.id)}
              title={t.description}
            >
              <span className="theme-switcher__option-icon" aria-hidden="true">
                <ThemeIcon id={t.id} />
              </span>
              <span className="theme-switcher__option-label">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Narrow screens: one control that cycles Press → Parchment → Modern.
          It says "Theme" and names the current theme so it is never mistaken
          for decoration. */}
      {!isMenuVariant && (
        <button
          type="button"
          className="theme-switcher__cycle"
          onClick={cycleTheme}
          aria-label={`Theme: ${current.label}. Activate to switch to the next theme.`}
          title={`Theme: ${current.label} — click to switch to ${themeLabel(nextThemeId(current.id))}`}
        >
          <span className="theme-switcher__cycle-icon" aria-hidden="true">
            <ThemeIcon id={current.id} />
          </span>
          <span className="theme-switcher__cycle-caption" aria-hidden="true">
            Theme
          </span>
          <span className="theme-switcher__cycle-value" aria-hidden="true">
            {current.label}
          </span>
        </button>
      )}
    </div>
  );
}
