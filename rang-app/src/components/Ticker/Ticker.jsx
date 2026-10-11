import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../../utils/helpers';
import './Ticker.css';

/**
 * Breaking-news ticker.
 * The headline run is rendered twice so the CSS marquee can loop seamlessly;
 * the duplicate is hidden from assistive tech and removed from the tab order.
 * Under prefers-reduced-motion the marquee stops and the duplicate is hidden.
 */
export default function Ticker({ articles = [] }) {
  const items = articles.slice(0, 4);

  if (items.length === 0) return null;

  const renderRun = (isDuplicate) => (
    <span className="ticker__run" aria-hidden={isDuplicate ? 'true' : undefined}>
      {items.map((article) => (
        <Link
          key={`${isDuplicate ? 'dup' : 'run'}-${article.id}`}
          to={`/article/${article.id}`}
          className="ticker__item"
          tabIndex={isDuplicate ? -1 : undefined}
        >
          <time className="ticker__time" dateTime={article.published_at}>
            {formatRelativeTime(article.published_at)}
          </time>
          <span className="ticker__headline">{article.title}</span>
          <span className="ticker__source">{article.source_name}</span>
        </Link>
      ))}
    </span>
  );

  return (
    <div className="ticker" role="region" aria-label="Latest headlines ticker">
      <span className="ticker__label">Breaking</span>
      <div className="ticker__mask">
        <div className="ticker__track">
          {renderRun(false)}
          {renderRun(true)}
        </div>
      </div>
    </div>
  );
}
