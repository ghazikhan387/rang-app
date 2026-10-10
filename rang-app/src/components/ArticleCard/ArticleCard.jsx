import { Link } from 'react-router-dom';
import { CATEGORIES, IMPACT_STATUS } from '../../data/categories';
import { formatRelativeTime, truncateText, getCountryFlag, getCountryName } from '../../utils/helpers';
import './ArticleCard.css';

export default function ArticleCard({ article }) {
  const category = CATEGORIES.find((c) => c.id === article.primary_category);
  const impact = article.summary?.impact_status
    ? IMPACT_STATUS[article.summary.impact_status]
    : null;

  return (
    <article className="article-card">
      {/* Image area */}
      <div className="article-card__image-wrapper">
        {article.image_url ? (
          <img
            className="article-card__image"
            src={article.image_url}
            alt=""
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="article-card__image-placeholder"
          style={article.image_url ? { display: 'none' } : {}}
          aria-hidden="true"
        >
          {category?.icon || '📰'}
        </div>
      </div>

      {/* Card body */}
      <div className="article-card__body">
        {/* Country & category */}
        <div className="article-card__meta-row">
          <span className="article-card__country-badge">
            {getCountryFlag(article.country)} {getCountryName(article.country)}
          </span>
          <span className="article-card__meta-dot" />
          <span className="article-card__category-badge">
            {category?.label || article.primary_category}
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
          <span className="article-card__meta-dot" />
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
