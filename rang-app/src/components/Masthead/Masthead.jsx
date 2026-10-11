import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { getPublishedArticles } from '../../services/newsService';
import { truncateText } from '../../utils/helpers';
import Ticker from '../Ticker/Ticker';
import './Masthead.css';

const EDITION_LINE = 'US & Canada Edition';
const FREE_LINE = 'Independently edited · Free to read';

/**
 * Masthead — the print-style header above the site navigation.
 * Shows live teasers/ticker only when the feed loads. When the feed fails
 * or is empty, these sections stay hidden — no mock content is rendered.
 * Presentation only: no new content, no new routes.
 */
export default function Masthead() {
  const [articles, setArticles] = useState([]);
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  useEffect(() => {
    let mounted = true;
    getPublishedArticles().then((res) => {
      if (mounted && !res.error && res.articles && res.articles.length > 0) {
        setArticles(res.articles);
      }
      // On error/empty: intentionally leave teasers + ticker empty so a
      // broken feed is visible as missing, not masked by demo headlines.
    }).catch(() => {
      // Leave empty — the main feed surfaces the actual error.
    });
    return () => {
      mounted = false;
    };
  }, []);

  const dateLine = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    []
  );

  const ordered = useMemo(
    () => [...articles].sort((a, b) => new Date(b.published_at) - new Date(a.published_at)),
    [articles]
  );

  const teasers = ordered.slice(0, 3);
  const categoryOf = (id) => CATEGORIES.find((c) => c.id === id);

  return (
    <header className="masthead">
      {/* Thin info strip: edition · date · price line */}
      <div className="masthead__strip">
        <span className="masthead__strip-item masthead__edition">{EDITION_LINE}</span>
        <span className="masthead__strip-item masthead__date">{dateLine}</span>
        <span className="masthead__strip-item masthead__price">{FREE_LINE}</span>
      </div>

      {/* Oversized brand plate: the real logo lockup, never recoloured */}
      <div className={`masthead__plate${isHome ? '' : ' masthead__plate--bare'}`}>
        <Link to="/" className="masthead__wordmark" aria-label="Rang Healthcare — front page">
          <img
            className="masthead__logo"
            src="/rang-logo.webp"
            alt=""
            width="412"
            height="144"
            decoding="async"
          />
        </Link>
        <p className="masthead__tagline">
          Healthcare news, clearly explained — with the context recruiters need.
        </p>
        <span className="masthead__stamp" aria-hidden="true">
          EST. 2026
        </span>
      </div>

      {/* Teaser strip: boxed front-page items, front page only */}
      {isHome && teasers.length > 0 && (
        <ul className="masthead__teasers" aria-label="Front page teasers">
          {teasers.map((article) => {
            const category = categoryOf(article.primary_category);
            const ThumbIcon = category?.icon || Newspaper;
            return (
              <li className="masthead__teaser" key={article.id}>
                <Link to={`/article/${article.id}`} className="masthead__teaser-link">
                  <span className="masthead__teaser-thumb" aria-hidden="true">
                    <ThumbIcon size={22} strokeWidth={1.75} />
                  </span>
                  <span className="masthead__teaser-text">
                    <span className="masthead__teaser-kicker">
                      {category?.label || article.primary_category}
                    </span>
                    <span className="masthead__teaser-headline">
                      {truncateText(article.title, 68)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Ticker articles={ordered} />
    </header>
  );
}
