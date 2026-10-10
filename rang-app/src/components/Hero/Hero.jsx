import './Hero.css';

export default function Hero({ articleCount }) {
  return (
    <section className="hero">
      <div className="hero__bg" aria-hidden="true" />
      <div className="hero__content">
        <h1 className="hero__title">
          Healthcare, <span className="hero__title-accent">better understood.</span>
        </h1>
        <p className="hero__subtitle">
          The latest healthcare developments across the US and Canada, with clear summaries and context for recruiters.
        </p>
        <div className="hero__stats">
          <div className="hero__stat">
            <span className="hero__stat-number">{articleCount}</span>
            <span className="hero__stat-label">Articles</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-number">2</span>
            <span className="hero__stat-label">Countries</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-number">10</span>
            <span className="hero__stat-label">Categories</span>
          </div>
        </div>
      </div>
    </section>
  );
}
