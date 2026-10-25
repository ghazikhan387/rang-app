import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import { CATEGORIES, IMPACT_STATUS } from '../../data/categories';
import {
  formatRelativeTime,
  truncateText,
  getCountryIcon,
  getCountryName,
  isPressReleaseSource,
} from '../../utils/helpers';
import './ArticleCard.css';

const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || id;

/* Full-bleed gradient fallback — fills the same 16/9 media area as article
   images so every card in a row lines up. Content is centered over a
   category-tied gradient with a faint highlight/dot pattern. */
function CardMediaFallback({ article }) {
  const FallbackIcon = CATEGORIES.find((c) => c.id === article.primary_category)?.icon || Newspaper;
  return (
    <div
      className="article-card__image-fallback"
      data-accent={article.primary_category}
      aria-hidden="true"
    >
      <span className="article-card__fallback-icon">
        <FallbackIcon size={32} strokeWidth={1.8} />
      </span>
      <span className="article-card__fallback-category">{categoryLabel(article.primary_category)}</span>
      <span className="article-card__fallback-source">{article.source_name}</span>
    </div>
  );
}

export default function ArticleCard({ article }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(article.image_url) && !imageFailed;
  const CountryIcon = getCountryIcon(article.country);
  const isPressRelease = isPressReleaseSource(article.source_name);
  const impact = article.summary?.impact_status
    ? IMPACT_STATUS[article.summary.impact_status]
    : null;

  /*
    Decorative hooks: a few presentation-only data attributes so CSS can
    render print-style details (the big date numeral in the Modern row
    layout, the section label in Press) with pseudo-elements instead of
    duplicating markup per theme.
  */
  const published = article.published_at ? new Date(article.published_at) : null;
  const day = published ? String(published.getDate()).padStart(2, '0') : '--';
  const month = published ? published.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '';
  const weekday = published ? published.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() : '';

  return (
    <article
      className="article-card"
      data-day={day}
      data-month={month}
      data-weekday={weekday}
      data-category={categoryLabel(article.primary_category)}
      data-source={article.source_name}
    >
      {/* Media: the article image when available, otherwise a full-size gradient fallback */}
      <div className="article-card__image-wrapper">
        {hasImage ? (
          <img
            className="article-card__image"
            src={article.image_url}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <CardMediaFallback article={article} />
        )}
      </div>

      {/* Card body */}
      <div className="article-card__body">
        {/* Country & category */}
        <div className="article-card__meta-row">
          <span className="article-card__country-badge">
            <CountryIcon size={12} strokeWidth={2} aria-hidden="true" /> {getCountryName(article.country)}
          </span>
          <span className="article-card__meta-dot" aria-hidden="true" />
          <span className="article-card__category-badge">
            {categoryLabel(article.primary_category)}
          </span>
        </div>

        {/* Title */}
        <h2 className="article-card__title">
          <Link to={`/article/${article.id}`}>
            {article.title}
          </Link>
        </h2>

        {/* Source & date */}
        <div className="article-card__source">
          <span className="article-card__source-name">{article.source_name}</span>
          {isPressRelease && <span className="article-card__press-badge">Press release</span>}
          <span className="article-card__meta-dot" aria-hidden="true" />
          <time dateTime={article.published_at}>
            {formatRelativeTime(article.published_at)}
          </time>
        </div>

        {/* Quick summary */}
        {article.summary?.quick_summary && (
          <p className="article-card__summary">
            {truncateText(article.summary.quick_summary, 200)}
          </p>
        )}

        {/* Impact line */}
        {impact && article.summary?.impact_status !== 'unclear' && (
          <div className="article-card__impact">
            <span
              className="article-card__impact-dot"
              style={{ background: impact.color }}
              aria-hidden="true"
            />
            <span className="article-card__impact-text">
              <span className="article-card__impact-label">{impact.label}</span>
            </span>
          </div>
        )}

        {/* CTA */}
        <Link to={`/article/${article.id}`} className="article-card__cta">
          Read summary
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </Link>
      </div>
    </article>
  );
}

/* Skeleton placeholder */
export function ArticleCardSkeleton() {
  return (
    <div className="article-card-skeleton" aria-hidden="true">
      <div className="article-card-skeleton__image skeleton" />
      <div className="article-card-skeleton__body">
        <div className="article-card-skeleton__meta skeleton" />
        <div className="article-card-skeleton__title skeleton" />
        <div className="article-card-skeleton__title-2 skeleton" />
        <div className="article-card-skeleton__text skeleton" />
        <div className="article-card-skeleton__text-2 skeleton" />
        <div className="article-card-skeleton__cta skeleton" />
      </div>
    </div>
  );
}
