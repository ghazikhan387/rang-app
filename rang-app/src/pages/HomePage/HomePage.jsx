import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPublishedArticles } from '../../services/newsService';
import { isWithinRecency, formatRelativeTime, getCountryName } from '../../utils/helpers';
import Hero from '../../components/Hero/Hero';
import FilterBar from '../../components/FilterBar/FilterBar';
import ArticleCard, { ArticleCardSkeleton } from '../../components/ArticleCard/ArticleCard';
import { EmptyState, ErrorState } from '../../components/EmptyState/EmptyState';
import './HomePage.css';

export default function HomePage({ selectedCountry, onCountryChange }) {
  const [articles, setArticles] = useState([]);
  const [isLiveFeed, setIsLiveFeed] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedRecency, setSelectedRecency] = useState('latest');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await getPublishedArticles();
    setArticles(res.articles || []);
    setIsLiveFeed(res.isLive);
    if (res.error) {
      setError(res.error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      const res = await getPublishedArticles();
      if (isMounted) {
        setArticles(res.articles || []);
        setIsLiveFeed(res.isLive);
        if (res.error) setError(res.error);
        setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedRecency !== 'latest' ||
    selectedCountry !== 'all';

  const filteredArticles = useMemo(() => {
    return articles
      .filter((a) => {
        // Country
        if (selectedCountry !== 'all' && a.country !== selectedCountry) return false;
        // Category
        if (selectedCategories.length > 0 && !selectedCategories.includes(a.primary_category)) return false;
        // Recency
        if (!isWithinRecency(a.published_at, selectedRecency)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  }, [articles, selectedCountry, selectedCategories, selectedRecency]);

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedRecency('latest');
    onCountryChange('all');
  };

  /* Presentation-only collection derived from the same data */
  const leadingStories = useMemo(
    () =>
      [...articles]
        .sort((a, b) => {
          const rank = (article) => (article.summary?.impact_status === 'confirmed' ? 0 : 1);
          const byImpact = rank(a) - rank(b);
          if (byImpact !== 0) return byImpact;
          return new Date(b.published_at) - new Date(a.published_at);
        })
        .slice(0, 5),
    [articles]
  );

  /* Date tab / section label used by the themed section heading (CSS ::before) */
  const monthLabel = new Date()
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase();

  const openSearch = () => {
    window.dispatchEvent(new Event('rang:open-search'));
  };

  return (
    <main id="main-content">
      <Hero articleCount={articles.length} />

      <div className="container">
        {/* In-page search field — opens the existing search dialog */}
        <div className="home-page__search">
          <button
            type="button"
            className="site-search"
            onClick={openSearch}
            aria-label="Search for a story"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span className="site-search__placeholder">Search for a story</span>
            <span className="site-search__hint" aria-hidden="true">Ctrl K</span>
          </button>
        </div>

        {/* Feed header */}
        <div className="home-page__feed-header" data-month-label={monthLabel} data-section-index="01">
          <h2 className="home-page__feed-title">Latest healthcare news</h2>
          <span className="home-page__feed-count">
            {filteredArticles.length} {filteredArticles.length === 1 ? 'story' : 'stories'}
          </span>
        </div>

        {/* Filter bar */}
        <FilterBar
          selectedCategories={selectedCategories}
          onCategoryChange={setSelectedCategories}
          selectedRecency={selectedRecency}
          onRecencyChange={setSelectedRecency}
          onClearAll={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Main feed */}
        <div>
            {isLoading ? (
              <div className="home-page__grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ArticleCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <ErrorState
                message="The news feed could not be loaded, so no stories are shown."
                details={error}
                onRetry={loadArticles}
              />
            ) : filteredArticles.length === 0 ? (
              <EmptyState
                type={
                  articles.length === 0
                    ? 'no-stories'
                    : selectedCountry !== 'all'
                      ? 'no-country'
                      : 'no-results'
                }
                onAction={articles.length === 0 ? undefined : clearAllFilters}
              />
            ) : (
              <div className="home-page__grid">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}

            {/* Ranked story list */}
            {!isLoading && !error && leadingStories.length > 0 && (
              <section className="home-page__leading" aria-labelledby="leading-heading">
                <div className="section-head" data-month-label={monthLabel} data-section-index="02">
                  <h2 className="section-head__title" id="leading-heading">
                    Leading stories
                  </h2>
                  <span className="section-head__note">Ranked by recency and confirmed impact</span>
                </div>
                <ol className="ranked-list">
                  {leadingStories.map((article, index) => (
                    <li className="ranked-list__item" key={article.id}>
                      <span className="ranked-list__rank" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="ranked-list__body">
                        <Link to={`/article/${article.id}`} className="ranked-list__title">
                          {article.title}
                        </Link>
                        <span className="ranked-list__meta">
                          {article.source_name} · {getCountryName(article.country)} ·{' '}
                          {formatRelativeTime(article.published_at)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
      </div>
    </main>
  );
}
