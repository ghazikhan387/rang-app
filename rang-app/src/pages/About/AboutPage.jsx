import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Info, UserCheck, Activity, ArrowRight } from 'lucide-react';
import './AboutPage.css';

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">
      {/* Editorial Header Banner */}
      <section className="about-hero-banner">
        <div className="about-hero-inner">
          <div className="about-hero-badge">
            <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" />
            <span>Methodology & Standards</span>
          </div>
          <h1 className="about-hero-title">
            Healthcare news, clearly explained — with the context recruiters need.
          </h1>
          <p className="about-hero-subtitle">
            Rang is built for US and Canadian healthcare recruiters, talent leaders, and workforce planners. We distill noisy healthcare reporting into clear, evidence-grounded intelligence.
          </p>
        </div>
      </section>

      <div className="container about-content-container">
        {/* Section 1: Product Promise */}
        <div className="about-section">
          <div className="about-section__header">
            <div className="about-section__icon">
              <Info size={20} strokeWidth={2} />
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
              <UserCheck size={20} strokeWidth={2} />
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
              <Activity size={20} strokeWidth={2} />
            </div>
            <h2 className="about-section__title">Discovery & Sourcing Policy</h2>
          </div>
          <p className="about-section__text">
            Rang is engineered as a lean, zero-cost side project operating under sustainable free-tier allowances:
          </p>
          <ul className="about-list">
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
        <div className="about-footer-action">
          <Link to="/" className="btn btn--primary about-cta-btn">
            Browse Latest Healthcare Briefs
            <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </div>
  );
}
