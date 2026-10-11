import { useState } from 'react';
import './Newsletter.css';

/**
 * Newsletter signup block.
 * Presentation-layer form only — there is no delivery provider wired up yet,
 * so submitting gives an honest local confirmation instead of faking a send.
 */
export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <section className="newsletter" aria-labelledby="newsletter-heading">
      <div className="newsletter__copy">
        <p className="newsletter__eyebrow">The Daily Brief</p>
        <h2 className="newsletter__title" id="newsletter-heading">
          Subscribe now
        </h2>
        <p className="newsletter__text">
          One email each weekday morning: the US and Canadian healthcare developments that move
          hiring, staffing and pay — with the context recruiters actually need.
        </p>

        {submitted ? (
          <p className="newsletter__confirmation" role="status">
            Thanks — <strong>{email}</strong> is saved in this browser only. Delivery isn’t connected
            yet, so nothing has been sent to an inbox.
          </p>
        ) : (
          <form className="newsletter__form" onSubmit={handleSubmit} noValidate={false}>
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
              className="newsletter__input"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" className="newsletter__button">
              Subscribe
            </button>
          </form>
        )}
      </div>

      <div className="newsletter__art" aria-hidden="true">
        <img
          className="newsletter__art-mark"
          src="/rang-logo.webp"
          alt=""
          width="412"
          height="144"
          decoding="async"
        />
        <span className="newsletter__art-line" />
      </div>
    </section>
  );
}
