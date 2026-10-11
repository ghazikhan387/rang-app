import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  Sparkles,
  Search,
  X,
  Filter,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Building2,
  Layers,
  ArrowUpRight,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { getTimelineArticles } from '../../services/newsService';
import { CATEGORIES, COUNTRIES, TIMELINE_RANGES, IMPACT_STATUS } from '../../data/categories';
import './Timeline.css';

/**
 * Date formatting helpers
 */
function formatDay(dateStr) {
  if (!dateStr) return 'Recent';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMonth(dateStr) {
  if (!dateStr) return 'Historical';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function formatYear(dateStr) {
  if (!dateStr) return 'Historical';
  const d = new Date(dateStr);
  return String(d.getFullYear());
}

function formatCardDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Timeline() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state synchronization
  const initialRange = searchParams.get('range') || 'month';
  const initialCountry = searchParams.get('country') || 'US';
  const initialCategory = searchParams.get('category') || 'all';
  const initialMajor = searchParams.get('major') === 'true';
  const initialSearch = searchParams.get('q') || '';

  const [dateRange, setDateRange] = useState(initialRange);
  const [country, setCountry] = useState(initialCountry);
  const [category, setCategory] = useState(initialCategory);
  const [majorOnly, setMajorOnly] = useState(initialMajor);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  const [articles, setArticles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  // Sync debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (dateRange !== 'month') params.set('range', dateRange);
    if (country !== 'US') params.set('country', country);
    if (category !== 'all') params.set('category', category);
    if (majorOnly) params.set('major', 'true');
    if (debouncedSearch) params.set('q', debouncedSearch);
    setSearchParams(params, { replace: true });
  }, [dateRange, country, category, majorOnly, debouncedSearch, setSearchParams]);

  // Reset to page 1 whenever primary filters change
  useEffect(() => {
    setPage(1);
  }, [dateRange, country, category, majorOnly, debouncedSearch]);

  // Fetch articles
  useEffect(() => {
    let isCancelled = false;

    async function fetchTimeline() {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const res = await getTimelineArticles({
          country,
          dateRange,
          category: category === 'all' ? null : category,
          search: debouncedSearch,
          majorOnly,
          page,
          pageSize: 20,
        });

        if (isCancelled) return;

        if (res.error) {
          if (page === 1) {
            setArticles([]);
            setTotalCount(0);
            setHasMore(false);
          }
          setError(res.error);
          setIsLive(false);
          return;
        }

        if (page === 1) {
          setArticles(res.articles);
        } else {
          setArticles((prev) => [...prev, ...res.articles]);
        }
        setTotalCount(res.totalCount);
        setHasMore(res.hasMore);
        setIsLive(res.isLive);
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load timeline events');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }

    fetchTimeline();

    return () => {
      isCancelled = true;
    };
  }, [dateRange, country, category, majorOnly, debouncedSearch, page, retryKey]);

  // Group articles based on dateRange
  const groupedData = useMemo(() => {
    if (!articles || articles.length === 0) return { mode: 'empty', groups: [] };

    if (dateRange === '3years') {
      const yearsMap = new Map();
      for (const a of articles) {
        const yKey = formatYear(a.published_at);
        const mKey = formatMonth(a.published_at);
        if (!yearsMap.has(yKey)) {
          yearsMap.set(yKey, new Map());
        }
        const monthsMap = yearsMap.get(yKey);
        if (!monthsMap.has(mKey)) {
          monthsMap.set(mKey, []);
        }
        monthsMap.get(mKey).push(a);
      }

      const groups = [];
      for (const [year, monthsMap] of yearsMap.entries()) {
        const monthGroups = [];
        for (const [month, items] of monthsMap.entries()) {
          monthGroups.push({ label: month, items });
        }
        groups.push({ year, monthGroups });
      }
      return { mode: 'year', groups };
    } else if (dateRange === 'week' || dateRange === 'month') {
      const daysMap = new Map();
      for (const a of articles) {
        const dKey = formatDay(a.published_at);
        if (!daysMap.has(dKey)) {
          daysMap.set(dKey, []);
        }
        daysMap.get(dKey).push(a);
      }
      const groups = [];
      for (const [label, items] of daysMap.entries()) {
        groups.push({ label, items });
      }
      return { mode: 'flat', groups };
    } else {
      // 3months, 6months, year -> Group by Month
      const monthsMap = new Map();
      for (const a of articles) {
        const mKey = formatMonth(a.published_at);
        if (!monthsMap.has(mKey)) {
          monthsMap.set(mKey, []);
        }
        monthsMap.get(mKey).push(a);
      }
      const groups = [];
      for (const [label, items] of monthsMap.entries()) {
        groups.push({ label, items });
      }
      return { mode: 'flat', groups };
    }
  }, [articles, dateRange]);

  const handleResetFilters = () => {
    setDateRange('month');
    setCountry('US');
    setCategory('all');
    setMajorOnly(false);
    setSearchQuery('');
    setDebouncedSearch('');
    setPage(1);
  };

  const activeRangeObj = TIMELINE_RANGES.find((r) => r.id === dateRange);

  return (
    <main id="main-content" className="timeline-page">
      {/* Header Banner */}
      <section className="timeline-header">
        <div className="timeline-header__container">
          <div className="timeline-header__badge">
            <CalendarDays size={14} aria-hidden="true" />
            <span>Healthcare Intelligence Timeline</span>
          </div>

          <h1 className="timeline-header__title">
            Healthcare Developments Timeline
          </h1>
          <p className="timeline-header__subtitle">
            Explore major policy rulings, CMS mandates, hospital closures & mergers, and clinical workforce trends across chronological periods from the past week to three years.
          </p>

          {/* Honest Coverage Disclosure */}
          <div className="timeline-disclosure" role="region" aria-label="Coverage scope disclosure">
            <div className="timeline-disclosure__icon">
              <Info size={16} aria-hidden="true" />
            </div>
            <div className="timeline-disclosure__content">
              <strong>Archive Scope & Coverage Disclosure:</strong>{' '}
              Continuous automated RSS ingestion monitors active feeds for recent events. Historical records (2023–2025) are curated to capture landmark regulatory actions, federal minimum staffing rules, major hospital bankruptcies, and healthcare labor strikes.
            </div>
          </div>
        </div>
      </section>

      {/* Control Toolbar */}
      <div className="timeline-controls-sticky">
        <div className="timeline-controls__container">
          {/* Segmented Range Selector */}
          <div className="timeline-range-bar" role="tablist" aria-label="Timeline historical date range">
            {TIMELINE_RANGES.map((r) => {
              const isActive = dateRange === r.id;
              return (
                <button
                  key={r.id}
                  role="tab"
                  aria-selected={isActive}
                  className={`timeline-range-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setDateRange(r.id)}
                  title={r.description}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Secondary Filter Row */}
          <div className="timeline-filter-row">
            {/* Search Input */}
            <div className="timeline-search">
              <Search size={16} className="timeline-search__icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search developments, policy, hospitals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Filter timeline events"
              />
              {searchQuery && (
                <button
                  className="timeline-search__clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Country Selector */}
            <div className="timeline-pills-group" role="group" aria-label="Country filter">
              {COUNTRIES.map((c) => {
                const IconComponent = c.icon;
                const isSelected = country === c.id;
                return (
                  <button
                    key={c.id}
                    className={`timeline-filter-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => setCountry(c.id)}
                    aria-pressed={isSelected}
                  >
                    {IconComponent && <IconComponent size={13} aria-hidden="true" />}
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Category Dropdown */}
            <div className="timeline-select-wrapper">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filter by category"
                className="timeline-select"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="timeline-select__chevron" aria-hidden="true" />
            </div>

            {/* Major Developments Only Toggle */}
            <button
              className={`timeline-toggle-major ${majorOnly ? 'active' : ''}`}
              onClick={() => setMajorOnly(!majorOnly)}
              aria-pressed={majorOnly}
              title="Filter to high-significance regulatory, hospital, and workforce milestones"
            >
              <Sparkles size={14} aria-hidden="true" />
              <span>Major developments only</span>
            </button>
          </div>

          {/* Status / Count Summary */}
          <div className="timeline-meta-bar">
            <span className="timeline-meta-count">
              {loading ? (
                'Loading timeline developments...'
              ) : (
                <>
                  Showing <strong>{articles.length}</strong> {articles.length === 1 ? 'event' : 'events'}
                  {totalCount > articles.length && ` of ${totalCount}`} in <strong>{activeRangeObj?.label}</strong>
                  {country !== 'all' && ` • ${country === 'US' ? 'United States' : 'Canada'}`}
                  {category !== 'all' && ` • ${CATEGORIES.find((c) => c.id === category)?.label || category}`}
                  {majorOnly && ` • Major only`}
                </>
              )}
            </span>

            {(country !== 'US' || category !== 'all' || majorOnly || debouncedSearch || dateRange !== 'month') && (
              <button className="timeline-reset-link" onClick={handleResetFilters}>
                <RotateCcw size={12} aria-hidden="true" />
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Timeline Stream */}
      <section className="timeline-body">
        <div className="timeline-body__container">
          {loading && (
            <div className="timeline-loading">
              <div className="timeline-skeleton-track">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="timeline-skeleton-item">
                    <div className="timeline-skeleton-node" />
                    <div className="timeline-skeleton-card">
                      <div className="skeleton-line skeleton-line--sm" />
                      <div className="skeleton-line skeleton-line--title" />
                      <div className="skeleton-line skeleton-line--desc" />
                      <div className="skeleton-line skeleton-line--desc" style={{ width: '80%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="timeline-state timeline-state--error" role="alert">
              <AlertCircle size={36} className="timeline-state__icon" />
              <h3>Something is not right.</h3>
              <p>The timeline could not be loaded, so no events are shown rather than demo content.</p>
              <pre style={{ textAlign: 'left', fontSize: '12px', lineHeight: 1.5, background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)', borderRadius: '8px', padding: '10px 12px', maxWidth: '560px', margin: '0 auto 16px', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {error}
              </pre>
              <div className="timeline-empty-actions">
                <button className="timeline-btn timeline-btn--primary" onClick={() => setRetryKey((k) => k + 1)}>
                  Try Again
                </button>
                <button className="timeline-btn timeline-btn--secondary" onClick={handleResetFilters}>
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          {!loading && !error && articles.length === 0 && (
            <div className="timeline-state timeline-state--empty">
              <CalendarDays size={42} className="timeline-state__icon" />
              <h3>No developments found in this timeframe</h3>
              <p>
                There are no published events matching your selected filters in <strong>{activeRangeObj?.label}</strong>.
              </p>
              <div className="timeline-empty-actions">
                <button
                  className="timeline-btn timeline-btn--primary"
                  onClick={() => setDateRange('3years')}
                >
                  Expand to Past 3 Years
                </button>
                <button
                  className="timeline-btn timeline-btn--secondary"
                  onClick={handleResetFilters}
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}

          {!loading && !error && articles.length > 0 && (
            <div className="timeline-stream">
              {groupedData.mode === 'year' ? (
                // Grouped by Year with Month Subsections
                groupedData.groups.map((yearGroup) => (
                  <div key={yearGroup.year} className="timeline-year-group">
                    <div className="timeline-year-badge">
                      <span>{yearGroup.year}</span>
                    </div>

                    {yearGroup.monthGroups.map((monthGroup) => (
                      <div key={monthGroup.label} className="timeline-month-subgroup">
                        <div className="timeline-month-badge">
                          <span>{monthGroup.label}</span>
                        </div>

                        <div className="timeline-entries-list">
                          {monthGroup.items.map((article) => (
                            <TimelineEntryCard key={article.id} article={article} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                // Grouped Flat (by Day or by Month)
                groupedData.groups.map((group) => (
                  <div key={group.label} className="timeline-group">
                    <div className="timeline-group-header">
                      <span className="timeline-group-label">{group.label}</span>
                    </div>

                    <div className="timeline-entries-list">
                      {group.items.map((article) => (
                        <TimelineEntryCard key={article.id} article={article} />
                      ))}
                    </div>
                  </div>
                ))
              )}

              {/* Load More Pagination */}
              {hasMore && (
                <div className="timeline-load-more">
                  <button
                    className="timeline-load-btn"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading more developments...' : 'Load older developments'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

/**
 * Individual Timeline Card — collapsed to headline by default.
 * Full details (summary, recruiter impact, tags, actions) reveal on
 * hover / keyboard focus, or via the tap-to-expand toggle (touch devices).
 */
function TimelineEntryCard({ article }) {
  const [expanded, setExpanded] = useState(false);
  const categoryObj = CATEGORIES.find((c) => c.id === article.primary_category);
  const CategoryIcon = categoryObj?.icon || Building2;
  const impactInfo = IMPACT_STATUS[article.summary?.impact_status] || IMPACT_STATUS.unclear;

  const isMajor = Boolean(article.is_major);

  return (
    <article className={`timeline-entry ${isMajor ? 'timeline-entry--major' : ''}${expanded ? ' is-expanded' : ''}`}>
      {/* Node Marker */}
      <div className={`timeline-entry__marker ${isMajor ? 'marker--major' : ''}`}>
        {isMajor ? (
          <Sparkles size={12} aria-hidden="true" />
        ) : (
          <div className="timeline-entry__marker-dot" />
        )}
      </div>

      {/* Main Card Content */}
      <div className="timeline-card">
        {/* Card Header */}
        <header className="timeline-card__header">
          <div className="timeline-card__badges">
            <span className="timeline-card__date">
              <Clock size={12} aria-hidden="true" />
              {formatCardDate(article.published_at)}
            </span>

            {isMajor && (
              <span className="timeline-badge timeline-badge--major" title="Landmark policy, hospital merger/closure, or workforce milestone">
                <Sparkles size={11} aria-hidden="true" />
                Major Development
              </span>
            )}

            {categoryObj && (
              <span className="timeline-badge timeline-badge--category">
                <CategoryIcon size={12} aria-hidden="true" />
                {categoryObj.label}
              </span>
            )}

            <span className="timeline-badge timeline-badge--country">
              {article.country === 'CA' ? 'Canada' : 'United States'}
            </span>
          </div>

          <span className="timeline-card__source">{article.source_name}</span>
        </header>

        {/* Title — always visible */}
        <h3 className="timeline-card__title">
          <Link to={`/article/${article.id}`} className="timeline-card__title-link">
            {article.title}
          </Link>
        </h3>

        {/* Expand toggle (touch / keyboard users — hover alone reveals on desktop) */}
        <button
          type="button"
          className="timeline-card__expand"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          <ChevronDown size={14} aria-hidden="true" className="timeline-card__expand-icon" />
          <span>{expanded ? 'Show less' : 'Details'}</span>
        </button>

        {/* Collapsible details — revealed on hover, focus-within, or toggle */}
        <div className="timeline-card__details">
          <div className="timeline-card__details-inner">
            {/* AI Quick Summary */}
            <p className="timeline-card__summary">
              {article.summary?.quick_summary || 'Detailed news analysis available in full article report.'}
            </p>

            {/* Recruiter Impact Callout */}
            {article.summary?.recruiter_impact && (
              <div className="timeline-card__impact">
                <div className="timeline-card__impact-header">
                  <span className="timeline-card__impact-label">
                    Recruiter Relevance
                  </span>
                  <span
                    className={`timeline-card__impact-status status--${article.summary?.impact_status || 'unclear'}`}
                  >
                    {article.summary?.impact_status === 'confirmed' ? (
                      <CheckCircle2 size={12} aria-hidden="true" />
                    ) : (
                      <HelpCircle size={12} aria-hidden="true" />
                    )}
                    {impactInfo.label}
                  </span>
                </div>
                <p className="timeline-card__impact-text">
                  {article.summary.recruiter_impact}
                </p>
              </div>
            )}

            {/* Footer & Actions */}
            <footer className="timeline-card__footer">
              <div className="timeline-card__tags">
                {(article.tags || []).slice(0, 4).map((tag, idx) => (
                  <span key={idx} className="timeline-tag">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="timeline-card__actions">
                <Link
                  to={`/article/${article.id}`}
                  className="timeline-action-btn timeline-action-btn--primary"
                >
                  <span>Full Analysis</span>
                  <ChevronRight size={14} aria-hidden="true" />
                </Link>

                {article.canonical_url && (
                  <a
                    href={article.canonical_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="timeline-action-btn timeline-action-btn--ghost"
                    title="View original article at source publisher"
                  >
                    <ArrowUpRight size={14} aria-hidden="true" />
                    <span>Source</span>
                  </a>
                )}
              </div>
            </footer>
          </div>
        </div>
      </div>
    </article>
  );
}
