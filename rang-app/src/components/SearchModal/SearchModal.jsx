import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getPublishedArticles } from '../../services/newsService';
import { CATEGORIES } from '../../data/categories';
import { formatRelativeTime, debounce } from '../../utils/helpers';
import './SearchModal.css';

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const inputRef = useRef(null);

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

    // Trap focus / close on outside click
    const handleClick = (e) => {
      if (e.target.classList.contains('search-modal__overlay')) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    // Prevent body scroll
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
            aria-label="Search articles"
          />
          <kbd className="search-modal__kbd" onClick={onClose} style={{ cursor: 'pointer' }}>ESC</kbd>
        </div>

        <div className="search-modal__results">
          {searchError ? (
            <div className="search-modal__empty" role="alert">
              <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>Search is unavailable.</p>
              <p style={{ fontSize: 'var(--font-size-sm)', wordBreak: 'break-word' }}>{searchError}</p>
            </div>
          ) : (
            <>
          {query.trim() && results.length === 0 && (
            <div className="search-modal__empty">
              <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-2)' }}>No stories found</p>
              <p>Try a broader term or different keyword.</p>
            </div>
          )}
          {results.map((article) => (
            <Link
              key={article.id}
              to={`/article/${article.id}`}
              className="search-modal__result-item"
              onClick={onClose}
            >
              <div className="search-modal__result-title">{article.title}</div>
              <div className="search-modal__result-meta">
                {article.source_name} · {formatRelativeTime(article.published_at)} · {getCategoryLabel(article.primary_category)}
              </div>
            </Link>
          ))}
          {!query.trim() && (
            <div className="search-modal__empty">
              <p>Start typing to search across articles, publishers, and topics.</p>
            </div>
          )}
            </>
          )}
        </div>

        <div className="search-modal__footer">
          <span>↑↓ Navigate · ↵ Open · ESC Close</span>
          <span>Rang Search</span>
        </div>
      </div>
    </div>
  );
}
