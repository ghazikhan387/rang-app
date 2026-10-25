import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BookmarkCheck,
  ChevronRight,
  TrendingUp,
  Scale,
  Building2,
  Activity,
  Cpu,
  ArrowUpRight,
  ListOrdered,
  Layers,
} from 'lucide-react';
import {
  getConsolidatedReport,
  listMonthlyArchives,
  triggerReportGeneration,
  PERIOD_TYPES,
} from '../../services/developmentReportService';
import './DevelopmentReports.css';

export default function DevelopmentReports() {
  const [periodType, setPeriodType] = useState('month'); // 'day' | 'week' | 'month'
  const [selectedMonthKey, setSelectedMonthKey] = useState('2026-10');
  const [monthlyArchives, setMonthlyArchives] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // 1. Load monthly archive list once on mount
  useEffect(() => {
    async function loadArchives() {
      const { archives } = await listMonthlyArchives();
      if (archives && archives.length > 0) {
        setMonthlyArchives(archives);
        // Default to first month if not set
        if (!selectedMonthKey) {
          setSelectedMonthKey(archives[0].period_key);
        }
      }
    }
    loadArchives();
  }, []);

  // 2. Fetch the consolidated report whenever periodType or selectedMonthKey changes
  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError(null);
      try {
        const periodKey = periodType === 'month' ? selectedMonthKey : 'latest';
        const { report: rep, error: repErr } = await getConsolidatedReport({
          periodType,
          periodKey,
        });

        if (repErr) {
          setError(repErr);
        } else {
          setReport(rep);
        }
      } catch (err) {
        setError(err?.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [periodType, selectedMonthKey]);

  // Handle on-demand regeneration
  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      const periodKey = periodType === 'month' ? selectedMonthKey : 'latest';
      const res = await triggerReportGeneration({
        periodType,
        periodKey,
        force: true,
      });

      if (res.success && res.report) {
        setReport(res.report);
      } else {
        // Fallback fetch
        const { report: rep } = await getConsolidatedReport({
          periodType,
          periodKey,
        });
        if (rep) setReport(rep);
      }
    } catch (err) {
      console.error('Report regeneration error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const formatDateRange = (start, end) => {
    if (!start || !end) return '';
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="dev-reports-page">
      {/* Editorial Header */}
      <header className="dev-reports-header">
        <div className="header-inner">
          <div className="report-badge">
            <Sparkles className="badge-sparkle-icon" />
            <span>AI Industry Intelligence Briefing</span>
          </div>

          <h1 className="header-title">US Healthcare Development Reports</h1>
          <p className="header-subtitle">
            A single, comprehensive executive briefing synthesizing major developments across the entire
            US healthcare industry into one unified narrative.
          </p>

          {/* Period Selection Controls */}
          <div className="period-control-bar">
            <div className="period-tabs">
              <button
                className={`period-tab-btn ${periodType === 'day' ? 'active' : ''}`}
                onClick={() => setPeriodType('day')}
              >
                <Clock className="tab-icon" />
                <span>Past 24 Hours</span>
              </button>

              <button
                className={`period-tab-btn ${periodType === 'week' ? 'active' : ''}`}
                onClick={() => setPeriodType('week')}
              >
                <Calendar className="tab-icon" />
                <span>Past Week</span>
              </button>

              <button
                className={`period-tab-btn ${periodType === 'month' ? 'active' : ''}`}
                onClick={() => setPeriodType('month')}
              >
                <BookmarkCheck className="tab-icon" />
                <span>Past Month</span>
              </button>
            </div>

            {/* Archive Selector for Monthly Reports */}
            {periodType === 'month' && monthlyArchives.length > 0 && (
              <div className="archive-selector-group">
                <label htmlFor="month-select" className="archive-label">
                  Historical Archive:
                </label>
                <select
                  id="month-select"
                  className="archive-dropdown"
                  value={selectedMonthKey}
                  onChange={(e) => setSelectedMonthKey(e.target.value)}
                >
                  {monthlyArchives.map((arch) => (
                    <option key={arch.period_key} value={arch.period_key}>
                      {arch.period_label || arch.period_key}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Consolidated Report Container */}
      <main className="report-wrapper">
        {loading ? (
          <div className="report-loading-skeleton">
            <div className="skeleton-title-bar" />
            <div className="skeleton-prose-block" />
            <div className="skeleton-prose-block" />
            <div className="skeleton-card-block" />
          </div>
        ) : error ? (
          <div className="report-error-box">
            <AlertCircle className="error-icon" />
            <h3>Unable to Load Healthcare Report</h3>
            <p>{error}</p>
            <button
              className="retry-btn"
              onClick={() => {
                setLoading(true);
                getConsolidatedReport({ periodType, periodKey: selectedMonthKey })
                  .then((res) => {
                    setReport(res.report);
                    setError(res.error);
                  })
                  .finally(() => setLoading(false));
              }}
            >
              Retry
            </button>
          </div>
        ) : !report ? (
          <div className="report-empty-box">
            <FileText className="empty-icon" />
            <h3>No Report Published for this Period</h3>
            <p>
              An executive briefing has not yet been generated for this timeframe. Click below to initiate
              the AI research and synthesis workflow.
            </p>
            <button className="primary-action-btn" onClick={handleRegenerate} disabled={generating}>
              {generating ? 'Synthesizing...' : 'Generate Consolidated Report'}
            </button>
          </div>
        ) : (
          <div className="editorial-article-container">
            {/* Report Metadata Ribbon */}
            <div className="report-meta-ribbon">
              <div className="meta-left">
                <span className="meta-period-badge">{report.period_label}</span>
                <span className="meta-dates">
                  {formatDateRange(report.start_date, report.end_date)}
                </span>
                <span className="meta-dot">•</span>
                <span className="meta-sources">{report.source_count} Primary Sources Analyzed</span>
              </div>

              <div className="meta-right">
                <span className="meta-model-tag">
                  <Sparkles className="sparkle-mini" />
                  {report.gemini_model || 'Gemini 2.0 Flash'}
                </span>
                <button
                  className={`regenerate-btn ${generating ? 'spinning' : ''}`}
                  onClick={handleRegenerate}
                  disabled={generating}
                  title="Regenerate this briefing using Gemini"
                >
                  <RefreshCw className="refresh-mini" />
                  <span>{generating ? 'Updating...' : 'Regenerate'}</span>
                </button>
              </div>
            </div>

            {/* Quick Navigation Anchor Bar */}
            <nav className="quick-jump-bar" aria-label="Report sections">
              <span className="jump-title">Jump to:</span>
              <button onClick={() => scrollToSection('sec-summary')}>Executive Summary</button>
              <button onClick={() => scrollToSection('sec-developments')}>Major Developments</button>
              <button onClick={() => scrollToSection('sec-staffing')}>Staffing Impact</button>
              <button onClick={() => scrollToSection('sec-takeaways')}>Key Takeaways</button>
              <button onClick={() => scrollToSection('sec-watch')}>What to Watch</button>
              <button onClick={() => scrollToSection('sec-references')}>Sources & Citations</button>
            </nav>

            {/* Consolidated Report Title */}
            <div className="report-heading-area">
              <h2 className="report-main-title">{report.report_title}</h2>
              <p className="report-dek">
                A synthesized briefing covering federal regulatory directives, hospital M&amp;A, clinical
                breakthroughs, and workforce compensation benchmarks across the United States.
              </p>
            </div>

            {/* SECTION A: Executive Summary */}
            <section className="editorial-section" id="sec-summary">
              <div className="section-label-row">
                <span className="section-step-num">A</span>
                <h3 className="section-heading">Executive Summary</h3>
              </div>
              <div className="executive-callout-box">
                <p className="executive-narrative">{report.executive_summary}</p>
              </div>
            </section>

            {/* SECTION B: Major Healthcare Developments (Narrative Flow) */}
            <section className="editorial-section" id="sec-developments">
              <div className="section-label-row">
                <span className="section-step-num">B</span>
                <h3 className="section-heading">Major Healthcare Developments</h3>
              </div>
              <p className="section-intro">
                The most significant industry events during this reporting period, synthesized across multiple
                authoritative sources and organized by core healthcare domain.
              </p>

              <div className="developments-narrative-flow">
                {report.major_developments && report.major_developments.length > 0 ? (
                  report.major_developments.map((dev, idx) => (
                    <article key={idx} className="narrative-development-block">
                      <div className="dev-topic-header">
                        <span className="topic-pill">{dev.topic || 'Policy & Operations'}</span>
                      </div>

                      <h4 className="dev-narrative-headline">{dev.headline}</h4>

                      <p className="dev-narrative-text">{dev.narrative}</p>

                      {/* In-text Citation Chips */}
                      {dev.citations && dev.citations.length > 0 && (
                        <div className="inline-citations-strip">
                          <span className="citation-lead">Sources:</span>
                          {dev.citations.map((c, cIdx) => (
                            <a
                              key={cIdx}
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="citation-chip"
                              title={c.title || c.publisher}
                            >
                              <span>{c.publisher || c.title || 'Official Source'}</span>
                              <ArrowUpRight className="chip-arrow" />
                            </a>
                          ))}
                        </div>
                      )}
                    </article>
                  ))
                ) : (
                  <p className="empty-subtext">No major developments recorded for this timeframe.</p>
                )}
              </div>
            </section>

            {/* SECTION C: Impact on Healthcare Staffing (Strategic Analysis) */}
            <section className="editorial-section" id="sec-staffing">
              <div className="section-label-row staffing-theme">
                <span className="section-step-num staffing">C</span>
                <h3 className="section-heading">Impact on Healthcare Staffing &amp; Workforce</h3>
              </div>

              <div className="staffing-editorial-card">
                <div className="staffing-header-bar">
                  <Users className="staffing-icon" />
                  <h4>Strategic Analysis for Healthcare Recruiters &amp; Talent Leaders</h4>
                </div>
                <div className="staffing-body-text">
                  {report.staffing_impact.split('\n').map((para, pIdx) => (
                    <p key={pIdx}>{para}</p>
                  ))}
                </div>
              </div>
            </section>

            {/* SECTION D: Key Takeaways */}
            <section className="editorial-section" id="sec-takeaways">
              <div className="section-label-row">
                <span className="section-step-num">D</span>
                <h3 className="section-heading">Key Takeaways</h3>
              </div>

              <div className="takeaways-box">
                <ul className="takeaways-bullet-list">
                  {report.key_takeaways && report.key_takeaways.length > 0 ? (
                    report.key_takeaways.map((item, idx) => (
                      <li key={idx} className="takeaway-bullet">
                        <CheckCircle2 className="bullet-icon" />
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li>No takeaways recorded.</li>
                  )}
                </ul>
              </div>
            </section>

            {/* SECTION E: What to Watch Next */}
            <section className="editorial-section" id="sec-watch">
              <div className="section-label-row">
                <span className="section-step-num">E</span>
                <h3 className="section-heading">What to Watch Next</h3>
              </div>
              <p className="section-intro">
                Confirmed upcoming regulatory deadlines, scheduled policy implementations, and industry milestones
                for the upcoming reporting cycle.
              </p>

              <div className="watch-items-timeline">
                {report.what_to_watch_next && report.what_to_watch_next.length > 0 ? (
                  report.what_to_watch_next.map((item, idx) => (
                    <div key={idx} className="watch-timeline-card">
                      <div className="watch-meta">
                        <span className="watch-type-tag">{item.type || 'Upcoming'}</span>
                        <span className="watch-deadline-date">{item.deadline}</span>
                      </div>
                      <p className="watch-description">{item.item}</p>
                    </div>
                  ))
                ) : (
                  <p className="empty-subtext">No upcoming deadlines logged.</p>
                )}
              </div>
            </section>

            {/* SECTION F: Sources & Primary References */}
            <section className="editorial-section" id="sec-references">
              <div className="section-label-row">
                <span className="section-step-num">F</span>
                <h3 className="section-heading">Sources &amp; Primary References</h3>
              </div>
              <p className="section-intro">
                All claims and data in this consolidated briefing are grounded strictly in the following published
                reporting and official federal documents:
              </p>

              <div className="references-list-table">
                {report.sources_and_references && report.sources_and_references.length > 0 ? (
                  report.sources_and_references.map((src, idx) => (
                    <div key={idx} className="reference-row">
                      <span className="ref-index">[{idx + 1}]</span>
                      <div className="ref-details">
                        <span className="ref-publisher">{src.publisher || 'Verified Source'}</span>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ref-title-link"
                        >
                          <span>{src.title || src.url}</span>
                          <ExternalLink className="ref-ext-icon" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-subtext">No specific citations listed.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
