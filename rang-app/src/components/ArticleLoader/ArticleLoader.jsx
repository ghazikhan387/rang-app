import { Newspaper } from 'lucide-react';
import './ArticleLoader.css';

/**
 * ArticleLoader — polished loading indicator shown while an article is
 * being fetched. News-themed and subtle: a brand mark with a soft pulse,
 * typesetting-style shimmer lines, a status line, and a thin press rule.
 * Centered in the viewport area; reuses the global `.skeleton` shimmer
 * and design tokens so it matches the rest of the site.
 */
export default function ArticleLoader({ message = 'Preparing your brief' }) {
  return (
    <div className="article-loader" role="status" aria-live="polite" aria-label="Loading article">
      <div className="article-loader__mark" aria-hidden="true">
        <span className="article-loader__pulse" />
        <Newspaper size={26} strokeWidth={1.75} />
      </div>

      <div className="article-loader__lines" aria-hidden="true">
        <div className="skeleton article-loader__line article-loader__line--1" />
        <div className="skeleton article-loader__line article-loader__line--2" />
        <div className="skeleton article-loader__line article-loader__line--3" />
      </div>

      <p className="article-loader__text">
        {message}
        <span className="article-loader__dots" aria-hidden="true">
          <span>.</span><span>.</span><span>.</span>
        </span>
      </p>

      <div className="article-loader__rule" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}
