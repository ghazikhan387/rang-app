import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <img src="/rang-logo.webp" alt="Rang Healthcare" className="footer__logo" />
          <p className="footer__tagline">
            Healthcare news, clearly explained — with the context recruiters need.
          </p>
        </div>

        <div>
          <h3 className="footer__section-title">Navigation</h3>
          <div className="footer__links">
            <Link to="/" className="footer__link">News Feed</Link>
            <Link to="/about" className="footer__link">About & Methodology</Link>
          </div>
        </div>

        <div>
          <h3 className="footer__section-title">Coverage</h3>
          <div className="footer__links">
            <span className="footer__link">🇺🇸 United States</span>
            <span className="footer__link">🇨🇦 Canada</span>
          </div>
        </div>

        <div>
          <h3 className="footer__section-title">Information</h3>
          <div className="footer__links">
            <Link to="/about" className="footer__link">How It Works</Link>
            <Link to="/about" className="footer__link">Source Policy</Link>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <p className="footer__copyright">
          © {year} Rang Healthcare. All rights reserved.
        </p>
        <p className="footer__disclaimer">
          Summaries are AI-generated from public sources and may not reflect all aspects of a story. Always verify important details with original sources.
        </p>
      </div>
    </footer>
  );
}
