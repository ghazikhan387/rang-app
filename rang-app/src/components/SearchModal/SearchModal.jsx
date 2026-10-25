import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getPublishedArticles } from '../../services/newsService';
import { CATEGORIES } from '../../data/categories';
import { formatRelativeTime } from '../../utils/helpers';
import './SearchModal.css';

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    // Load live articles if available — no mock fallback, so a broken
    // feed shows an explicit error instead of fake results.
    let isMounted = true;
    getPublishedArticles().then((res) => {
      if (!isMounted) return;
      if (res.error) {
        setSearchError(res.error);
        setArticles([]);
      } else if (res.articles && res.articles.length > 0) {
        setArticles(res.articles);
      }
    }).catch((err) => {
      if (isMounted) setSearchError(err?.message || 'Search index could not be loaded.');
    });

    // Close on outside click / prevent body scroll
    const handleClick = (e) => {
      if (e.target.classList.contains('search-modal__overlay')) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.body.style.overflow = 'hidden';
    return () => {
      isMounted = false;
      document.removeEventListener('mousedown', handleClick);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return articles.filter((a) => {
      return (
        a.title.toLowerCase().includes(q) ||
        a.source_name.toLowerCase().includes(q) ||
        a.tags?.some((t) => t.toLowerCase().includes(q)) ||
        a.summary?.quick_summary?.toLowerCase().includes(q)
      );
    }).slice(0, 8);
  }, [query, articles]);

  const getCategoryLabel = (id) =>
    CATEGORIES.find((c) => c.id === id)?.label || id;

  // Reset the selection whenever the query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  // Keyboard navigation: ESC closes, ↑↓ moves the selection, Enter opens.
  // This is what the footer hints advertise, so it has to actually work.
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (!results.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const target = results[selectedIndex >= 0 ? selectedIndex : 0];
        if (target) {
          onClose();
          navigate(`/article/${target.id}`);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [results, selectedIndex, onClose, navigate]);

  // Keep the selected row visible while arrowing through results
  useEffect(() => {
    if (selectedIndex < 0) return;
    document
      .querySelector('.search-modal__result-item.selected')
      ?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const searchUnavailable = Boolean(searchError);
  const showNoResults = query.trim() && !searchError && results.length === 0;
  const showInitialHint = !query.trim() && !searchError;

  return (
    <div className="search-modal__overlay" role="dialog" aria-modal="true" aria-label="Search articles">
      <div className="search-modal">
        <div className="search-modal__input-row">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            ref={inputRef}
            className="search-modal__input"
            type="text"
            placeholder="Search articles, publishers, topics…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search articles, publishers, topics"
          />
          <kbd className="search-modal__kbd" onClick={onClose} title="Close search">ESC</kbd>
        </div>

        <div className="search-modal__results">
          {searchUnavailable ? (
            <div className="search-modal__empty" role="alert">
              <span className="search-modal__empty-icon" aria-hidden="true">
                <Search size={18} strokeWidth={2} />
              </span>
              <span className="search-modal__empty-title">Search is unavailable.</span>
              <span className="search-modal__empty-detail">{searchError}</span>
            </div>
          ) : (
            <>
              {showNoResults && (
                <div className="search-modal__empty">
                  <span className="search-modal__empty-icon" aria-hidden="true">
                    <Search size={18} strokeWidth={2} />
                  </span>
                  <span className="search-modal__empty-title">No results found</span>
                  <span>Try a broader term or different keyword.</span>
                </div>
              )}

              {results.map((article, index) => (
                <Link
                  key={article.id}
                  to={`/article/${article.id}`}
                  className={`search-modal__result-item ${
                    index === selectedIndex ? 'selected' : ''
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="search-modal__result-title">{article.title}</div>
                  <div className="search-modal__result-meta">
                    {article.source_name} · {formatRelativeTime(article.published_at)} · {getCategoryLabel(article.primary_category)}
                  </div>
                </Link>
              ))}

              {showInitialHint && (
                <div className="search-modal__empty">
                  <span className="search-modal__empty-icon" aria-hidden="true">
                    <Search size={18} strokeWidth={2} />
                  </span>
                  <p>Start typing to search across articles, publishers, and topics.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="search-modal__footer">
          <div className="search-modal__hints" aria-hidden="true">
            <span className="search-modal__hint">
              <kbd className="search-modal__key">↑↓</kbd>
              <span className="search-modal__hint-label">Navigate</span>
            </span>
            <span className="search-modal__hint">
              <kbd className="search-modal__key">↵</kbd>
              <span className="search-modal__hint-label">Open</span>
            </span>
            <span className="search-modal__hint">
              <kbd className="search-modal__key">ESC</kbd>
              <span className="search-modal__hint-label">Close</span>
            </span>
          </div>
          <span className="search-modal__brand">Rang Search</span>
        </div>
      </div>
    </div>
  );
}
