import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockArticles } from '../../data/mockArticles';
import { getPublishedArticles } from '../../services/newsService';
import { CATEGORIES } from '../../data/categories';
import { isWithinRecency, formatRelativeTime, getCountryName } from '../../utils/helpers';
import Hero from '../../components/Hero/Hero';
import FilterBar from '../../components/FilterBar/FilterBar';
import ArticleCard, { ArticleCardSkeleton } from '../../components/ArticleCard/ArticleCard';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import './HomePage.css';

export default function HomePage({ selectedCountry, onCountryChange }) {
  const [articles, setArticles] = useState(mockArticles);
  const [isLiveFeed, setIsLiveFeed] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedRecency, setSelectedRecency] = useState('latest');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadArticles() {
      setIsLoading(true);
      const res = await getPublishedArticles();
      if (isMounted) {
        if (res.articles && res.articles.length > 0) {
          setArticles(res.articles);
        }
        setIsLiveFeed(res.isLive);
        setIsLoading(false);
      }
    }
    loadArticles();
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

  // Top 5 articles for sidebar
  const trendingArticles = articles
    .filter((a) => a.summary?.impact_status === 'confirmed')
    .slice(0, 5);

  /* Presentation-only collections derived from the same data */
  const newestFirst = useMemo(
    () => [...articles].sort((a, b) => new Date(b.published_at) - new Date(a.published_at)),
    [articles]
  );
  const dailyFeed = newestFirst.slice(0, 4);
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

  /* The "confirmed developments" module is only rendered when the feed
     actually contains confirmed developments; the print-style index numbers
     are derived from what is rendered so they never skip. */
  const showTrending = trendingArticles.length > 0;
  const moduleIndex = {
    daily: '01',
    trending: showTrending ? '02' : null,
    categories: showTrending ? '03' : '02',
  };

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

        {/* Layout: feed + sidebar */}
        <div className="home-page__layout">
          {/* Main feed */}
          <div>
            {isLoading ? (
              <div className="home-page__grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ArticleCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <EmptyState
                type={selectedCountry !== 'all' ? 'no-country' : 'no-results'}
                onAction={clearAllFilters}
              />
            ) : (
              <div className="home-page__grid">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}

            {/* Ranked story list */}
            {!isLoading && leadingStories.length > 0 && (
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

          {/* Sidebar */}
          <aside className="home-page__sidebar" aria-label="Sidebar">
            {/* Daily feed */}
            <div className="sidebar-card sidebar-daily">
              <h3 className="sidebar-card__title" data-index={moduleIndex.daily}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Daily Feed
                <span className="sidebar-card__index" aria-hidden="true">{moduleIndex.daily}</span>
              </h3>
              <div className="sidebar-card__list">
                {dailyFeed.map((a) => (
                  <div key={a.id} className="sidebar-card__item daily-feed__item">
                    <time className="daily-feed__time" dateTime={a.published_at}>
                      {new Date(a.published_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                    </time>
                    <div>
                      <Link to={`/article/${a.id}`} className="sidebar-card__item-title">
                        {a.title}
                      </Link>
                      <div className="sidebar-card__item-meta">
                        {getCountryName(a.country)} · {a.source_name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending */}
            {showTrending && (
            <div className="sidebar-card" data-index={moduleIndex.trending}>
              <h3 className="sidebar-card__title" data-index={moduleIndex.trending}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                Confirmed Developments
                <span className="sidebar-card__index" aria-hidden="true">{moduleIndex.trending}</span>
              </h3>
              <div className="sidebar-card__list">
                {trendingArticles.map((a, i) => (
                  <div key={a.id} className="sidebar-card__item">
                    <span className="sidebar-card__rank">{i + 1}</span>
                    <div>
                      <Link to={`/article/${a.id}`} className="sidebar-card__item-title">
                        {a.title}
                      </Link>
                      <div className="sidebar-card__item-meta">
                        {a.source_name} · {formatRelativeTime(a.published_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Category shortcuts */}
            <div className="sidebar-card sidebar-categories" data-index={moduleIndex.categories}>
              <h3 className="sidebar-card__title" data-index={moduleIndex.categories}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Categories
                <span className="sidebar-card__index" aria-hidden="true">{moduleIndex.categories}</span>
              </h3>
              <div className="sidebar-card__list">
                {CATEGORIES.filter(c => c.id !== 'other').slice(0, 8).map((cat) => {
                  const count = mockArticles.filter((a) => a.primary_category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      className="sidebar-category-link"
                      onClick={() => setSelectedCategories([cat.id])}
                    >
                      <span>{cat.icon}</span>
                      <span style={{ flex: 1 }}>{cat.label}</span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
