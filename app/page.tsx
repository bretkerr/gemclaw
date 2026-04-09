"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export default function Landing() {
  const [revealed, setRevealed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [glitch, setGlitch] = useState(false);

  const handleMouse = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [handleMouse]);

  // Random glitch every 4-7 seconds
  useEffect(() => {
    const scheduleGlitch = () => {
      const delay = 4000 + Math.random() * 3000;
      return setTimeout(() => {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 200);
        timerRef = scheduleGlitch();
      }, delay);
    };
    let timerRef = scheduleGlitch();
    return () => clearTimeout(timerRef);
  }, []);

  return (
    <>
      {/* ── PHASE 1: Velvet Rope ─────────────────────────────────────── */}
      {!revealed && (
        <div
          className="velvet"
          onClick={() => setRevealed(true)}
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,8,0,0.06), transparent 40%), #000`,
          }}
        >
          <div className="scanlines" />

          {/* Animated claw + gem SVG */}
          <div className="claw-scene">
            <svg viewBox="0 0 200 200" className="claw-svg" xmlns="http://www.w3.org/2000/svg">
              {/* Left claw arm */}
              <g className="claw-left">
                <path d="M30 40 L70 90 L60 95 L20 50 Z" fill="#333" stroke="#555" strokeWidth="1" />
                <path d="M70 90 L80 110 L65 108 L60 95 Z" fill="#444" stroke="#666" strokeWidth="0.5" />
              </g>
              {/* Right claw arm */}
              <g className="claw-right">
                <path d="M170 40 L130 90 L140 95 L180 50 Z" fill="#333" stroke="#555" strokeWidth="1" />
                <path d="M130 90 L120 110 L135 108 L140 95 Z" fill="#444" stroke="#666" strokeWidth="0.5" />
              </g>
              {/* Gem */}
              <g className="gem">
                <polygon points="100,85 115,100 108,120 92,120 85,100" fill="none" stroke="#FF0800" strokeWidth="1.5" opacity="0.8" />
                <polygon points="100,85 115,100 100,105 85,100" fill="rgba(255,8,0,0.1)" />
                <line x1="100" y1="85" x2="100" y2="105" stroke="#FF0800" strokeWidth="0.5" opacity="0.4" />
                <line x1="85" y1="100" x2="115" y2="100" stroke="#FF0800" strokeWidth="0.5" opacity="0.4" />
              </g>
              {/* Sparks */}
              <circle className="spark s1" cx="95" cy="95" r="1.5" fill="#FF0800" />
              <circle className="spark s2" cx="108" cy="92" r="1" fill="#FF0800" />
              <circle className="spark s3" cx="88" cy="105" r="1.2" fill="#FF0800" />
              <circle className="spark s4" cx="115" cy="98" r="0.8" fill="#FF0800" />
              <circle className="spark s5" cx="100" cy="88" r="1" fill="#FF0800" />
              <circle className="spark s6" cx="82" cy="96" r="0.7" fill="#FF0800" />
            </svg>
          </div>

          <h1 className={`velvet-title ${glitch ? "glitching" : ""}`}>
            GEMCLAW
          </h1>

          <button className="velvet-btn">
            Do not click
          </button>
        </div>
      )}

      {/* ── PHASE 2: Revealed ────────────────────────────────────────── */}
      {revealed && (
        <div className="revealed">
          {/* Hero */}
          <section className="hero">
            <p className="overline">Mixture of Experts &mdash; Deep Research Protocol</p>
            <h1 className="hero-title">The apex predator of cross-model research synthesis</h1>
            <p className="hero-body">
              GemClaw orchestrates autonomous research dialogues between Anthropic Claude and Google Gemini.
              Two frontier models. One extraction engine. Claude decomposes and critiques. Gemini explores and gathers.
              The MoE synthesis layer fuses both perspectives into research output that neither model produces alone.
            </p>
            <div className="stats-row">
              <div className="stat">
                <span className="stat-num">+33%</span>
                <span className="stat-label">info gain</span>
              </div>
              <div className="stat">
                <span className="stat-num">2x</span>
                <span className="stat-label">models</span>
              </div>
              <div className="stat">
                <span className="stat-num">$1.50</span>
                <span className="stat-label">domain cost</span>
              </div>
            </div>
            <Link href="/research" className="cta-btn">
              Enter the research engine
            </Link>
          </section>

          {/* Manifesto */}
          <section className="manifesto">
            <p>
              The internet is a sandbox of soft edges and infinite scrolling.
              We are the end of the scroll. We don&apos;t nudge. We don&apos;t suggest. We extract.
              The gem is the value; the claw is how we take it.
              You bought the cheapest real estate on the web.
              We are building a fortress on it.
            </p>
          </section>

          {/* Architecture grid */}
          <section className="arch-section">
            <div className="arch-grid">
              <div className="arch-card">
                <span className="arch-num">01</span>
                <h3>Decompose</h3>
                <p>Claude Sonnet 4 breaks your topic into focused sub-questions optimized for parallel extraction.</p>
              </div>
              <div className="arch-card">
                <span className="arch-num">02</span>
                <h3>Extract</h3>
                <p>Gemini 2.5 Flash gathers data, evidence, and reasoning across each sub-question independently.</p>
              </div>
              <div className="arch-card">
                <span className="arch-num">03</span>
                <h3>Synthesize</h3>
                <p>Depth-first analysis merges perspectives, resolves contradictions, and surfaces blind spots.</p>
              </div>
              <div className="arch-card">
                <span className="arch-num">04</span>
                <h3>Converge</h3>
                <p>.sgt entropy scoring produces a final research report with cross-model confidence weighting.</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="landing-footer">
            <div className="footer-brand">GEMCLAW.CLICK</div>
            <div className="footer-links">
              <a href="https://contextjamming.substack.com" target="_blank" rel="noopener noreferrer">Context Jamming</a>
              <a href="https://signalgraph.com" target="_blank" rel="noopener noreferrer">SignalGraph</a>
              <a href="https://founderfile.ai" target="_blank" rel="noopener noreferrer">FounderFile</a>
            </div>
            <div className="footer-copy">&copy; 2026 ACRA Insight LLC</div>
          </footer>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #000; color: #E5E4E2; font-family: "Space Mono", monospace; -webkit-font-smoothing: antialiased; }
        a { color: inherit; }
      `}</style>

      <style jsx>{`
        /* ── Phase 1: Velvet Rope ──────────────────────────────────────── */
        .velvet {
          position: fixed; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center; cursor: pointer;
          z-index: 100; overflow: hidden;
        }
        .scanlines {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.015) 2px,
            rgba(255,255,255,0.015) 4px
          );
        }

        /* Claw animation */
        .claw-scene { position: relative; z-index: 2; width: 180px; height: 180px; margin-bottom: 1.5rem; }
        .claw-svg { width: 100%; height: 100%; }

        .claw-left {
          transform-origin: 50px 65px;
          animation: clawCloseL 3s ease-in-out infinite;
        }
        .claw-right {
          transform-origin: 150px 65px;
          animation: clawCloseR 3s ease-in-out infinite;
        }
        .gem {
          transform-origin: 100px 103px;
          animation: gemShake 3s ease-in-out infinite;
        }

        @keyframes clawCloseL {
          0%, 100% { transform: rotate(0deg); }
          35%, 65% { transform: rotate(12deg); }
        }
        @keyframes clawCloseR {
          0%, 100% { transform: rotate(0deg); }
          35%, 65% { transform: rotate(-12deg); }
        }
        @keyframes gemShake {
          0%, 30%, 70%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-2px, 1px) scale(0.97); }
          45% { transform: translate(3px, -1px) scale(0.97); }
          50% { transform: translate(-1px, 2px) scale(0.96); }
          55% { transform: translate(2px, 0px) scale(0.97); }
          60% { transform: translate(0, 0) scale(1); }
        }

        .spark {
          opacity: 0;
          animation: sparkFly 3s ease-in-out infinite;
        }
        .s1 { animation-delay: 0s; }
        .s2 { animation-delay: 0.08s; }
        .s3 { animation-delay: 0.15s; }
        .s4 { animation-delay: 0.05s; }
        .s5 { animation-delay: 0.12s; }
        .s6 { animation-delay: 0.1s; }

        @keyframes sparkFly {
          0%, 30% { opacity: 0; transform: translate(0, 0) scale(1); }
          40% { opacity: 1; transform: translate(0, 0) scale(1.5); }
          55% { opacity: 0.8; transform: translate(var(--sx, -8px), var(--sy, -12px)) scale(0.5); }
          65%, 100% { opacity: 0; transform: translate(var(--sx, -8px), var(--sy, -18px)) scale(0); }
        }
        .spark.s1 { --sx: -12px; --sy: -15px; }
        .spark.s2 { --sx: 10px; --sy: -18px; }
        .spark.s3 { --sx: -15px; --sy: 8px; }
        .spark.s4 { --sx: 18px; --sy: -10px; }
        .spark.s5 { --sx: 2px; --sy: -20px; }
        .spark.s6 { --sx: -20px; --sy: -5px; }

        /* Title + glitch */
        .velvet-title {
          font-family: "Bebas Neue", sans-serif;
          font-size: 5rem;
          letter-spacing: 0.15em;
          color: #E5E4E2;
          position: relative;
          z-index: 2;
          line-height: 1;
          margin-bottom: 2.5rem;
        }
        .velvet-title.glitching {
          animation: glitchText 0.2s steps(2) forwards;
        }
        @keyframes glitchText {
          0% { text-shadow: 2px 0 #FF0800, -2px 0 #3b82f6; transform: translate(0); }
          25% { text-shadow: -2px 0 #FF0800, 2px 0 #3b82f6; transform: translate(2px, -1px); }
          50% { text-shadow: 1px 2px #FF0800, -1px -2px #3b82f6; transform: translate(-1px, 2px); }
          75% { text-shadow: -1px -1px #FF0800, 1px 1px #3b82f6; transform: translate(1px, 0); }
          100% { text-shadow: none; transform: translate(0); }
        }

        .velvet-btn {
          position: relative; z-index: 2;
          background: transparent;
          border: 1px solid #FF0800;
          color: #FF0800;
          font-family: "Space Mono", monospace;
          font-size: 0.8rem;
          padding: 0.7rem 2rem;
          cursor: pointer;
          letter-spacing: 0.06em;
          transition: background 0.2s, color 0.2s;
        }
        .velvet-btn:hover {
          background: #FF0800;
          color: #000;
        }

        /* ── Phase 2: Revealed ─────────────────────────────────────────── */
        .revealed {
          animation: revealIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes revealIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        /* Hero */
        .hero {
          max-width: 720px;
          margin: 0 auto;
          padding: 6rem 1.5rem 4rem;
          text-align: center;
        }
        .overline {
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #FF0800;
          margin-bottom: 1.5rem;
        }
        .hero-title {
          font-family: "Bebas Neue", sans-serif;
          font-size: 3rem;
          line-height: 1.05;
          letter-spacing: 0.03em;
          margin-bottom: 1.5rem;
          color: #E5E4E2;
        }
        .hero-body {
          font-size: 0.82rem;
          line-height: 1.75;
          color: #888;
          margin-bottom: 2.5rem;
          max-width: 560px;
          margin-left: auto;
          margin-right: auto;
        }
        .stats-row {
          display: flex;
          justify-content: center;
          gap: 3rem;
          margin-bottom: 2.5rem;
        }
        .stat { display: flex; flex-direction: column; align-items: center; }
        .stat-num {
          font-family: "Bebas Neue", sans-serif;
          font-size: 2rem;
          color: #FF0800;
          line-height: 1;
        }
        .stat-label {
          font-size: 0.65rem;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 0.25rem;
        }
        .cta-btn {
          display: inline-block;
          background: transparent;
          border: 1px solid #FF0800;
          color: #FF0800;
          font-family: "Space Mono", monospace;
          font-size: 0.78rem;
          padding: 0.75rem 2rem;
          text-decoration: none;
          letter-spacing: 0.04em;
          transition: background 0.2s, color 0.2s;
        }
        .cta-btn:hover {
          background: #FF0800;
          color: #000;
        }

        /* Manifesto */
        .manifesto {
          max-width: 640px;
          margin: 0 auto;
          padding: 4rem 1.5rem;
          border-top: 1px solid #111;
          border-bottom: 1px solid #111;
        }
        .manifesto p {
          font-size: 0.85rem;
          line-height: 1.9;
          color: #999;
          text-align: center;
          font-style: italic;
        }

        /* Architecture */
        .arch-section {
          max-width: 800px;
          margin: 0 auto;
          padding: 4rem 1.5rem;
        }
        .arch-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: #111;
          border: 1px solid #111;
        }
        .arch-card {
          background: #000;
          padding: 2rem 1.5rem;
        }
        .arch-num {
          font-family: "Bebas Neue", sans-serif;
          font-size: 1.5rem;
          color: #FF0800;
          display: block;
          margin-bottom: 0.5rem;
        }
        .arch-card h3 {
          font-family: "Bebas Neue", sans-serif;
          font-size: 1.4rem;
          letter-spacing: 0.04em;
          margin-bottom: 0.5rem;
          color: #E5E4E2;
        }
        .arch-card p {
          font-size: 0.75rem;
          line-height: 1.65;
          color: #666;
        }

        /* Footer */
        .landing-footer {
          max-width: 800px;
          margin: 0 auto;
          padding: 3rem 1.5rem 2rem;
          text-align: center;
          border-top: 1px solid #111;
        }
        .footer-brand {
          font-family: "Bebas Neue", sans-serif;
          font-size: 1.3rem;
          letter-spacing: 0.12em;
          color: #E5E4E2;
          margin-bottom: 1rem;
        }
        .footer-links {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 1.5rem;
        }
        .footer-links a {
          font-size: 0.7rem;
          color: #555;
          text-decoration: none;
          letter-spacing: 0.04em;
          transition: color 0.15s;
        }
        .footer-links a:hover { color: #FF0800; }
        .footer-copy {
          font-size: 0.6rem;
          color: #333;
          letter-spacing: 0.06em;
        }

        @media (max-width: 600px) {
          .velvet-title { font-size: 3rem; }
          .hero-title { font-size: 2rem; }
          .stats-row { gap: 1.5rem; }
          .arch-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
