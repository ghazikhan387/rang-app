import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, CalendarDays } from 'lucide-react';
import { COUNTRIES } from '../../data/categories';
import SearchModal from '../SearchModal/SearchModal';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';
import './Navbar.css';

export default function Navbar({ selectedCountry, onCountryChange }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // The in-page search field (HomePage) asks us to open the same dialog
  useEffect(() => {
    const openSearch = () => setSearchOpen(true);
    window.addEventListener('rang:open-search', openSearch);
    return () => window.removeEventListener('rang:open-search', openSearch);
  }, []);

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="navbar__inner">
          <Link to="/" className="navbar__logo" aria-label="Rang Healthcare home">
            <img src="/rang-logo.webp" alt="Rang Healthcare" />
          </Link>

          <div className="navbar__nav">
            <Link
              to="/"
              className={`navbar__link ${location.pathname === '/' ? 'active' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 12h10"/></svg>
              News
            </Link>

            <Link
              to="/timeline"
              className={`navbar__link ${location.pathname === '/timeline' ? 'active' : ''}`}
            >
              <CalendarDays size={16} strokeWidth={2} aria-hidden="true" />
              Timeline
            </Link>

            <div className="navbar__country-pills" role="group" aria-label="Country filter">
              {COUNTRIES.map((c) => {
                const CountryIcon = c.icon;
                return (
                <button
                  key={c.id}
                  className={`navbar__country-pill ${selectedCountry === c.id ? 'active' : ''}`}
                  onClick={() => onCountryChange(c.id)}
                  aria-pressed={selectedCountry === c.id}
                >
                  {CountryIcon && <CountryIcon size={12} strokeWidth={2} aria-hidden="true" />}
                  {c.label}
                </button>
                );
              })}
            </div>

            <button
              className="navbar__search-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Search articles (Ctrl+K)"
              title="Search (Ctrl+K)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>

            <Link
              to="/about"
              className={`navbar__link ${location.pathname === '/about' ? 'active' : ''}`}
            >
              About
            </Link>
          </div>

          {/* Reader theme switcher — segmented on desktop, icon button on mobile */}
          <div className="navbar__actions">
            <ThemeSwitcher />

            <button
              className="navbar__mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation menu"
            >
            {mobileOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
            </button>
          </div>
        </div>

        <div className={`navbar__mobile-menu ${mobileOpen ? 'open' : ''}`}>
          <Link to="/" className={`navbar__link ${location.pathname === '/' ? 'active' : ''}`}>
            News
          </Link>
          <Link to="/timeline" className={`navbar__link ${location.pathname === '/timeline' ? 'active' : ''}`}>
            Timeline
          </Link>

          {/* Full, labelled theme choice for phone-sized screens */}
          <div className="navbar__mobile-theme">
            <span className="navbar__mobile-theme-label" id="mobile-theme-label">
              Reader theme
            </span>
            <ThemeSwitcher variant="menu" />
          </div>
          <div className="navbar__country-pills" role="group" aria-label="Country filter">
            {COUNTRIES.map((c) => {
              const CountryIcon = c.icon;
              return (
              <button
                key={c.id}
                className={`navbar__country-pill ${selectedCountry === c.id ? 'active' : ''}`}
                onClick={() => onCountryChange(c.id)}
                aria-pressed={selectedCountry === c.id}
              >
                {CountryIcon && <CountryIcon size={12} strokeWidth={2} aria-hidden="true" />}
                {c.label}
              </button>
              );
            })}
          </div>
          <button className="navbar__link" onClick={() => { setSearchOpen(true); setMobileOpen(false); }}>
            <Search size={16} strokeWidth={2} aria-hidden="true" /> Search
          </button>
          <Link to="/about" className={`navbar__link ${location.pathname === '/about' ? 'active' : ''}`}>
            About
          </Link>
        </div>
      </nav>

      {searchOpen && (
        <SearchModal onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}
