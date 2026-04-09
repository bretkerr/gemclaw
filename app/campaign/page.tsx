"use client";

import { useState, FormEvent } from "react";

export default function CampaignPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/campaign/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          message,
          source: "x-campaign",
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      console.log("[Campaign] Lead response:", data);
      if (!res.ok) throw new Error(data.error || "Failed");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── 1. HERO ────────────────────────────────────────────────────── */}
      <section className="hero">
        <img src="/hero.jpg" alt="" className="hero-bg" />
        <div className="hero-content">
          <h1 className="hero-title">SECURE THE HUMAN SIGNAL</h1>
          <p className="hero-sub">Cross-model intelligence extraction</p>
          <p className="hero-sub2">Claude &times; Gemini Mixture of Experts deep research protocol</p>
        </div>
      </section>

      {/* ── 2. WHAT IS THIS ────────────────────────────────────────────── */}
      <section className="what">
        <div className="what-grid">
          <div className="what-card">
            <span className="what-num">01</span>
            <h3>DECOMPOSE + EXTRACT</h3>
            <p>Claude breaks your topic into sub-questions. Gemini gathers data across each one independently.</p>
          </div>
          <div className="what-card">
            <span className="what-num">02</span>
            <h3>SYNTHESIZE + CRITIQUE</h3>
            <p>Claude identifies the narrative, surfaces contradictions, flags gaps. Gemini fills them in the next round.</p>
          </div>
          <div className="what-card">
            <span className="what-num">03</span>
            <h3>CONVERGE + EMIT</h3>
            <p>Multiple rounds produce a final research synthesis. Output is entropy-scored and publication-ready.</p>
          </div>
        </div>
      </section>

      {/* ── 3. THE PROOF ───────────────────────────────────────────────── */}
      <section className="proof">
        <div className="proof-grid">
          <div className="proof-card">
            <span className="proof-num">+33%</span>
            <span className="proof-label">information gain over single model</span>
          </div>
          <div className="proof-card">
            <span className="proof-num">2x</span>
            <span className="proof-label">frontier models in autonomous dialogue</span>
          </div>
          <div className="proof-card">
            <span className="proof-num">142s</span>
            <span className="proof-label">average deep research session</span>
          </div>
        </div>
      </section>

      {/* ── 4. TRY IT ──────────────────────────────────────────────────── */}
      <section className="try-it">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="lead-form">
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
            <textarea
              placeholder="What would you research first?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              disabled={submitting}
            />
            {error && <p className="form-error">{error}</p>}
            <button type="submit" disabled={submitting || !email.trim()}>
              {submitting ? "Transmitting..." : "Request Access"}
            </button>
          </form>
        ) : (
          <div className="confirmation">
            <p className="conf-title">SIGNAL RECEIVED</p>
            <p className="conf-body">We&apos;ll be in touch.</p>
          </div>
        )}
      </section>

      {/* ── 5. LOOM EMBED ──────────────────────────────────────────────── */}
      <section className="loom">
        <div className="loom-box">
          <div className="loom-play" />
          <p className="loom-title">THE SIGNAL AND THE CLAW</p>
          <p className="loom-sub">Video dropping soon</p>
        </div>
      </section>

      {/* ── 6. FOOTER ──────────────────────────────────────────────────── */}
      <footer className="camp-footer">
        <p className="footer-brand">GemClaw.click &mdash; secure the human signal</p>
        <div className="footer-links">
          <a href="/research">Research Engine</a>
          <a href="https://contextjamming.substack.com" target="_blank" rel="noopener noreferrer">Context Jamming</a>
          <a href="https://acrainsightllc.cloud" target="_blank" rel="noopener noreferrer">ACRA Insight</a>
        </div>
        <p className="footer-copy">&copy; 2026 ACRA Insight LLC</p>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #000; color: #E5E4E2; font-family: "Space Mono", monospace; -webkit-font-smoothing: antialiased; }
      `}</style>

      <style jsx>{`
        /* ── Hero ──────────────────────────────────────────────────────── */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          opacity: 0.15;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
          pointer-events: none;
        }
        .hero-content {
          position: relative; z-index: 1;
          text-align: center;
          padding: 2rem;
        }
        .hero-title {
          font-family: "Bebas Neue", sans-serif;
          font-size: clamp(28px, 5vw, 48px);
          color: #FF0800;
          letter-spacing: 0.08em;
          line-height: 1.1;
          margin-bottom: 1rem;
        }
        .hero-sub {
          font-size: 14px;
          color: #E5E4E2;
          margin-bottom: 0.5rem;
          letter-spacing: 0.02em;
        }
        .hero-sub2 {
          font-size: 12px;
          color: #666;
          letter-spacing: 0.03em;
        }

        /* ── What Is This ──────────────────────────────────────────────── */
        .what {
          padding: 4rem 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }
        .what-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: #111;
          border: 1px solid #111;
        }
        .what-card {
          background: #000;
          padding: 2rem 1.5rem;
        }
        .what-num {
          font-family: "Bebas Neue", sans-serif;
          font-size: 1.5rem;
          color: #FF0800;
          display: block;
          margin-bottom: 0.75rem;
        }
        .what-card h3 {
          font-family: "Bebas Neue", sans-serif;
          font-size: 1.15rem;
          letter-spacing: 0.04em;
          color: #E5E4E2;
          margin-bottom: 0.6rem;
        }
        .what-card p {
          font-size: 0.72rem;
          line-height: 1.7;
          color: #666;
        }

        /* ── Proof ─────────────────────────────────────────────────────── */
        .proof {
          padding: 3rem 1.5rem;
          max-width: 900px;
          margin: 0 auto;
          border-top: 1px solid #111;
        }
        .proof-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        .proof-card {
          text-align: center;
        }
        .proof-num {
          font-family: "Bebas Neue", sans-serif;
          font-size: 2.5rem;
          color: #FF0800;
          display: block;
          line-height: 1;
          margin-bottom: 0.4rem;
        }
        .proof-label {
          font-size: 0.68rem;
          color: #666;
          line-height: 1.5;
          letter-spacing: 0.02em;
        }

        /* ── Try It ────────────────────────────────────────────────────── */
        .try-it {
          padding: 4rem 1.5rem;
          max-width: 500px;
          margin: 0 auto;
          border-top: 1px solid #111;
        }
        .lead-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .lead-form input,
        .lead-form textarea {
          width: 100%;
          padding: 0.7rem 0.9rem;
          background: #000;
          border: 1px solid #222;
          border-radius: 0;
          color: #E5E4E2;
          font-family: "Space Mono", monospace;
          font-size: 0.8rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .lead-form input:focus,
        .lead-form textarea:focus {
          border-color: #FF0800;
        }
        .lead-form textarea {
          resize: vertical;
          min-height: 70px;
        }
        .lead-form button {
          background: transparent;
          border: 1px solid #FF0800;
          color: #FF0800;
          font-family: "Space Mono", monospace;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 0.7rem 1.5rem;
          cursor: pointer;
          letter-spacing: 0.04em;
          transition: background 0.2s, color 0.2s;
        }
        .lead-form button:hover:not(:disabled) {
          background: #FF0800;
          color: #000;
        }
        .lead-form button:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .form-error {
          font-size: 0.72rem;
          color: #FF0800;
        }
        .confirmation {
          text-align: center;
          padding: 2rem 0;
        }
        .conf-title {
          font-family: "Bebas Neue", sans-serif;
          font-size: 1.5rem;
          color: #FF0800;
          letter-spacing: 0.08em;
          margin-bottom: 0.5rem;
        }
        .conf-body {
          font-size: 0.8rem;
          color: #666;
        }

        /* ── Loom ──────────────────────────────────────────────────────── */
        .loom {
          padding: 4rem 1.5rem;
          max-width: 700px;
          margin: 0 auto;
          border-top: 1px solid #111;
        }
        .loom-box {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 */
          background: #000;
          border: 1px solid #FF0800;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .loom-play {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -65%);
          width: 0;
          height: 0;
          border-left: 24px solid #FF0800;
          border-top: 14px solid transparent;
          border-bottom: 14px solid transparent;
          opacity: 0.6;
        }
        .loom-title {
          position: absolute;
          bottom: 2.5rem;
          left: 0; right: 0;
          text-align: center;
          font-family: "Bebas Neue", sans-serif;
          font-size: 1rem;
          color: #E5E4E2;
          letter-spacing: 0.1em;
        }
        .loom-sub {
          position: absolute;
          bottom: 1.2rem;
          left: 0; right: 0;
          text-align: center;
          font-size: 0.65rem;
          color: #444;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* ── Footer ────────────────────────────────────────────────────── */
        .camp-footer {
          padding: 3rem 1.5rem 2rem;
          text-align: center;
          border-top: 1px solid #111;
          max-width: 700px;
          margin: 0 auto;
        }
        .footer-brand {
          font-size: 0.75rem;
          color: #555;
          letter-spacing: 0.06em;
          margin-bottom: 1rem;
        }
        .footer-links {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 1.2rem;
        }
        .footer-links a {
          font-size: 0.68rem;
          color: #444;
          text-decoration: none;
          letter-spacing: 0.04em;
          transition: color 0.15s;
        }
        .footer-links a:hover { color: #FF0800; }
        .footer-copy {
          font-size: 0.58rem;
          color: #333;
          letter-spacing: 0.06em;
        }

        /* ── Mobile ────────────────────────────────────────────────────── */
        @media (max-width: 600px) {
          .what-grid { grid-template-columns: 1fr; }
          .proof-grid { grid-template-columns: 1fr; gap: 1.5rem; }
          .footer-links { flex-direction: column; gap: 0.75rem; }
        }
      `}</style>
    </>
  );
}
