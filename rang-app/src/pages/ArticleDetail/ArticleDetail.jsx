import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Hospital, TriangleAlert, Copy, Check } from 'lucide-react';
import { getArticleById } from '../../services/newsService';
import { CATEGORIES } from '../../data/categories';
import {
  formatDate,
  formatRelativeTime,
  getCountryName,
  getCountryIcon,
  getImpactBadgeClass,
  getImpactLabel
} from '../../utils/helpers';
import './ArticleDetail.css';

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copyStatus, setCopyStatus] = useState('idle'); // idle | copied | error
  const CountryIcon = getCountryIcon(article?.country);

  // Scroll to top on mount or id change and fetch live article
  useEffect(() => {
    window.scrollTo(0, 0);
    let isMounted = true;
    async function fetchArticle() {
      setLoading(true);
      setError(null);
      setArticle(null);
      const res = await getArticleById(id);
      if (isMounted) {
        if (res.article) {
          setArticle(res.article);
        } else if (res.error) {
          setError(res.error);
        }
        setLoading(false);
      }
    }
    fetchArticle();
    return () => { isMounted = false; };
  }, [id]);

  if (loading && !article) {
    return (
      <div className="article-detail__not-found" style={{ textAlign: 'center', padding: 'var(--space-24) 0' }}>
        <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>Loading healthcare intelligence brief...</p>
      </div>
    );
  }

  if (!article) {
    // A fetch-level failure (misconfiguration, DB error, network) must be
    // clearly distinguished from a genuine "article doesn't exist".
    if (error) {
      return (
        <div className="article-detail__not-found" role="alert" style={{ textAlign: 'center', padding: 'var(--space-24) var(--space-6)' }}>
          <div style={{ display: 'inline-flex', width: '48px', height: '48px', borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
            <TriangleAlert size={22} strokeWidth={2} />
          </div>
          <h2>Something is not right.</h2>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '560px', margin: '0 auto var(--space-4)' }}>
            This article could not be loaded, so nothing is shown rather than demo content.
          </p>
          <pre style={{ textAlign: 'left', fontSize: '12px', lineHeight: 1.5, background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)', borderRadius: '8px', padding: '10px 12px', maxWidth: '560px', margin: '0 auto var(--space-6)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--color-text-secondary)' }}>
            {error}
          </pre>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="article-detail__back" style={{ cursor: 'pointer' }} onClick={() => window.location.reload()}>
              Try again
            </button>
            <Link to="/" className="article-detail__back">
              Back to all news
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="article-detail__not-found">
        <h2>Article Not Found</h2>
        <p>The healthcare intelligence brief you are looking for does not exist or has been archived.</p>
        <Link to="/" className="article-detail__back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to all news
        </Link>
      </div>
    );
  }

  const catObj = CATEGORIES.find((c) => c.id === article.primary_category);
  const categoryLabel = catObj ? catObj.label : article.primary_category;
  const impactStatus = article.summary?.impact_status || 'unclear';
  const impactLabel = getImpactLabel(impactStatus);
  const impactBadgeClass = getImpactBadgeClass(impactStatus);

  const buildArticleText = () => {
    const lines = [];
    lines.push(article.title);
    lines.push(
      `${article.source_name} · ${formatDate(article.published_at)} · ${getCountryName(article.country)} · ${categoryLabel}`
    );
    if (article.canonical_url) lines.push(article.canonical_url);
    if (article.tags && article.tags.length > 0) {
      lines.push(`Tags: ${article.tags.map((t) => `#${t}`).join(' ')}`);
    }
    lines.push('');
    if (article.summary?.quick_summary) {
      lines.push('EXECUTIVE SUMMARY');
      lines.push(article.summary.quick_summary);
      lines.push('');
    }
    if (article.summary?.recruiter_impact) {
      lines.push(`RECRUITER & TALENT INTELLIGENCE (Impact: ${impactLabel})`);
      lines.push(article.summary.recruiter_impact);
      lines.push('');
    }
    if (article.summary?.why_it_matters) {
      lines.push('WHY IT MATTERS');
      lines.push(article.summary.why_it_matters);
      lines.push('');
    }
    if (article.summary?.detailed_summary) {
      lines.push('IN-DEPTH REPORTING');
      lines.push(article.summary.detailed_summary);
      lines.push('');
    }
    if (article.summary?.evidence_notes) {
      lines.push(`Evidence: ${article.summary.evidence_notes}`);
      lines.push('');
    }
    const sourceUrls = article.summary?.source_urls?.length
      ? article.summary.source_urls
      : (article.canonical_url ? [article.canonical_url] : []);
    if (sourceUrls.length > 0) {
      lines.push('SOURCES');
      sourceUrls.forEach((url) => lines.push(`- ${url}`));
    }
    return lines.join('\n');
  };

  const handleCopyArticle = async () => {
    const text = buildArticleText();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers / non-secure contexts
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
    window.setTimeout(() => setCopyStatus('idle'), 2000);
  };

  return (
    <article className="article-detail" itemScope itemType="https://schema.org/NewsArticle">
      {/* Breadcrumb Navigation */}
      <nav className="article-detail__breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/">{categoryLabel}</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-text)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {article.title}
        </span>
      </nav>

      {/* Header section */}
      <header className="article-detail__header">
        <div className="article-detail__meta-row">
          <span className="article-detail__badge">
            <CountryIcon size={12} strokeWidth={2} aria-hidden="true" />
            <span>{getCountryName(article.country)}</span>
          </span>

          <span className="article-detail__badge article-detail__badge--category">
            {categoryLabel}
          </span>

          {article.regions && article.regions.length > 0 && (
            <span className="article-detail__badge" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <MapPin size={12} strokeWidth={2} aria-hidden="true" /> {article.regions.join(', ')}
            </span>
          )}
        </div>

        <h1 className="article-detail__title" itemProp="headline">
          {article.title}
        </h1>

        <div className="article-detail__source-row">
          <span className="article-detail__source-name" itemProp="author">
            {article.source_name}
          </span>
          <span className="article-detail__dot"></span>
          <time dateTime={article.published_at} title={formatDate(article.published_at)} itemProp="datePublished">
            Published {formatRelativeTime(article.published_at)} ({formatDate(article.published_at)})
          </time>
          <span className="article-detail__dot"></span>
          <a
            href={article.canonical_url}
            target="_blank"
            rel="noopener noreferrer"
            className="article-detail__original-link"
          >
            Original source
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
          <span className="article-detail__dot"></span>
          <button
            type="button"
            onClick={handleCopyArticle}
            className="article-detail__copy-btn"
            aria-live="polite"
          >
            {copyStatus === 'copied' ? (
              <>
                <Check size={12} strokeWidth={2.5} aria-hidden="true" /> Copied!
              </>
            ) : (
              <>
                <Copy size={12} strokeWidth={2.5} aria-hidden="true" /> Copy article
              </>
            )}
          </button>
        </div>
        {copyStatus === 'error' && (
          <p role="alert" style={{ fontSize: 'var(--font-size-xs)', color: '#DC2626', marginTop: 'var(--space-2)' }}>
            Copy failed — your browser blocked clipboard access. Select the text manually to copy.
          </p>
        )}

        {article.tags && article.tags.length > 0 && (
          <div className="article-detail__tags">
            {article.tags.map((tag, idx) => (
              <span key={idx} className="article-detail__tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Hero image or banner, with a print-style caption line */}
      <figure className="article-detail__figure">
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={article.title}
            className="article-detail__image"
            itemProp="image"
          />
        ) : (
          <div className="article-detail__image-placeholder" aria-hidden="true">
            <Hospital size={56} strokeWidth={1.5} />
          </div>
        )}
        <figcaption className="article-detail__caption">
          {`“${article.title}”`} — {article.source_name}
          {article.regions && article.regions.length > 0
            ? ` · ${article.regions.join(', ')}`
            : ` · ${getCountryName(article.country)}`}
        </figcaption>
      </figure>

      {/* Main Content Sections */}
      <div className="article-detail__content">
        {/* Section 1: Executive Summary / Quick Take */}
        {article.summary?.quick_summary && (
          <section className="article-detail__section" aria-labelledby="heading-quick-take">
            <h2 id="heading-quick-take" className="article-detail__section-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              Executive Summary & Quick Take
            </h2>
            <div
              className="article-detail__quick-take"
              itemProp="description"
              data-pullquote="true"
            >
              {article.summary.quick_summary}
            </div>
          </section>
        )}

        {/* Section 2: Recruiter Impact Analysis (Crucial PRD requirement) */}
        {article.summary?.recruiter_impact && (
          <section className="article-detail__section" aria-labelledby="heading-recruiter-impact">
            <h2 id="heading-recruiter-impact" className="article-detail__section-label article-detail__section-label--purple">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Recruiter & Talent Intelligence
            </h2>
            <div className="article-detail__impact-card">
              <div className="article-detail__impact-header">
                <span className={`article-detail__impact-dot impact-badge impact-badge--${impactStatus}`}></span>
                <span className="article-detail__impact-label">
                  Impact Status: {impactLabel}
                </span>
                <span className="article-detail__impact-description">
                  ({impactStatus === 'confirmed' ? 'Directly stated hiring/staffing changes' : impactStatus === 'potential' ? 'Projected or contingent implications' : 'Speculative or secondary correlation'})
                </span>
              </div>
              <p className="article-detail__impact-text">
                {article.summary.recruiter_impact}
              </p>
            </div>
          </section>
        )}

        {/* Section 3: Why It Matters */}
        {article.summary?.why_it_matters && (
          <section className="article-detail__section" aria-labelledby="heading-why-it-matters">
            <h2 id="heading-why-it-matters" className="article-detail__section-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              Why It Matters to Healthcare Systems
            </h2>
            <div className="article-detail__body-text" style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-charcoal)', fontWeight: 500 }}>
              {article.summary.why_it_matters}
            </div>
          </section>
        )}

        {/* Section 4: Detailed Background & Analysis */}
        {article.summary?.detailed_summary && (
          <section className="article-detail__section" aria-labelledby="heading-detailed-analysis">
            <h2 id="heading-detailed-analysis" className="article-detail__section-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              In-Depth Reporting & Context
            </h2>
            <div className="article-detail__body-text" itemProp="articleBody">
              {article.summary.detailed_summary}
            </div>
          </section>
        )}

        {/* Section 5: Grounding and Verification Evidence */}
        <section className="article-detail__section" aria-labelledby="heading-evidence">
          <h2 id="heading-evidence" className="article-detail__section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Grounding & Verification Notes
          </h2>
          <div className="article-detail__evidence">
            <p style={{ margin: 0, marginBottom: '6px' }}>
              <strong>Evidence basis:</strong> {article.summary?.evidence_notes || 'Grounded in public press releases and regional healthcare authority dispatches.'}
            </p>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              {article.summary?.model_name && (
                <span>Processed by: <code>{article.summary.model_name}</code></span>
              )}
              {article.summary?.generated_at && (
                <span>Synthesized: {formatDate(article.summary.generated_at)}</span>
              )}
            </div>
          </div>
        </section>

        {/* Section 6: Primary Sources */}
        <section className="article-detail__section" aria-labelledby="heading-sources">
          <h2 id="heading-sources" className="article-detail__section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            Primary Source Outlets
          </h2>
          <div className="article-detail__source-links">
            {article.summary?.source_urls && article.summary.source_urls.length > 0 ? (
              article.summary.source_urls.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="article-detail__source-link-item"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  {url}
                </a>
              ))
            ) : (
              <a
                href={article.canonical_url}
                target="_blank"
                rel="noopener noreferrer"
                className="article-detail__source-link-item"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                {article.canonical_url}
              </a>
            )}
          </div>
        </section>

        {/* Back link */}
        <Link to="/" className="article-detail__back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to all news
        </Link>
      </div>
    </article>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <div className="article-detail-skeleton">
      <div className="skeleton article-detail-skeleton__breadcrumb"></div>
      <div className="article-detail-skeleton__badge-row">
        <div className="skeleton article-detail-skeleton__badge"></div>
        <div className="skeleton article-detail-skeleton__badge"></div>
      </div>
      <div className="skeleton article-detail-skeleton__title"></div>
      <div className="skeleton article-detail-skeleton__title-2"></div>
      <div className="skeleton article-detail-skeleton__meta"></div>
      <div className="skeleton article-detail-skeleton__image"></div>
      <div className="skeleton article-detail-skeleton__section-label"></div>
      <div className="skeleton article-detail-skeleton__text"></div>
      <div className="skeleton article-detail-skeleton__text"></div>
      <div className="skeleton article-detail-skeleton__text-short"></div>
      <div className="skeleton article-detail-skeleton__section-label"></div>
      <div className="skeleton article-detail-skeleton__text"></div>
      <div className="skeleton article-detail-skeleton__text-short"></div>
    </div>
  );
}
