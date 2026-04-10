"use client";

import { useState, useEffect, useRef } from "react";

interface SubQuestion { id: number; question: string; }
interface RoundResult { round: number; subQuestionId: number; question: string; geminiAnswer: string; claudeReview: string; synthesized: string; }
interface ResearchSession { id: string; topic: string; depth: string; status: string; subQuestions: SubQuestion[]; rounds: RoundResult[]; currentRound: number; totalRounds: number; finalSynthesis: string | null; }
interface SleepMemory { round: number; keyFindings: string[]; contradictions: string[]; gaps: string[]; consolidatedInsight: string; coherenceScore: number; noveltyScore: number; entropyDelta: number; }
interface SleepMetrics { rounds: number[]; coherence: number[]; novelty: number[]; entropy: number[]; bindingStrength: number; }

async function api<T>(url: string, body: object): Promise<T> {
  console.log(`[MoE] POST ${url}`, body);
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const raw = await res.json();
  console.log(`[MoE] ${url} response:`, raw);
  if (!res.ok) throw new Error(raw.error || `API error ${res.status}`);
  return raw as T;
}

// ─── SVG Chart Component ─────────────────────────────────────────────────────

function SleepChart({ metrics, memories }: { metrics: SleepMetrics; memories: SleepMemory[] }) {
  const [hoveredRound, setHoveredRound] = useState<number | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  if (!metrics || metrics.rounds.length === 0) return null;

  const W = 280;
  const H = 180;
  const PAD = { top: 20, right: 15, bottom: 30, left: 35 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const n = metrics.rounds.length;
  const xStep = n > 1 ? plotW / (n - 1) : plotW / 2;

  const toX = (i: number) => PAD.left + (n > 1 ? i * xStep : plotW / 2);
  const toY = (v: number) => PAD.top + plotH - v * plotH;

  const makePath = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(Math.max(0, Math.min(1, v))).toFixed(1)}`).join(" ");

  const coherencePath = makePath(metrics.coherence);
  const noveltyPath = makePath(metrics.novelty);
  const entropyPath = makePath(metrics.entropy.map((e) => Math.max(0, Math.min(1, (e + 0.5)))));

  const active = selectedRound ?? hoveredRound;
  const activeMem = active !== null ? memories.find((m) => m.round === active) : null;

  return (
    <div className="sleep-panel">
      <div className="sleep-header">
        <span className="sleep-icon">&#x263E;</span>
        <span>SLEEP CONSOLIDATION</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="sleep-svg">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)} stroke="#1a1a2a" strokeWidth="0.5" />
            <text x={PAD.left - 4} y={toY(v) + 3} textAnchor="end" fill="#444" fontSize="7">{v.toFixed(1)}</text>
          </g>
        ))}

        {/* X axis labels */}
        {metrics.rounds.map((r, i) => (
          <text key={r} x={toX(i)} y={H - 8} textAnchor="middle" fill="#555" fontSize="7">R{r}</text>
        ))}

        {/* Lines */}
        <path d={coherencePath} fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.9" />
        <path d={noveltyPath} fill="none" stroke="#FF0800" strokeWidth="1.5" opacity="0.7" />
        <path d={entropyPath} fill="none" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.6" strokeDasharray="3,2" />

        {/* Data points + hover zones */}
        {metrics.rounds.map((r, i) => (
          <g key={r}>
            <circle cx={toX(i)} cy={toY(metrics.coherence[i])} r={active === r ? 4 : 2.5} fill="#22d3ee" opacity={active === r ? 1 : 0.8} />
            <circle cx={toX(i)} cy={toY(metrics.novelty[i])} r={active === r ? 4 : 2.5} fill="#FF0800" opacity={active === r ? 1 : 0.7} />
            <circle cx={toX(i)} cy={toY(Math.max(0, Math.min(1, metrics.entropy[i] + 0.5)))} r={active === r ? 3 : 2} fill="#8b5cf6" opacity={active === r ? 1 : 0.6} />
            {/* Invisible hover target */}
            <rect
              x={toX(i) - xStep / 2}
              y={PAD.top}
              width={xStep}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHoveredRound(r)}
              onMouseLeave={() => setHoveredRound(null)}
              onClick={() => setSelectedRound(selectedRound === r ? null : r)}
              style={{ cursor: "pointer" }}
            />
            {/* Active indicator line */}
            {active === r && (
              <line x1={toX(i)} y1={PAD.top} x2={toX(i)} y2={PAD.top + plotH} stroke="#22d3ee" strokeWidth="0.5" opacity="0.3" />
            )}
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="sleep-legend">
        <span className="sl-item"><span className="sl-dot" style={{ background: "#22d3ee" }} />Coherence</span>
        <span className="sl-item"><span className="sl-dot" style={{ background: "#FF0800" }} />Novelty</span>
        <span className="sl-item"><span className="sl-dot" style={{ background: "#8b5cf6" }} />Entropy</span>
      </div>

      {/* Binding strength */}
      <div className="sleep-binding">
        <span className="sb-label">BINDING STRENGTH</span>
        <div className="sb-bar-track">
          <div className="sb-bar-fill" style={{ width: `${metrics.bindingStrength * 100}%` }} />
        </div>
        <span className="sb-value">{(metrics.bindingStrength * 100).toFixed(0)}%</span>
      </div>

      {/* Round detail on hover/click */}
      {activeMem && (
        <div className="sleep-detail">
          <div className="sd-title">Round {activeMem.round} Consolidation</div>
          <p className="sd-insight">{activeMem.consolidatedInsight}</p>
          {activeMem.keyFindings.length > 0 && (
            <div className="sd-section">
              <span className="sd-label">Key Findings</span>
              <ul>{activeMem.keyFindings.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </div>
          )}
          {activeMem.contradictions.length > 0 && (
            <div className="sd-section">
              <span className="sd-label sd-contra">Contradictions</span>
              <ul>{activeMem.contradictions.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          )}
          {activeMem.gaps.length > 0 && (
            <div className="sd-section">
              <span className="sd-label sd-gaps">Gaps</span>
              <ul>{activeMem.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </div>
          )}
          <div className="sd-scores">
            <span>Coherence: {activeMem.coherenceScore.toFixed(2)}</span>
            <span>Novelty: {activeMem.noveltyScore.toFixed(2)}</span>
            <span>Entropy &Delta;: {activeMem.entropyDelta.toFixed(4)}</span>
          </div>
        </div>
      )}

      <div className="sleep-cite">
        &ldquo;LLMs need sleep to bind lessons learned&rdquo;<br />
        <span>&mdash; Sir Demis Hassabis, DeepMind</span>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ResearchPage() {
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<"quick" | "standard" | "deep">("standard");
  const [sleepEnabled, setSleepEnabled] = useState(true);
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [loadingPhase, setLoadingPhase] = useState<"" | "gemini" | "claude" | "sleep">("");
  const [error, setError] = useState<string | null>(null);
  const [sleepMemories, setSleepMemories] = useState<SleepMemory[]>([]);
  const [sleepMetrics, setSleepMetrics] = useState<SleepMetrics | null>(null);

  const startResearch = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setError(null);
    setSession(null);
    setSleepMemories([]);
    setSleepMetrics(null);
    setLoadingMsg("Claude is decomposing your topic into sub-questions...");
    setLoadingPhase("claude");
    try {
      const newSession = await api<ResearchSession>("/api/research", { topic, depth });
      setSession(newSession);
      setLoadingMsg("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start research");
    } finally {
      setLoading(false);
      setLoadingPhase("");
    }
  };

  const runNextRound = async () => {
    if (!session || loading) return;
    setLoading(true);
    setError(null);
    const roundNum = session.currentRound + 1;
    try {
      setLoadingMsg(`Round ${roundNum}/${session.totalRounds} — Gemini gathering data...`);
      setLoadingPhase("gemini");
      const data = await api<{ result: RoundResult; session: ResearchSession }>("/api/research/rounds", { sessionId: session.id });
      setSession(data.session);

      // Sleep consolidation
      if (sleepEnabled) {
        setLoadingMsg(`Round ${roundNum} — Sleep consolidation...`);
        setLoadingPhase("sleep");
        const memory = await api<SleepMemory>("/api/research/sleep", {
          sessionId: session.id,
          roundResult: data.result.synthesized,
        });
        setSleepMemories((prev) => [...prev, memory]);

        // Fetch updated metrics
        const metricsRes = await fetch(`/api/research/sleep?sessionId=${session.id}`);
        if (metricsRes.ok) {
          const m = await metricsRes.json();
          console.log("[MoE] Sleep metrics:", m);
          setSleepMetrics(m);
        }
      }

      setLoadingMsg("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Round failed");
    } finally {
      setLoading(false);
      setLoadingPhase("");
    }
  };

  const runAllRounds = async () => {
    if (!session || loading) return;
    setLoading(true);
    setError(null);
    const remaining = session.totalRounds - session.currentRound;
    let current = session;
    try {
      for (let i = 0; i < remaining; i++) {
        const roundNum = current.currentRound + 1;
        setLoadingMsg(`Round ${roundNum}/${current.totalRounds} — Gemini gathering data...`);
        setLoadingPhase("gemini");
        const data = await api<{ result: RoundResult; session: ResearchSession }>("/api/research/rounds", { sessionId: session.id });
        current = data.session;
        setSession(current);

        if (sleepEnabled) {
          setLoadingMsg(`Round ${roundNum} — Sleep consolidation...`);
          setLoadingPhase("sleep");
          const memory = await api<SleepMemory>("/api/research/sleep", {
            sessionId: session.id,
            roundResult: data.result.synthesized,
          });
          setSleepMemories((prev) => [...prev, memory]);

          const metricsRes = await fetch(`/api/research/sleep?sessionId=${session.id}`);
          if (metricsRes.ok) {
            const m = await metricsRes.json();
            setSleepMetrics(m);
          }
        }
      }
      setLoadingMsg("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Round failed");
    } finally {
      setLoading(false);
      setLoadingPhase("");
    }
  };

  const runSynthesize = async () => {
    if (!session || loading) return;
    setLoading(true);
    setError(null);
    setLoadingMsg("Claude synthesizing final research report...");
    setLoadingPhase("claude");
    try {
      const data = await api<{ session: ResearchSession }>("/api/research/synthesize", { sessionId: session.id });
      setSession(data.session);
      setLoadingMsg("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Synthesis failed");
    } finally {
      setLoading(false);
      setLoadingPhase("");
    }
  };

  const hasRoundsLeft = session !== null && session.currentRound < session.totalRounds;

  return (
    <>
      <div className="r-layout">
        {/* ── Main column ──────────────────────────────────────────────── */}
        <div className="r-main">
          <header className="r-header">
            <a href="/" className="r-back">&larr; GEMCLAW</a>
            <h1>
              Deep Research{" "}
              <span className="r-claude">Claude</span>
              <span className="r-x"> x </span>
              <span className="r-gemini">Gemini</span>
            </h1>
            <p>Cross-model Mixture of Experts research engine</p>
          </header>

          <div className="r-form">
            <input
              type="text"
              placeholder="Enter a research topic..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startResearch()}
              disabled={loading}
            />
            <div className="r-form-row">
              <select value={depth} onChange={(e) => setDepth(e.target.value as "quick" | "standard" | "deep")} disabled={loading}>
                <option value="quick">Quick (3)</option>
                <option value="standard">Standard (5)</option>
                <option value="deep">Deep (8)</option>
              </select>
              <label className="r-sleep-toggle">
                <input type="checkbox" checked={sleepEnabled} onChange={(e) => setSleepEnabled(e.target.checked)} disabled={loading} />
                <span className="r-sleep-label">Sleep</span>
              </label>
              <button className="r-btn r-btn-start" onClick={startResearch} disabled={loading || !topic.trim()}>
                Start Research
              </button>
            </div>
          </div>

          {error && (
            <div className="r-error">
              <span>{error}</span>
              <button onClick={() => setError(null)}>&times;</button>
            </div>
          )}

          {loading && loadingMsg && (
            <div className="r-loading">
              <span className={`r-spinner ${loadingPhase}`} />
              <span>{loadingMsg}</span>
            </div>
          )}

          {session && (
            <>
              <div className="r-status">
                <div><span className="r-sl">Session</span> {session.id.slice(0, 8)}</div>
                <div><span className="r-sl">Depth</span> {session.depth}</div>
                <div><span className="r-sl">Rounds</span> {session.currentRound}/{session.totalRounds}</div>
                <div><span className="r-sl">Status</span> <span className={`r-sv-${session.status}`}>{session.status}</span></div>
                {sleepEnabled && <div><span className="r-sl">Sleep</span> <span className="r-sv-sleep">ON</span></div>}
              </div>

              <div className="r-progress"><div className="r-progress-fill" style={{ width: `${(session.currentRound / session.totalRounds) * 100}%` }} /></div>

              <ul className="r-questions">
                {session.subQuestions.map((sq, i) => {
                  const cls = i < session.currentRound ? "done" : i === session.currentRound && loading ? "active" : "pending";
                  return <li key={sq.id} className={cls}><span className="r-qn">{i + 1}</span>{sq.question}</li>;
                })}
              </ul>

              <div className="r-actions">
                {hasRoundsLeft && (
                  <>
                    <button className="r-btn r-btn-gem" onClick={runNextRound} disabled={loading}>Run Next Round</button>
                    <button className="r-btn r-btn-start" onClick={runAllRounds} disabled={loading}>Run All Rounds</button>
                  </>
                )}
                {session.rounds.length > 0 && !session.finalSynthesis && (
                  <button className="r-btn r-btn-synth" onClick={runSynthesize} disabled={loading}>Synthesize Report</button>
                )}
              </div>

              {session.rounds.map((r) => (
                <div key={r.round} className="r-round">
                  <h3><span className="r-rn">Round {r.round}</span> {r.question}</h3>
                  <div className="r-card r-card-gem">
                    <div className="r-card-h gem">Gemini 2.5 Flash &mdash; Research</div>
                    <div className="r-card-b">{r.geminiAnswer}</div>
                  </div>
                  <div className="r-card r-card-cla">
                    <div className="r-card-h cla">Claude Sonnet 4 &mdash; Review &amp; Critique</div>
                    <div className="r-card-b">{r.claudeReview}</div>
                  </div>
                  <div className="r-card r-card-syn">
                    <div className="r-card-h syn">MoE Synthesis</div>
                    <div className="r-card-b">{r.synthesized}</div>
                  </div>
                  {/* Sleep memory inline */}
                  {sleepMemories.find((m) => m.round === r.round) && (
                    <div className="r-card r-card-sleep">
                      <div className="r-card-h sleep">&#x263E; Sleep Consolidation</div>
                      <div className="r-card-b">{sleepMemories.find((m) => m.round === r.round)!.consolidatedInsight}</div>
                    </div>
                  )}
                </div>
              ))}

              {session.finalSynthesis && (
                <div className="r-final">
                  <h3>Final Research Report</h3>
                  <div className="r-final-body">{session.finalSynthesis}</div>
                </div>
              )}
            </>
          )}

          <footer className="r-footer">
            ACRA INSIGHT LLC &mdash; CONTEXT JAMMING &times; DEEP RESEARCH MOE
          </footer>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        {sleepEnabled && sleepMemories.length > 0 && sleepMetrics && (
          <aside className="r-sidebar">
            <SleepChart metrics={sleepMetrics} memories={sleepMemories} />
          </aside>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        body { font-family: "Space Mono", monospace; background: #000; color: #E5E4E2; margin: 0; }
        *, *::before, *::after { box-sizing: border-box; }
      `}</style>
      <style jsx>{`
        /* ── Layout ────────────────────────────────────────────────────── */
        .r-layout { display: flex; gap: 1.5rem; max-width: 1340px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
        .r-main { flex: 1; min-width: 0; max-width: 960px; }
        .r-sidebar { width: 320px; flex-shrink: 0; position: sticky; top: 2rem; align-self: flex-start; max-height: calc(100vh - 4rem); overflow-y: auto; }

        /* ── Header ────────────────────────────────────────────────────── */
        .r-header { text-align: center; margin-bottom: 2rem; }
        .r-header h1 { font-size: 1.6rem; font-weight: 700; margin-bottom: 0.3rem; }
        .r-header p { color: #888; font-size: 0.8rem; letter-spacing: 0.04em; }
        .r-back { display: inline-block; margin-bottom: 1rem; color: #FF0800; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; }
        .r-claude { color: #d97706; }
        .r-gemini { color: #3b82f6; }
        .r-x { color: #666; }

        /* ── Form ──────────────────────────────────────────────────────── */
        .r-form { background: #0a0a0f; border: 1px solid #1e1e2e; border-radius: 10px; padding: 1.25rem; margin-bottom: 1.5rem; }
        .r-form input[type="text"] { width: 100%; padding: 0.7rem 0.9rem; background: #000; border: 1px solid #1e1e2e; border-radius: 6px; color: #E5E4E2; font-family: "Space Mono", monospace; font-size: 0.85rem; outline: none; margin-bottom: 0.75rem; }
        .r-form input[type="text"]:focus { border-color: #8b5cf6; }
        .r-form select { padding: 0.5rem 0.75rem; background: #000; border: 1px solid #1e1e2e; border-radius: 6px; color: #E5E4E2; font-family: "Space Mono", monospace; font-size: 0.8rem; outline: none; }
        .r-form-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }

        .r-sleep-toggle { display: flex; align-items: center; gap: 0.35rem; cursor: pointer; }
        .r-sleep-toggle input { accent-color: #22d3ee; width: 14px; height: 14px; cursor: pointer; }
        .r-sleep-label { font-size: 0.72rem; color: #22d3ee; letter-spacing: 0.04em; }

        /* ── Buttons ───────────────────────────────────────────────────── */
        .r-btn { padding: 0.5rem 1.2rem; border: none; border-radius: 6px; font-family: "Space Mono", monospace; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
        .r-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .r-btn-start { background: linear-gradient(135deg, #d97706, #8b5cf6); color: #fff; }
        .r-btn-gem { background: #3b82f6; color: #fff; }
        .r-btn-synth { background: #8b5cf6; color: #fff; }

        /* ── Status / Progress / Errors / Loading ──────────────────────── */
        .r-error { padding: 0.7rem 1rem; background: rgba(255,8,0,0.08); border: 1px solid rgba(255,8,0,0.3); border-radius: 8px; margin-bottom: 1rem; font-size: 0.8rem; color: #FF0800; display: flex; align-items: center; justify-content: space-between; }
        .r-error button { background: none; border: none; color: #FF0800; cursor: pointer; font-size: 1rem; }
        .r-loading { display: flex; align-items: center; justify-content: center; gap: 0.6rem; padding: 0.7rem; margin-bottom: 1rem; background: #0a0a0f; border: 1px solid #1e1e2e; border-radius: 8px; font-size: 0.8rem; color: #888; }
        .r-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid #1e1e2e; border-radius: 50%; animation: rspin 0.6s linear infinite; }
        .r-spinner.gemini { border-top-color: #3b82f6; }
        .r-spinner.claude { border-top-color: #d97706; }
        .r-spinner.sleep { border-top-color: #22d3ee; }
        @keyframes rspin { to { transform: rotate(360deg); } }

        .r-status { display: flex; flex-wrap: wrap; gap: 0.5rem 1.2rem; padding: 0.7rem 1rem; background: #0a0a0f; border: 1px solid #1e1e2e; border-radius: 8px; margin-bottom: 1rem; font-size: 0.72rem; }
        .r-sl { color: #555; text-transform: uppercase; font-size: 0.62rem; letter-spacing: 0.06em; margin-right: 0.3rem; }
        .r-sv-researching { color: #8b5cf6; }
        .r-sv-complete { color: #10b981; }
        .r-sv-sleep { color: #22d3ee; }

        .r-progress { width: 100%; height: 3px; background: #1e1e2e; border-radius: 2px; margin-bottom: 1.2rem; overflow: hidden; }
        .r-progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #d97706); border-radius: 2px; transition: width 0.5s ease; }

        /* ── Sub-questions ──────────────────────────────────────────────── */
        .r-questions { list-style: none; margin-bottom: 1.2rem; padding: 0; }
        .r-questions li { padding: 0.4rem 0 0.4rem 1.5rem; font-size: 0.78rem; color: #666; border-left: 2px solid #1e1e2e; margin-left: 0.5rem; position: relative; }
        .r-qn { position: absolute; left: -0.85rem; width: 1.2rem; height: 1.2rem; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; border-radius: 50%; background: #1e1e2e; color: #666; }
        .r-questions li.done { color: #E5E4E2; border-left-color: #10b981; }
        .r-questions li.done .r-qn { background: #10b981; color: #fff; }
        .r-questions li.active { color: #8b5cf6; border-left-color: #8b5cf6; }
        .r-questions li.active .r-qn { background: #8b5cf6; color: #fff; }
        .r-actions { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }

        /* ── Round cards ───────────────────────────────────────────────── */
        .r-round { background: #0a0a0f; border: 1px solid #1e1e2e; border-radius: 10px; padding: 1.2rem; margin-bottom: 1.2rem; }
        .r-round h3 { font-size: 0.85rem; font-weight: 400; margin-bottom: 1rem; }
        .r-rn { color: #8b5cf6; margin-right: 0.35rem; font-weight: 700; }
        .r-card { border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; background: #000; }
        .r-card-gem { border-left: 3px solid #3b82f6; }
        .r-card-cla { border-left: 3px solid #d97706; }
        .r-card-syn { border-left: 3px solid #8b5cf6; }
        .r-card-sleep { border-left: 3px solid #22d3ee; background: rgba(34,211,238,0.03); }
        .r-card-h { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.5rem; }
        .r-card-h.gem { color: #3b82f6; }
        .r-card-h.cla { color: #d97706; }
        .r-card-h.syn { color: #8b5cf6; }
        .r-card-h.sleep { color: #22d3ee; }
        .r-card-b { font-size: 0.78rem; line-height: 1.65; color: #999; white-space: pre-wrap; max-height: 400px; overflow-y: auto; }
        .r-card-b::-webkit-scrollbar { width: 4px; }
        .r-card-b::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 2px; }

        /* ── Final report ──────────────────────────────────────────────── */
        .r-final { background: #0a0a0f; border: 1px solid #8b5cf6; border-radius: 10px; padding: 1.5rem; margin-top: 1.5rem; }
        .r-final h3 { font-size: 0.85rem; font-weight: 700; margin-bottom: 1rem; color: #8b5cf6; text-transform: uppercase; letter-spacing: 0.04em; }
        .r-final-body { font-size: 0.8rem; line-height: 1.75; white-space: pre-wrap; }
        .r-footer { text-align: center; margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #1e1e2e; font-size: 0.6rem; color: #555; letter-spacing: 0.12em; text-transform: uppercase; }

        /* ── Mobile ────────────────────────────────────────────────────── */
        @media (max-width: 900px) {
          .r-layout { flex-direction: column; }
          .r-sidebar { width: 100%; position: static; max-height: none; order: -1; }
        }
      `}</style>

      {/* Sleep panel styles — global because SleepChart is a child component */}
      <style jsx global>{`
        .sleep-panel { background: #0a0a0f; border: 1px solid #1a3a3a; border-radius: 10px; padding: 1rem; }
        .sleep-header { display: flex; align-items: center; gap: 0.4rem; font-size: 0.65rem; font-weight: 700; color: #22d3ee; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; }
        .sleep-icon { font-size: 1rem; }
        .sleep-svg { width: 100%; height: auto; display: block; margin-bottom: 0.5rem; }

        .sleep-legend { display: flex; gap: 0.75rem; justify-content: center; margin-bottom: 0.75rem; }
        .sl-item { display: flex; align-items: center; gap: 0.25rem; font-size: 0.58rem; color: #666; }
        .sl-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

        .sleep-binding { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
        .sb-label { font-size: 0.55rem; color: #555; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
        .sb-bar-track { flex: 1; height: 4px; background: #1e1e2e; border-radius: 2px; overflow: hidden; }
        .sb-bar-fill { height: 100%; background: linear-gradient(90deg, #22d3ee, #8b5cf6); border-radius: 2px; transition: width 0.5s ease; }
        .sb-value { font-size: 0.65rem; color: #22d3ee; font-weight: 700; min-width: 2rem; text-align: right; }

        .sleep-detail { background: #000; border: 1px solid #1a3a3a; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.75rem; animation: sdFade 0.2s ease; }
        @keyframes sdFade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .sd-title { font-size: 0.65rem; font-weight: 700; color: #22d3ee; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.4rem; }
        .sd-insight { font-size: 0.7rem; line-height: 1.55; color: #999; margin-bottom: 0.5rem; }
        .sd-section { margin-bottom: 0.4rem; }
        .sd-label { font-size: 0.58rem; font-weight: 700; color: #22d3ee; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 0.2rem; }
        .sd-label.sd-contra { color: #FF0800; }
        .sd-label.sd-gaps { color: #d97706; }
        .sd-section ul { list-style: none; padding: 0; }
        .sd-section li { font-size: 0.65rem; color: #777; padding: 0.1rem 0 0.1rem 0.6rem; border-left: 1px solid #1e1e2e; margin-bottom: 0.15rem; }
        .sd-scores { display: flex; gap: 0.75rem; font-size: 0.58rem; color: #555; margin-top: 0.3rem; }

        .sleep-cite { font-size: 0.55rem; color: #333; text-align: center; font-style: italic; line-height: 1.5; border-top: 1px solid #111; padding-top: 0.6rem; }
        .sleep-cite span { color: #444; }
      `}</style>
    </>
  );
}
