import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  FileText,
  BookmarkCheck,
  CheckCircle2,
  Newspaper,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { getAllPeriodSummaries, triggerSummaryGeneration } from '../../services/aiSummaryService';
import { CATEGORIES } from '../../data/categories';
import './AISummaries.css';

function formatRelativeTime(dateString) {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCategoryInfo(categoryId) {
  const found = CATEGORIES.find((c) => c.id === categoryId);
  return found || { label: categoryId || 'Healthcare', icon: Newspaper };
}

export default function AISummaries() {
  const [data, setData] = useState({ today: [], week: [], month: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadSummaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllPeriodSummaries();
      if (result.error && !result.month.length) {
        setError(result.error);
      } else {
        setData({
          today: result.today || [],
          week: result.week || [],
          month: result.month || [],
        });
      }
    } catch (err) {
      setError(err?.message || 'Failed to load summaries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummaries();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await triggerSummaryGeneration([], { force: false });
      await loadSummaries();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter articles by search query if present
  const filterList = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary_text.toLowerCase().includes(q) ||
        (a.source_name && a.source_name.toLowerCase().includes(q))
    );
  };

  const filteredToday = useMemo(() => filterList(data.today), [data.today, searchQuery]);
  const filteredWeek = useMemo(() => filterList(data.week), [data.week, searchQuery]);
  const filteredMonth = useMemo(() => filterList(data.month), [data.month, searchQuery]);

  return (
    <div className="ai-summaries-page">
      {/* Top Hero Banner */}
      <header className="ai-summaries-hero">
        <div className="ai-summaries-hero-content">
          <div className="ai-badge">
            <Sparkles className="ai-badge-icon" />
            <span>Gemini AI Intelligence</span>
          </div>
          <h1 className="ai-summaries-title">AI Article Summaries</h1>
          <p className="ai-summaries-subtitle">
            Executive syntheses of verified healthcare articles published across our network. 
            Grounded strictly in published article text to provide instant key takeaways.
          </p>

          <div className="ai-summaries-stats-bar">
            <div className="stats-metric">
              <span className="stats-num">{data.today.length}</span>
              <span className="stats-label">Today (24h)</span>
            </div>
            <div className="stats-divider" />
            <div className="stats-metric">
              <span className="stats-num">{data.week.length}</span>
              <span className="stats-label">This Week (7d)</span>
            </div>
            <div className="stats-divider" />
            <div className="stats-metric">
              <span className="stats-num">{data.month.length}</span>
              <span className="stats-label">This Month (30d)</span>
            </div>
            <div className="stats-divider" />
            <button
              className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh AI summaries cache"
            >
              <RefreshCw className="refresh-icon" />
              <span>{refreshing ? 'Updating AI...' : 'Refresh Summaries'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Controls & Search */}
      <section className="ai-controls-bar">
        <div className="period-tabs">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Layers className="tab-icon" />
            <span>All Periods</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            <Clock className="tab-icon" />
            <span>Today</span>
            <span className="tab-count">{data.today.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'week' ? 'active' : ''}`}
            onClick={() => setActiveTab('week')}
          >
            <Calendar className="tab-icon" />
            <span>This Week</span>
            <span className="tab-count">{data.week.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'month' ? 'active' : ''}`}
            onClick={() => setActiveTab('month')}
          >
            <BookmarkCheck className="tab-icon" />
            <span>This Month</span>
            <span className="tab-count">{data.month.length}</span>
          </button>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search summaries by topic or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="ai-summaries-container">
        {loading ? (
          <div className="loading-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-thumb" />
                <div className="skeleton-body">
                  <div className="skeleton-line title" />
                  <div className="skeleton-line meta" />
                  <div className="skeleton-line text" />
                  <div className="skeleton-line text short" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle className="error-icon" />
            <h3>Unable to Load Summaries</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={loadSummaries}>
              Try Again
            </button>
          </div>
        ) : (
          <div className="sections-wrapper">
            {/* Section 1: Today */}
            {(activeTab === 'all' || activeTab === 'today') && (
              <section className="summary-period-section" id="section-today">
                <div className="section-header">
                  <div className="section-title-group">
                    <span className="section-pill today">Today</span>
                    <h2 className="section-heading">Published in the Last 24 Hours</h2>
                  </div>
                  <span className="section-counter">
                    {filteredToday.length} {filteredToday.length === 1 ? 'Article' : 'Articles'}
                  </span>
                </div>

                {filteredToday.length === 0 ? (
                  <div className="empty-period-state">
                    <Clock className="empty-icon" />
                    <h4>No Articles Published Today</h4>
                    <p>
                      No new articles have been published in the last 24 hours. Check{' '}
                      <button className="link-button" onClick={() => setActiveTab('week')}>
                        This Week
                      </button>{' '}
                      or{' '}
                      <button className="link-button" onClick={() => setActiveTab('month')}>
                        This Month
                      </button>{' '}
                      for recent healthcare intelligence.
                    </p>
                  </div>
                ) : (
                  <div className="summaries-grid">
                    {filteredToday.map((article) => (
                      <ArticleSummaryCard key={`today-${article.id}`} article={article} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Section 2: This Week */}
            {(activeTab === 'all' || activeTab === 'week') && (
              <section className="summary-period-section" id="section-week">
                <div className="section-header">
                  <div className="section-title-group">
                    <span className="section-pill week">This Week</span>
                    <h2 className="section-heading">Published in the Last 7 Days</h2>
                  </div>
                  <span className="section-counter">
                    {filteredWeek.length} {filteredWeek.length === 1 ? 'Article' : 'Articles'}
                  </span>
                </div>

                {filteredWeek.length === 0 ? (
                  <div className="empty-period-state">
                    <Calendar className="empty-icon" />
                    <h4>No Articles Published This Week</h4>
                    <p>There are no published articles within the past seven days.</p>
                  </div>
                ) : (
                  <div className="summaries-grid">
                    {filteredWeek.map((article) => (
                      <ArticleSummaryCard key={`week-${article.id}`} article={article} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Section 3: This Month */}
            {(activeTab === 'all' || activeTab === 'month') && (
              <section className="summary-period-section" id="section-month">
                <div className="section-header">
                  <div className="section-title-group">
                    <span className="section-pill month">This Month</span>
                    <h2 className="section-heading">Published in the Last 30 Days</h2>
                  </div>
                  <span className="section-counter">
                    {filteredMonth.length} {filteredMonth.length === 1 ? 'Article' : 'Articles'}
                  </span>
                </div>

                {filteredMonth.length === 0 ? (
                  <div className="empty-period-state">
                    <FileText className="empty-icon" />
                    <h4>No Articles Published This Month</h4>
                    <p>No articles matched your criteria for the last 30 days.</p>
                  </div>
                ) : (
                  <div className="summaries-grid">
                    {filteredMonth.map((article) => (
                      <ArticleSummaryCard key={`month-${article.id}`} article={article} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Individual Article Summary Card
 */
function ArticleSummaryCard({ article }) {
  const [takeawaysExpanded, setTakeawaysExpanded] = useState(false);
  const categoryInfo = getCategoryInfo(article.primary_category);
  const CategoryIcon = categoryInfo.icon;

  return (
    <article className="article-summary-card">
      {/* Thumbnail or Fallback */}
      <div className="card-thumb-container">
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={article.title}
            className="card-thumb-img"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="card-thumb-fallback"
          style={{ display: article.image_url ? 'none' : 'flex' }}
        >
          <CategoryIcon className="fallback-category-icon" />
        </div>
        <span className="card-category-badge">
          <CategoryIcon className="badge-icon" />
          <span>{categoryInfo.label}</span>
        </span>
      </div>

      {/* Card Content */}
      <div className="card-content">
        <div className="card-meta">
          <span className="card-source">{article.source_name}</span>
          <span className="meta-dot">•</span>
          <span className="card-time" title={article.published_at}>
            {formatRelativeTime(article.published_at)}
          </span>
        </div>

        <h3 className="card-title">
          <Link to={`/article/${article.id}`} className="card-title-link">
            {article.title}
          </Link>
        </h3>

        {/* AI Summary Prose */}
        <p className="card-ai-summary">{article.summary_text}</p>

        {/* Key Takeaways Section */}
        {article.key_takeaways && article.key_takeaways.length > 0 && (
          <div className="card-takeaways-block">
            <div
              className="takeaways-header"
              onClick={() => setTakeawaysExpanded(!takeawaysExpanded)}
            >
              <div className="takeaways-title">
                <CheckCircle2 className="takeaways-icon" />
                <span>Key Insights ({article.key_takeaways.length})</span>
              </div>
              <ChevronDown
                className={`expand-chevron ${takeawaysExpanded ? 'rotated' : ''}`}
              />
            </div>
            {(takeawaysExpanded || article.key_takeaways.length <= 2) && (
              <ul className="takeaways-list">
                {article.key_takeaways.map((item, idx) => (
                  <li key={idx} className="takeaway-item">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Card Actions & Gemini Attribution */}
        <div className="card-footer">
          <div className="model-tag" title="Summarized using Google Gemini">
            <Sparkles className="model-sparkle" />
            <span>Gemini AI</span>
          </div>

          <div className="card-links">
            {article.canonical_url && (
              <a
                href={article.canonical_url}
                target="_blank"
                rel="noopener noreferrer"
                className="external-source-link"
                title="View original external source"
              >
                <span>Original</span>
                <ExternalLink className="ext-icon" />
              </a>
            )}
            <Link to={`/article/${article.id}`} className="read-article-link">
              <span>Read Full</span>
              <ChevronRight className="arrow-icon" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
