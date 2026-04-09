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

export default function ResearchPage() {
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

  const hasRoundsLeft = session !== null && session.currentRound < session.totalRounds;

  return (
    <>
      <div className="r-container">
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
            <select
              value={depth}
              onChange={(e) => setDepth(e.target.value as "quick" | "standard" | "deep")}
              disabled={loading}
            >
              <option value="quick">Quick (3 sub-questions)</option>
              <option value="standard">Standard (5 sub-questions)</option>
              <option value="deep">Deep (8 sub-questions)</option>
            </select>
            <button
              className="r-btn r-btn-start"
              onClick={startResearch}
              disabled={loading || !topic.trim()}
            >
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
            </div>

            <div className="r-progress"><div className="r-progress-fill" style={{ width: `${(session.currentRound / session.totalRounds) * 100}%` }} /></div>

            <ul className="r-questions">
              {session.subQuestions.map((sq, i) => {
                const cls = i < session.currentRound ? "done" : i === session.currentRound && loading ? "active" : "pending";
                return (
                  <li key={sq.id} className={cls}>
                    <span className="r-qn">{i + 1}</span>
                    {sq.question}
                  </li>
                );
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

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        body { font-family: "Space Mono", monospace; background: #000; color: #E5E4E2; margin: 0; }
        *, *::before, *::after { box-sizing: border-box; }
      `}</style>
      <style jsx>{`
        .r-container { max-width: 1000px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
        .r-header { text-align: center; margin-bottom: 2rem; }
        .r-header h1 { font-size: 1.6rem; font-weight: 700; margin-bottom: 0.3rem; }
        .r-header p { color: #888; font-size: 0.8rem; letter-spacing: 0.04em; }
        .r-back { display: inline-block; margin-bottom: 1rem; color: #FF0800; text-decoration: none; font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; }
        .r-claude { color: #d97706; }
        .r-gemini { color: #3b82f6; }
        .r-x { color: #666; }
        .r-form { background: #0a0a0f; border: 1px solid #1e1e2e; border-radius: 10px; padding: 1.25rem; margin-bottom: 1.5rem; }
        .r-form input { width: 100%; padding: 0.7rem 0.9rem; background: #000; border: 1px solid #1e1e2e; border-radius: 6px; color: #E5E4E2; font-family: "Space Mono", monospace; font-size: 0.85rem; outline: none; margin-bottom: 0.75rem; }
        .r-form input:focus { border-color: #8b5cf6; }
        .r-form select { padding: 0.5rem 0.75rem; background: #000; border: 1px solid #1e1e2e; border-radius: 6px; color: #E5E4E2; font-family: "Space Mono", monospace; font-size: 0.8rem; outline: none; }
        .r-form-row { display: flex; gap: 0.75rem; align-items: center; }
        .r-btn { padding: 0.5rem 1.2rem; border: none; border-radius: 6px; font-family: "Space Mono", monospace; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
        .r-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .r-btn-start { background: linear-gradient(135deg, #d97706, #8b5cf6); color: #fff; }
        .r-btn-gem { background: #3b82f6; color: #fff; }
        .r-btn-synth { background: #8b5cf6; color: #fff; }
        .r-error { padding: 0.7rem 1rem; background: rgba(255,8,0,0.08); border: 1px solid rgba(255,8,0,0.3); border-radius: 8px; margin-bottom: 1rem; font-size: 0.8rem; color: #FF0800; display: flex; align-items: center; justify-content: space-between; }
        .r-error button { background: none; border: none; color: #FF0800; cursor: pointer; font-size: 1rem; }
        .r-loading { display: flex; align-items: center; justify-content: center; gap: 0.6rem; padding: 0.7rem; margin-bottom: 1rem; background: #0a0a0f; border: 1px solid #1e1e2e; border-radius: 8px; font-size: 0.8rem; color: #888; }
        .r-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid #1e1e2e; border-radius: 50%; animation: rspin 0.6s linear infinite; }
        .r-spinner.gemini { border-top-color: #3b82f6; }
        .r-spinner.claude { border-top-color: #d97706; }
        @keyframes rspin { to { transform: rotate(360deg); } }
        .r-status { display: flex; flex-wrap: wrap; gap: 0.5rem 1.2rem; padding: 0.7rem 1rem; background: #0a0a0f; border: 1px solid #1e1e2e; border-radius: 8px; margin-bottom: 1rem; font-size: 0.72rem; }
        .r-sl { color: #555; text-transform: uppercase; font-size: 0.62rem; letter-spacing: 0.06em; margin-right: 0.3rem; }
        .r-sv-researching { color: #8b5cf6; }
        .r-sv-complete { color: #10b981; }
        .r-progress { width: 100%; height: 3px; background: #1e1e2e; border-radius: 2px; margin-bottom: 1.2rem; overflow: hidden; }
        .r-progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #d97706); border-radius: 2px; transition: width 0.5s ease; }
        .r-questions { list-style: none; margin-bottom: 1.2rem; padding: 0; }
        .r-questions li { padding: 0.4rem 0 0.4rem 1.5rem; font-size: 0.78rem; color: #666; border-left: 2px solid #1e1e2e; margin-left: 0.5rem; position: relative; }
        .r-qn { position: absolute; left: -0.85rem; width: 1.2rem; height: 1.2rem; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; border-radius: 50%; background: #1e1e2e; color: #666; }
        .r-questions li.done { color: #E5E4E2; border-left-color: #10b981; }
        .r-questions li.done .r-qn { background: #10b981; color: #fff; }
        .r-questions li.active { color: #8b5cf6; border-left-color: #8b5cf6; }
        .r-questions li.active .r-qn { background: #8b5cf6; color: #fff; }
        .r-actions { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
        .r-round { background: #0a0a0f; border: 1px solid #1e1e2e; border-radius: 10px; padding: 1.2rem; margin-bottom: 1.2rem; }
        .r-round h3 { font-size: 0.85rem; font-weight: 400; margin-bottom: 1rem; }
        .r-rn { color: #8b5cf6; margin-right: 0.35rem; font-weight: 700; }
        .r-card { border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; background: #000; }
        .r-card-gem { border-left: 3px solid #3b82f6; }
        .r-card-cla { border-left: 3px solid #d97706; }
        .r-card-syn { border-left: 3px solid #8b5cf6; }
        .r-card-h { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.5rem; }
        .r-card-h.gem { color: #3b82f6; }
        .r-card-h.cla { color: #d97706; }
        .r-card-h.syn { color: #8b5cf6; }
        .r-card-b { font-size: 0.78rem; line-height: 1.65; color: #999; white-space: pre-wrap; max-height: 400px; overflow-y: auto; }
        .r-card-b::-webkit-scrollbar { width: 4px; }
        .r-card-b::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 2px; }
        .r-final { background: #0a0a0f; border: 1px solid #8b5cf6; border-radius: 10px; padding: 1.5rem; margin-top: 1.5rem; }
        .r-final h3 { font-size: 0.85rem; font-weight: 700; margin-bottom: 1rem; color: #8b5cf6; text-transform: uppercase; letter-spacing: 0.04em; }
        .r-final-body { font-size: 0.8rem; line-height: 1.75; white-space: pre-wrap; }
        .r-footer { text-align: center; margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #1e1e2e; font-size: 0.6rem; color: #555; letter-spacing: 0.12em; text-transform: uppercase; }
      `}</style>
    </>
  );
}
