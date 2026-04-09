"use client";

import { useState } from "react";

interface SubQuestion {
  id: number;
  question: string;
}

interface RoundResult {
  round: number;
  subQuestionId: number;
  question: string;
  geminiAnswer: string;
  claudeReview: string;
  synthesized: string;
}

interface ResearchSession {
  id: string;
  topic: string;
  depth: string;
  status: string;
  subQuestions: SubQuestion[];
  rounds: RoundResult[];
  currentRound: number;
  totalRounds: number;
  finalSynthesis: string | null;
}

async function api<T>(url: string, body: object): Promise<T> {
  console.log(`[MoE] POST ${url}`, body);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const raw = await res.json();
  console.log(`[MoE] ${url} response:`, raw);
  if (!res.ok) {
    throw new Error(raw.error || `API error ${res.status}`);
  }
  return raw as T;
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<"quick" | "standard" | "deep">("standard");
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [loadingPhase, setLoadingPhase] = useState<"" | "gemini" | "claude">("");
  const [error, setError] = useState<string | null>(null);

  const startResearch = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setError(null);
    setSession(null);
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

      const data = await api<{ result: RoundResult; session: ResearchSession }>(
        "/api/research/rounds",
        { sessionId: session.id }
      );

      setSession(data.session);
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

        const data = await api<{ result: RoundResult; session: ResearchSession }>(
          "/api/research/rounds",
          { sessionId: session.id }
        );

        current = data.session;
        setSession(current);
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
      const data = await api<{ session: ResearchSession }>(
        "/api/research/synthesize",
        { sessionId: session.id }
      );

      setSession(data.session);
      setLoadingMsg("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Synthesis failed");
    } finally {
      setLoading(false);
      setLoadingPhase("");
    }
  };

  const allRoundsDone = session !== null && session.currentRound >= session.totalRounds;
  const hasRoundsLeft = session !== null && session.currentRound < session.totalRounds;

  return (
    <div className="container">
      <header>
        <h1>
          Deep Research{" "}
          <span className="claude">Claude</span>
          <span className="x"> x </span>
          <span className="gemini">Gemini</span>
        </h1>
        <p>Cross-model Mixture of Experts research engine</p>
      </header>

      {/* ── Input form ─────────────────────────────────────────────────── */}
      <div className="research-form">
        <input
          type="text"
          placeholder="Enter a research topic..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && startResearch()}
          disabled={loading}
        />
        <div className="form-row">
          <select
            className="depth-select"
            value={depth}
            onChange={(e) => setDepth(e.target.value as "quick" | "standard" | "deep")}
            disabled={loading}
          >
            <option value="quick">Quick (3 sub-questions)</option>
            <option value="standard">Standard (5 sub-questions)</option>
            <option value="deep">Deep (8 sub-questions)</option>
          </select>
          <button
            className="btn btn-primary"
            onClick={startResearch}
            disabled={loading || !topic.trim()}
          >
            Start Research
          </button>
        </div>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button className="error-dismiss" onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}

      {/* ── Loading indicator ──────────────────────────────────────────── */}
      {loading && loadingMsg && (
        <div className="loading-bar">
          <span className={`spinner ${loadingPhase}`} />
          <span className="loading-text">{loadingMsg}</span>
        </div>
      )}

      {/* ── Session ────────────────────────────────────────────────────── */}
      {session && (
        <>
          {/* Status bar */}
          <div className="status-bar">
            <div className="status-item">
              <span className="status-label">Session</span>
              <span className="status-value" style={{ fontSize: "0.7rem" }}>
                {session.id.slice(0, 8)}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Depth</span>
              <span className="status-value">{session.depth}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Rounds</span>
              <span className="status-value">
                {session.currentRound} / {session.totalRounds}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Status</span>
              <span className={`status-value ${session.status}`}>
                {session.status}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(session.currentRound / session.totalRounds) * 100}%`,
              }}
            />
          </div>

          {/* Sub-questions */}
          <ul className="sub-questions">
            {session.subQuestions.map((sq, i) => {
              const isDone = i < session.currentRound;
              const isActive = i === session.currentRound && loading;
              return (
                <li
                  key={sq.id}
                  className={isDone ? "done" : isActive ? "active" : "pending"}
                >
                  <span className="sq-num">{i + 1}</span>
                  {sq.question}
                </li>
              );
            })}
          </ul>

          {/* Action buttons */}
          <div className="btn-group">
            {hasRoundsLeft && (
              <>
                <button
                  className="btn btn-gemini"
                  onClick={runNextRound}
                  disabled={loading}
                >
                  Run Next Round
                </button>
                <button
                  className="btn btn-primary"
                  onClick={runAllRounds}
                  disabled={loading}
                >
                  Run All Rounds
                </button>
              </>
            )}
            {session.rounds.length > 0 && !session.finalSynthesis && (
              <button
                className="btn btn-synth"
                onClick={runSynthesize}
                disabled={loading}
              >
                Synthesize Report
              </button>
            )}
          </div>

          {/* Round results */}
          {session.rounds.length > 0 && (
            <div className="rounds-section" style={{ marginTop: "1.5rem" }}>
              {session.rounds.map((r) => (
                <div key={r.round} className="round-card">
                  <h3>
                    <span className="round-num">Round {r.round}</span>
                    {r.question}
                  </h3>

                  <div className="model-card gemini-card">
                    <div className="model-card-header gemini">
                      Gemini 2.5 Flash &mdash; Research
                    </div>
                    <div className="model-card-body">{r.geminiAnswer}</div>
                  </div>

                  <div className="model-card claude-card">
                    <div className="model-card-header claude">
                      Claude Sonnet 4 &mdash; Review &amp; Critique
                    </div>
                    <div className="model-card-body">{r.claudeReview}</div>
                  </div>

                  <div className="model-card synth-card">
                    <div className="model-card-header synth">
                      MoE Synthesis
                    </div>
                    <div className="model-card-body">{r.synthesized}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Final report */}
          {session.finalSynthesis && (
            <div className="final-report">
              <h3>Final Research Report</h3>
              <div className="report-content">{session.finalSynthesis}</div>
            </div>
          )}
        </>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="footer">
        ACRA INSIGHT LLC &mdash; CONTEXT JAMMING &times; DEEP RESEARCH MOE
      </footer>
    </div>
  );
}
