import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.css';

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">
      {/* Hero section */}
      <div className="about-page__hero">
        <div className="about-page__badge">
          <span>🛡️</span>
          <span>Methodology & Standards</span>
        </div>
        <h1 className="about-page__title">
          Healthcare news, clearly explained — with the context recruiters need.
        </h1>
        <p className="about-page__subtitle">
          Rang is built for US and Canadian healthcare recruiters, talent leaders, and workforce planners. We distill noisy healthcare reporting into clear, evidence-grounded intelligence.
        </p>
      </div>

      {/* Section 1: Product Promise */}
      <div className="about-section">
        <div className="about-section__header">
          <div className="about-section__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <h2 className="about-section__title">Our Core Promise</h2>
        </div>
        <p className="about-section__text">
          Healthcare recruiters don't need another generic news aggregator with clickbait headlines or paywalled links. Every intelligence brief on Rang is curated to answer four critical questions in under 60 seconds:
        </p>

        <div className="method-grid">
          <div className="method-card">
            <div className="method-card__step">01. What Happened?</div>
            <div className="method-card__title">Executive Facts</div>
            <div className="method-card__desc">A concise, verified 2–3 sentence executive summary of the verified event or policy development.</div>
          </div>

          <div className="method-card">
            <div className="method-card__step">02. Strategic Context</div>
            <div className="method-card__title">In-Depth Reporting</div>
            <div className="method-card__desc">Key figures, geographic regions, health systems involved, and regulatory backdrop.</div>
          </div>

          <div className="method-card">
            <div className="method-card__step">03. Recruiter Relevance</div>
            <div className="method-card__title">Talent Intelligence</div>
            <div className="method-card__desc">Direct evaluation of clinical staffing supply, compensation pressure, credentialing shifts, or hospital expansion.</div>
          </div>

          <div className="method-card">
            <div className="method-card__step">04. Evidence Grounding</div>
            <div className="method-card__title">Fact vs. Implication</div>
            <div className="method-card__desc">Clear demarcation of confirmed data versus potential future projections, backed by primary source links.</div>
          </div>
        </div>
      </div>

      {/* Section 2: Recruiter Impact Taxonomy */}
      <div className="about-section">
        <div className="about-section__header">
          <div className="about-section__icon about-section__icon--purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <polyline points="16 11 18 13 22 9"></polyline>
            </svg>
          </div>
          <h2 className="about-section__title">Impact Qualification Matrix</h2>
        </div>
        <p className="about-section__text">
          To combat hallucination and over-interpretation, Rang classifies recruiter impact into three strict criteria:
        </p>

        <table className="matrix-table">
          <thead>
            <tr>
              <th>Status Badge</th>
              <th>Definition</th>
              <th>Standard of Proof</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="impact-badge impact-badge--confirmed">Confirmed</span></td>
              <td>Explicit hiring, layoffs, wage increases, or clinic openings directly announced by the employer or government authority.</td>
              <td>Verifiable direct quotes, press announcements, or legal filings with exact headcount or timeline.</td>
            </tr>
            <tr>
              <td><span className="impact-badge impact-badge--potential">Potential</span></td>
              <td>Legislation, licensing proposals, or regional expansions that are likely to shift labor demand if finalized.</td>
              <td>Draft policy, pending legislative hearings, or multi-year master plans subject to approval.</td>
            </tr>
            <tr>
              <td><span className="impact-badge impact-badge--unclear">Unclear</span></td>
              <td>Early-stage clinical studies, high-level technology acquisitions, or macro market reports with indirect staffing effects.</td>
              <td>No direct labor statement; recruiters should maintain general awareness without operational adjustments.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 3: Ingestion & Zero-Budget Architecture */}
      <div className="about-section">
        <div className="about-section__header">
          <div className="about-section__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <h2 className="about-section__title">Discovery & Sourcing Policy</h2>
        </div>
        <p className="about-section__text">
          Rang is engineered as a lean, zero-cost side project operating under sustainable free-tier allowances:
        </p>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: 'var(--color-text)', fontSize: 'var(--font-size-base)' }}>
          <li><strong>Public Feeds Only:</strong> We monitor official healthcare department RSS feeds (HHS, CMS, Health Canada), public hospital press rooms, and major medical media.</li>
          <li><strong>Zero Paywall Bypass:</strong> We never scrape paywalled journals or bypass publisher restrictions. If an article cannot be legitimately accessed, it is not summarized.</li>
          <li><strong>Full Publisher Attribution:</strong> Every summary prominently displays the source outlet name, publication timestamp, and direct canonical link to the original reporting.</li>
          <li><strong>Cached Intelligence:</strong> Background workers process incoming stories on an hourly schedule into Supabase. Client requests load static cached data with zero latency.</li>
        </ul>

        <div className="about-callout">
          <div className="about-callout__title">Fair Use & Publisher Integrity Notice</div>
          <p className="about-callout__text">
            Rang does not reproduce full-text articles. We provide transformative, recruiter-specific analytical commentary and direct links to original publishers to encourage readers to read original journalism.
          </p>
        </div>
      </div>

      {/* Navigation bottom */}
      <div style={{ textAlign: 'center', marginTop: 'var(--space-10)' }}>
        <Link to="/" className="btn btn--primary" style={{ padding: '12px 28px', fontSize: 'var(--font-size-base)' }}>
          Browse Latest Healthcare Briefs
        </Link>
      </div>
    </div>
  );
}
